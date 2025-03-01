'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Volume2, Languages } from 'lucide-react'
import Link from 'next/link'

interface Level {
  id: number;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  locked: boolean;
}

interface Question {
  text: string;
  options: string[];
  correctAnswer: string;
}

const levels: Level[] = [
  { id: 1, title: "Getting to know me!", subtitle: "LEVEL 1", color: "bg-pink-500", icon: "🙋‍♂️", locked: false },
  { id: 2, title: "My home", subtitle: "LEVEL 2", color: "bg-blue-500", icon: "🏠", locked: true },
  { id: 3, title: "Cricket", subtitle: "LEVEL 3", color: "bg-green-500", icon: "🏏", locked: true },
  { id: 4, title: "Things Around Me", subtitle: "LEVEL 4", color: "bg-purple-500", icon: "🌈", locked: true },
  { id: 5, title: "What's In My Bag?", subtitle: "LEVEL 5", color: "bg-red-500", icon: "🎒", locked: true },
];

const questions: Question[] = [
  {
    text: "Is that your native?",
    options: ["Yes, it is.", "No, it is not my native."],
    correctAnswer: "No, it is not my native."
  },
  // Add more questions here
];

const GrammarLessonPage: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleLevelSelect = (level: Level) => {
    if (!level.locked) {
      setSelectedLevel(level);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setUserAnswer(answer);
    setShowFeedback(true);
  };

  const handleContinue = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer(null);
      setShowFeedback(false);
    } else {
      // End of lesson
      setSelectedLevel(null);
    }
  };

  const renderLevels = () => (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-center">LEVELS</h1>
      {levels.map((level) => (
        <Card 
          key={level.id} 
          className={`${level.color} ${level.locked ? 'opacity-50' : ''} cursor-pointer`}
          onClick={() => handleLevelSelect(level)}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold">{level.subtitle}</h2>
              <p className="text-white text-lg">{level.title}</p>
            </div>
            <div className="text-4xl">{level.icon}</div>
            {level.locked && <span className="text-white">🔒</span>}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderQuestion = () => {
    const question = questions[currentQuestionIndex];
    return (
      <div className="space-y-4">
        <Progress value={(currentQuestionIndex + 1) / questions.length * 100} className="w-full" />
        <h2 className="text-xl font-bold">Choose your response from the given statements</h2>
        <Card className="bg-purple-100">
          <CardContent className="p-4">
            <p className="text-lg">{question.text}</p>
            <div className="flex justify-end space-x-2 mt-2">
              <Button variant="ghost" size="icon">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Languages className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        {question.options.map((option, index) => (
          <Button
            key={index}
            className="w-full justify-between"
            onClick={() => handleAnswerSelect(option)}
            variant={userAnswer === option ? 'default' : 'outline'}
          >
            {option}
            <div className="flex space-x-2">
              <Volume2 className="h-4 w-4" />
              <Languages className="h-4 w-4" />
            </div>
          </Button>
        ))}
      </div>
    );
  };

  const renderFeedback = () => {
    const question = questions[currentQuestionIndex];
    const isCorrect = userAnswer === question.correctAnswer;
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Read your complete response out loud</h2>
        <Card className="bg-gray-100">
          <CardContent className="p-4">
            <p className="text-lg">{userAnswer}</p>
            <div className="flex justify-end space-x-2 mt-2">
              <Button variant="ghost" size="icon">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Languages className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className={`p-4 rounded-md ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
          <p className={`text-lg font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? 'FANTASTIC JOB 🤩' : 'GOOD TRY 😊'}
          </p>
          <p className="mt-2">Sentence accuracy: {isCorrect ? '100%' : '67%'}</p>
        </div>
        <Button className="w-full" onClick={handleContinue}>Continue</Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white p-4 flex items-center justify-between shadow-md">
        <Link href="/user-page" className="text-gray-600 hover:text-gray-800">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-semibold text-center flex-grow">Grammar Lesson</h1>
        <div className="w-6" /> {/* Spacer for alignment */}
      </header>

      <main className="flex-grow p-4 space-y-4">
        {!selectedLevel && renderLevels()}
        {selectedLevel && !showFeedback && renderQuestion()}
        {selectedLevel && showFeedback && renderFeedback()}
      </main>
    </div>
  );
};

export default GrammarLessonPage;