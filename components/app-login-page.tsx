'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import DOMPurify from 'dompurify'
import Image from 'next/image'
import Link from 'next/link'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})

type LoginFormData = z.infer<typeof loginSchema>

export function Page() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const sanitizedData = {
        email: DOMPurify.sanitize(data.email),
        password: DOMPurify.sanitize(data.password),
      }

      await signInWithEmailAndPassword(auth, sanitizedData.email, sanitizedData.password)
      router.push('/user-page')
    } catch (error) {
      console.error('Login error:', error)
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="AI Language Coach" width={64} height={64} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign in to AI Language Coach</CardTitle>
          <p className="text-center text-gray-500">Welcome back! Please sign in to continue</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              Sign In
            </Button>
          </form>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="link" className="text-sm text-purple-600">
            Forgot password?
          </Button>
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-purple-600 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
      <footer className="fixed bottom-4 text-center w-full text-white text-sm">
        <p>© 2024 AI Language Coach</p>
        <div className="mt-2">
          <Link href="/support" className="mx-2 hover:underline">Support</Link>
          <Link href="/privacy" className="mx-2 hover:underline">Privacy</Link>
          <Link href="/terms" className="mx-2 hover:underline">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
