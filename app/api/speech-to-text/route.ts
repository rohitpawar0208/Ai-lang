import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  const formData = await request.formData()
  const audio = formData.get('audio') as Blob

  if (!audio) {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
  }

  try {
    const translation = await groq.audio.translations.create({
      file: audio,
      model: "whisper-large-v3",
      response_format: "json",
    })

    return NextResponse.json({ text: translation.text })
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 })
  }
}