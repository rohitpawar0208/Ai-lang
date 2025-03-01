'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ComponentsUserDashboard } from "@/components/components-user-dashboard"

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <ComponentsUserDashboard />
    </ProtectedRoute>
  );
}