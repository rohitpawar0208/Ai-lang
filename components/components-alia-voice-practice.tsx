'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Mic, Pause, Play, X, Sparkles, Volume2, VolumeX, Save, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface AryaVoicePracticeProps {
  topic: string
  initialPrompt: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  onComplete: () => void
}

enum SessionState {
  Idle,
  AryaSpeaking,
  UserSpeaking,
  Paused,
  Completed,
}

export function AryaVoicePracticeComponent({ topic, initialPrompt, difficulty, onComplete }: AryaVoicePracticeProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.Idle)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [replySuggestion, setReplySuggestion] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(70)
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

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
    let interval: NodeJS.Timeout
    if (sessionState === SessionState.UserSpeaking || sessionState === SessionState.AryaSpeaking) {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [sessionState])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  const handleStart = () => {
    setSessionState(SessionState.AryaSpeaking)
    playAudio('arya_introduction.mp3')
    setTimeout(() => {
      setSessionState(SessionState.UserSpeaking)
      setReplySuggestion(initialPrompt)
    }, 3000)
  }

  const handlePause = () => {
    setSessionState(SessionState.Paused)
    if (audioRef.current) audioRef.current.pause()
  }

  const handleResume = () => {
    setSessionState(SessionState.UserSpeaking)
    if (audioRef.current) audioRef.current.play()
  }

  const handleEnd = () => {
    setSessionState(SessionState.Completed)
    onComplete()
  }

  const handleUserResponse = () => {
    // This is where you'd integrate with speech recognition API
    // For now, we'll simulate a response
    toast({
      title: "Response Recorded",
      description: "Your answer has been processed. ALIA is analyzing your response.",
    })
    setSessionState(SessionState.AryaSpeaking)
    playAudio('arya_feedback.mp3')
    setTimeout(() => {
      setSessionState(SessionState.UserSpeaking)
      setReplySuggestion(null) // Clear previous suggestion
    }, 3000)
  }

  const playAudio = (filename: string) => {
    if (audioRef.current) {
      audioRef.current.src = `/audio/${filename}`
      audioRef.current.play()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-teal-900 via-emerald-900 to-green-900">
      <audio ref={audioRef} />
      <header className="bg-black bg-opacity-30 p-4 flex items-center justify-between">
        <Link href="/arya-chat" className="text-white hover:text-gray-200">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold text-white">{topic}</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX className="h-6 w-6 text-white" /> : <Volume2 className="h-6 w-6 text-white" />}
        </Button>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center p-4 space-y-8">
        <div className="text-white text-center">
          <p className="text-3xl font-bold mb-2">{topic}</p>
          <p className="text-xl">Difficulty: {difficulty}</p>
          <p className="text-lg mt-2">Session Time: {formatTime(sessionDuration)}</p>
        </div>
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-teal-500">
            <AvatarImage src="/arya-avatar.png" alt="ALIA" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          {sessionState === SessionState.AryaSpeaking && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-teal-500 text-white px-3 py-1 rounded-full text-sm">
              Speaking
            </div>
          )}
        </div>
        <div className="text-white text-center text-2xl font-semibold">
          {sessionState === SessionState.AryaSpeaking && "ALIA is speaking..."}
          {sessionState === SessionState.UserSpeaking && "Your turn to speak"}
          {sessionState === SessionState.Paused && "Session Paused"}
          {sessionState === SessionState.Completed && "Session Completed"}
        </div>
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-green-500">
            <AvatarImage src="/user-avatar.png" alt="User" />
            <AvatarFallback>You</AvatarFallback>
          </Avatar>
          {sessionState === SessionState.UserSpeaking && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
              Your Turn
            </div>
          )}
        </div>
      </div>

      {replySuggestion && (
        <Card className="mx-4 mb-4 bg-teal-800 border-teal-700">
          <CardContent className="p-4 flex items-start space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm font-semibold text-teal-300 mb-1">Suggestion</p>
              <p className="text-white">{replySuggestion}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto" 
              onClick={() => setReplySuggestion(null)}
            >
              <X className="h-4 w-4 text-teal-300" />
            </Button>
          </CardContent>
        </Card>
      )}

      <footer className="bg-black bg-opacity-30 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-white" />
            <Slider
              value={[volume]}
              max={100}
              step={1}
              className="w-24"
              onValueChange={(value) => setVolume(value[0])}
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">Auto-play</span>
            <Switch
              checked={isAutoPlayEnabled}
              onCheckedChange={setIsAutoPlayEnabled}
            />
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          {sessionState === SessionState.Idle ? (
            <Button variant="default" size="lg" onClick={handleStart}>
              <Play className="h-6 w-6 mr-2" />
              Start Session
            </Button>
          ) : sessionState === SessionState.Paused ? (
            <Button variant="default" size="lg" onClick={handleResume}>
              <Play className="h-6 w-6 mr-2" />
              Resume
            </Button>
          ) : sessionState === SessionState.UserSpeaking ? (
            <Button variant="default" size="lg" onClick={handleUserResponse}>
              <Mic className="h-6 w-6 mr-2" />
              Record Response
            </Button>
          ) : (
            <Button variant="default" size="lg" onClick={handlePause}>
              <Pause className="h-6 w-6 mr-2" />
              Pause
            </Button>
          )}
          <Button variant="secondary" size="lg" onClick={() => toast({ title: "Progress Saved", description: "Your session progress has been saved." })}>
            <Save className="h-6 w-6 mr-2" />
            Save Progress
          </Button>
          <Button variant="destructive" size="lg" onClick={handleEnd}>
            <X className="h-6 w-6 mr-2" />
            End Session
          </Button>
        </div>
      </footer>
    </div>
  )
}