import { Course, CourseLanguage } from "./course";
import { Profile } from "./profile";

export interface CourseEnrollment {
    id: number,
    user?: Profile,
    course_language: CourseLanguage,
    course_stats?: CourseUserStatistics,
    daily_goal: number,
    enrolled: Date,
    reminder: boolean,
}

export interface CourseUserStatistics {
    course: Course,
    progress: number,
    rank: number,
    cards_per_day: number[]
}

export interface DailyStatistics {
    date: Date,
    correct: number,
    wrong: number,
    goal_met: boolean
}