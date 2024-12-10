import { Course, CourseLanguage } from "packages/common/src/model/course";
import { Repository } from "./repository";
import { Card } from "../model/card";

export interface CourseRepository extends Repository<Course, number> {
    getById(id: number): Promise<Course>;
}

export interface CourseLanguageRepository extends Repository<CourseLanguage, number> {
    getById(id: number): Promise<CourseLanguage>;
    match(namePrefix: string, lang: string): Promise<CourseLanguage[]>;
}

export type CardRepository = Repository<Card, number>;