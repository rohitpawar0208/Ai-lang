'use client'

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function MigratePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const checkAdmin = async () => {
      if (!loading) {
        if (!user) {
          router.push('/login');
          return;
        }
        const token = await user.getIdTokenResult();
        if (!token.claims.admin) {
          router.push('/');
        }
      }
    };
    checkAdmin();
  }, [user, loading, router]);

  const handleMigration = async (action: 'weeklyProgress' | 'lastWeekReset') => {
    if (!user) return;
    try {
      setIsLoading(true);
      setStatus('Migration in progress...');

      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          idToken,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }

      setStatus(`${data.message}`);
    } catch (error) {
      setStatus(`Migration failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Database Migration</h1>
      <div className="space-y-4">
        <Button 
          onClick={() => handleMigration('weeklyProgress')} 
          disabled={isLoading}
        >
          {isLoading ? 'Migrating...' : 'Run Weekly Progress Migration'}
        </Button>
        <Button 
          onClick={() => handleMigration('lastWeekReset')} 
          disabled={isLoading}
        >
          Add Last Week Reset Field
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