'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        console.log('No user found, redirecting to login...');
        router.push('/login')
        return
      }

      try {
        console.log('Checking admin status for:', user.email);
        const token = await user.getIdToken(true); // Force token refresh
        
        const response = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken: token }),
        })

        const data = await response.json()
        console.log('Admin check response:', data);
        
        if (!data.isAdmin) {
          setError('User is not an admin');
          console.log('Not an admin, redirecting...');
          router.push('/')
          return
        }

        console.log('Admin access granted');
        setIsAdmin(true)
      } catch (error) {
        console.error('Admin check failed:', error)
        setError('Admin check failed: ' + error.message);
        router.push('/')
      } finally {
        setChecking(false)
      }
    }

    if (!loading) {
      checkAdmin()
    }
  }, [user, loading, router])

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Checking admin status...</p>
          {error && (
            <p className="mt-2 text-red-600">{error}</p>
          )}
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Access Denied</p>
          {error && (
            <p className="mt-2 text-red-600">{error}</p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
} 