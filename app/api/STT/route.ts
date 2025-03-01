import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const { audio } = await request.json();

    // Convert base64 to Blob
    const binaryData = Buffer.from(audio, 'base64');
    const audioBlob = new Blob([binaryData], { type: 'audio/webm' });

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });

    const translation = await groq.audio.translations.create({
      file,
      model: "whisper-large-v3",
      response_format: "json",
      temperature: 0.0,
    });

    return NextResponse.json({ text: translation.text });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate audio' },
      { status: 500 }
    );
  }
} 