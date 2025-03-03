'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Volume2, Languages, Mic, Send, Share, Copy } from 'lucide-react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute';


interface Message {
  id: number;
  text: string;
  grammarFeedback?: string;
  correction?: string;
  tone?: 'Formal' | 'Informal' | 'Friendly';
  suggestions?: string[];
  toneVariations?: Record<string, string>;
}

interface GrammarCorrectionOption {
  title: string;
  description: string;
  icon: JSX.Element;
}

const grammarOptions: GrammarCorrectionOption[] = [
    {
      title: "Refine & Set Tone",
      description: "Receive a refined sentence instantly. Choose the tone you want to apply.",
      icon: <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">🗣️</div>
    },
    {
      title: "Modify Your Tone",
      description: "Select a tone to adjust your sentence. Make it fit the context perfectly.",
      icon: <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">✏️</div>
    },
    {
      title: "Instant Grammar Fix",
      description: "Type or Speak your sentence even on your native language to get instant corrections. Get clear and error-free message.",
      icon: <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white">✨</div>
    }
  ];

const GrammarCorrectionPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSendMessage = async () => {
    if (currentMessage.trim()) {
      try {
        const response = await fetch('/api/tone-correction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: currentMessage,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get corrections');
        }

        const data = await response.json();
        
        const newMessage: Message = {
          id: Date.now(),
          text: currentMessage,
          grammarFeedback: data.grammarFeedback.errors.length > 0 
            ? data.grammarFeedback.errors.join('\n') 
            : 'No Grammar mistakes were found. Good job! 😃',
          correction: data.corrections.formal, // Default to formal correction
          suggestions: data.grammarFeedback.suggestions,
          toneVariations: {
            Formal: data.corrections.formal,
            Informal: data.corrections.informal,
            Friendly: data.corrections.friendly,
          }
        };
        
        setMessages([...messages, newMessage]);
        setCurrentMessage('');
      } catch (error) {
        console.error('Error getting corrections:', error);
        // Handle error appropriately
      }
    }
  };

  const handleToneSelection = (id: number, tone: 'Formal' | 'Informal' | 'Friendly') => {
    setMessages(messages.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          tone,
          correction: msg.toneVariations?.[tone] || msg.correction
        };
      }
      return msg;
    }));
  };

  const getToneVariant = (message: Message, tone: 'Formal' | 'Informal' | 'Friendly') => {
    return message.tone === tone ? "default" : "outline";
  };

  const handleShare = (text: string) => {
    // Implement share functionality
    console.log('Sharing:', text);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleAudioUpload(audioBlob);
        
        // Clean up the stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (base64Audio) {
          const response = await fetch('/api/STT', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              audio: base64Audio,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to transcribe audio');
          }

          const data = await response.json();
          setCurrentMessage(data.text);
        }
      };
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    // Add event listener to input
    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('keypress', handleKeyPress);
    }

    // Cleanup
    return () => {
      if (inputElement) {
        inputElement.removeEventListener('keypress', handleKeyPress);
      }
    };
  }, [currentMessage]); // Add currentMessage as dependency

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white p-4 flex items-center justify-between shadow-md">
        <Link href="/user-page" className="text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold text-center flex-grow">Grammar Correction</h1>
        <div className="w-6" /> {/* Spacer for alignment */}
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4">

      {grammarOptions.map((option, index) => (
          <Card key={index} className="hover:bg-gray-50 transition-colors duration-200">
            <CardContent className="p-4 flex items-start space-x-4">
              {option.icon}
              <div>
                <h3 className="font-semibold">{option.title}</h3>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {messages.map((message) => (
          <Card key={message.id} className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Your message</h3>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Languages className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-gray-700 mb-2">{message.text}</p>
              
              {message.grammarFeedback && (
                <div className="mt-2 p-2 bg-green-100 rounded-md">
                  <h4 className="font-semibold mb-1">Grammar Feedback</h4>
                  <p className="text-green-700">{message.grammarFeedback}</p>
                </div>
              )}
              
              {message.correction && (
                <div className="mt-2 p-2 bg-blue-100 rounded-md">
                  <h4 className="font-semibold mb-1">Correction</h4>
                  <p className="text-blue-700">{message.correction}</p>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" onClick={() => handleShare(message.correction || '')}>
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(message.correction || '')}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-2 flex space-x-2">
                <Button 
                  onClick={() => handleToneSelection(message.id, 'Formal')}
                  variant={getToneVariant(message, 'Formal')}
                >
                  Formal
                </Button>
                <Button 
                  onClick={() => handleToneSelection(message.id, 'Informal')}
                  variant={getToneVariant(message, 'Informal')}
                >
                  Informal
                </Button>
                <Button 
                  onClick={() => handleToneSelection(message.id, 'Friendly')}
                  variant={getToneVariant(message, 'Friendly')}
                >
                  Friendly
                </Button>
              </div>

              {message.tone && (
                <div className="mt-2 p-2 bg-purple-100 rounded-md">
                  <h4 className="font-semibold mb-1">{message.tone} Tone</h4>
                  <p className="text-purple-700">
                    {message.tone === 'Informal' ? 'Hey, hello sir, it\'s not me.' : message.correction}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </main>

      <footer className="p-4 bg-white">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
          />
          <Button 
            onClick={handleMicClick} 
            variant="outline"
            className={isRecording ? "bg-red-500 text-white hover:bg-red-600" : ""}
          >
            <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`} />
          </Button>
          <Button onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default GrammarCorrectionPage;