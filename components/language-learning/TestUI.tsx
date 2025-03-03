'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface TestUIProps {
  unitId: number;
  unitTitle: string;
  questions: TestQuestion[];
  onBack: () => void;
  onComplete: (score: number, totalQuestions: number) => void;
}

const TestUI: React.FC<TestUIProps> = ({
  unitId,
  unitTitle,
  questions,
  onBack,
  onComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showingResults, setShowingResults] = useState(false);

  const handleSelectAnswer = (optionIndex: number) => {
    if (isSubmitted) return;
    
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newSelectedAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const handleSubmitTest = () => {
    const finalScore = calculateScore();
    setScore(finalScore);
    setShowingResults(true);
  };

  const handleCompleteReview = () => {
    setIsSubmitted(true);
    setShowingResults(false);
    onComplete(score, questions.length);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const hasAnsweredCurrent = selectedAnswers[currentQuestionIndex] !== -1;
  const allQuestionsAnswered = selectedAnswers.every(answer => answer !== -1);

  if (!currentQuestion) {
    return <div>No questions available</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Learning Path
        </button>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Final Test: Unit {unitId} - {unitTitle}</h1>
            {!isSubmitted && !showingResults && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            )}
          </div>

          {!isSubmitted && !showingResults ? (
            <>
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{currentQuestion.question}</h2>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <div 
                      key={index}
                      onClick={() => handleSelectAnswer(index)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAnswers[currentQuestionIndex] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                          selectedAnswers[currentQuestionIndex] === index
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!hasAnsweredCurrent}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitTest}
                    disabled={!allQuestionsAnswered}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Submit Test
                  </Button>
                )}
              </div>
            </>
          ) : showingResults ? (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold mb-4">Test Results</h2>
                <p className="text-lg mb-3">You scored {score} out of {questions.length}</p>
                <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-4 mb-8">
                  <div 
                    className={`h-4 rounded-full ${
                      score === questions.length
                        ? 'bg-green-500'
                        : score >= questions.length / 2
                        ? 'bg-blue-500'
                        : 'bg-orange-500'
                    }`} 
                    style={{ width: `${(score / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                {questions.map((question, questionIndex) => {
                  const isCorrect = selectedAnswers[questionIndex] === question.correctAnswer;
                  return (
                    <div 
                      key={question.id} 
                      className={`p-4 rounded-lg border-2 ${
                        isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-medium">
                          <span className="mr-2">
                            {questionIndex + 1}.
                          </span>
                          {question.question}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-sm font-bold ${
                          isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = selectedAnswers[questionIndex] === optionIndex;
                          const isCorrectOption = question.correctAnswer === optionIndex;
                          
                          let optionClass = 'p-3 rounded-lg flex items-center';
                          
                          if (isSelected && isCorrectOption) {
                            optionClass += ' bg-green-200 border border-green-500';
                          } else if (isSelected && !isCorrectOption) {
                            optionClass += ' bg-red-200 border border-red-500';
                          } else if (isCorrectOption) {
                            optionClass += ' bg-green-100 border border-green-400';
                          } else {
                            optionClass += ' bg-gray-100 border border-gray-300';
                          }
                          
                          return (
                            <div key={optionIndex} className={optionClass}>
                              <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                                isCorrectOption
                                  ? 'bg-green-500 text-white'
                                  : isSelected
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200'
                              }`}>
                                {String.fromCharCode(65 + optionIndex)}
                              </div>
                              <span>{option}</span>
                              {isCorrectOption && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              {isSelected && !isCorrectOption && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-auto text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleCompleteReview}
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  Complete Review
                </Button>
              </div>
            </>
          ) : (
            // This is the original "completed" view that shows after reviewing results
            <div className="text-center py-8">
              <div className="text-5xl mb-4">
                {score === questions.length ? '🎉' : score >= questions.length / 2 ? '👍' : '😕'}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Your Score: {score}/{questions.length}
              </h2>
              <p className="text-lg mb-6 text-gray-600">
                {score === questions.length
                  ? 'Perfect! You mastered this unit!'
                  : score >= questions.length / 2
                  ? 'Good job! You passed the test.'
                  : 'Keep practicing. You can do better!'}
              </p>
              <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-4 mb-8">
                <div 
                  className={`h-4 rounded-full ${
                    score === questions.length
                      ? 'bg-green-500'
                      : score >= questions.length / 2
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                  }`} 
                  style={{ width: `${(score / questions.length) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={onBack}>
                  Return to Learning Path
                </Button>
                <Button onClick={() => {
                  setIsSubmitted(false);
                  setShowingResults(false);
                  setCurrentQuestionIndex(0);
                  setSelectedAnswers(Array(questions.length).fill(-1));
                }}>
                  Retry Test
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestUI;
