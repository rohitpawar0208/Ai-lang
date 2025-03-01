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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getAuth } from 'firebase/auth'
import { createUserDocument } from '@/lib/firestore-user'
import { db } from '@/lib/firebase'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { app } from '@/lib/firebase'

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters').max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export function Page() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      const sanitizedData = {
        firstName: DOMPurify.sanitize(data.firstName),
        lastName: DOMPurify.sanitize(data.lastName),
        email: DOMPurify.sanitize(data.email),
        password: DOMPurify.sanitize(data.password),
      }

      const auth = getAuth(app)
      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedData.email, sanitizedData.password)
      await updateProfile(userCredential.user, {
        displayName: `${sanitizedData.firstName} ${sanitizedData.lastName}`
      })

      // The user document will be created automatically by the AuthContext

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userCredential.user.displayName,
        email: userCredential.user.email,
        streak: 0,
        completedDays: 0,
        totalMinutes: 0,
        weeklyProgress: [],
        selectedDates: [],
        contributionData: {},
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      })

      router.push('/user-page')
    } catch (err) {
      console.error('Signup error:', err)
      setError('An error occurred during signup. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="AI Language Coach" width={64} height={64} />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Sign up for AI Language Coach</CardTitle>
          <p className="text-center text-gray-500">Create an account to start learning</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="First Name"
                  {...register('firstName')}
                  aria-invalid={errors.firstName ? 'true' : 'false'}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Last Name"
                  {...register('lastName')}
                  aria-invalid={errors.lastName ? 'true' : 'false'}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>
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
            <div>
              <Input
                type="password"
                placeholder="Confirm Password"
                {...register('confirmPassword')}
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              Sign Up
            </Button>
          </form>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-600 hover:underline">
              login here
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
