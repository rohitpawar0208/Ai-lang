'use client'

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type SpeechRecognition = typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition;
type SpeechRecognitionEvent = any; // Add this line

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Mic, MicOff, Play, Pause, RotateCcw, Volume2, VolumeX, Send, Check } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { debounce } from 'lodash'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

type Message = {
  role: 'user' | 'ai'
  content: string
}

type GrammarError = {
  message: string
  offset: number
  length: number
  replacements: { value: string }[]
}

const LESSON_TOPICS = [
  "Greetings and Introductions",
  "Daily Routines",
  "Describing People and Places",
  "Ordering Food at a Restaurant",
  "Giving Directions",
]

export function ComponentsAiLanguageCoach() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [sessionTime, setSessionTime] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [currentTopic, setCurrentTopic] = useState('')
  const [lessonProgress, setLessonProgress] = useState(0)
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const lastProcessedResult = useRef<string>('')
  const userInputRef = useRef<HTMLTextAreaElement>(null)

  const debouncedCheckGrammar = useCallback(
    debounce((text: string) => checkGrammar(text), 500),
    []
  )

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript.trim()
            if (event.results[i].isFinal) {
              if (transcript !== lastProcessedResult.current) {
                finalTranscript += transcript + ' '
                lastProcessedResult.current = transcript
              }
            } else {
              interimTranscript = transcript
            }
          }

          setUserInput(prev => {
            const newInput = (prev + finalTranscript).trim()
            return newInput + (interimTranscript ? ' ' + interimTranscript : '')
          })

          if (finalTranscript) {
            debouncedCheckGrammar(finalTranscript.trim())
          }
        }

        recognitionRef.current.onend = () => {
          if (isListening) {
            recognitionRef.current?.start()
          }
        }
      }

      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis
      }
    }

    return () => {
      recognitionRef.current?.stop()
      synthRef.current?.cancel()
    }
  }, [isListening, debouncedCheckGrammar])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSessionActive) {
      interval = setInterval(() => {
        setSessionTime((prevTime) => prevTime + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isSessionActive])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    debouncedCheckGrammar(userInput)
  }, [userInput, debouncedCheckGrammar])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
      lastProcessedResult.current = ''
    }
    setIsListening(!isListening)
  }

  const toggleSession = () => {
    setIsSessionActive(!isSessionActive)
    if (!isSessionActive) {
      startNewLesson()
    } else {
      endSession()
    }
  }

  const startNewLesson = () => {
    setSessionTime(0)
    setMessages([])
    setUserInput('')
    setAiResponse('')
    setLessonProgress(0)
    setGrammarErrors([])
    lastProcessedResult.current = ''
    const newTopic = LESSON_TOPICS[Math.floor(Math.random() * LESSON_TOPICS.length)]
    setCurrentTopic(newTopic)
    const welcomeMessage = `Welcome to your English practice session! Today, we'll be focusing on "${newTopic}". Are you ready to begin?`
    addAIMessage(welcomeMessage)
  }

  const endSession = () => {
    recognitionRef.current?.stop()
    synthRef.current?.cancel()
    setIsListening(false)
    setIsSpeaking(false)
    const endMessage = `Great job! You've completed the lesson on "${currentTopic}". Your speaking has improved. Would you like to review any part of the lesson?`
    addAIMessage(endMessage)
  }

  const resetSession = () => {
    setIsSessionActive(false)
    setSessionTime(0)
    setMessages([])
    setUserInput('')
    setAiResponse('')
    setCurrentTopic('')
    setLessonProgress(0)
    setGrammarErrors([])
    lastProcessedResult.current = ''
    recognitionRef.current?.stop()
    synthRef.current?.cancel()
    setIsListening(false)
    setIsSpeaking(false)
  }

  const handleSendMessage = async (message: string = userInput) => {
    if (message.trim()) {
      addUserMessage(message)
      setUserInput('')
      lastProcessedResult.current = ''

      // Simulate AI response (replace with actual AI processing in a real application)
      setTimeout(() => {
        const aiResponse = generateAIResponse(message)
        addAIMessage(aiResponse)
      }, 1000)

      setLessonProgress(prev => Math.min(prev + 20, 100))
    }
  }

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'user', content }])
  }

  const addAIMessage = (content: string) => {
    setMessages(prev => [...prev, { role: 'ai', content }])
    setAiResponse(content)
    speak(content)
  }

  const generateAIResponse = (userMessage: string): string => {
    // This is a placeholder. In a real application, you'd integrate with a language model API.
    const responses = [
      `Great attempt! Let's practice saying "${userMessage}" with better pronunciation. Repeat after me...`,
      `Good job! Now, let's try using that phrase in a different context. Can you say...`,
      `Excellent! You're getting better at using "${currentTopic}" vocabulary. Let's try something more challenging...`,
      `I noticed you used [specific word/phrase]. That's perfect for this situation! Can you think of a synonym?`,
      `Well done! Now, let's roleplay a situation where you might use this language. Imagine you're...`,
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const speak = (text: string) => {
    if (synthRef.current) {
      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onend = () => setIsSpeaking(false)
      synthRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const checkGrammar = async (text: string) => {
    try {
      const response = await fetch('/api/grammar-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to check grammar');
      }

      const data = await response.json();
      setGrammarErrors(data.matches);
    } catch (error) {
      console.error('Error checking grammar:', error);
    }
  }

  const highlightErrors = (text: string) => {
    let result = text;
    let offset = 0;
    grammarErrors.sort((a, b) => b.offset - a.offset).forEach(error => {
      const start = error.offset + offset;
      const end = start + error.length;
      const highlightedText = `<span class="bg-yellow-200 cursor-pointer" title="${error.message}">${result.slice(start, end)}</span>`;
      result = result.slice(0, start) + highlightedText + result.slice(end);
      offset += highlightedText.length - error.length;
    });
    return result;
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI Language Coach</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Interactive English Practice</CardTitle>
          <CardDescription>Improve your English skills through conversation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button onClick={toggleSession} variant={isSessionActive ? "destructive" : "default"}>
                {isSessionActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isSessionActive ? 'End Session' : 'Start Session'}
              </Button>
              <span className="text-2xl font-mono">{formatTime(sessionTime)}</span>
              <Button onClick={resetSession} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
            {currentTopic && (
              <Alert>
                <AlertTitle>Current Topic</AlertTitle>
                <AlertDescription>{currentTopic}</AlertDescription>
              </Alert>
            )}
            <Progress value={lessonProgress} className="w-full" />
            <ScrollArea className="h-[300px] w-full border rounded-md p-4" ref={scrollAreaRef}>
              {messages.map((message, index) => (
                <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span 
                    className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                    dangerouslySetInnerHTML={{ __html: message.role === 'user' ? highlightErrors(message.content) : message.content }}
                  />
                </div>
              ))}
            </ScrollArea>
            <div className="space-y-2">
              <Label htmlFor="ai-response">AI Coach Response:</Label>
              <Textarea
                id="ai-response"
                value={aiResponse}
                readOnly
                className="w-full h-20"
                placeholder="AI coach response will appear here..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Textarea
                ref={userInputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message here..."
                className="flex-grow"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button onClick={() => handleSendMessage()} disabled={!isSessionActive || !userInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {grammarErrors.length > 0 && (
              <div className="space-y-2">
                <Label>Real-Time Error Detection:</Label>
                <div className="flex flex-wrap gap-2">
                  {grammarErrors.map((error, index) => (
                    <Popover key={index}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Check className="mr-2 h-4 w-4" />
                          Error {index + 1}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <p className="font-medium">Error: {error.message}</p>
                          <p>Suggestions:</p>
                          <ul className="list-disc pl-4">
                            {error.replacements.slice(0, 3).map((replacement, idx) => (
                              <li key={idx}>{replacement.value}</li>
                            ))}
                          </ul>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-between">
              <Button 
                onClick={toggleListening} 
                variant={isListening ? "destructive" : "default"}
                disabled={!isSessionActive}
              >
                {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </Button>
              <Button
                onClick={isSpeaking ? stopSpeaking : () => speak(aiResponse)}
                variant="outline"
                disabled={!isSessionActive || !aiResponse.trim()}
              >
                {isSpeaking ? <VolumeX className="mr-2 h-4 w-4" /> : <Volume2 className="mr-2 h-4 w-4" />}
                {isSpeaking ? 'Stop' : 'Repeat'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}