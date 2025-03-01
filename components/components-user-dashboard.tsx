'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  MessageCircle, 
  CheckCircle2, 
  Zap,
  Users,
  Bot,
  Target,
  Lightbulb,
  LayoutDashboard, 
  Settings,
  LogOut,
  Menu,
  X,
  HelpCircle,
  MessageSquare,
  Share2,
  Bell,
  Calendar,
  Trophy,
  Clock,
  ChevronRight,
  Home
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Track = {
  id: string
  name: string
  days: number
  progress: number
}

const sidebarItems = [
  { name: 'Home', icon: Home, href: '/user-page' },
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Profile', icon: Users, href: '/profile' },
  { name: 'Practice Sessions', icon: BookOpen, href: '/practice' },
  { name: 'Settings', icon: Settings, href: '/settings' },
  { name: 'How it works', icon: HelpCircle, href: '/how-it-works' },
  { name: 'Share your feedback', icon: MessageSquare, href: '/feedback' },
  { name: 'Invite Friends', icon: Share2, href: '/invite' },
]

export function ComponentsUserDashboard() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [tracks, setTracks] = useState<Track[]>([
    { id: '10days', name: '10 Days Challenge', days: 10, progress: 30 },
    { id: '20days', name: '20 Days Mastery', days: 20, progress: 15 },
    { id: '30days', name: '30 Days Fluency', days: 30, progress: 0 },
  ])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  const formatProgress = (progress: number, total: number) => {
    return `${progress}/${total}`
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Failed to log out', error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b h-16 fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2" 
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <span className="font-bold text-xl text-gray-800">AI Coach</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
            <Bell className="h-5 w-5" />
          </Button>
          <Popover>
            <PopoverTrigger>
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <Link href="/profile" className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-md">
                  <Users className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 md:pt-16
          `}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeSidebar}
              className="md:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <nav className="px-4 py-4">
              {sidebarItems.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center py-2 px-4 rounded-lg mb-2 transition-colors ${
                    pathname === item.href 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </ScrollArea>
          <div className="absolute bottom-0 left-0 right-0 border-t p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              <span>Logout</span>
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold mb-8">Your Language Learning Journey</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tracks.map((track) => (
                <Card key={track.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{track.name}</CardTitle>
                    <CardDescription>Complete a 30-minute session every day</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>{track.days} Days</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          <span>30 min/day</span>
                        </div>
                      </div>
                      <Progress value={(track.progress / track.days) * 100} className="w-full" />
                      <div className="text-sm text-muted-foreground">
                        Progress: {formatProgress(track.progress, track.days)} days completed
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {track.progress === track.days ? 'Completed!' : `${track.days - track.progress} days left`}
                        </span>
                      </div>
                      <Link href={`/practice?track=${track.id}`} passHref>
                        <Button variant="outline" size="sm">
                          {track.progress === track.days ? 'Review' : 'Continue'}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Daily Streak</CardTitle>
                <CardDescription>Keep practicing every day to maintain your streak!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="mr-2 h-6 w-6 text-yellow-500" />
                    <span className="text-2xl font-bold">7 Days</span>
                  </div>
                  <Button>Start Today's Session</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-4 px-6 mt-auto">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <p className="text-sm text-gray-600">© 2023 AI Language Coach. All rights reserved.</p>
          <div className="flex space-x-4">
            <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">Terms of Service</Link>
            <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}