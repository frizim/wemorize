import { Course, CourseLanguage } from "packages/common/src/model/course";
import { Repository } from "./repository";
import { Card } from "../model/card";

export interface CourseRepository extends Repository<Course, number> {
    getById(id: number): Promise<Course>;

    update(item: Course): Promise<boolean>;
}

export interface CourseLanguageRepository extends Repository<CourseLanguage, number> {
    getById(id: number): Promise<CourseLanguage>;
    getAllByCourse(courseId: number): Promise<CourseLanguage[]>;
    match(namePrefix: string, lang: string, max_results?: number, end?: number): Promise<CourseLanguage[]>;

    update(item: CourseLanguage): Promise<boolean>;
}

export interface CardRepository extends Repository<Card, number> {
    getById(id: number): Promise<Card>;
    getAllByCourseLanguage(courseLangId: number): Promise<Map<number, Map<number | null,Card>>>;

    update(item: Card): Promise<boolean>;
    updatePosition(item: Card, prevCardId: number|null, oldNextId: number|null): Promise<boolean>;

    delete(id: number): Promise<boolean>;
}