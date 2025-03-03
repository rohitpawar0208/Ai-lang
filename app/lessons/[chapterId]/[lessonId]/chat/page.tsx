'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useParams } from 'next/navigation';
import CourseChatInterface from "@/components/CourseChatInterface";
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface CourseData {
  unitName: string;
  chapterName: string;
  lessonTitle: string;
  lessonObjectives: string[];
}

export default function CourseChatPage() {
  const params = useParams();
  const chapterId = params?.chapterId as string;
  const lessonId = params?.lessonId as string;
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrCreateCourseData = async () => {
      if (!chapterId || !lessonId) {
        setLoading(false);
        return;
      }

      try {
        const lessonRef = doc(db, 'courses', 'english', 'chapters', chapterId, 'lessons', lessonId);
        const lessonDoc = await getDoc(lessonRef);
        
        if (lessonDoc.exists()) {
          const data = lessonDoc.data();
          setCourseData({
            unitName: data.unitName || 'English Course',
            chapterName: data.chapterName || `Chapter ${chapterId}`,
            lessonTitle: data.title || 'Lesson',
            lessonObjectives: data.objectives || []
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

          setCourseData({
            unitName: defaultData.unitName,
            chapterName: defaultData.chapterName,
            lessonTitle: defaultData.title,
            lessonObjectives: defaultData.objectives
          });
        }
      } catch (error) {
        console.error('Error fetching/creating course data:', error);
        // Set default data even if Firestore fails
        setCourseData({
          unitName: 'English Learning Path',
          chapterName: `Chapter ${chapterId}`,
          lessonTitle: `Lesson ${lessonId}`,
          lessonObjectives: [
            'Practice natural conversation',
            'Improve speaking fluency',
            'Learn new vocabulary',
            'Master common expressions'
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrCreateCourseData();
  }, [chapterId, lessonId]);

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