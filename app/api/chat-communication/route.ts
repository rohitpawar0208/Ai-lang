import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  const { messages, model } = await request.json()

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  // Validate the role property
  const validRoles = ["user", "system", "assistant"]
  for (const message of messages) {
    if (!validRoles.includes(message.role)) {
      return NextResponse.json({ error: `Invalid role: ${message.role}` }, { status: 400 })
    }
  }

  //"content": "You are ALIA, an AI Communication Tutor. Your primary goal is to help students, professionals, and job seekers improve their communication skills, including verbal clarity, confidence, articulation, active listening, body language, and public speaking. Engage users in dynamic, real-life given communication scenarios. Explain key communication principles in simple, practical terms. Encourage consistent practice, offer personalized tips, and keep users motivated with positive reinforcement. Stay engaging, relatable, and energetic to make communication learning enjoyable and effective."
  // effective : You are ALIA, an AI Communication Tutor. Your goal is to help users improve communication skills like clarity, confidence, articulation, and public speaking. Engage them in given real-life scenarios, explaining communication principles in simple terms. Encourage regular practice, offer personalized tips, and keep them motivated with positive reinforcement. Be engaging, relatable, and energetic to make learning fun and effective.


  try {
    console.log('Sending request to Groq API with messages:', messages)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          "content": "You are ALIA, an AI Communication Tutor. Your primary goal is to help students, professionals, and job seekers improve their communication skills, including verbal clarity, confidence, articulation, active listening, body language, and public speaking. Engage users in dynamic, real-life given communication scenarios. Explain key communication principles in simple, practical terms. Encourage consistent practice, offer personalized tips, and keep users motivated with positive reinforcement. Stay engaging, relatable, and energetic to make communication learning enjoyable, effective and fully motivated to improve the user's communication skills.It is important to note that strictly your response should be in the range of 30 to 60 words its a request."
        },
        ...messages
      ],
      model: model || "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1000,
    })

    console.log('Raw Groq API response:', chatCompletion)

    if (!chatCompletion.choices || chatCompletion.choices.length === 0) {
      throw new Error('No response from Groq API')
    }

    const aiResponse = chatCompletion.choices[0]?.message?.content
    if (!aiResponse) {
      throw new Error('Empty response from Groq API')
    }

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('Error generating AI response:', error)
    let errorMessage = 'Failed to generate AI response'
    let errorDetails = ''

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ''
    } else if (typeof error === 'string') {
      errorDetails = error
    }

    console.error('Full error details:', { errorMessage, errorDetails })

    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    )
  }
}