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
    <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{courseInfo.title}</h1>
              <p className="text-gray-600 text-lg">{courseInfo.description}</p>
              <div className="flex items-center gap-4">
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
            <div className="flex flex-col items-center gap-2 bg-blue-50 p-4 rounded-xl">
              <div className="text-3xl font-bold text-blue-600">{courseInfo.progress}%</div>
              <Progress value={courseInfo.progress} className="w-32" />
              <span className="text-sm text-gray-600">Course Progress</span>
            </div>
          </div>
        </div>

        {/* View Roadmap Button */}
        <div className="flex justify-center mt-2">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-lg py-4 px-6"
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