import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(request: Request) {
  try {
    const { message, topic, category, difficulty } = await request.json()

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    const prompt = `You are an AI language teacher helping a student practice ${topic} at ${difficulty} level.
    The context is ${category}.
    
    Student's message: "${message}"
    
    Provide a natural, conversational response that:
    1. Acknowledges their input
    2. Corrects any major language errors politely
    3. Encourages further conversation
    4. Keeps responses concise and clear
    
    Response:`

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 200,
      top_p: 1,
      stream: false,
    })

    return NextResponse.json({ response: completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that." })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}