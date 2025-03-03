import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Phone, Lock, Ear, ArrowLeft, MoreVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface Lesson {
  id: number;
  title: string;
  description: string;
  isLocked: boolean;
  isCompleted: boolean;
  iconType: 'ear' | 'speech' | 'other';
  hasAudio?: boolean;
  hasChat?: boolean;
}

interface LessonUIProps {
  chapterId: number;
  chapterTitle: string;
  lessons: Lesson[];
  onBack: () => void;
}

const LessonUI: React.FC<LessonUIProps> = ({ 
  chapterId, 
  chapterTitle, 
  lessons, 
  onBack 
}) => {
  const router = useRouter();
  const completedCount = lessons.filter(lesson => lesson.isCompleted).length;
  
  const getLessonIcon = (iconType: string) => {
    switch (iconType) {
      case 'ear':
        return (
          <div className="bg-gradient-to-br from-teal-400 to-purple-500 w-14 h-14 rounded-full flex items-center justify-center">
            <Ear className="text-white" size={28} />
          </div>
        );
      case 'speech':
        return (
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 w-14 h-14 rounded-full flex items-center justify-center">
            <MessageSquare className="text-white" size={28} />
          </div>
        );
      default:
        return (
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 w-14 h-14 rounded-full flex items-center justify-center">
            <MessageSquare className="text-white" size={28} />
          </div>
        );
    }
  };

  const handleChatClick = (lesson: Lesson) => {
    if (!lesson.isLocked) {
      // Navigate to chat interface with lesson data
      router.push(`/language-learning/learning-path/${chapterId}/lessons/${lesson.id}/chat`);
    }
  };

  const handleVoiceClick = (lesson: Lesson) => {
    if (!lesson.isLocked) {
      // Navigate to voice assistant with lesson data
      router.push(`/lessons/${chapterId}/${lesson.id}/voice`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-500 to-indigo-600 pb-10">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={onBack} className="text-white">
          <ArrowLeft size={24} />
        </button>
        <button className="bg-indigo-400 bg-opacity-30 p-2 rounded-full">
          <MoreVertical size={20} className="text-white" />
        </button>
      </div>
      
      {/* Chapter Info */}
      <div className="px-5 pb-6 text-white">
        <div className="inline-block bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-medium mb-2">
          CHAPTER {chapterId}
        </div>
        <h1 className="text-2xl font-bold mb-2">{chapterTitle}</h1>
        <div className="text-white text-opacity-90">
          {lessons.length} Lessons 
          <span className="ml-8">{completedCount}/{lessons.length} Completed</span>
        </div>
      </div>
      
      {/* Lessons List */}
      <div className="px-4 space-y-4">
        {lessons.map((lesson, index) => (
          <div key={lesson.id} className="relative">
            <Card 
              className={`p-4 flex items-center gap-4 ${lesson.isCompleted ? "border-l-4 border-l-green-500" : ""}`}
            >
              {getLessonIcon(lesson.iconType)}
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">{lesson.title}</h3>
                {lesson.description && <p className="text-sm text-gray-600">{lesson.description}</p>}
              </div>
              <div className="flex gap-2">
                {lesson.hasChat && (
                  <button 
                    className={`p-2 ${lesson.isLocked ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'} rounded-lg transition-colors`}
                    onClick={() => handleChatClick(lesson)}
                    disabled={lesson.isLocked}
                  >
                    <MessageSquare size={18} />
                  </button>
                )}
                {lesson.hasAudio && (
                  <button 
                    className={`p-2 ${lesson.isLocked ? 'bg-gray-100 text-gray-500' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'} rounded-lg transition-colors`}
                    onClick={() => handleVoiceClick(lesson)}
                    disabled={lesson.isLocked}
                  >
                    <Phone size={18} />
                  </button>
                )}
                {lesson.isLocked && (
                  <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
                    <Lock size={18} />
                  </div>
                )}
              </div>
            </Card>
            
            {/* Dashed connector line (except for last item) */}
            {index < lessons.length - 1 && (
              <div className="absolute left-7 top-full h-4 border-l-2 border-dashed border-gray-300"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonUI;
