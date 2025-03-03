'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Unit {
  id: number;
  title: string;
  description: string;
  progress?: number;
  isCompleted?: boolean;
  isActive?: boolean;
}

interface UnitRoadmapProps {
  units: Unit[];
  onUnitClick: (unitId: number) => void;
  onBackClick?: () => void;
}

const UnitRoadmap: React.FC<UnitRoadmapProps> = ({ 
  units, 
  onUnitClick
}) => {
  const router = useRouter();

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 min-h-[800px]">
      {/* Back Button */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          className="flex items-center text-gray-600 hover:text-gray-900"
          onClick={() => router.push('/user-page')}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to User Page
        </Button>
      </div>
      
      {/* Main Title */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 mb-12 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Learning Path
        </h2>
        <h3 className="text-xl text-gray-600 dark:text-gray-300">Master your language journey</h3>
      </div>

      {/* Learning Path */}
      <div className="relative">
        {/* Path Line */}
        <svg
          className="absolute top-0 left-0 w-full h-full z-0"
          preserveAspectRatio="none"
          viewBox="0 0 100 800"
        >
          <path
            d="M50,0 Q60,100 40,200 Q20,300 60,400 Q80,500 40,600 Q20,700 50,800"
            className="stroke-2 stroke-blue-400 dark:stroke-blue-600 fill-none"
            strokeDasharray="5,5"
          />
        </svg>

        {/* Units */}
        <div className="relative z-10 flex flex-col items-center gap-16">
          {units.map((unit, index) => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`
                cursor-pointer
                w-48 h-48
                flex flex-col items-center justify-center
                clip-path-hexagon
                transform hover:scale-105 transition-transform
                ${unit.isActive ? 'bg-blue-500 text-white' : 
                  unit.isCompleted ? 'bg-green-500 text-white' : 
                  'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}
                shadow-lg hover:shadow-xl
                relative
              `}
              onClick={() => onUnitClick(unit.id)}
            >
              {/* Unit Number */}
              <span className="text-2xl font-bold mb-2">Unit {unit.id}</span>
              
              {/* Unit Title */}
              <span className="text-lg font-medium text-center px-4 mb-1">{unit.title}</span>
              
              {/* Description */}
              <span className="text-sm text-center px-4 opacity-80">
                {unit.description}
              </span>

              {/* Progress Bar */}
              {unit.progress !== undefined && unit.progress > 0 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3/4">
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/80 rounded-full"
                      style={{ width: `${unit.progress}%` }}
                    />
                  </div>
                  <span className="text-xs mt-1 text-center block">
                    {unit.progress}% Complete
                  </span>
                </div>
              )}

              {/* Completion Indicator */}
              {unit.isCompleted && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .clip-path-hexagon {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default UnitRoadmap;
