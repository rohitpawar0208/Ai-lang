'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronRight, Award, Users, Clock } from "lucide-react";

const CourseOverview = () => {
  const router = useRouter();

  const courseInfo = {
    title: "Complete Language Mastery",
    description: "Master the fundamentals of language learning through our comprehensive, structured approach. From basic greetings to complex conversations, this course will guide you to fluency.",
    progress: 45,
    totalStudents: "2.3k",
    duration: "12 weeks",
    objectives: [
      "Achieve conversational fluency in everyday situations",
      "Master essential grammar and vocabulary",
      "Develop cultural understanding and context",
      "Build confidence in speaking and listening"
    ]
  };

  const handleViewRoadmap = () => {
    router.push('/language-learning/unit-roadmap');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4 flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{courseInfo.title}</h1>
              <p className="text-gray-600 text-lg">{courseInfo.description}</p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-600">{courseInfo.totalStudents} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-600">{courseInfo.duration}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 bg-blue-50 p-6 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">{courseInfo.progress}%</div>
              <Progress value={courseInfo.progress} className="w-32" />
              <span className="text-sm text-gray-600">Course Progress</span>
            </div>
          </div>
        </div>

        {/* Course Objectives */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-500" />
            Course Objectives
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {courseInfo.objectives.map((objective, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-gray-700">{objective}</p>
              </div>
            ))}
          </div>
        </div>

        {/* View Roadmap Button */}
        <div className="flex justify-center">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-lg py-6 px-8"
            onClick={handleViewRoadmap}
          >
            View Unit Roadmap
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseOverview; 