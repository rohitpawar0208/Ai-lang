'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Book, TrendingUp, Award } from 'lucide-react'

export function AppPage() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the email to your backend
    console.log('Email submitted:', email)
    // For demo purposes, we'll just clear the input
    setEmail('')
    alert('Thank you for your interest! We\'ll be in touch soon.')
  }

  const handleGetStarted = () => {
    router.push('/signup')
  }

  const handleLogIn = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <header className="container mx-auto px-4 py-8">
        <nav className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">SpeakEasy AI</h1>
          <Button variant="outline" onClick={handleLogIn}>
          {/* <a href="./dashboard"> */}
            
            Log In
            
          {/* </a> */}
            </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">Master Your Language Skills with AI</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Personalized coaching for job seekers and professionals</p>
          <Button size="lg" className="mr-4 bg-blue-600 hover:bg-blue-700" onClick={handleGetStarted}>
            
            Get Started
            
            </Button>
          <Button size="lg" variant="outline"><a href=".\practice\">Free trail</a></Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Tabs defaultValue="features" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            </TabsList>
            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle>Key Features</CardTitle>
                  <CardDescription>Discover how SpeakEasy AI can help you improve</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Mic className="h-5 w-5 text-blue-500" />
                    <span>Real-time speech analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Book className="h-5 w-5 text-blue-500" />
                    <span>Customized learning paths</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <span>Progress tracking and analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-blue-500" />
                    <span>Industry-specific vocabulary</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pricing">
              <Card>
                <CardHeader>
                  <CardTitle>Flexible Pricing</CardTitle>
                  <CardDescription>Choose the plan that fits your needs</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic</CardTitle>
                      <CardDescription>For casual learners</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">$9.99/mo</p>
                      <ul className="mt-4 space-y-2">
                        <li>5 practice sessions per month</li>
                        <li>Basic progress tracking</li>
                        <li>Email support</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Choose Basic</Button>
                    </CardFooter>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Premium</CardTitle>
                      <CardDescription>For serious job seekers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">$29.99/mo</p>
                      <ul className="mt-4 space-y-2">
                        <li>Unlimited practice sessions</li>
                        <li>Advanced analytics and insights</li>
                        <li>Priority support</li>
                        <li>Industry-specific modules</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">Choose Premium</Button>
                    </CardFooter>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="testimonials">
              <Card>
                <CardHeader>
                  <CardTitle>What Our Users Say</CardTitle>
                  <CardDescription>Real success stories from SpeakEasy AI users</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent>
                      <p className="italic">"SpeakEasy AI helped me ace my job interview at a multinational company. The industry-specific vocabulary training was invaluable!"</p>
                      <p className="mt-2 font-semibold">- Sarah K., Software Engineer</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <p className="italic">"I've seen a dramatic improvement in my fluency and confidence. The real-time feedback is like having a personal tutor available 24/7."</p>
                      <p className="mt-2 font-semibold">- Michael T., Business Analyst</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Ready to boost your language skills?</h3>
          <form onSubmit={handleSubmit} className="flex justify-center items-center space-x-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-sm"
              required
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
          </form>
        </motion.div>
      </main>

      <footer className="container mx-auto px-4 py-8 mt-16 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-gray-300">&copy; 2024 SpeakEasy AI. All rights reserved.</p>
          <nav className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</Link>
            <Link href="/contact" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Contact Us</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}