import { NextApiRequest, NextApiResponse } from 'next';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, context } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert English teacher.note that is conversation between learner and ai tutor text is user chat and context is previous conversation between learner and tutor. Analyze the text and provide feedback in exactly this format:

GRAMMAR_FEEDBACK:
• [If no errors: "No grammar mistakes found. Good job! 😊"]
• [If errors: List each error and correction]

SUGGESTIONS:
• [1-2 clear suggestions for improvement and give one example of corrected sentence]

COHERENCE:
• [One point about message flow and context fit and utilize conversation context between learner and AItutor]

Rules:
- Start each point with "•"
- No asterisks or special characters
- Keep each point to one line
- Use simple, clear language
- Include emoji only for positive feedback`
          },
          {
            role: 'user',
            content: `Context:\n${context}\n\nAnalyze this message: "${text}"`
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Groq API');
    }

    const data = await response.json();
    const feedbackText = data.choices[0].message.content;

    // Parse sections using exact markers
    const sections: Record<'grammar' | 'suggestions' | 'coherence', string> = {
      grammar: '',
      suggestions: '',
      coherence: ''
    };

    const grammarMatch = feedbackText.match(/GRAMMAR_FEEDBACK:\n((?:•[^\n]*\n?)*)/);
    const suggestionsMatch = feedbackText.match(/SUGGESTIONS:\n((?:•[^\n]*\n?)*)/);
    const coherenceMatch = feedbackText.match(/COHERENCE:\n((?:•[^\n]*\n?)*)/);

    sections.grammar = grammarMatch ? grammarMatch[1].trim() : 'No grammar feedback available';
    sections.suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : 'No suggestions available';
    sections.coherence = coherenceMatch ? coherenceMatch[1].trim() : 'No coherence analysis available';

    // Clean up the sections
    (Object.keys(sections) as Array<keyof typeof sections>).forEach(key => {
      sections[key] = sections[key]
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.startsWith('•'))
        .join('\n');
    });

    res.status(200).json({ feedback: sections });
  } catch (error) {
    console.error('Error in grammar feedback API:', error);
    res.status(500).json({ error: 'Failed to generate grammar feedback' });
  }
}