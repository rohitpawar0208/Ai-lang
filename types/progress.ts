import { Timestamp } from 'firebase/firestore';

export interface WeeklyProgress {
  day: string
  minutes: number
  timestamp: string
}

export interface ArchivedWeek {
  weekEnding: string
  progress: WeeklyProgress[]
}

export interface UserData {
  weeklyProgress: WeeklyProgress[]
  archivedProgress: ArchivedWeek[]
  lastWeekReset: Timestamp
} 