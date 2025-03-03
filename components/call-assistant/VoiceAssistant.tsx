import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, ChevronDown, X, RefreshCw, ArrowLeft, CheckCircle2, BookOpen, Lightbulb } from "lucide-react";
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
    if (messages.length > 1 && !sessionStartTime) {
      setSessionStartTime(new Date());
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

  const formatMessageTime = (date: Date) => {
    return format(date, 'hh:mm:ss a');
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
        setMessages(prev => [...prev, {
          text: data.text,
          type: 'user',
          timestamp: new Date()
        }]);

        if (onMessageReceived) {
          setIsAiLoading(true);
          const aiResponse = await onMessageReceived(data.text);
          setIsAiLoading(false);
          
          setMessages(prev => [...prev, {
            text: aiResponse,
            type: 'ai',
            timestamp: new Date()
          }]);
          
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

  return (
    <div className={cn(
      "flex flex-col mx-auto bg-white/80 backdrop-blur-sm max-w-md w-full",
      "md:rounded-lg md:shadow-lg md:my-4",
      className
    )}>

      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-alia-primary to-alia-secondary text-white">
        <button 
          onClick={handleGoBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold">ALIA</h1>
          <p className="text-sm opacity-90">Your AI Language Coach</p>
        </div>
        <div className="flex items-center gap-2">
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
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={clearChat}
          >
            <RefreshCw className="h-5 w-5" />
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
  );
};

export default VoiceAssistant;