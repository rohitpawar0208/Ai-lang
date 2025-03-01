import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, ChevronDown, X, RefreshCw, ArrowLeft, CheckCircle2, BookOpen, Lightbulb, History } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, getDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import SphereVisualizer from './SphereVisualizer';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import type { VoiceAssistantProps, Message } from './types';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChatSidebar } from "@/components/ChatSidebar";
import { createChat, updateChat, Chat, ChatMessage } from '@/lib/firestore-chat';
import { v4 as uuidv4 } from 'uuid';

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  className,
  initialMessage,
  onMessageReceived,
  onRecordingStart,
  onRecordingStop,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // State declarations - keep them all together at the top
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showGrammarFeedback, setShowGrammarFeedback] = useState(false);

  // Group all useEffects together
  useEffect(() => {
    if (initialMessage) {
      setMessages([{
        text: initialMessage,
        type: 'ai',
        timestamp: new Date()
      }]);
    }
  }, [initialMessage]);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onended = () => {
      setIsPlaying(false);
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length > 1 && messages[messages.length - 1].type === 'user' && !sessionStartTime) {
      // Only start session if the last message is from user and is a new message
      const lastMessage = messages[messages.length - 1];
      const isNewMessage = lastMessage.timestamp.getTime() > Date.now() - 1000;
      if (isNewMessage) {
        setSessionStartTime(new Date());
      }
    }
  }, [messages, sessionStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        setSessionDuration(duration);
        if (duration >= 90000) {
          handleSessionComplete();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - recordingStartTime.getTime()) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSessionComplete = async () => {
    if (user && sessionStartTime) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      const contributionDate = localDate.toISOString().split('T')[0];
      const dayKey = localDate.toLocaleString('en-US', { weekday: 'short' });
      const sessionDurationMinutes = Math.floor(sessionDuration / 60);

      const newProgressEntry = {
        day: dayKey,
        minutes: sessionDurationMinutes,
        timestamp: localDate.toISOString()
      };

      await updateDoc(userDocRef, {
        totalMinutes: increment(sessionDurationMinutes),
        sessionsCompleted: increment(1),
        lastActiveDay: contributionDate,
        [`activityLog.${contributionDate}`]: increment(1),
        weeklyProgress: arrayUnion(newProgressEntry),
        lastUpdated: Timestamp.now()
      });

      setSessionStartTime(null);
      setSessionDuration(0);
    }
  };

  // Add clear chat functionality
  const clearChat = () => {
    setMessages([{
      text: initialMessage || "Let's start a new conversation.",
      type: 'ai',
      timestamp: new Date()
    }]);
    setSessionStartTime(new Date());
    setSessionDuration(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMessageTime = (date: Date | string) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return format(dateObj, 'hh:mm:ss a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid time';
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsAiSpeaking(true);
      const response = await fetch('/api/TTS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get audio stream');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsAiSpeaking(false);
          setIsPlaying(false);
        };
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      setIsAiSpeaking(false);
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateGrammarFeedback = async (text: string) => {
    try {
      // Get conversation context (last 3 messages)
      const contextMessages = messages.slice(-3).map(m => ({
        role: m.type === 'user' ? 'user' : 'ai',
        content: m.text
      }));

      // Format context for better feedback
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

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]);
        };
        reader.readAsDataURL(audioBlob);
      });

      const response = await fetch('/api/STT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      
      if (data.text) {
        // Start session when user sends a new message
        if (!sessionStartTime) {
          setSessionStartTime(new Date());
        }

        const newUserMessage = {
          text: data.text,
          type: 'user' as const,
          timestamp: new Date()
        };
        
        // Generate grammar feedback
        const feedback = await generateGrammarFeedback(data.text);
        const userMessageWithFeedback = { ...newUserMessage, grammarFeedback: feedback };
        
        setMessages(prev => [...prev, userMessageWithFeedback]);

        if (onMessageReceived) {
          setIsAiLoading(true);
          const aiResponse = await onMessageReceived(data.text);
          setIsAiLoading(false);
          
          const newAiMessage = {
            text: aiResponse,
            type: 'ai' as const,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, newAiMessage]);
          
          // Only try to update chat if we have a currentChatId
          if (currentChatId) {
            try {
              await updateChat(currentChatId, [...messages, userMessageWithFeedback, newAiMessage].map(m => ({
                id: uuidv4(),
                sender: m.type,
                content: m.text,
                timestamp: m.timestamp
              })));
            } catch (error) {
              console.error('Error updating chat:', error);
              // Don't throw here, just show a toast notification
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save chat history. Your conversation will continue but may not be saved."
              });
            }
          }
          
          await speakText(aiResponse);
        }
      } else {
        throw new Error('No translation received');
      }
    } catch (error) {
      setIsAiLoading(false);
      setIsAiSpeaking(false);
      console.error('Translation error:', error);
      toast({
        title: "Error",
        description: "Failed to translate audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstart = () => {
        console.log('Recording started');
        setIsRecording(true);
        setRecordingStartTime(new Date());
        setAudioChunks([]);
        setMessages(prev => [...prev, {
          text: "Started recording...",
          type: 'user',
          timestamp: new Date()
        }]);
        onRecordingStart?.();
      };

      recorder.onstop = async () => {
        console.log('Recording stopped');
        setIsRecording(false);
        setRecordingStartTime(null);
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        onRecordingStop?.();
        await transcribeAudio(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const handleGoBack = async () => {
    if (sessionStartTime) {
      if (window.confirm("Are you sure you want to end the session?")) {
        await handleSessionComplete();
        router.push('/user-page/talk-to-coach/');
      }
    } else {
      router.push('/user-page/talk-to-coach/');
    }
  };

  const playMessage = async (message: Message) => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      await speakText(message.text);
    }
  };

  const handleFeedbackClick = async () => {
    try {
      // First, complete the session analytics
      await handleSessionComplete();

      // Then store conversation for feedback
      const conversationData = {
        messages: messages.map(msg => ({
          id: Date.now(),
          sender: msg.type === 'user' ? 'user' : 'ai',
          content: msg.text,
          timestamp: msg.timestamp
        })),
        topic: "Voice Conversation",
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('currentConversation', JSON.stringify(conversationData));

      // Navigate to feedback page
      router.push('/user-page/talk-to-coach/feedback');
    } catch (error) {
      console.error('Error completing session:', error);
      // Still navigate to feedback even if analytics fails
      router.push('/user-page/talk-to-coach/feedback');
    }
  };

  // Add new functions for chat management
  const createNewChat = async () => {
    if (!user || messages.length === 0) return;
    
    try {
      const chatTitle = messages.find(m => m.type === 'user')?.text.slice(0, 50) || 'Voice Chat';
      const newChat = await createChat(user.uid, {
        title: chatTitle,
        topic: 'Voice Chat',
        category: 'Voice',
        difficulty: 'Mixed',
        messages: messages.map(m => ({
          id: uuidv4(),
          sender: m.type as 'user' | 'ai',
          content: m.text,
          timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
        })),
        userId: user.uid
      });
      setCurrentChatId(newChat.id);
      toast({
        title: "Success",
        description: "New chat created successfully"
      });
    } catch (error) {
      console.error('Error creating new chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create new chat"
      });
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    try {
      const formattedMessages = chat.messages.map(m => ({
        text: m.content,
        type: m.sender as 'user' | 'ai',
        timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
      }));
      
      // First set the chat ID to prevent unnecessary updates
      setCurrentChatId(chat.id);
      
      // Then update the messages without starting the session
      setMessages(formattedMessages);
      
      // Reset session-related states
      setSessionStartTime(null);
      setSessionDuration(0);
      setIsSidebarOpen(false);
      
      toast({
        title: "Chat Loaded",
        description: "Successfully loaded chat history"
      });
    } catch (error) {
      console.error('Error selecting chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load chat"
      });
    }
  };

  const handleNewChat = () => {
    // Reset all states for new chat
    setMessages([{
      text: initialMessage || "Let's start a new conversation.",
      type: 'ai',
      timestamp: new Date()
    }]);
    setCurrentChatId(null);
    setSessionStartTime(null);
    setSessionDuration(0);
    setIsSidebarOpen(false);
  };

  // Update the effect for chat updates to handle errors gracefully and prevent unnecessary updates
  useEffect(() => {
    const updateChatHistory = async () => {
      // Only update if we have a currentChatId and new messages have been added
      if (currentChatId && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const isNewMessage = lastMessage.timestamp.getTime() > Date.now() - 1000; // Check if message is new (within last second)
        
        if (isNewMessage) {
          try {
            await updateChat(currentChatId, messages.map(m => ({
              id: uuidv4(),
              sender: m.type,
              content: m.text,
              timestamp: m.timestamp
            })));
          } catch (error) {
            console.error('Error updating chat:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to save chat history. Please try again."
            });
          }
        }
      }
    };

    updateChatHistory();
  }, [messages, currentChatId]);

  const renderGrammarFeedback = (message: Message) => {
    if (message.type !== 'user' || !message.grammarFeedback || !showGrammarFeedback) return null;

    return (
      <div className="mt-2 text-xs space-y-2 border-t border-gray-200 pt-2">
        {/* Grammar Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-3 w-3" />
            <span className="font-medium">Grammar</span>
          </div>
          <p className="text-gray-600 pl-4 text-[11px]">{message.grammarFeedback.grammar}</p>
        </div>

        {/* Suggestions Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-amber-600">
            <Lightbulb className="h-3 w-3" />
            <span className="font-medium">Suggestions</span>
          </div>
          <p className="text-gray-600 pl-4 text-[11px]">{message.grammarFeedback.suggestions}</p>
        </div>

        {/* Coherence Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-purple-600">
            <BookOpen className="h-3 w-3" />
            <span className="font-medium">Coherence</span>
          </div>
          <p className="text-gray-600 pl-4 text-[11px]">{message.grammarFeedback.coherence}</p>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex mx-auto bg-white/80 backdrop-blur-sm max-w-md w-full relative",
      "md:rounded-lg md:shadow-lg md:my-4",
      className
    )}>
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Chat History Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-200 ease-in-out z-50 w-72 bg-white`}>
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-alia-primary to-alia-secondary text-white">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleGoBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">ALIA</h1>
            <p className="text-sm opacity-90">Your AI Language Coach</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-white hover:bg-white/20"
                >
                  Feedback
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white rounded-lg border-0">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl text-blue-700 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    End Session and Get Feedback?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 mt-2">
                    <div className="space-y-3">
                      <p>
                        This will analyze your conversation and provide:
                      </p>
                      <ul className="list-none space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>Detailed grammar analysis</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          <span>Vocabulary assessment</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <span>Content evaluation and recommendations</span>
                        </li>
                      </ul>
                      <p className="text-sm text-gray-500 italic">
                        You can start a new conversation after reviewing your feedback.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel className="hover:bg-gray-100 transition-colors">
                    Continue Chat
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleFeedbackClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Get Feedback
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              onClick={() => setIsSidebarOpen(true)}
              variant="ghost"
              className="text-white hover:bg-white/20"
              size="sm"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-3 space-y-6 overflow-hidden">
          {/* Timer and Controls */}
          <div className={cn(
            "flex items-center justify-center space-x-4 p-3 rounded-full bg-gray-100/80 backdrop-blur-sm",
            "transition-all duration-300",
            !isRecording && "opacity-0 pointer-events-none"
          )}>
            <span className="text-gray-700 font-mono min-w-[60px]">{formatTime(elapsedTime)}</span>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50">
              <Volume2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50">
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-red-100 hover:text-red-500"
              onClick={stopRecording}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Sphere and Recording Controls */}
          <div className="flex-1 flex flex-col justify-between items-center py-4">
            <div className="flex-1 flex items-center justify-center w-full">
              <SphereVisualizer 
                isRecording={isRecording} 
                isAnimating={isAiLoading || isAiSpeaking} 
                className="scale-100"
              />
            </div>
            
            <div className="mt-4 flex flex-col items-center space-y-3">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "rounded-full w-16 h-16 transition-all duration-300 shadow-lg",
                  isRecording 
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-alia-primary hover:bg-alia-secondary"
                )}
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </Button>
              <p className="text-sm text-gray-500 font-medium">
                {isRecording ? "Tap to stop" : "Tap to start"}
              </p>
            </div>
          </div>

          {/* Chat Section */}
          <div className="w-full rounded-lg border bg-white/50 backdrop-blur-sm shadow-sm">
            <div className="px-3 py-2 border-b">
              <Button
                onClick={() => setShowGrammarFeedback(!showGrammarFeedback)}
                variant="ghost"
                className="w-full h-8 text-xs bg-green-50 text-green-700 hover:bg-green-100"
              >
                {showGrammarFeedback ? 'Hide' : 'Show'} Grammar Feedback
              </Button>
            </div>
            <ScrollArea className="h-[200px] w-full rounded-lg p-3">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col p-3 rounded-lg transition-all duration-300",
                      message.type === 'user' 
                        ? "bg-alia-primary/10 ml-auto max-w-[80%]" 
                        : "bg-gray-100/80 mr-auto max-w-[80%]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => playMessage(message)}
                      >
                        {isPlaying ? (
                          <Volume2 className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm">{message.text}</p>
                    {renderGrammarFeedback(message)}
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-white/50">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Session Duration
            </p>
            <p className="text-2xl font-mono text-alia-primary">
              {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;