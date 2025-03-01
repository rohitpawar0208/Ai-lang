'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Lightbulb, 
  BookOpen, ArrowRight, MessageSquare, ChevronDown, ChevronUp, Download 
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/components/ui/use-toast"

interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ConversationData {
  messages: Message[];
  topic: string;
  timestamp: string;
}

interface ResponseFeedback {
  originalMessage: string;
  grammar: {
    score: number;
    strengths: string[];
    improvements: string[];
    tips: string[];
    examples: { original: string; corrected: string }[];
  };
  vocabulary: {
    score: number;
    range: string;
    appropriateness: string;
    suggestions: { original: string; alternative: string }[];
    advancedOptions: { original: string; alternative: string }[];
  };
  content: {
    score: number;
    development: string;
    coherence: string;
    engagement: string;
    recommendations: string[];
  };
}

interface FeedbackResponse {
  responses: ResponseFeedback[];
  overallScore: number;
  totalBatches: number;
}

// Add a helper function to calculate average score safely
const calculateAverageScore = (response: ResponseFeedback | undefined): string => {
  if (!response || !response.grammar || !response.vocabulary || !response.content) {
    return '0.0';
  }

  const grammarScore = response.grammar.score || 0;
  const vocabularyScore = response.vocabulary.score || 0;
  const contentScore = response.content.score || 0;

  return ((grammarScore + vocabularyScore + contentScore) / 3).toFixed(1);
};

export default function ChatFeedbackPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [feedbackResponses, setFeedbackResponses] = useState<ResponseFeedback[]>([]);
  const [progress, setProgress] = useState({
    currentBatch: 0,
    totalBatches: 0,
    messageCount: 0,
    estimatedMinutes: 0,
    startTime: 0,
    elapsedTime: 0,
    hasError: false
  });
  const [controller, setController] = useState<AbortController | null>(null);
  const { toast } = useToast();

  // Add timer effect to track elapsed time
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading && progress.startTime > 0) {
      timer = setInterval(() => {
        setProgress(prev => ({
          ...prev,
          elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000)
        }));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading, progress.startTime]);

  const calculateEstimatedTime = (messageCount: number): number => {
    if (messageCount <= 25) return 3;
    if (messageCount <= 50) return 6;
    return 12;
  };

  const analyzeChatAndGenerateFeedback = async (isRetry = false) => {
    const conversationData = localStorage.getItem('currentConversation');
    if (!conversationData) {
      router.push('/user-page/talk-to-coach/chat');
      return;
    }

    const conversation: ConversationData = JSON.parse(conversationData);
    const userMessageCount = conversation.messages.filter(m => m.sender === 'user').length;
    const estimatedMinutes = calculateEstimatedTime(userMessageCount);
    
    setProgress(prev => ({
      ...prev,
      messageCount: userMessageCount,
      estimatedMinutes: estimatedMinutes,
      startTime: Date.now(),
      elapsedTime: 0,
      hasError: false
    }));

    // Create new abort controller
    const newController = new AbortController();
    setController(newController);
    
    try {
      const formattedMessages = conversation.messages.map(msg => ({
        content: msg.content,
        type: msg.sender === 'user' ? 'user' : 'ai',
        timestamp: msg.timestamp
      }));

      const response = await fetch('/api/communication-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: formattedMessages,
          topic: conversation.topic
        }),
        signal: newController.signal
      });

      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      const feedbackData: FeedbackResponse = await response.json();
      
      const userMessages = conversation.messages.filter(m => m.sender === 'user');
      const orderedFeedback = feedbackData.responses
        .filter(feedback => feedback && feedback.grammar && feedback.vocabulary && feedback.content)
        .map((feedback, index) => ({
          ...feedback,
          originalMessage: userMessages[index].content
        }));

      setFeedbackResponses(orderedFeedback);
      setOverallScore(feedbackData.overallScore);
      setProgress({
        currentBatch: feedbackData.totalBatches,
        totalBatches: feedbackData.totalBatches,
        messageCount: userMessageCount,
        estimatedMinutes: estimatedMinutes,
        startTime: Date.now(),
        elapsedTime: 0,
        hasError: false
      });
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "Cancelled",
          description: "Feedback generation was cancelled.",
          variant: "default",
        });
        return;
      }
      
      setProgress(prev => ({ ...prev, hasError: true }));
      
      if (error.status === 429) {
        toast({
          title: "Too Many Requests",
          description: "Please wait a moment before trying again.",
          variant: "destructive",
        });
      } else {
        console.error('Error generating feedback:', error);
        toast({
          title: "Error",
          description: "Failed to generate feedback. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      setController(null);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return;
    }

    analyzeChatAndGenerateFeedback();

    // Cleanup function to abort any ongoing requests
    return () => {
      if (controller) {
        controller.abort();
      }
    };
  }, [user, loading, router]);

  const handleCancel = () => {
    if (controller) {
      controller.abort();
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    analyzeChatAndGenerateFeedback(true);
  };

  const downloadReport = () => {
    try {
      const report = generateReport(feedbackResponses, overallScore);
      const blob = new Blob([report], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-analysis-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateReport = (responses: ResponseFeedback[], overall: number): string => {
    return `Conversation Analysis Report
Generated on: ${new Date().toLocaleString()}

Overall Score: ${overall}/5

${responses.map((response, index) => `
Message ${index + 1}:
${response.originalMessage}

Grammar Analysis (Score: ${response.grammar.score}/5)
Strengths:
${response.grammar.strengths.map(s => `- ${s}`).join('\n')}

Areas for Improvement:
${response.grammar.improvements.map(i => `- ${i}`).join('\n')}

Tips:
${response.grammar.tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Vocabulary Assessment (Score: ${response.vocabulary.score}/5)
Range: ${response.vocabulary.range}
Appropriateness: ${response.vocabulary.appropriateness}

Content Evaluation (Score: ${response.content.score}/5)
Development: ${response.content.development}
Coherence: ${response.content.coherence}
Engagement: ${response.content.engagement}
Recommendations:
${response.content.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`).join('\n---\n')}`;
  };

  if (loading || isLoading) {
    const progressPercentage = progress.totalBatches 
      ? (progress.currentBatch / progress.totalBatches) * 100 
      : 0;
    
    const remainingMinutes = Math.max(
      0,
      progress.estimatedMinutes - Math.floor(progress.elapsedTime / 60)
    );
    const remainingSeconds = Math.max(
      0,
      (progress.estimatedMinutes * 60) - progress.elapsedTime
    ) % 60;

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-[90%] max-w-md p-6">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="flex items-center justify-center gap-3">
              {!progress.hasError && (
                <div className="relative w-8 h-8">
                  <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
                  <div 
                    className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin"
                    style={{ 
                      clipPath: `polygon(50% 50%, 50% 0, ${50 + 50 * Math.cos(progressPercentage * 2 * Math.PI / 100)}% ${50 - 50 * Math.sin(progressPercentage * 2 * Math.PI / 100)}%, 50% 50%)`
                    }}
                  ></div>
                </div>
              )}
              <span>Analyzing Your Conversation</span>
            </CardTitle>
            {progress.messageCount > 0 && (
              <p className="text-sm text-gray-600">
                Analyzing {progress.messageCount} messages
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Information */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{progress.currentBatch} of {progress.totalBatches || '...'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {progress.elapsedTime > 0 && (
                <p className="text-sm text-center text-gray-600">
                  Time remaining: {remainingMinutes}m {remainingSeconds}s
                </p>
              )}
            </div>

            {/* Estimated Time */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-blue-900">Estimated Processing Time</h4>
              <p className="text-sm text-blue-700">
                Estimated total time: ~{progress.estimatedMinutes} minutes
              </p>
              <div className="text-xs text-blue-600">
                Reference times:
                <ul className="list-disc list-inside mt-1">
                  <li>25 messages: ~3 minutes</li>
                  <li>50 messages: ~6 minutes</li>
                  <li>100 messages: ~12 minutes</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center mt-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="w-full"
                disabled={!controller}
              >
                Cancel
              </Button>
              {progress.hasError && (
                <Button
                  onClick={handleRetry}
                  className="w-full"
                  disabled={!!controller}
                >
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/user-page/talk-to-coach/" className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">Conversation Analysis</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadReport}
          disabled={isLoading || feedbackResponses.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Overall Score Card */}
        <Card className="mb-8 bg-white/50 backdrop-blur-sm border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Overall Performance</h2>
                <p className="text-gray-600">Based on {feedbackResponses.length} messages analyzed</p>
              </div>
              <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray={`${overallScore * 10}, 100`}
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="text-3xl font-bold text-gray-900">{overallScore}</span>
                  <span className="text-sm text-gray-500">/5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Message Feedback */}
        <div className="space-y-6">
          {feedbackResponses.map((response, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-500">Message {index + 1}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-800 font-medium">User Message:</p>
                      <p className="text-gray-600">{response.originalMessage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {calculateAverageScore(response)}
                      </div>
                      <div className="text-xs text-gray-500">Average</div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {/* Grammar Section */}
                  <AccordionItem value={`grammar-${index}`}>
                    <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <span className="font-semibold">Grammar Analysis</span>
                        </div>
                        <span className="text-green-600 font-bold">{response.grammar.score}/5</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 space-y-4">
                      {/* Strengths */}
                      {response.grammar.strengths.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-green-700">Strengths</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {response.grammar.strengths.map((strength, idx) => (
                              <li key={idx} className="text-gray-600">{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Areas for Improvement */}
                      {response.grammar.improvements.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-amber-700">Areas for Improvement</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {response.grammar.improvements.map((improvement, idx) => (
                              <li key={idx} className="text-gray-600">{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tips */}
                      {response.grammar.tips.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-blue-700">Tips</h4>
                          <ul className="list-decimal list-inside space-y-1">
                            {response.grammar.tips.map((tip, idx) => (
                              <li key={idx} className="text-gray-600">{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Corrections */}
                      {response.grammar.examples.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-blue-700">Corrections</h4>
                          <div className="space-y-2">
                            {response.grammar.examples.map((example, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                <span className="text-red-500">{example.original}</span>
                                <ArrowRight className="h-4 w-4 text-gray-400" />
                                <span className="text-green-500">{example.corrected}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Vocabulary Section */}
                  <AccordionItem value={`vocabulary-${index}`}>
                    <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold">Vocabulary Assessment</span>
                        </div>
                        <span className="text-blue-600 font-bold">{response.vocabulary.score}/5</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 space-y-4">
                      {/* Range */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700">Vocabulary Range</h4>
                        <p className="text-gray-600">{response.vocabulary.range}</p>
                      </div>

                      {/* Appropriateness */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700">Appropriateness</h4>
                        <p className="text-gray-600">{response.vocabulary.appropriateness}</p>
                      </div>

                      {/* Suggestions */}
                      {response.vocabulary.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-green-700">Suggested Alternatives</h4>
                          <div className="space-y-2">
                            {response.vocabulary.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-gray-600">{suggestion.original}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span className="text-green-600">{suggestion.alternative}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Advanced Options */}
                      {response.vocabulary.advancedOptions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-purple-700">Advanced Vocabulary</h4>
                          <div className="space-y-2">
                            {response.vocabulary.advancedOptions.map((option, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-gray-600">{option.original}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span className="text-purple-600">{option.alternative}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Content Section */}
                  <AccordionItem value={`content-${index}`}>
                    <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-purple-600" />
                          <span className="font-semibold">Content Evaluation</span>
                        </div>
                        <span className="text-purple-600 font-bold">{response.content.score}/5</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 py-4 space-y-4">
                      {/* Development */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-purple-700">Development</h4>
                        <p className="text-gray-600">{response.content.development}</p>
                      </div>

                      {/* Coherence */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-blue-700">Coherence</h4>
                        <p className="text-gray-600">{response.content.coherence}</p>
                      </div>

                      {/* Engagement */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-green-700">Engagement</h4>
                        <p className="text-gray-600">{response.content.engagement}</p>
                      </div>

                      {/* Recommendations */}
                      {response.content.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-blue-700">Recommendations</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {response.content.recommendations.map((recommendation, idx) => (
                              <li key={idx} className="text-gray-600">{recommendation}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}