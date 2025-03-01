'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ComponentsAiLanguageCoach } from "@/components/components-ai-language-coach"

export default function PracticePage() {
  return (
    <ProtectedRoute>
      <ComponentsAiLanguageCoach />
    </ProtectedRoute>
  );
}
