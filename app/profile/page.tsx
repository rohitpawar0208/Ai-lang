'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppProfilePage } from "@/components/app-profile-page";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppProfilePage />
    </ProtectedRoute>
  );
}