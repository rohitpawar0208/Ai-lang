import { NextApiRequest, NextApiResponse } from 'next';

interface ToneResponse {
  original: string;
  corrections: {
    formal: string;
    informal: string;
    friendly: string;
  };
  grammarFeedback: {
    errors: string[];
    suggestions: string[];
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, tone } = req.body;

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
            content: `You are an expert in English language and communication styles. Analyze the given text and provide corrections and variations in different tones. 
            
Response Format:
GRAMMAR_ANALYSIS:
• List any grammar errors found
• If no errors, state "No grammar mistakes found"

CORRECTIONS:
FORMAL:
• Provide a formal, professional version
INFORMAL:
• Provide a casual, relaxed version
FRIENDLY:
• Provide a warm, approachable version

SUGGESTIONS:
• Provide 1-2 suggestions for improving clarity or impact

Each tone should maintain the core message while adjusting the language appropriately:
- Formal: Professional, proper, business-appropriate
- Informal: Casual, everyday language
- Friendly: Warm, personal, approachable

Keep the meaning intact while adjusting the tone and fixing any grammar issues.`
          },
          {
            role: 'user',
            content: `Analyze and provide tone variations for: "${text}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Groq API');
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content;

    // Parse the response sections
    const grammarMatch = analysisText.match(/GRAMMAR_ANALYSIS:\n((?:•[^\n]*\n?)*)/);
    const formalMatch = analysisText.match(/FORMAL:\n((?:•[^\n]*\n?)*)/);
    const informalMatch = analysisText.match(/INFORMAL:\n((?:•[^\n]*\n?)*)/);
    const friendlyMatch = analysisText.match(/FRIENDLY:\n((?:•[^\n]*\n?)*)/);
    const suggestionsMatch = analysisText.match(/SUGGESTIONS:\n((?:•[^\n]*\n?)*)/);

    const formatSection = (match: RegExpMatchArray | null) => {
      if (!match) return '';
      return match[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('•'))
        .map(line => line.substring(1).trim())
        .join(' ');
    };

    const response_data: ToneResponse = {
      original: text,
      corrections: {
        formal: formatSection(formalMatch),
        informal: formatSection(informalMatch),
        friendly: formatSection(friendlyMatch),
      },
      grammarFeedback: {
        errors: grammarMatch ? formatSection(grammarMatch).split('•').filter(Boolean) : [],
        suggestions: suggestionsMatch ? formatSection(suggestionsMatch).split('•').filter(Boolean) : [],
      }
    };

    res.status(200).json(response_data);
  } catch (error) {
    console.error('Error in tone correction API:', error);
    res.status(500).json({ error: 'Failed to generate tone corrections' });
  }
} 