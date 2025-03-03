// Main export file for the language learning module

export { default as LessonUI } from './LessonUI';
export type { Lesson } from './LessonUI';

export { default as TestUI } from './TestUI';
export type { TestQuestion } from './TestUI';

export { default as UnitRoadmap } from './UnitRoadmap';
export { default as LearningPathJourney } from './LearningPathJourney';
export { default as CourseOverview } from './CourseOverview';

// Sample data exports
export const sampleUnits = [
  {
    id: 1,
    title: "Basics",
    description: "Learn the fundamentals",
    progress: 80,
    isCompleted: true
  },
  {
    id: 2,
    title: "Self-Introduction",
    description: "Master self-introductions",
    progress: 20,
    isActive: true
  },
  {
    id: 3,
    title: "Daily Conversations",
    description: "Master everyday communication",
    progress: 0
  }
];

// Sample lessons for demo
export const sampleLessons = [
  { 
    id: 1, 
    title: "Greeting Basics", 
    description: "Learn common greetings", 
    isLocked: false, 
    isCompleted: true, 
    iconType: 'ear', 
    hasChat: true, 
    hasAudio: true 
  },
  { 
    id: 2, 
    title: "Introduction Practice", 
    description: "Practice introducing yourself", 
    isLocked: false, 
    isCompleted: false, 
    iconType: 'speech', 
    hasChat: true 
  },
  { 
    id: 3, 
    title: "Advanced Greetings", 
    description: "Learn formal greetings", 
    isLocked: true, 
    isCompleted: false, 
    iconType: 'ear', 
    hasAudio: true 
  }
];

// Sample test questions for demo
export const sampleTestQuestions = [
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
  }
];
