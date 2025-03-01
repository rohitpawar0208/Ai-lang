'use client'

import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';

export default function SignOutButton() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login'; // Force a full page refresh
  };

  return (
    <Button onClick={handleSignOut} variant="ghost">
      Sign Out
    </Button>
  );
} 