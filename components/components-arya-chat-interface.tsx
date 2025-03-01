'use client'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, MessageSquare, Mic, Search, Star, Clock, Zap, BookOpen, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/contexts/AuthContext'

interface Topic {
  id: string
  title: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  category: string
  image: string
}

interface ChallengeTrack {
  id: string
  title: string
  days: number
  progress: number
}

const topics: Topic[] = [
  { id: 'small-talk', title: 'Small Talk', difficulty: 'Beginner', category: 'General', image: '/placeholder.svg?height=100&width=100' },
  { id: 'opinion', title: 'Express Opinions', difficulty: 'Intermediate', category: 'General', image: '/placeholder.svg?height=100&width=100' },
  { id: 'daily-routine', title: 'Daily Routines', difficulty: 'Beginner', category: 'General', image: '/placeholder.svg?height=100&width=100' },
  { id: 'artificial-intelligence', title: "Artificial Intelligence", difficulty: 'Advanced', category: 'General', image: '/placeholder.svg?height=100&width=100' },
  { id: 'job-interview', title: 'Job Interview', difficulty: 'Intermediate', category: 'Interview', image: '/placeholder.svg?height=100&width=100' },
  { id: 'behavioral-questions', title: 'Behavioral Questions', difficulty: 'Advanced', category: 'Interview', image: '/placeholder.svg?height=100&width=100' },
  { id: 'ancient-civilizations', title: 'Ancient Civilizations', difficulty: 'Intermediate', category: 'History', image: '/placeholder.svg?height=100&width=100' },
  { id: 'world-wars', title: 'World Wars', difficulty: 'Advanced', category: 'History', image: '/placeholder.svg?height=100&width=100' },
  { id: 'industrial-revolution', title: 'Industrial Revolution', difficulty: 'Intermediate', category: 'History', image: '/placeholder.svg?height=100&width=100' },
]

const challengeTracks: ChallengeTrack[] = [
  { id: '10-day-challenge', title: '10-Day Speaking Challenge', days: 10, progress: 0 },
  { id: '20-day-fluency', title: '20-Day Fluency Builder', days: 20, progress: 0 },
  { id: '30-day-mastery', title: '30-Day English Mastery', days: 30, progress: 0 },
]

const categories = ['All', 'General', 'Interview', 'History', 'Challenge Tracks']

export function AryaChatInterfaceComponent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [remainingTime, setRemainingTime] = useState(943) // 15:43 in seconds
  const [tracks, setTracks] = useState(challengeTracks)

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

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const savedTracks = localStorage.getItem('challengeTracks')
    if (savedTracks) {
      setTracks(JSON.parse(savedTracks))
    }
  }, [])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const filteredTopics = topics.filter(topic => 
    (activeCategory === 'All' || topic.category === activeCategory) &&
    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleProgressUpdate = (trackId: string) => {
    const updatedTracks = tracks.map(track => 
      track.id === trackId ? { ...track, progress: Math.min(track.progress + 1, track.days) } : track
    )
    setTracks(updatedTracks)
    localStorage.setItem('challengeTracks', JSON.stringify(updatedTracks))
  }

  // const startConversation = (topicId: string, mode: 'chat' | 'voice') => {
  //   // Implement the conversation start logic here
  //   console.log(`Starting ${mode} conversation for topic: ${topicId}`)
  // }

  const startConversation = (topicId: string, mode: 'chat' | 'voice') => {
    if (mode === 'chat') {
      const topic = topics.find(t => t.id === topicId)
      if (topic) {
        router.push(`/user-page/talk-to-coach/chat?topic=${topic.title}&category=${topic.category}&difficulty=${topic.difficulty}`)
      }
    }
    if (mode === 'voice') {
      const topic = topics.find(t => t.id === topicId)
      if (topic) {
        router.push(`/user-page/talk-to-coach/voice-sphere-arya-english?topic=${topic.title}&category=${topic.category}&difficulty=${topic.difficulty}`)
      }
    }
    
    else {
      console.log(`Starting ${mode} conversation for topic: ${topicId}`)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white p-4 flex items-center justify-between shadow-sm">
        <Link href="/user-page" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold">ARYA AI Language Coach</h1>
        <Button variant="ghost" size="icon">
          <Star className="h-6 w-6 text-yellow-400" />
        </Button>
      </header>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search topics..."
            className="pl-10 pr-4 py-2 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-grow overflow-hidden flex flex-col">
        <TabsList className="bg-white p-2 justify-start overflow-x-auto flex-shrink-0">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="px-4 py-2">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeCategory} className="flex-grow overflow-y-auto p-4">
          {activeCategory === 'Challenge Tracks' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tracks.map((track) => (
                <Card key={track.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{track.title}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {track.days} Days
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {track.progress} / {track.days} completed
                      </span>
                    </div>
                    <Progress value={(track.progress / track.days) * 100} className="mb-4" />
                    <Button 
                      className="w-full mb-2"
                      onClick={() => handleProgressUpdate(track.id)}
                      disabled={track.progress === track.days}
                    >
                      {track.progress === track.days ? 'Completed' : 'Complete Today'}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => startConversation(track.id, 'chat')}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                      <Button variant="outline" onClick={() => startConversation(track.id, 'voice')}>
                        <Mic className="w-4 h-4 mr-2" />
                        Voice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTopics.map((topic) => (
                <Card key={topic.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-4">
                    <img src={topic.image} alt="" className="w-full h-40 object-cover rounded-md mb-4" />
                    <Badge className={`mb-2 ${getDifficultyColor(topic.difficulty)}`}>
                      {topic.difficulty}
                    </Badge>
                    <h3 className="font-semibold text-lg mb-2">{topic.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">Practice {topic.title.toLowerCase()} with ARYA</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => startConversation(topic.id, 'chat')}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Button>
                      <Button onClick={() => startConversation(topic.id, 'voice')}>
                        <Mic className="w-4 h-4 mr-2" />
                        Voice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <footer className="bg-white p-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-yellow-500" />
            <span className="text-sm text-yellow-600 font-medium">
              {formatTime(remainingTime)} remaining in trial
            </span>
          </div>
          <Button variant="outline" size="sm">
            Upgrade
          </Button>
        </div>
        <Progress value={(remainingTime / 943) * 100} className="mb-4" />
      </footer>
    </div>
  )
}