'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  ChevronRight,
  ChevronLeft,
  Calendar,
  Trophy,
  Home
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/contexts/AuthContext'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { db } from '@/lib/firebase'
import { doc, onSnapshot, updateDoc, setDoc, Timestamp, getDoc, arrayUnion } from 'firebase/firestore'
import { CourseOverview } from '@/components/language-learning'
import { Calendar as UiCalendar } from "@/components/ui/calendar"

// Import the ContributionGraph component
const ContributionGraph = dynamic(() => import('@/components/ContributionGraph'), { ssr: false })

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

const learningTracks = [
  { name: 'Alternative Sentences', icon: MessageCircle, color: 'bg-orange-500' },
  { name: 'Daily Vocab', icon: BookOpen, color: 'bg-green-500' },
  { name: 'AI Tutor', icon: Bot, color: 'bg-purple-500' },
  { name: 'Colloquial Expressions', icon: Zap, color: 'bg-blue-500' },
]

const grammarActivities = [
  { name: 'Grammar Lessons', icon: Target, color: 'bg-red-500' },
  { name: 'Grammar Correction', icon: CheckCircle2, color: 'bg-green-500' },
  { name: 'Grammar Quizzes', icon: Lightbulb, color: 'bg-yellow-500' },
]

// Add this interface at the top of the file
interface WeeklyProgressItem {
  day: string;
  minutes: number;
  timestamp?: string;
}

// Add this interface at the top of the file
interface ActivityLog {
  [date: string]: number;
}
const getDayKey = (date = new Date()) => {
  return date.toLocaleString('en-US', { weekday: 'short' });
}

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const isCurrentWeek = (date: Date): boolean => {
  const today = new Date();
  const startOfWeek = new Date(today);
  // Set to Monday of current week
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const checkDate = new Date(date);
  return checkDate >= startOfWeek && checkDate <= endOfWeek;
};

const formatWeeklyData = (weeklyProgress: WeeklyProgressItem[]): WeeklyProgressItem[] => {
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const aggregatedData: { [key: string]: number } = {};
  
  // Initialize all days with 0 minutes
  dayOrder.forEach(day => {
    aggregatedData[day] = 0;
  });

  // Get the start of the current week
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);

  // Only include data from current week
  weeklyProgress
    .filter(item => item.timestamp && isCurrentWeek(new Date(item.timestamp)))
    .forEach(item => {
      aggregatedData[item.day] += item.minutes;
    });

  return dayOrder.map(day => ({
    day,
    minutes: aggregatedData[day],
    timestamp: new Date().toISOString()
  }));
};

// Function to handle weekly reset
const handleWeeklyReset = async (userId: string, currentData: any) => {
  try {
    const userRef = doc(db, 'users', userId)
    const now = new Date()

    // Archive current week's data
    await updateDoc(userRef, {
      archivedProgress: arrayUnion({
        weekEnding: now.toISOString(),
        progress: currentData.weeklyProgress || []
      }),
      weeklyProgress: [], // Reset current week's progress
      lastWeekReset: Timestamp.now()
    })

    console.log('Weekly progress reset successfully')
  } catch (error) {
    console.error('Error resetting weekly progress:', error)
  }
}

const WeeklyProgressChart = ({ weeklyProgress }: { weeklyProgress: WeeklyProgressItem[] }) => {
  const formattedData = formatWeeklyData(weeklyProgress);
  
  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={formattedData}>
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `${value}m`}
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value} minutes`, 'Practice Time']}
            cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
          />
          <Bar 
            dataKey="minutes" 
            fill="#4F46E5"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-sm text-gray-500 text-center">
        Current Week's Progress
      </div>
    </div>
  );
};

// Add this function near the top of the file
const cleanWeeklyProgressData = (data: any[]): WeeklyProgressItem[] => {
  return data
    .filter(item => item && typeof item === 'object' && item.day && typeof item.minutes === 'number')
    .map(item => ({
      day: item.day,
      minutes: item.minutes,
      timestamp: item.timestamp || new Date().toISOString() // Ensure timestamp exists
    }));
};

export function UserPageComponent() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTrack, setActiveTrack] = useState<string | null>(null)
  const [trackProgress, setTrackProgress] = useState(0)
  const [streak, setStreak] = useState(4)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [completedDays, setCompletedDays] = useState(0)
  const pathname = usePathname()

  // Add state for contribution data
  const [contributionData, setContributionData] = useState<Record<string, number>>({})

  // Then update the state declaration
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressItem[]>([]);

  const [totalMinutes, setTotalMinutes] = useState(0)
  const [activityLog, setActivityLog] = useState<ActivityLog>({});

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid)
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setStreak(data.currentStreak || 0)
          setSelectedDates(data.selectedDates?.map((d: Timestamp) => d.toDate()) || [])
          setCompletedDays(data.completedDays || 0)
          // Clean and validate weekly progress data
          setWeeklyProgress(cleanWeeklyProgressData(data.weeklyProgress || []))
          setTotalMinutes(data.totalMinutes || 0)
          setContributionData(data.contributionData || {})
          setActivityLog(data.activityLog || {})
        }
      })

      return () => unsubscribe()
    }
  }, [user])

  const updateProgress = async (minutes: number) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const today = new Date();
      
      // Check if we need to reset weekly progress
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const lastReset = userData?.lastWeekReset?.toDate() || new Date(0);
      const startOfCurrentWeek = new Date(today);
      startOfCurrentWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      startOfCurrentWeek.setHours(0, 0, 0, 0);

      // If last reset was before the start of current week, perform reset
      if (lastReset < startOfCurrentWeek) {
        await handleWeeklyReset(user.uid, userData);
      }

      const dayOfWeek = getDayKey(today);
      
      // Get current week's data after potential reset
      const currentWeekProgress = weeklyProgress.filter(item => 
        item.timestamp && isCurrentWeek(new Date(item.timestamp))
      );

      // Find if there's an entry for today
      const todayEntry = currentWeekProgress.find(item => 
        item.day === dayOfWeek && 
        item.timestamp && 
        new Date(item.timestamp).toDateString() === today.toDateString()
      );

      let newWeeklyProgress;
      if (todayEntry) {
        // Update existing entry for today
        newWeeklyProgress = weeklyProgress.map(item => {
          if (item === todayEntry) {
            return {
              ...item,
              minutes: item.minutes + minutes
            };
          }
          return item;
        });
      } else {
        // Create new entry for today
        newWeeklyProgress = [
          ...weeklyProgress.filter(item => 
            item.timestamp && isCurrentWeek(new Date(item.timestamp))
          ),
          {
            day: dayOfWeek,
            minutes: minutes,
            timestamp: today.toISOString()
          }
        ];
      }

      // Update other progress metrics
      const newTotalMinutes = totalMinutes + minutes;
      const contributionDate = today.toISOString().split('T')[0];
      const newContributionData = {
        ...contributionData,
        [contributionDate]: (contributionData[contributionDate] || 0) + 1
      };

      // Batch update all progress data
      await updateDoc(userDocRef, {
        weeklyProgress: newWeeklyProgress,
        totalMinutes: newTotalMinutes,
        contributionData: newContributionData,
        lastUpdated: Timestamp.now()
      });

      // Update local state
      setWeeklyProgress(newWeeklyProgress);
      setTotalMinutes(newTotalMinutes);
      setContributionData(newContributionData);
    }
  };

  // Replace the existing incrementStreak function with this:
  const incrementStreak = () => updateProgress(30) // Assuming 30 minutes per session

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  const handleTrackChange = (trackId: string) => {
    setActiveTrack(trackId)
    setTrackProgress(0) // Reset progress when changing tracks
  }

  const getActiveTrackDays = () => {
    const track = learningTracks.find(t => t.name === activeTrack)
    return track ? 1 : 0
  }

  const handleTalkToArya = () => {
    router.push('/user-page/talk-to-coach')
  }
  const handleTalkToAlia = () => {
    router.push('/user-page/talk-to-coach-communication')
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Failed to log out', error)
    }
  }

  // Update handleDateSelect to work with Calendar component
  const handleDateSelect = (dates: Date[] | undefined) => {
    if (dates) {
      setSelectedDates(dates)
    }
  }

  // Effect to update completed days when selectedDates changes
  useEffect(() => {
    setCompletedDays(selectedDates.length)
  }, [selectedDates])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Add this effect to handle data updates
  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const cleanedWeeklyProgress = cleanWeeklyProgressData(data.weeklyProgress || []);
          setWeeklyProgress(cleanedWeeklyProgress);
          setTotalMinutes(data.totalMinutes || 0);
          setContributionData(data.contributionData || {});
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
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
            {/* Close Sidebar Button (visible on mobile when sidebar is open) */}
            <Button
              variant="outline"
              size="icon"
              onClick={closeSidebar}
              className={`md:hidden fixed top-20 left-64 z-50 bg-white shadow-md ${sidebarOpen ? 'block' : 'hidden'}`}
              aria-label="Close sidebar"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <h1 className="text-3xl font-bold text-gray-800">Welcome back, {user?.displayName || 'Learner'}!</h1>
            
            {/* Improved Learning Journey Component */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Your Learning Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="progress" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="streak">Streak</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="progress" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Weekly Goal</p>
                        <p className="text-2xl font-bold">300 minutes</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                          {totalMinutes} minutes
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={(totalMinutes / 300) * 100} 
                      className="h-2 w-full"
                    />
                    <WeeklyProgressChart weeklyProgress={weeklyProgress} />
                  </TabsContent>
                  
                  <TabsContent value="streak" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Current Streak</p>
                        <div className="flex items-center">
                          <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
                          <p className="text-3xl font-bold">{streak} Days</p>
                        </div>
                      </div>
                      {/* <Button onClick={incrementStreak} variant="outline">
                        Complete Today
                      </Button> */}
                    </div>
                    <UiCalendar
                      selected={selectedDates}
                      onSelect={handleDateSelect}
                      className="rounded-md border"
                    />
                  </TabsContent>
                  
                  <TabsContent value="activity" className="space-y-4">
                    {/* <h3 className="text-xl font-semibold mb-2">Contribution Activity 2024</h3> */}
                    <ContributionGraph data={activityLog} year={new Date().getFullYear()} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Tracks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {learningTracks.map((track) => (
                    <Button 
                      key={track.name} 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors"
                    >
                      <track.icon className={`h-8 w-8 ${track.color} text-white p-1 rounded-full mb-2`} />
                      <span className="text-sm font-medium">{track.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Replace Challenge Tracks with CourseOverview */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold">Language Learning Course</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div onClick={() => router.push('/language-learning/unit-roadmap')} className="cursor-pointer">
                  <CourseOverview />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-400 to-blue-500 text-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">AI-POWERED ENGLISH TUTOR</h3>
                  <p className="text-lg mb-4 opacity-90">ARYA Personal Teacher</p>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50" onClick={handleTalkToArya}>Talk to ARYA</Button>
                </div>
                <Bot className="h-24 w-24 text-white opacity-80" />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-400 to-blue-500 text-white">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">AI-POWERED COMMUNICATION TUTOR</h3>
                  <p className="text-lg mb-4 opacity-90">ALIA Personal Teacher</p>
                  <Button className="bg-white text-red-600 hover:bg-red-50" onClick={handleTalkToAlia}>Talk to ALIA</Button>
                </div>
                <Bot className="h-24 w-24 text-white opacity-80" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>More learning for you</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {grammarActivities.map((activity) => (
                    <Button 
                      key={activity.name} 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/user-page/${activity.name.replace(/\s+/g, '')}`)} // Removed spaces from activity.name
                    >
                      
                      <activity.icon className={`h-8 w-8 ${activity.color} text-white p-1 rounded-full mb-2`} />
                      <span className="text-sm font-medium">{activity.name}</span>
                    </Button>
                  ))}
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
