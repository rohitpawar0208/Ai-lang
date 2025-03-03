'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import LessonUI, { Lesson } from './LessonUI';
import TestUI, { TestQuestion } from './TestUI';

interface Chapter {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  xp: number;
  duration: string;
}

interface Unit {
  id: number;
  title: string;
  description: string;
  progress: number;
  chapters: Chapter[];
}

interface Badge {
  id: number;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
}

interface LearningPathJourneyProps {
  unitId?: number;
  onChangeUnit?: (unitId: number) => void;
  onBack?: () => void;
}

const LearningPathJourney: React.FC<LearningPathJourneyProps> = ({
  unitId: initialUnitId = 1,
  onChangeUnit,
  onBack
}) => {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [activeUnit, setActiveUnit] = useState(initialUnitId);
  const [activeChapter, setActiveChapter] = useState(0); // 0 means no chapter selected
  const [showFinalTest, setShowFinalTest] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  const [animatePath, setAnimatePath] = useState(true);

  // Sample data - in a real app, this would likely come from a database
  const units: Unit[] = [
    {
      id: 1,
      title: "Basics",
      description: "Learn the fundamentals of the language",
      progress: 80,
      chapters: [
        { id: 1, title: "Introduction", description: "Getting started", completed: true, xp: 120, duration: "10 min" },
        { id: 2, title: "Formal greetings", description: "How to greet formally", completed: true, xp: 150, duration: "15 min" },
        { id: 3, title: "Greetings and salutations", description: "Common phrases", completed: false, xp: 180, duration: "20 min" },
        { id: 4, title: "Greetings and culture", description: "Cultural context", completed: false, xp: 200, duration: "25 min" },
        { id: 5, title: "Body language in greetings", description: "Non-verbal communication", completed: false, xp: 220, duration: "30 min" },
      ]
    },
    {
      id: 2,
      title: "Self-Introduction",
      description: "Learn how to introduce yourself effectively",
      progress: 20,
      chapters: [
        { id: 6, title: "Personal information", description: "Sharing about yourself", completed: true, xp: 180, duration: "15 min" },
        { id: 7, title: "Talking about where you are from", description: "Countries and origins", completed: false, xp: 200, duration: "20 min" },
        { id: 8, title: "Professional information", description: "Job titles and work", completed: false, xp: 220, duration: "25 min" },
        { id: 9, title: "Hobbies and interests", description: "Talking about free time", completed: false, xp: 240, duration: "30 min" },
        { id: 10, title: "Family members", description: "Describing your family", completed: false, xp: 260, duration: "20 min" },
      ]
    },
    {
      id: 3,
      title: "Daily Conversations",
      description: "Master everyday communication scenarios",
      progress: 0,
      chapters: [
        { id: 11, title: "Asking questions", description: "Question structures", completed: false, xp: 240, duration: "25 min" },
        { id: 12, title: "Giving directions", description: "Navigation vocabulary", completed: false, xp: 260, duration: "30 min" },
        { id: 13, title: "Restaurant conversations", description: "Ordering food", completed: false, xp: 280, duration: "35 min" },
        { id: 14, title: "Shopping dialogues", description: "Buying and paying", completed: false, xp: 300, duration: "40 min" },
        { id: 15, title: "Travel situations", description: "Common travel phrases", completed: false, xp: 320, duration: "30 min" },
      ]
    }
  ];

  const sampleLessons: Lesson[][] = [
    [
      { id: 1, title: "Informal Opening Greeting words and Phrases", description: "", isLocked: false, isCompleted: false, iconType: 'ear', hasChat: true, hasAudio: true },
      { id: 2, title: "Responses to Opening Greeting", description: "", isLocked: true, isCompleted: false, iconType: 'ear' },
      { id: 3, title: "Greeting Each Other", description: "", isLocked: true, isCompleted: false, iconType: 'speech' },
      { id: 4, title: "Informal Closing Greeting words and Phrases", description: "", isLocked: true, isCompleted: false, iconType: 'ear' },
      { id: 5, title: "Greeting Friends", description: "", isLocked: true, isCompleted: false, iconType: 'speech' },
    ],
    [
      { id: 6, title: "Self Introduction Basics", description: "Learn how to introduce yourself", isLocked: false, isCompleted: false, iconType: 'ear', hasChat: true },
      { id: 7, title: "Talking About Your Background", description: "", isLocked: true, isCompleted: false, iconType: 'speech' },
      { id: 8, title: "Asking Questions About Others", description: "", isLocked: true, isCompleted: false, iconType: 'ear' },
    ],
    [
      { id: 9, title: "Common Daily Expressions", description: "Everyday useful phrases", isLocked: false, isCompleted: false, iconType: 'ear', hasChat: true, hasAudio: true },
      { id: 10, title: "Time and Schedule", description: "", isLocked: true, isCompleted: false, iconType: 'speech' },
      { id: 11, title: "Weather Talk", description: "", isLocked: true, isCompleted: false, iconType: 'other' },
    ]
  ];

  const badges: Badge[] = [
    { id: 1, name: "First Steps", icon: "🥉", description: "Complete your first chapter", earned: true },
    { id: 2, name: "Quick Learner", icon: "⚡", description: "Complete a chapter in under 10 minutes", earned: true },
    { id: 3, name: "Consistent Practice", icon: "🔥", description: "3-day streak", earned: true },
    { id: 4, name: "Conversation Master", icon: "🎯", description: "Perfect score on a speaking test", earned: false },
    { id: 5, name: "Cultural Explorer", icon: "🌍", description: "Complete all cultural notes", earned: false },
  ];

  // Final test questions for each unit
  const finalTestQuestions: Record<number, TestQuestion[]> = {
    1: [
      {
        id: 1,
        question: "What is the most common informal greeting in English?",
        options: ["Good day", "Hello", "How do you do?", "Pleased to meet you"],
        correctAnswer: 1
      },
      {
        id: 2,
        question: "Which response is appropriate for 'How are you?'",
        options: ["I'm John", "Yes, please", "I'm fine, thank you", "Good morning"],
        correctAnswer: 2
      },
      {
        id: 3,
        question: "Which phrase is typically used when leaving?",
        options: ["Good morning", "Hello", "Nice to meet you", "Goodbye"],
        correctAnswer: 3
      },
      {
        id: 4,
        question: "What gesture often accompanies a formal greeting?",
        options: ["A handshake", "A hug", "A wave", "A bow"],
        correctAnswer: 0
      },
      {
        id: 5,
        question: "Which greeting is appropriate in the evening?",
        options: ["Good morning", "Good afternoon", "Good evening", "Good day"],
        correctAnswer: 2
      }
    ],
    2: [
      {
        id: 1,
        question: "When introducing yourself, what personal information is typically shared first?",
        options: ["Your age", "Your name", "Your nationality", "Your job"],
        correctAnswer: 1
      },
      {
        id: 2,
        question: "Which sentence pattern is correct for introducing yourself?",
        options: ["I John", "Me John", "My name is John", "John I am"],
        correctAnswer: 2
      },
      {
        id: 3,
        question: "How would you ask someone where they are from?",
        options: ["Where from you?", "Where are you from?", "You from where?", "From where you?"],
        correctAnswer: 1
      },
      {
        id: 4,
        question: "What question would you ask to find out someone's profession?",
        options: ["You work?", "Do you job?", "What do you do?", "How do you work?"],
        correctAnswer: 2
      },
      {
        id: 5,
        question: "Which is the correct way to introduce a family member?",
        options: ["This my brother", "He my brother", "This is my brother", "My brother he"],
        correctAnswer: 2
      }
    ],
    3: [
      {
        id: 1,
        question: "What is the correct word order for asking a question in English?",
        options: ["You are from where?", "Where you are from?", "Where are you from?", "From where you are?"],
        correctAnswer: 2
      },
      {
        id: 2,
        question: "Which phrase would you use to ask for directions to a restaurant?",
        options: ["Where is the restaurant?", "The restaurant where?", "I want restaurant", "Restaurant is where?"],
        correctAnswer: 0
      },
      {
        id: 3,
        question: "How would you order a meal in a restaurant?",
        options: ["Bring me food", "I want this", "I'd like to order...", "Give food"],
        correctAnswer: 2
      },
      {
        id: 4,
        question: "What phrase would you use to ask for the price of an item?",
        options: ["Cost?", "Money?", "How much is this?", "Price what?"],
        correctAnswer: 2
      },
      {
        id: 5,
        question: "Which phrase would you use to ask about transportation options?",
        options: ["How I go there?", "How can I get to...?", "Where transport?", "I need go there"],
        correctAnswer: 1
      }
    ]
  };

  useEffect(() => {
    setAnimatePath(false);
    setTimeout(() => setAnimatePath(true), 50);
  }, [activeUnit]);

  const getLessonsForChapter = (chapterId: number): Lesson[] => {
    const unitIndex = units.findIndex(u => u.id === activeUnit);
    const chapterIndex = units[unitIndex]?.chapters.findIndex(c => c.id === chapterId);
    
    if (unitIndex >= 0 && chapterIndex >= 0) {
      return sampleLessons[unitIndex] || sampleLessons[0];
    }
    return sampleLessons[0];
  };

  const handleChapterClick = (chapterId: number) => {
    setActiveChapter(chapterId);
    if (Math.random() > 0.7) {
      setShowAchievement(true);
      setTimeout(() => setShowAchievement(false), 3000);
    }
  };

  const handleBackFromLessons = () => {
    setActiveChapter(0);
  };

  const handleStartFinalTest = () => {
    setShowFinalTest(true);
  };

  const handleBackFromTest = () => {
    setShowFinalTest(false);
  };

  const handleTestComplete = (score: number, totalQuestions: number) => {
    // Show toast with results
    const percentage = Math.round((score / totalQuestions) * 100);
    const currentUnit = units.find(u => u.id === activeUnit);
    
    // Update user's XP or other metrics here
    
    toast({
      title: `Test Completed: ${percentage}%`,
      description: `You scored ${score} out of ${totalQuestions} on the ${currentUnit?.title} unit test.`,
      variant: percentage >= 70 ? "default" : "destructive",
    });
    
    // If score is high enough, could mark unit as complete or unlock next unit
    if (percentage >= 70 && activeUnit < 3) {
      // Could potentially automatically unlock the next unit here
      setTimeout(() => {
        toast({
          title: "Achievement Unlocked",
          description: "You've unlocked the next unit!",
          variant: "default",
        });
      }, 1500);
    }
  };

  const handleUnitChange = (unitId: number) => {
    setActiveUnit(unitId);
    if (onChangeUnit) {
      onChangeUnit(unitId);
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    }
  };

  // Update handleViewRoadmap to use Next.js router
  const handleViewRoadmap = () => {
    router.push('/unit-roadmap');
  };

  // Display test UI if in test mode
  if (showFinalTest) {
    const currentUnit = units.find(u => u.id === activeUnit) || units[0];
    return (
      <TestUI
        unitId={activeUnit}
        unitTitle={currentUnit.title}
        questions={finalTestQuestions[activeUnit] || finalTestQuestions[1]}
        onBack={handleBackFromTest}
        onComplete={handleTestComplete}
      />
    );
  }

  // Display lesson UI if a chapter is selected
  if (activeChapter > 0) {
    const currentUnit = units.find(u => u.id === activeUnit);
    const currentChapter = currentUnit?.chapters.find(c => c.id === activeChapter);
    
    if (currentChapter) {
      return (
        <LessonUI
          chapterId={currentChapter.id}
          chapterTitle={currentChapter.title}
          lessons={getLessonsForChapter(currentChapter.id)}
          onBack={handleBackFromLessons}
        />
      );
    }
  }

  // Render the main learning path journey UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={handleBackClick}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Unit Roadmap
        </button>

        {/* Main content: unit selector, chapter list, etc. */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Learning Path</h1>
            <button className="ml-2 text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 100-16 8 8 0 000 16zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center bg-white py-1 px-3 rounded-full shadow-sm">
              <span className="text-yellow-500 font-bold">1250 XP</span>
              <div className="mx-2 h-4 w-px bg-gray-300"></div>
              <div className="flex items-center text-orange-500">
                <span>🔥</span>
                <span className="ml-1 font-medium">5 day streak</span>
              </div>
            </div>
            <div className="flex items-center text-orange-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="ml-1 font-medium">05:56</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-nowrap overflow-x-auto pb-4 gap-3 mb-8">
          {units.map(unit => (
            <button
              key={unit.id}
              onClick={() => handleUnitChange(unit.id)}
              className={`relative whitespace-nowrap rounded-full py-3 px-6 font-medium transition-all ${
                activeUnit === unit.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>Unit {unit.id}: {unit.title}</span>
                {unit.progress > 0 && (
                  <span className="inline-flex items-center justify-center bg-green-500 text-white text-xs rounded-full h-5 px-2">
                    {unit.progress}%
                  </span>
                )}
              </div>
              {unit.progress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${unit.progress}%` }}
                  ></div>
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="relative mb-8 bg-white rounded-lg p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Unit {activeUnit}: {units.find(u => u.id === activeUnit)?.title || units[0].title}
              </h2>
              <p className="text-gray-600 mt-1">
                {units.find(u => u.id === activeUnit)?.description || units[0].description}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              {badges.filter(b => b.earned).slice(0, 3).map(badge => (
                <div key={badge.id} className="group relative">
                  <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full border-2 border-yellow-300 text-xl">
                    {badge.icon}
                  </div>
                  <div className="hidden group-hover:block absolute z-30 bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-48 bg-black bg-opacity-80 text-white text-xs rounded p-2">
                    <div className="font-bold">{badge.name}</div>
                    <div>{badge.description}</div>
                  </div>
                </div>
              ))}
              <button className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full border-2 border-gray-200 text-gray-400 hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className={`relative transition-opacity duration-500 ${animatePath ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute left-1/2 top-0 bottom-0 w-1.5 bg-blue-600 transform -translate-x-1/2 z-0 shadow-lg shadow-blue-200"></div>
          
          <div className="relative z-10">
            {units.find(u => u.id === activeUnit)?.chapters.map((chapter, index) => {
              const isEven = index % 2 === 0;
              const isCompleted = chapter.completed;
              const isActive = chapter.id === activeChapter;
              const isLocked = !isCompleted && chapter.id !== activeChapter && 
                               units.find(u => u.id === activeUnit)?.chapters[index - 1]?.completed !== true;
              
              return (
                <div key={chapter.id} className="mb-24 relative flex items-center">
                  <div 
                    className={`absolute ${isEven ? '-left-1/2' : '-right-1/2'} top-1/2 h-0.5 
                    ${isCompleted ? 'bg-blue-500' : 'border-b-2 border-dashed border-blue-500'} 
                    w-1/2 transform -translate-y-1/2 z-0`}
                    style={{ 
                      left: isEven ? '50%' : 'auto', 
                      right: isEven ? 'auto' : '50%',
                      width: '30%'
                    }}
                  ></div>
                  
                  <div className={`w-full flex ${isEven ? 'justify-start' : 'justify-end'}`}>
                    <div 
                      className={`flex ${isEven ? 'flex-row' : 'flex-row-reverse'} items-center gap-4 lg:gap-6 max-w-md 
                      ${isActive ? 'scale-110' : 'scale-100'} 
                      transition-all duration-300 transform`}
                      onClick={() => !isLocked && handleChapterClick(chapter.id)}
                    >
                      <div className={`relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center z-20 
                        cursor-pointer hover:scale-105 transition-transform duration-300
                        ${isLocked ? 'opacity-60 cursor-not-allowed' : 'opacity-100'}`}>
                        <svg className={`absolute inset-0 w-full h-full ${
                          isCompleted ? 'text-green-600' : 
                          isActive ? 'text-blue-600' : 
                          isLocked ? 'text-gray-400' : 'text-blue-400'
                        }`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.042 23.648C11.128 22.876 0.3 14.647 0.3 8.647C0.3 3.922 5.522 0.148 12.042 0.148C18.562 0.148 23.784 3.922 23.784 8.647C23.784 14.647 12.956 22.876 12.042 23.648Z" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          {isCompleted ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isLocked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          ) : (
                            <>
                              <span className="text-lg font-bold text-white">{chapter.id}</span>
                              <span className="text-xs text-white">Chapter</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div 
                        className={`bg-white rounded-lg shadow-md p-3 transform transition-all duration-300
                        ${isActive ? 'ring-2 ring-blue-400 -rotate-1' : ''}`}
                        onMouseEnter={() => setShowTooltip(chapter.id)}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        <div className="flex flex-col">
                          <h3 className="font-medium text-gray-800 flex items-center gap-2">
                            {chapter.title}
                            {isCompleted && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{chapter.description}</p>
                          <div className="flex items-center justify-between mt-2 text-xs">
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              {chapter.xp} XP
                            </span>
                            <span className="text-gray-500 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {chapter.duration}
                            </span>
                          </div>
                        </div>
                        
                        {showTooltip === chapter.id && !isLocked && (
                          <div className="absolute z-30 top-0 transform -translate-y-full mt-1 p-3 bg-black bg-opacity-80 text-white text-sm rounded-lg w-48">
                            <div className="font-bold mb-1">{isCompleted ? 'Completed!' : 'Next Up!'}</div>
                            <div className="text-xs mb-2">
                              {isCompleted 
                                ? 'You can review this lesson anytime.' 
                                : 'Click to start this lesson.'}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="bg-yellow-500 text-black px-2 py-0.5 rounded-full">
                                {chapter.xp} XP
                              </span>
                              <span>{chapter.duration}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <div className="mb-10 relative flex justify-center">
              <div className="absolute left-1/2 -top-10 h-10 transform -translate-x-1/2"></div>
              <div 
                className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg z-20 transform hover:scale-105 transition-all cursor-pointer"
                onClick={handleStartFinalTest}
              >
                <div className="text-white text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-xs mt-1">Final Test</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="fixed bottom-6 right-6 z-30 md:static md:mt-8">
          <button
            onClick={handleStartFinalTest}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-3 flex items-center gap-2 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Take Final Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningPathJourney;
