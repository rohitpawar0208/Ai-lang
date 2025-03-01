'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Volume2, Languages } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: "Choose the correct word to complete the sentence: 'The musician's ________ in composing emotional melodies is widely recognized.'",
    options: ["proficiency", "ineptitude"],
    correctAnswer: "proficiency",
    explanation: "The correct answer is 'proficiency' because it means high skill and competence. 'Ineptitude' means a lack of skill."
  },
  {
    id: 2,
    text: "Which of these words is an adverb: 'Fast,' 'Quick,' 'Fastly'?",
    options: ["Fast", "Quick", "Fastly"],
    correctAnswer: "Fastly",
    explanation: "The correct answer is 'Fastly' because it is an adverb that describes the speed of an action. 'Fast' and 'Quick' are adjectives."
  },
  // Add more questions here
];

const GrammarQuizPage: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    if (answer === currentQuestion.correctAnswer) {
      setCorrectCount(correctCount + 1);
    } else {
      setWrongCount(wrongCount + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleExit = () => {
    setShowExitDialog(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white p-4 flex items-center justify-between shadow-md">
        <Button variant="ghost" size="icon" onClick={handleExit}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold text-center flex-grow">Grammar Quiz</h1>
        <div className="w-6" /> {/* Spacer for alignment */}
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">QUESTION {currentQuestionIndex + 1} OF {questions.length}</p>
          <div className="flex space-x-2">
            <span className="text-green-600 border border-green-600 rounded-full px-2 py-1">
              {correctCount} Correct
            </span>
            <span className="text-red-600 border border-red-600 rounded-full px-2 py-1">
              {wrongCount} Wrong
            </span>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <p className="text-lg font-semibold mb-4">{currentQuestion.text}</p>
            <div className="flex items-center space-x-2 mb-2">
              <Button variant="ghost" size="icon">
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Languages className="h-4 w-4" />
              </Button>
            </div>
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                className={`w-full mb-2 justify-between ${
                  selectedAnswer === option
                    ? option === currentQuestion.correctAnswer
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                    : ''
                }`}
                onClick={() => handleAnswerSelect(option)}
                disabled={!!selectedAnswer}
              >
                {option}
                <div className="flex items-center space-x-2">
                  <Volume2 className="h-4 w-4" />
                  <Languages className="h-4 w-4" />
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {showExplanation && (
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Explanation</h3>
              <p>{currentQuestion.explanation}</p>
            </CardContent>
          </Card>
        )}

        {selectedAnswer && (
          <div className="flex justify-center">
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          </div>
        )}
      </main>

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Quiz</DialogTitle>
            <DialogDescription>
              Do you want to exit this quiz? Your progress will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitDialog(false)}>
              No
            </Button>
            <Button>
              <Link href="/user-page">Yes</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrammarQuizPage;