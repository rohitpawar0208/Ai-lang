export interface Message {
  text: string;
  type: 'user' | 'ai';
  timestamp: Date;
  grammarFeedback?: {
    grammar: string;
    suggestions: string;
    coherence: string;
  };
}

export interface VoiceAssistantProps {
  className?: string;
  initialMessage?: string;
  onMessageReceived?: (message: string) => Promise<string>;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}