'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  BookOpen, 
  Users,
  Bot,
  LayoutDashboard, 
  Settings,
  LogOut,
  Menu,
  X,
  HelpCircle,
  MessageSquare,
  Share2,
  Bell,
  Home
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

export function AppProfilePage() {
  const { user, userData, loading, logout } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subscription, setSubscription] = useState('Basic')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user && userData) {
      setName(userData.name)
      setEmail(userData.email)
      setSubscription(userData.subscription)
    }
  }, [user, userData, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle profile update logic here
    console.log('Profile updated:', { name, email })
  }

  const handleSubscriptionChange = (value: string) => {
    setSubscription(value)
    // Handle subscription change logic here
    console.log('Subscription changed to:', value)
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

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
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your account details here</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src="/placeholder.svg" alt={name} />
                          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline">Change Avatar</Button>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>
                    <Button type="submit" className="mt-4">Save Changes</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                  <CardDescription>Manage your subscription plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select onValueChange={handleSubscriptionChange} defaultValue={subscription}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic Plan</SelectItem>
                      <SelectItem value="Premium">Premium Plan</SelectItem>
                      <SelectItem value="Enterprise">Enterprise Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Manage Billing</Button>
                </CardFooter>
              </Card>
            </div>
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
