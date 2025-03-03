'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, Volume2, Languages, Send, Mic, MicOff, 
  Trash2, RefreshCw, CheckCircle2, BookOpen, Lightbulb 
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, updateDoc, increment, getDoc, Timestamp, arrayUnion, setDoc } from 'firebase/firestore'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  grammarFeedback?: {
    grammar: string;
    suggestions: string;
    coherence: string;
  };
}

interface CourseChatInterfaceProps {
  topic: string;
  initialPrompt: string;
  chapterId: string;
  lessonId: string;
}

export default function CourseChatInterface({ 
  topic, 
  initialPrompt,
  chapterId,
  lessonId 
}: CourseChatInterfaceProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      sender: 'ai', 
      content: initialPrompt,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showGrammarFeedback, setShowGrammarFeedback] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const LESSON_DURATION = 15 * 60; // 15 minutes in seconds

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 1 && !sessionStartTime) {
      setSessionStartTime(new Date());
    }
  }, [messages, sessionStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStartTime && !lessonCompleted) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        setSessionDuration(duration);
        
        // Check if lesson duration is reached
        if (duration >= LESSON_DURATION && !lessonCompleted) {
          handleLessonComplete();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStartTime, lessonCompleted]);

  const handleLessonComplete = async () => {
    setLessonCompleted(true);
    setShowCompletionDialog(true);
    
    try {
      if (!user) return;

      // Update lesson progress
      const lessonProgressRef = doc(db, 'users', user.uid, 'progress', `${chapterId}_${lessonId}`);
      await setDoc(lessonProgressRef, {
        completed: true,
        lastAttempt: Timestamp.now(),
        minutesSpent: Math.floor(sessionDuration / 60),
        messages: messages.map(m => ({
          ...m,
          timestamp: Timestamp.fromDate(m.timestamp)
        })),
        completedAt: Timestamp.now()
      }, { merge: true });

      // Unlock next lesson
      const nextLessonId = parseInt(lessonId) + 1;
      const nextLessonRef = doc(db, 'users', user.uid, 'progress', `${chapterId}_${nextLessonId}`);
      await setDoc(nextLessonRef, {
        unlocked: true,
        unlockedAt: Timestamp.now()
      }, { merge: true });

      // Update user stats
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        totalMinutes: increment(Math.floor(sessionDuration / 60)),
        lessonsCompleted: increment(1),
        lastCompletedLesson: `${chapterId}_${lessonId}`,
        lastActiveDay: new Date().toISOString().split('T')[0],
        [`activityLog.${new Date().toISOString().split('T')[0]}`]: increment(1),
        weeklyProgress: arrayUnion({
          day: new Date().toLocaleString('en-US', { weekday: 'short' }),
          minutes: Math.floor(sessionDuration / 60),
          lessonId: `${chapterId}_${lessonId}`,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || lessonCompleted) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const newUserMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputMessage('');

    const aiResponse = await generateAIResponse(inputMessage);
    const newAiMessage: Message = {
      id: messages.length + 2,
      sender: 'ai',
      content: aiResponse,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newAiMessage]);
    
    const feedback = await generateGrammarFeedback(inputMessage);
    
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === newUserMessage.id 
          ? { ...msg, grammarFeedback: feedback }
          : msg
      )
    );

    speak(aiResponse);
  };

  const generateAIResponse = async (userInput: string) => {
    setLoadingAI(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: initialPrompt },
            ...messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
            { role: "user", content: userInput }
          ],
          model: "llama-3.1-8b-instant"
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI response');
      }

      const data = await response.json();
      return data.response || 'I apologize, but I could not generate a response at this time.';
    } catch (error) {
      console.error('Error generating AI response:', error);
      return `I'm sorry, I couldn't generate a response at the moment. Error: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      setLoadingAI(false);
    }
  };

  const generateGrammarFeedback = async (text: string) => {
    try {
      const contextMessages = messages.slice(-3).map(m => ({
        role: m.sender,
        content: m.content
      }));

      const formattedContext = contextMessages
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

      const response = await fetch('/api/grammar-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          context: formattedContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get grammar feedback');
      }

      const data = await response.json();
      return {
        grammar: data.feedback.grammar || 'No grammar corrections needed.',
        suggestions: data.feedback.suggestions || 'No suggestions at this time.',
        coherence: data.feedback.coherence || 'No coherence analysis available.'
      };
    } catch (error) {
      console.error('Error getting grammar feedback:', error);
      return {
        grammar: 'Unable to generate grammar feedback at this time.',
        suggestions: 'Service temporarily unavailable.',
        coherence: 'Service temporarily unavailable.'
      };
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') && 
        voice.lang.startsWith('en-')
      );
      
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.2;
      utterance.rate = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat and start over?')) {
      setMessages([{ id: 1, sender: 'ai', content: initialPrompt, timestamp: new Date() }]);
      setInputMessage('');
    }
  };

  const handleBack = async () => {
    if (sessionStartTime) {
      if (window.confirm("Are you sure you want to end this session?")) {
        await handleLessonComplete();
        router.back();
      }
    } else {
      router.back();
    }
  };

  const handleFeedbackClick = async () => {
    try {
      await handleLessonComplete();
      
      const conversationData = {
        messages,
        topic,
        chapterId,
        lessonId,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('currentConversation', JSON.stringify(conversationData));
      
      router.push(`/lessons/${chapterId}/${lessonId}/feedback`);
    } catch (error) {
      console.error('Error completing session:', error);
      router.push(`/lessons/${chapterId}/${lessonId}/feedback`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.min((sessionDuration / LESSON_DURATION) * 100, 100);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white px-4 py-3 flex items-center justify-between shadow-md">
        <button 
          onClick={handleBack}
          className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 mx-4">
          <h1 className="text-lg font-semibold text-center truncate">
            {topic}
          </h1>
          <div className="mt-2 relative">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className="text-sm text-center mt-1 text-gray-600">
              {formatTime(sessionDuration)} / {formatTime(LESSON_DURATION)}
            </p>
          </div>
        </div>
        <AlertDialog open={showCompletionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Lesson Completed! 🎉</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-4">
                  <p>Congratulations! You've completed this lesson.</p>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-800">Your Progress:</h4>
                    <ul className="mt-2 space-y-1 text-sm text-green-700">
                      <li>• Time spent: {formatTime(sessionDuration)}</li>
                      <li>• Messages exchanged: {messages.length}</li>
                      <li>• Next lesson unlocked!</li>
                    </ul>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => router.push(`/language-learning/learning-path/${chapterId}`)}>
                Return to Chapter
              </AlertDialogAction>
              <AlertDialogAction onClick={() => router.push(`/language-learning/learning-path/${chapterId}/lessons/${parseInt(lessonId) + 1}/chat`)}>
                Start Next Lesson
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Card className={`max-w-[75%] ${message.sender === 'user' ? 'bg-blue-50' : 'bg-white'}`}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  {message.sender === 'ai' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/ai-avatar.png" alt="AI" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-semibold">
                    {message.sender === 'ai' ? 'AI Teacher' : 'You'}
                  </span>
                  <div className="flex gap-1 ml-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => speak(message.content)}
                      className="h-8 w-8 p-1"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.sender === 'user' && message.grammarFeedback && showGrammarFeedback && (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="bg-green-50 p-2 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-1">Grammar</h4>
                      <p className="text-green-700">{message.grammarFeedback.grammar}</p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-1">Suggestions</h4>
                      <p className="text-blue-700">{message.grammarFeedback.suggestions}</p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg">
                      <h4 className="font-medium text-purple-800 mb-1">Coherence</h4>
                      <p className="text-purple-700">{message.grammarFeedback.coherence}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t">
        <button
          onClick={() => setShowGrammarFeedback(!showGrammarFeedback)}
          className="w-full py-2 px-4 text-green-700 bg-green-50 hover:bg-green-100 
                     border-b border-green-200 transition-colors text-center text-sm"
        >
          {showGrammarFeedback ? 'Hide Grammar Feedback' : 'Show Grammar Feedback'}
        </button>

        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={loadingAI}>
              <Send className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={clearChat}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {loadingAI && (
            <p className="text-center mt-2 text-sm text-gray-600">Processing...</p>
          )}
          <p className="text-center mt-2 text-sm text-gray-600">
            Session time: {formatTime(sessionDuration)}
          </p>
        </div>
      </div>
    </div>
  );
}
