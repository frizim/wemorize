import { CourseEnrollmentRepository } from "./course_users";
import { CardRepository, CourseLanguageRepository, CourseRepository } from "./courses";
import { AuthTokenRepository, SessionRepository, UserRepository } from "./users";
import { Logger } from "../util/logger";

export interface StorageProvider {

    migrate(logger: Logger): Promise<void>;
    shutdown(): Promise<void>;

    getUserRepository(): UserRepository;
    getSessionRepository(): SessionRepository;
    getAuthTokenRepository(): AuthTokenRepository;

    getCourseRepository(): CourseRepository;
    getCourseLanguageRepository(): CourseLanguageRepository;
    getCourseEnrollmentRepository(): CourseEnrollmentRepository;
    getCardRepository(): CardRepository;

}