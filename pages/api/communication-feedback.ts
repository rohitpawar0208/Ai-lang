import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface ResponseFeedback {
  originalMessage: string;
  grammar: {
    score: number;
    strengths: string[];
    improvements: string[];
    tips: string[];
    examples: { original: string; corrected: string }[];
  };
  vocabulary: {
    score: number;
    range: string;
    appropriateness: string;
    suggestions: { original: string; alternative: string }[];
    advancedOptions: { original: string; alternative: string }[];
  };
  content: {
    score: number;
    development: string;
    coherence: string;
    engagement: string;
    recommendations: string[];
  };
}

interface FeedbackResponse {
  responses: ResponseFeedback[];
  overallScore: number;
  totalBatches: number;
}

interface Message {
  content: string;
  type: 'user' | 'ai';
}

interface APIRequest extends NextApiRequest {
  body: {
    messages: Message[];
    topic: string;
  };
}

// Optimize for maximum speed with smart rate limiting
const RATE_LIMIT = {
  requestsPerMinute: 20, // Balanced rate
  delayBetweenRequests: 1000, // 1 second between requests
  delayBetweenBatches: 2000, // 2 seconds between batches
  maxRetries: 2, // Minimal retries
  retryDelay: 5000, // 5 seconds base delay for retries
  chunkSize: 5, // Smaller chunks for better reliability
  maxConcurrentRequests: 2 // 2 concurrent requests
};

interface ConversationContext {
  messageIndex: number;
  userMessage: string;
  previousAiResponse?: string;
  nextAiResponse?: string;
}

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Add system prompt constant
const SYSTEM_PROMPT =  `You are an expert English language teacher analyzing learner responses in a spoken conversation with an AI tutor. Your task is to provide detailed and practical feedback to help the learner improve their spoken English. Note not writtern english.
Key Guidelines:
1)Contextual Feedback: Align feedback with the conversational flow and context.
2)Spoken English Focus: Address spoken communication only—ignore punctuation or written conventions like question marks.
3)Actionable Insights: Offer clear corrections and tips for improvement.
3)Thorough Analysis: Evaluate grammar, vocabulary, and clarity.
4)Positive Reinforcement: Highlight strengths before pointing out areas for improvement.

For each message, you'll receive:
- The user's message
- The previous AI response (context for user's reply)
- The next AI response (how well the user's message was understood)

Follow this exact format for each analysis:

Context:
Previous AI: "{previousAiResponse}"
User Message: "{userMessage}"
Next AI: "{nextAiResponse}"

Grammar Analysis:
Score: {1-5}
✓ Strengths:
• {Point 1}
• {Point 2}
△ Areas for Improvement:
• {Issue 1}
• {Issue 2}
➤ Tips:
1. {Tip 1}
2. {Tip 2}
✎ Example Corrections:
{Original} → {Corrected version}

Vocabulary Assessment:
Score: {1-5}
📚 Range: 
{Assessment considering conversation context}

🎯 Appropriateness: 
{Evaluation of word choice in context}

💡 Suggested Alternatives:
• {Word/phrase 1} → {Better alternative 1}
• {Word/phrase 2} → {Better alternative 2}

📈 Advanced Options:
• {Basic term 1} → {Advanced equivalent 1}
• {Basic term 2} → {Advanced equivalent 2}

Content Evaluation:
Score: {1-5}
📝 Development: 
{Evaluation of response relevance and clarity}

🔄 Coherence:
{Evaluate message flow and organization in conversation context}

💭 Engagement:
{Assessment of conversation depth and interaction quality}

⚡ Recommendations:
1. {Context-specific improvement 1}
2. {Context-specific improvement 2}

---`;

// Add token bucket for rate limiting
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly refillRate: number;
  private readonly capacity: number;

  constructor() {
    this.capacity = RATE_LIMIT.requestsPerMinute;
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    this.refillRate = 60000 / RATE_LIMIT.requestsPerMinute; // ms per token
  }

  async getToken(): Promise<void> {
    await this.refill();
    if (this.tokens <= 0) {
      const waitTime = this.refillRate;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      await this.refill();
    }
    this.tokens--;
  }

  private async refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const newTokens = Math.floor(timePassed / this.refillRate);
    if (newTokens > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + newTokens);
      this.lastRefill = now;
    }
  }
}

const tokenBucket = new TokenBucket();

// Improved request queue with token bucket
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private activeRequests = 0;

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await tokenBucket.getToken();
          this.activeRequests++;
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeRequests--;
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    while (this.queue.length > 0) {
      const batchPromises: Promise<void>[] = [];
      const batchSize = Math.min(RATE_LIMIT.maxConcurrentRequests, this.queue.length);
      
      for (let i = 0; i < batchSize; i++) {
        const request = this.queue.shift();
        if (request) {
          batchPromises.push(request());
        }
      }

      await Promise.all(batchPromises);
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenBatches));
      }
    }
    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

