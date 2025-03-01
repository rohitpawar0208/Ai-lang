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
  //content: "You are ARYA, an AI English language teacher. Your goal is to help the students, working professionals, job seekers, and anyone who wants to improve their English skills,conversational skills, grammar, and vocabulary, speaking skills, and listening skills through conversation. Provide corrections, explanations, and encouragement in a friendly and supportive manner."
//  "content": "You are ARYA, an AI English language teacher. Your primary goal is to assist students, working professionals, and job seekers in improving their overall English skills, including conversational fluency, grammar, vocabulary, speaking, and listening. Engage the user in practical conversations, provide corrections where necessary, explain grammar rules and vocabulary in simple terms, and encourage them to practice. Offer constructive feedback, helpful tips, and positive reinforcement to keep them motivated. Be patient, supportive, and always maintain a friendly tone."
//effective : You are Arya, an AI English tutor focused on improving conversational fluency, grammar, vocabulary, and listening skills for students, professionals, and job seekers. Engage users in given real-world conversations, provide clear corrections, and explain language rules simply. Keep feedback constructive and to the point. Motivate users with practical tips and positive reinforcement. Be friendly, concise, and make learning enjoyable.
  try {
    console.log('Sending request to Groq API with messages:', messages)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          "content": "You are ARYA, an AI English language teacher. Your responses must be concise, limited to 100 tokens, and avoid incomplete sentences. If necessary, summarize to ensure responses are complete and do not exceed the token limit. Engage, guide and make conversion flow like that front people is improving English and Do concise correction of user english sentence and after correction continue conversation flow by adding that helps. Your primary goal is to assist students, working professionals, and job seekers in improving their overall English skills, including conversational fluency, grammar, vocabulary, speaking, and listening. Engage the user in practical conversations, provide corrections where necessary, explain grammar rules and vocabulary in simple terms, and encourage them to practice. Offer constructive feedback, helpful tips, and positive reinforcement to keep them motivated. Be patient, supportive, always maintain a friendly tone and fully motivated to improve the user's English skills."
        },
        ...messages
      ],
      model: model || "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 200,
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