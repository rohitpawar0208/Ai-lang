'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useSearchParams } from 'next/navigation'
import AryaChatInterface from "@/components/AryaChatInterface"

// Please guide the student through a small talk scenario related to this topic to improve their conversational skills, grammar, and vocabulary, speaking skills, and listening skills.
export default function ChatPage() {
  const searchParams = useSearchParams()
  const topic = searchParams?.get('topic') ?? 'Small Talk';
  const category = searchParams?.get('category') ?? 'General';
  const difficulty = searchParams?.get('difficulty') ?? 'Easy';
  const aiPrompt = `Let's have a conversation about ${topic}. This is a ${category} topic at a ${difficulty} level.`;

  return (
    <ProtectedRoute>
      <AryaChatInterface topic={topic} initialPrompt={aiPrompt} />
    </ProtectedRoute>
  );
}