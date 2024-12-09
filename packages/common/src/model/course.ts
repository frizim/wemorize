import { Profile } from "./profile";

export enum AnswerMode {
    selftest,
    input,
    similar_alts
}

export interface Course {
    id: number,
    creator: Profile|null,
    clicks: number,
    created: Date,
    last_update: Date,
    answer_mode: AnswerMode,
    flip: boolean,
    randomize: boolean,
    show_first: boolean
}

export interface CourseLanguage {
    course?: Course,
    id: number,
    language: string,
    name: string,
    description: string
}