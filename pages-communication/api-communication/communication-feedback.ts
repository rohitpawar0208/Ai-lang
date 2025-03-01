import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

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
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an expert communication coach. Your task is to provide feedback on the given text or speech. Focus on identifying issues related to clarity, tone, structure, and delivery, and suggest improvements to enhance effective communication.'
          },
          {
            role: 'user',
            content: `Please provide communication feedback for the following text: "${text}"`
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Groq API');
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    res.status(200).json({ feedback });
  } catch (error) {
    console.error('Error in communication feedback API:', error);
    res.status(500).json({ error: 'Failed to generate communication feedback' });
  }
}