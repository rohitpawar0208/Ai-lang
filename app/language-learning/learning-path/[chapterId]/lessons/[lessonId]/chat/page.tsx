'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useParams, useRouter } from 'next/navigation';
import CourseChatInterface from "@/components/CourseChatInterface";
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface CourseData {
  unitName: string;
  chapterName: string;
  lessonTitle: string;
  lessonObjectives: string[];
  isLocked?: boolean;
}

export default function CourseChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chapterId = params?.chapterId as string;
  const lessonId = params?.lessonId as string;
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLessonAccess = async () => {
      if (!user || !chapterId || !lessonId) {
        setLoading(false);
        return;
      }

      try {
        // Check if this lesson is unlocked
        const progressRef = doc(db, 'users', user.uid, 'progress', `${chapterId}_${lessonId}`);
        const progressDoc = await getDoc(progressRef);
        
        // If it's the first lesson (lessonId === '1'), it's automatically unlocked
        const isFirstLesson = lessonId === '1';
        
        // If it's not the first lesson, check if previous lesson was completed
        if (!isFirstLesson) {
          const prevLessonRef = doc(db, 'users', user.uid, 'progress', `${chapterId}_${parseInt(lessonId) - 1}`);
          const prevLessonDoc = await getDoc(prevLessonRef);
          
          if (!prevLessonDoc.exists() || !prevLessonDoc.data()?.completed) {
            router.push(`/language-learning/learning-path/${chapterId}`);
            return;
          }
        }

        // Get or create lesson data
        const lessonRef = doc(db, 'courses', 'english', 'chapters', chapterId, 'lessons', lessonId);
        const lessonDoc = await getDoc(lessonRef);
        
        if (lessonDoc.exists()) {
          const data = lessonDoc.data();
          setCourseData({
            unitName: data.unitName || 'English Course',
            chapterName: data.chapterName || `Chapter ${chapterId}`,
            lessonTitle: data.title || 'Lesson',
            lessonObjectives: data.objectives || [],
            isLocked: !isFirstLesson && (!progressDoc.exists() || !progressDoc.data()?.unlocked)
          });
        } else {
          // Create default course data if it doesn't exist
          const defaultData = {
            unitName: 'English Learning Path',
            chapterName: `Chapter ${chapterId}`,
            title: `Lesson ${lessonId}`,
            objectives: [
              'Practice natural conversation',
              'Improve speaking fluency',
              'Learn new vocabulary',
              'Master common expressions'
            ]
          };

          // Save default data to Firestore
          await setDoc(lessonRef, defaultData);

          // Create progress document if it doesn't exist
          if (!progressDoc.exists()) {
            await setDoc(progressRef, {
              unlocked: isFirstLesson,
              started: false,
              completed: false,
              minutesSpent: 0,
              createdAt: new Date().toISOString()
            });
          }

          setCourseData({
            ...defaultData,
            unitName: defaultData.unitName,
            chapterName: defaultData.chapterName,
            lessonTitle: defaultData.title,
            lessonObjectives: defaultData.objectives,
            isLocked: !isFirstLesson && (!progressDoc.exists() || !progressDoc.data()?.unlocked)
          });
        }
      } catch (error) {
        console.error('Error fetching/creating course data:', error);
        setCourseData({
          unitName: 'English Learning Path',
          chapterName: `Chapter ${chapterId}`,
          lessonTitle: `Lesson ${lessonId}`,
          lessonObjectives: [
            'Practice natural conversation',
            'Improve speaking fluency',
            'Learn new vocabulary',
            'Master common expressions'
          ],
          isLocked: false
        });
      } finally {
        setLoading(false);
      }
    };

    checkLessonAccess();
  }, [chapterId, lessonId, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your lesson...</p>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Lesson Setup</h2>
          <p className="text-gray-600">We're preparing your lesson environment. Please try again in a moment.</p>
        </div>
      </div>
    );
  }

  if (courseData.isLocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Lesson Locked</h2>
            <p className="text-gray-600 mb-4">
              Please complete the previous lesson to unlock this one.
            </p>
            <button
              onClick={() => router.push(`/language-learning/learning-path/${chapterId}`)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Return to Chapter
            </button>
          </div>
        </div>
      </div>
    );
  }

  const aiPrompt = `
    Welcome to your English learning session! 
    We are currently in ${courseData.unitName}, ${courseData.chapterName}, focusing on "${courseData.lessonTitle}".
    
    As your AI English teacher, I'll help you improve your:
    - Conversational skills
    - Grammar usage
    - Vocabulary
    - Speaking fluency
    - Listening comprehension
    
    Key objectives for this lesson:
    ${courseData.lessonObjectives.map(obj => `- ${obj}`).join('\n')}
    
    Let's begin our conversation practice. Feel free to ask questions or respond to my prompts.
    I'll provide instant feedback on your grammar, vocabulary, and pronunciation.
    
    Remember: This lesson will last for 15 minutes, during which we'll focus on achieving these objectives.
    Stay engaged and make the most of our conversation!
  `;

  return (
    <ProtectedRoute>
      <CourseChatInterface 
        topic={courseData.lessonTitle}
        initialPrompt={aiPrompt}
        chapterId={chapterId}
        lessonId={lessonId}
      />
    </ProtectedRoute>
  );
} 