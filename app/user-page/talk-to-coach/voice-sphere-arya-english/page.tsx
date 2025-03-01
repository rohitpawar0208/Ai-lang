'use client';

import { VoiceAssistant } from "@/components/voice-assistant";
import { useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function VoicePage() {
  const searchParams = useSearchParams();
  const topic = searchParams?.get('topic') ?? 'English Conversation';
  const category = searchParams?.get('category') ?? 'General';
  const difficulty = searchParams?.get('difficulty') ?? 'Easy';
  
  const initialPrompt = `Let's practice speaking ${topic}. This is a ${category} conversation at ${difficulty} level. I'll help you improve your pronunciation and fluency. Please speak clearly into the microphone.`;

  const handleMessageReceived = async (message: string) => {
    console.log("User speech:", message);
    // Here you can add logic to send the transcribed message to your AI endpoint
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          topic,
          category,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'I apologize, but I was unable to process your message. Please try again.';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center">
        <VoiceAssistant 
          initialMessage={initialPrompt}
          onMessageReceived={handleMessageReceived}
          onRecordingStart={() => {
            console.log("Recording started");
          }}
          onRecordingStop={() => {
            console.log("Recording stopped");
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
