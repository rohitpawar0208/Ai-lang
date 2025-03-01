import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContributionGraphProps {
  data: Record<string, number>;
  year?: number;
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ data, year }) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalContributions, setTotalContributions] = useState(0);
  const [averageContributions, setAverageContributions] = useState(0);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(year || currentYear);
  
  const getAvailableYears = () => {
    const years = new Set<number>();
    const today = new Date();
    
    // Add current and next year
    years.add(today.getFullYear());
    years.add(today.getFullYear() + 1);
    
    // Add years from data
    Object.keys(data).forEach(date => {
      const year = new Date(date).getFullYear();
      years.add(year);
    });

    return Array.from(years).sort((a, b) => b - a);
  };

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100';
    if (count < 3) return 'bg-green-200';
    if (count < 6) return 'bg-green-300';
    if (count < 9) return 'bg-green-400';
    return 'bg-green-500';
  };

  const getLocalDateString = (date: Date): string => {
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().split('T')[0];
  };

  const formatDate = (date: Date) => {
    return getLocalDateString(date);
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const calculateStats = () => {
    let current = 0;
    let longest = 0;
    let tempCurrent = 0;
    let total = 0;
    let daysWithContributions = 0;

    const sortedDays = Object.keys(data).sort();
    const today = getLocalDateString(new Date());
    
    sortedDays.forEach((day) => {
      if (day > today) return; // Skip future dates
      
      // Ensure we're working with numbers
      const contributions = typeof data[day] === 'number' ? data[day] : 0;
      
      if (contributions > 0) {
        total += contributions;
        daysWithContributions++;
        tempCurrent++;
        if (day === today) {
          current = tempCurrent;
        }
      } else {
        longest = Math.max(longest, tempCurrent);
        tempCurrent = 0;
      }
    });

    // Update stats
    longest = Math.max(longest, tempCurrent);
    const average = daysWithContributions > 0 ? 
      Number((total / daysWithContributions).toFixed(1)) : 0;

    setCurrentStreak(current);
    setLongestStreak(longest);
    setTotalContributions(Number(total));
    setAverageContributions(average);
  };

  useEffect(() => {
    calculateStats();
  }, [data]);

  const generateCalendarDays = () => {
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);
    const today = new Date();

    // Adjust start date to first Sunday of the year
    startDate.setDate(1);
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    const days = [];
    let currentDate = new Date(startDate);

    // Generate all weeks for the selected year
    while (currentDate <= endDate || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  const weeks = generateCalendarDays();

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatTooltipDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex-grow">
            Contribution Activity
          </CardTitle>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getAvailableYears().map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm font-normal text-gray-500 mt-2">
          Total: {totalContributions.toLocaleString()} Sessions
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Current Streak</div>
              <div className="text-xl font-bold text-green-500">{currentStreak} days</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Longest Streak</div>
              <div className="text-xl font-bold text-green-500">{longestStreak} days</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Total Sessions</div>
              <div className="text-xl font-bold text-green-500">
                {totalContributions.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Average Per Day</div>
              <div className="text-xl font-bold text-green-500">
                {averageContributions.toLocaleString()} sessions
              </div>
            </div>
          </div>

          {/* Contribution Graph with Horizontal Scroll for Mobile */}
          <div className="overflow-x-auto pb-4">
            <div className="flex min-w-[800px]">
              <div className="flex flex-col text-xs text-gray-400 justify-between pr-2 py-2">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  {monthLabels.map(month => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
                <div className="grid grid-cols-53 gap-1">
                  {generateCalendarDays().map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-rows-7 gap-1">
                      {week.map((day, dayIndex) => {
                        const formattedDate = formatDate(day);
                        const isCurrentYear = day.getFullYear() === selectedYear;
                        const count = isCurrentYear ? (data[formattedDate] || 0) : 0;
                        
                        return (
                          <TooltipProvider key={dayIndex}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div 
                                  className={`
                                    w-3 h-3 rounded-sm 
                                    ${isCurrentYear ? getColor(count) : 'bg-gray-50'} 
                                    cursor-pointer 
                                  `}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  {isCurrentYear 
                                    ? `${count} contributions on ${formatTooltipDate(day)}`
                                    : formatTooltipDate(day)
                                  }
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-end items-center space-x-2 text-xs text-gray-500">
            <span>Less</span>
            <div className="flex space-x-1">
              {[0, 2, 5, 8, 10].map(count => (
                <div key={count} className={`w-3 h-3 rounded-sm ${getColor(count)}`} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContributionGraph;