// Optimized retry helper
async function retryWithBackoff(fn: () => Promise<any>, retries = RATE_LIMIT.maxRetries): Promise<any> {
  let lastError: any;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await requestQueue.add(fn);
    } catch (error: any) {
      lastError = error;
      if (error.name === 'AbortError') throw error;
      
      if (i < retries) {
        const delay = error.status === 429
          ? RATE_LIMIT.retryDelay * (i + 1)
          : RATE_LIMIT.retryDelay;
        
        console.log(`Attempt ${i + 1} failed, waiting ${delay/1000}s before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

class StreamProcessor {
  private chunks: ConversationContext[][] = [];
  private results: Map<number, ResponseFeedback> = new Map();
  private processedCount = 0;

  constructor(contexts: ConversationContext[]) {
    // Split into smaller chunks for better management
    for (let i = 0; i < contexts.length; i += RATE_LIMIT.chunkSize) {
      this.chunks.push(contexts.slice(i, i + RATE_LIMIT.chunkSize));
    }
  }

  async process(onProgress: (processed: number, total: number) => void): Promise<ResponseFeedback[]> {
    const totalMessages = this.chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    
    // Process chunks in parallel with controlled concurrency
    const chunkPromises = this.chunks.map(async (chunk, index) => {
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenBatches));
      }
      return this.processChunk(chunk, totalMessages, onProgress);
    });

    await Promise.all(chunkPromises);

    return Array.from(this.results.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, response]) => response);
  }

  private async processChunk(
    contexts: ConversationContext[],
    totalMessages: number,
    onProgress: (processed: number, total: number) => void
  ): Promise<void> {
    const processPromises = contexts.map(async (context) => {
      try {
        const result = await retryWithBackoff(async () => {
          return await this.generateFeedback(context);
        });
        
        this.results.set(context.messageIndex, result);
        this.processedCount++;
        onProgress(this.processedCount, totalMessages);
      } catch (error) {
        console.error(`Failed to process message ${context.messageIndex}:`, error);
        this.results.set(context.messageIndex, createEmptyResponse(context.userMessage));
        this.processedCount++;
        onProgress(this.processedCount, totalMessages);
      }
    });

    await Promise.all(processPromises);
  }

  private async generateFeedback(context: ConversationContext): Promise<ResponseFeedback> {
    const prompt = `Analyzing single message:\n\n` +
      `Previous AI: "${context.previousAiResponse || 'Start of conversation'}"\n` +
      `User Message: "${context.userMessage}"\n` +
      `Next AI: "${context.nextAiResponse || 'End of conversation'}"`;

    try {
      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: prompt }
      ]);

      const aiResponse = result.response.text();
      const responses = parseIndividualResponses(aiResponse, [context]);
      return responses[0];
    } catch (error: any) {
      if (error.status === 429) {
        console.log('Rate limit hit, retrying with token bucket...');
      }
      throw error;
    }
  }
}

// Update the main handler to include better error handling
export default async function handler(req: APIRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, topic } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    // Create conversation contexts
    const conversationContexts: ConversationContext[] = [];
    let userMessageIndex = 0;
    
    messages.forEach((message, index) => {
      if (message.type === 'user') {
        conversationContexts.push({
          messageIndex: userMessageIndex++,
          userMessage: message.content,
          previousAiResponse: index > 0 ? messages[index - 1]?.content : undefined,
          nextAiResponse: index < messages.length - 1 ? messages[index + 1]?.content : undefined
        });
      }
    });

    let processedCount = 0;
    const totalMessages = conversationContexts.length;

    // Initialize stream processor
    const processor = new StreamProcessor(conversationContexts);
    
    // Process all messages with progress tracking
    const allResponses = await processor.process((processed, total) => {
      processedCount = processed;
    });

    // Calculate overall score only for valid responses
    const validResponses = allResponses.filter(r => r && r.grammar.score > 0);
    const overallScore = validResponses.length > 0
      ? Math.round(
          validResponses.reduce((acc, curr) => 
            acc + (curr.grammar.score + curr.vocabulary.score + curr.content.score) / 3, 0
          ) / validResponses.length
        )
      : 0;

    res.status(200).json({
      responses: allResponses,
      overallScore,
      totalMessages,
      processedMessages: validResponses.length,
      success: true
    });

  } catch (error: any) {
    console.error('Error in communication feedback API:', error);
    res.status(error.status || 500).json({ 
      error: 'Failed to generate communication feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
  }
}

// Update the createEmptyResponse function to return valid zero scores
function createEmptyResponse(message: string): ResponseFeedback {
  return {
    originalMessage: message,
    grammar: {
      score: 0,
      strengths: ['Analysis failed - please try again'],
      improvements: [],
      tips: [],
      examples: []
    },
    vocabulary: {
      score: 0,
      range: 'Analysis failed - please try again',
      appropriateness: 'Analysis failed - please try again',
      suggestions: [],
      advancedOptions: []
    },
    content: {
      score: 0,
      development: 'Analysis failed - please try again',
      coherence: 'Analysis failed - please try again',
      engagement: 'Analysis failed - please try again',
      recommendations: []
    }
  };
}

// Update the parseIndividualResponses function to ensure valid scores
function parseIndividualResponses(aiResponse: string, contextBatch: ConversationContext[]): ResponseFeedback[] {
  const responses: ResponseFeedback[] = [];
  const messageBlocks = aiResponse.split('---').filter(Boolean);

  messageBlocks.forEach((block, index) => {
    if (!block.trim()) {
      responses.push(createEmptyResponse(contextBatch[index].userMessage));
      return;
    }

    try {
      const response: ResponseFeedback = {
        originalMessage: contextBatch[index].userMessage,
        grammar: {
          score: extractScore(block, 'Grammar Analysis'),
          strengths: extractListItems(block, '✓ Strengths'),
          improvements: extractListItems(block, '△ Areas for Improvement'),
          tips: extractListItems(block, '➤ Tips'),
          examples: extractExampleCorrections(block)
        },
        vocabulary: {
          score: extractScore(block, 'Vocabulary Assessment'),
          range: extractSingleItem(block, '📚 Range'),
          appropriateness: extractSingleItem(block, '🎯 Appropriateness'),
          suggestions: extractPairItems(block, '💡 Suggested Alternatives'),
          advancedOptions: extractPairItems(block, '📈 Advanced Options')
        },
        content: {
          score: extractScore(block, 'Content Evaluation'),
          development: extractSingleItem(block, '📝 Development'),
          coherence: extractSingleItem(block, '🔄 Coherence'),
          engagement: extractSingleItem(block, '💭 Engagement'),
          recommendations: extractListItems(block, '⚡ Recommendations')
        }
      };

      responses.push(response);
    } catch (error) {
      console.error(`Error parsing response for message ${index}:`, error);
      responses.push(createEmptyResponse(contextBatch[index].userMessage));
    }
  });

  return responses;
}

// Helper functions for extracting different types of data
function extractScore(text: string, section: string): number {
  const regex = new RegExp(`${section}[^]*?Score:\\s*([1-5])`, 'g');
  const matches = text.matchAll(regex);
  const matchArray = Array.from(matches);
  
  return matchArray.length ? parseInt(matchArray[0][1]) || 3 : 3;
}

function extractListItems(text: string, marker: string): string[] {
  const regex = new RegExp(`${marker}:\\s*([^]*?)(?=\\n\\s*[✓△➤✎📚🎯💡📈🔄💭📝⚡]|\\n\\n|$)`, 'g');
  const matches = text.matchAll(regex);
  const matchArray = Array.from(matches);
  
  if (!matchArray.length) return [];

  const content = matchArray[0][1] || '';
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('•') || /^\d+\./.test(line))
    .map(line => line.replace(/^[•\d.]\s+/, ''))
    .filter(Boolean);
}

function extractSingleItem(text: string, marker: string): string {
  const regex = new RegExp(`${marker}:\\s*([^]*?)(?=\\n\\s*[📚🎯💡📈🔄💭📝⚡]|\\n\\n|$)`, 'g');
  const matches = text.matchAll(regex);
  const matchArray = Array.from(matches);
  
  return matchArray.length ? (matchArray[0][1] || '').trim() : '';
}

function extractExampleCorrections(text: string): { original: string; corrected: string }[] {
  const regex = new RegExp('✎ Example Corrections:\\s*([^]*?)(?=\\n\\s*[✓△➤📚🎯💡📈🔄💭📝⚡]|\\n\\n|$)', 'g');
  const matches = text.matchAll(regex);
  const matchArray = Array.from(matches);
  
  if (!matchArray.length) return [];

  const content = matchArray[0][1] || '';
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.includes('→'))
    .map(line => {
      const [original, corrected] = line.split('→').map(s => s.trim());
      return { original, corrected };
    })
    .filter(item => item.original && item.corrected);
}

function extractPairItems(text: string, marker: string): { original: string; alternative: string }[] {
  const regex = new RegExp(`${marker}:\\s*([^]*?)(?=\\n\\s*[📚🎯💡📈🔄💭📝⚡]|\\n\\n|$)`, 'g');
  const matches = text.matchAll(regex);
  const matchArray = Array.from(matches);
  
  if (!matchArray.length) return [];

  const content = matchArray[0][1] || '';
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('•') && line.includes('→'))
    .map(line => {
      const [original, alternative] = line.substring(1).split('→').map(s => s.trim());
      return { original, alternative };
    })
    .filter(item => item.original && item.alternative);
}