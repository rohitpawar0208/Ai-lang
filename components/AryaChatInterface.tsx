'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, Volume2, Languages, Send, Mic, MicOff, 
  Trash2, RefreshCw, CheckCircle2, BookOpen, Lightbulb 
} from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, updateDoc, increment, getDoc, Timestamp, arrayUnion } from 'firebase/firestore'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ChatSidebar } from "@/components/ChatSidebar"
import { createChat, updateChat, Chat, ChatMessage } from '@/lib/firestore-chat'
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from 'uuid'

interface Message extends Omit<ChatMessage, 'timestamp'> {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  grammarFeedback?: {
    grammar: string;
    suggestions: string;
    coherence: string;
  };
}

interface AryaChatInterfaceProps {
  topic: string;
  initialPrompt: string;
  category?: string;
  difficulty?: string;
}

export default function AryaChatInterface({ topic: initialTopic, initialPrompt, category = 'General', difficulty = 'Beginner' }: AryaChatInterfaceProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const [messages, setMessages] = useState<Message[]>([
    { id: uuidv4(), sender: 'ai', content: initialPrompt }
  ]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState(initialTopic);
  const [inputMessage, setInputMessage] = useState('');
  const [showGrammarFeedback, setShowGrammarFeedback] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 1 && messages[messages.length - 1].sender === 'user' && !sessionStartTime) {
      setSessionStartTime(new Date())
    }
  }, [messages, sessionStartTime])

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date()
        const duration = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
        setSessionDuration(duration)
        if (duration >= 90000) {
          handleSessionComplete()
        }
      }, 1000)
    }
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [sessionStartTime])

  useEffect(() => {
    if (messages.length > 1 && !currentChatId) {
      createNewChat();
    }
  }, [messages, currentChatId]);

  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      updateExistingChat();
    }
  }, [messages, currentChatId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setInputMessage(transcript);
          
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleNewChat = () => {
    setMessages([{ id: uuidv4(), sender: 'ai', content: initialPrompt }]);
    setCurrentChatId(null);
    setCurrentTopic(initialTopic);
    setInputMessage('');
    setSessionStartTime(null);
    setSessionDuration(0);
  };

  const createNewChat = async () => {
    if (!user || messages.length <= 1) return; // Don't create empty chats
    
    try {
      const chatTitle = messages.find(m => m.sender === 'user')?.content.slice(0, 50) || initialTopic;
      const newChat = await createChat(user.uid, {
        title: chatTitle,
        topic: initialTopic,
        category,
        difficulty,
        messages: messages.map(m => ({
          ...m,
          timestamp: new Date()
        })),
        userId: user.uid
      });
      setCurrentChatId(newChat.id);
      setCurrentTopic(newChat.topic);
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

  const updateExistingChat = async () => {
    if (!currentChatId || !user) return;
    
    try {
      await updateChat(currentChatId, messages.map(m => ({
        ...m,
        timestamp: new Date()
      })));
    } catch (error) {
      console.error('Error updating chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update chat"
      });
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    try {
      setMessages(chat.messages);
      setCurrentChatId(chat.id);
      setCurrentTopic(chat.topic);
      // Don't start session when loading chat history
      setSessionStartTime(null);
      setSessionDuration(0);
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

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    try {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }

      // Add user message with unique ID
      const newUserMessage: Message = {
        id: uuidv4(),
        sender: 'user',
        content: inputMessage,
      };
      setMessages(prevMessages => [...prevMessages, newUserMessage]);
      setInputMessage('');

      // Generate AI response
      const aiResponse = await generateAIResponse(inputMessage);
      const newAiMessage: Message = {
        id: uuidv4(),
        sender: 'ai',
        content: aiResponse,
      };
      
      // Add AI message to messages
      const updatedMessages = [...messages, newUserMessage, newAiMessage];
      setMessages(updatedMessages);
      
      // Generate grammar feedback
      const feedback = await generateGrammarFeedback(inputMessage);
      
      // Update user message with feedback
      const finalMessages = updatedMessages.map(msg => 
        msg.id === newUserMessage.id 
          ? { ...msg, grammarFeedback: feedback }
          : msg
      );
      setMessages(finalMessages);

      if (currentChatId) {
        await updateChat(currentChatId, finalMessages.map(m => ({
          ...m,
          timestamp: new Date()
        })));
      }

      speak(aiResponse);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message"
      });
    }
  };

  const generateAIResponse = async (userInput: string) => {
    setLoadingAI(true);
    try {
      console.log('Sending request to /api/chat with input:', userInput);
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

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const responseText = await response.text();
      console.log('Raw API response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        console.error('Invalid JSON response:', responseText);
        throw new Error(`Invalid JSON response from server: ${responseText.slice(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(`Failed to generate AI response: ${data.error || response.statusText}`);
      }

      if (!data.response) {
        throw new Error('Empty response from API');
      }
      return data.response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return `I'm sorry, I couldn't generate a response at the moment. Error: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      setLoadingAI(false);
    }
  };

  const generateGrammarFeedback = async (text: string) => {
    try {
      // Get conversation context (last 3 messages including the most recent AI response)
      const contextMessages = messages.slice(-3).map(m => ({
        role: m.sender,
        content: m.content
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

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Split the text into smaller chunks
      const chunks = splitTextIntoChunks(text);

      let currentChunkIndex = 0;

      const speakNextChunk = () => {
        if (currentChunkIndex < chunks.length) {
          const utterance = new SpeechSynthesisUtterance(chunks[currentChunkIndex]);
          
          const voices = window.speechSynthesis.getVoices();
          if (voices.length === 0) {
            // If voices are not loaded yet, wait for them
            window.speechSynthesis.onvoiceschanged = () => {
              const updatedVoices = window.speechSynthesis.getVoices();
              setVoice(updatedVoices, utterance);
              window.speechSynthesis.speak(utterance);
            };
          } else {
            setVoice(voices, utterance);
            window.speechSynthesis.speak(utterance);
          }

          utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            currentChunkIndex++; // Move to next chunk even if there's an error
            speakNextChunk();
          };

          utterance.onend = () => {
            currentChunkIndex++;
            speakNextChunk();
          };
        } else {
          console.log('Finished speaking all chunks');
        }
      };

      speakNextChunk();
    } else {
      console.log('Speech synthesis not supported');
    }
  };

  const setVoice = (voices: SpeechSynthesisVoice[], utterance: SpeechSynthesisUtterance) => {
    // Prioritize female voices
    const femaleVoices = voices.filter(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('girl')
    );
    
    if (femaleVoices.length > 0) {
      // Prefer English female voices if available
      const englishFemaleVoice = femaleVoices.find(voice => 
        voice.lang.startsWith('en-')
      );
      utterance.voice = englishFemaleVoice || femaleVoices[0];
    } else {
      // If no female voice is found, try to set a default English voice
      const defaultVoice = voices.find(voice => voice.lang.startsWith('en-'));
      if (defaultVoice) utterance.voice = defaultVoice;
    }
    
    // Set properties for a more feminine voice
    utterance.pitch = 1.2; // Slightly higher pitch
    utterance.rate = 1.0; // Normal speaking rate

    console.log('Selected voice:', utterance.voice?.name);
  };

  // Helper function to split text into smaller chunks
  const splitTextIntoChunks = (text: string, maxLength: number = 200): string[] => {
    const chunks: string[] = [];
    let currentChunk = '';

    text.split(' ').forEach(word => {
      if (currentChunk.length + word.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + word;
      } else {
        chunks.push(currentChunk);
        currentChunk = word;
      }
    });

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  };

  const clearChat = () => {
    if (confirm('Are you sure you want to delete the whole chat conversation and start a new one?')) {
      setMessages([]);
      setInputMessage(''); // Clear the input field
    }
  };

  const stopConversation = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    setInputMessage(''); // Clear the input field
  };

  const toggleListening = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
      setIsListening(!isListening);
    }
  };

  const handleSessionComplete = async () => {
    if (user && sessionStartTime) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      const today = new Date();
      const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
      const contributionDate = localDate.toISOString().split('T')[0];
      const dayKey = localDate.toLocaleString('en-US', { weekday: 'short' });
      const sessionDurationMinutes = Math.floor(sessionDuration / 60);

      // Create new progress entry with proper timestamp
      const newProgressEntry = {
        day: dayKey,
        minutes: sessionDurationMinutes,
        timestamp: localDate.toISOString()
      };

      // Update weekly progress
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

  const handleGoBack = () => {
    if (sessionStartTime) {
      if (window.confirm("Are you sure you want to end the session?")) {
        handleSessionComplete();
        router.push('/user-page/talk-to-coach/');
      }
    } else {
      router.push('/user-page/talk-to-coach/');
    }
  };

  // Add this function to handle auto-resize of textarea
  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto'; // Reset height to recalculate
    textarea.style.height = `${textarea.scrollHeight}px`; // Set new height
  };

  const handleFeedbackClick = async () => {
    try {
      // First, complete the session analytics
      await handleSessionComplete();

      // Then store conversation for feedback
      const conversationData = {
        messages: messages,
        topic: currentTopic,
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
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-200 lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-200 ease-in-out z-30 w-72 bg-white border-r`}>
        <ChatSidebar
          currentChatId={currentChatId}
          onChatSelect={(chat) => {
            handleChatSelect(chat);
            setIsSidebarOpen(false);
          }}
          onNewChat={() => {
            handleNewChat();
            setIsSidebarOpen(false);
          }}
        />
      </div>

      <div className="flex-1 flex flex-col w-full">
        <header className="bg-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleGoBack} 
              className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {/* Chat History button */}
            <Button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              variant="ghost"
            >
              Chat History
            </Button>
          </div>
          <h1 className="text-lg font-semibold text-center flex-grow mx-2 truncate">
            {currentTopic}
          </h1>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                className="text-sm px-3 py-1 hover:bg-blue-50"
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
        </header>

        <div className="flex-grow overflow-y-auto p-3 space-y-3 md:p-4 md:space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className={`max-w-[90%] md:max-w-[75%] ${message.sender === 'user' ? 'bg-blue-50' : 'bg-white'}`}>
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    {message.sender === 'ai' && (
                      <Avatar className="w-6 h-6 md:w-8 md:h-8">
                        <AvatarImage src="/arya-avatar.png" alt="ARYA" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <span className="font-semibold text-sm md:text-base">
                      {message.sender === 'ai' ? 'ARYA AI Teacher' : 'You'}
                    </span>
                    <div className="flex gap-1 ml-auto">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-1">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-1">
                        <Languages className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  {message.sender === 'user' && message.grammarFeedback && showGrammarFeedback && (
                    <div className="mt-3">
                      {/* Main Grammar Feedback Header */}
                      <div className="bg-green-50 p-2.5 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <h4 className="text-sm font-semibold text-green-700">Grammar Feedback</h4>
                        </div>
                      </div>

                      {/* Grammar Corrections Section */}
                      <div className="bg-blue-50 p-2.5 border-t border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <h5 className="text-sm font-medium text-gray-700">Grammar Corrections</h5>
                        </div>
                        <div className="text-sm">
                          {message.grammarFeedback.grammar.includes("No grammar mistakes") ? (
                            <p className="text-green-600 font-medium flex items-center gap-1">
                              <span>✓</span> {message.grammarFeedback.grammar}
                            </p>
                          ) : (
                            message.grammarFeedback.grammar.split('\n')
                              .filter(line => line.trim())
                              .map((line, i) => (
                                <div key={i} className="text-blue-700 mb-1.5 last:mb-0">
                                  {line.trim()}
                                </div>
                              ))
                          )}
                        </div>
                      </div>

                      {/* Suggestions Section */}
                      <div className="bg-amber-50 p-2.5 border-t border-amber-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <h5 className="text-sm font-medium text-gray-700">Suggestions for Improvement</h5>
                        </div>
                        <div className="text-sm">
                          {message.grammarFeedback.suggestions.split('\n')
                            .filter(line => line.trim())
                            .map((line, i) => (
                              <div key={i} className="text-amber-700 mb-1.5 last:mb-0">
                                {line.trim()}
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Coherence Section */}
                      <div className="bg-purple-50 p-2.5 border-t border-purple-100 rounded-b-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Languages className="h-4 w-4 text-purple-500" />
                          <h5 className="text-sm font-medium text-gray-700">Coherence Analysis</h5>
                        </div>
                        <div className="text-sm">
                          {message.grammarFeedback.coherence.split('\n')
                            .filter(line => line.trim())
                            .map((line, i) => (
                              <div key={i} className="text-purple-700 mb-1.5 last:mb-0">
                                {line.trim()}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              {message.sender === 'user' && (
                <Avatar className="w-6 h-6 md:w-8 md:h-8 ml-2">
                  <AvatarImage src="/user-avatar.png" alt="User" />
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white border-t md:p-4">
          <Button
            onClick={() => setShowGrammarFeedback(!showGrammarFeedback)}
            variant="outline"
            className="mb-2 w-full bg-green-50 text-green-700 hover:bg-green-100 text-sm"
          >
            {showGrammarFeedback ? 'Hide' : 'Show'} Grammar Feedback
          </Button>
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex-grow relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  handleTextareaResize(e);
                }}
                placeholder="Type your message..."
                className="w-full min-h-[60px] max-h-[200px] p-3 rounded-md border text-sm md:text-base resize-none overflow-y-auto"
                style={{ lineHeight: '1.5' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
            <div className="flex gap-1 justify-end">
              <Button 
                onClick={toggleListening} 
                className={`w-11 h-11 p-0 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                title={isListening ? 'Stop Recording' : 'Start Recording'}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button 
                onClick={handleSendMessage} 
                disabled={loadingAI}
                className="w-11 h-11 p-0 bg-blue-600 hover:bg-blue-700"
                title="Send Message"
              >
                <Send className="h-5 w-5" />
              </Button>
              <Button 
                onClick={clearChat} 
                variant="outline"
                className="w-11 h-11 p-0"
                title="Reset Chat"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button 
                onClick={stopConversation} 
                variant="outline"
                className="w-11 h-11 p-0"
                title="Clear Input"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          {loadingAI && (
            <p className="text-center mt-2 text-sm text-gray-600">Processing...</p>
          )}
          <p className="text-center mt-2 text-sm text-gray-600">
            Session time: {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
          </p>
        </div>
      </div>
    </div>
  )
}
