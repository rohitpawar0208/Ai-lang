export interface Message {
  text: string;
  type: 'user' | 'ai';
  timestamp: Date;
  grammarFeedback?: string;
}

export interface VoiceAssistantProps {
  className?: string;
  initialMessage?: string;
  onMessageReceived?: (message: string) => Promise<string>;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}