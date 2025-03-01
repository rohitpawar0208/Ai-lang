'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupAdmin = async () => {
    if (!user) {
      setStatus('Please sign in first');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to set admin');
      }

      setStatus(data.message);
      router.refresh();
    } catch (error: any) {
      setStatus(`Setup failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Setup</h1>
      <div className="space-y-4">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter admin email"
          disabled={isLoading}
        />
        <Button 
          onClick={handleSetupAdmin}
          disabled={isLoading}
        >
          {isLoading ? 'Setting up...' : 'Set as Admin'}
        </Button>
        {status && (
          <div className={`p-4 rounded-md ${
            status.includes('failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
} 