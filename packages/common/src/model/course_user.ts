import { Course, CourseLanguage } from "./course";
import { Profile } from "./profile";

export interface CourseEnrollment {
    id: number,
    user?: Profile,
    course_language: CourseLanguage,
    daily_goal: number,
    enrolled: Date,
    reminder: boolean,
}

export interface CourseUserStatistics {
    course: Course,
    progress: number,
    cards_per_day: number[]
}