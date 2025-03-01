'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { ArrowRight, Book, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type Session = { id: number; title: string; date: string };

type Recommendation = {
  id: number;
  title: string;
  type: string;
  icon: React.ElementType;
};

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export function AppDashboardPage() {
  const [userName, setUserName] = useState('User')
  const [progress, setProgress] = useState(0)
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])

  useEffect(() => {
    // Simulate fetching user data
    setUserName('John Doe')
    setProgress(65)
    setUpcomingSessions([
      { id: 1, title: 'Interview Practice', date: '2024-03-15T10:00:00Z' },
      { id: 2, title: 'Pronunciation Workshop', date: '2024-03-17T14:00:00Z' },
    ])
    setRecommendations([
      { id: 1, title: 'Improve your pronunciation', type: 'exercise', icon: Book },
      { id: 2, title: 'Master business idioms', type: 'lesson', icon: TrendingUp },
    ])
  }, [])

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Score',
        data: [65, 70, 75, 80],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome back, {userName}!</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
            <p className="mt-2 text-center">{progress}% Complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex justify-between items-center mb-2">
                <span>{session.title}</span>
                <span>{new Date(session.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            ))}
            <Button className="w-full mt-4">
              <Calendar className="mr-2 h-4 w-4" /> Schedule New Session
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.map((rec) => (
              <div key={rec.id} className="flex items-center mb-2">
                <rec.icon className="mr-2 h-4 w-4" />
                <span>{rec.title}</span>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              View All Recommendations
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>Weekly performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <Bar data={chartData} />
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Link href="/practice">
          <Button size="lg">
            Start New Practice Session <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}