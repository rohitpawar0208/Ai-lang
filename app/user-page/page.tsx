'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserPageComponent } from "@/components/components-user-page"

export default function UserPage() {
  return (
    <ProtectedRoute>
      <UserPageComponent />
    </ProtectedRoute>
  );
}