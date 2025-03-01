'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Volume2, Languages, Send, Mic, MicOff, Trash2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, updateDoc, increment, getDoc, Timestamp, arrayUnion } from 'firebase/firestore'

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  grammarFeedback?: string;
}

interface AliaChatInterfaceProps {
  topic: string;
  initialPrompt: string;
}

export default function AliaChatInterface({ topic, initialPrompt }: AliaChatInterfaceProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'ai', content: initialPrompt }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [showGrammarFeedback, setShowGrammarFeedback] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionDuration, setSessionDuration] = useState(0)

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 1 && !sessionStartTime) {
      setSessionStartTime(new Date())
    }
  }, [messages, sessionStartTime])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date()
        const duration = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
        setSessionDuration(duration)
        if (duration >= 90000) { // 15 minutes = 900 seconds now it is 25 hrs
          handleSessionComplete()
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [sessionStartTime])

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    // Turn off the microphone before generating AI response
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const newUserMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      content: inputMessage,
    };

    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputMessage(''); // Clear the input field

    // Generate grammar feedback
    const feedback = await generateGrammarFeedback(inputMessage);
    setMessages(prevMessages => prevMessages.map(msg => 
      msg.id === newUserMessage.id ? { ...msg, grammarFeedback: feedback } : msg
    ));

    const aiResponse = await generateAIResponse(inputMessage);
    const newAiMessage: Message = {
      id: messages.length + 2,
      sender: 'ai',
      content: aiResponse,
    };

    setMessages(prevMessages => [...prevMessages, newAiMessage]);
    speak(aiResponse); // Call text-to-speech for AI response
  };

  const generateAIResponse = async (userInput: string) => {
    setLoadingAI(true);
    try {
      console.log('Sending request to /api/chat-communication with input:', userInput);
      const response = await fetch('/api/chat-communication', {
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
      const response = await fetch('/api/communication-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to get communication feedback');
      }

      const data = await response.json();
      return data.feedback;
    } catch (error) {
      console.error('Error getting communication feedback:', error);
      return 'Unable to generate communication feedback at this time.';
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
        };

        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    } else {
      console.log('Speech recognition not supported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

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
        router.push('/user-page/talk-to-coach-communication/');
      }
    } else {
      router.push('/user-page/talk-to-coach-communication/');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white p-4 flex items-center justify-between shadow-md">
        <button onClick={handleGoBack} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-center flex-grow">{topic}</h1>
        <Button variant="outline" onClick={() => router.push('/user-page/talk-to-coach-communication/feedback')}>
          View Feedback
        </Button>
      </header>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <Card className={`max-w-[80%] ${message.sender === 'user' ? 'bg-blue-100' : 'bg-white'}`}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2 mb-2">
                  {message.sender === 'ai' && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src="/Alia-avatar.png" alt="Alia" />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-semibold">
                    {message.sender === 'ai' ? 'Alia AI Teacher' : 'You'}
                  </span>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Languages className="h-4 w-4" />
                  </Button>
                </div>
                <p>{message.content}</p>
                {message.sender === 'user' && message.grammarFeedback && showGrammarFeedback && (
                  <div className="mt-2 p-2 bg-green-100 rounded-md">
                    <h4 className="text-green-700 font-semibold mb-1">Communication Feedback</h4>
                    <p>{message.grammarFeedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {message.sender === 'user' && (
              <Avatar className="w-8 h-8 ml-2">
                <AvatarImage src="/user-avatar.png" alt="User" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white">
        <Button
          onClick={() => setShowGrammarFeedback(!showGrammarFeedback)}
          variant="outline"
          className="mb-2 w-full bg-green-50 text-green-700 hover:bg-green-100"
        >
          {showGrammarFeedback ? 'Hide' : 'Show'} Communication Feedback
        </Button>
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={toggleListening} 
            className={isListening ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button onClick={handleSendMessage} disabled={loadingAI}>
            <Send className="h-4 w-4" />
          </Button>
          <Button onClick={clearChat} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={stopConversation} variant="outline">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {loadingAI && <p className="text-center mt-2">Processing...</p>}
        <p className="text-center mt-2">
          Session time: {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
        </p>
      </div>
    </div>
  )
}
