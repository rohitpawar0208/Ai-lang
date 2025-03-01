'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute';
import ChatFeedbackPage from "@/components/ChatFeedbackPage"

export default function FeedbackPage() {
  return (
    <ProtectedRoute>
      <ChatFeedbackPage />
    </ProtectedRoute>
  );
}