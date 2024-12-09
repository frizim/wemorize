import { User } from "../model/user";
import { Repository } from "./repository";
import { CourseEnrollment, CourseUserStatistics } from "packages/common/src/model/course_user";

export interface CourseEnrollmentRepository extends Repository<CourseEnrollment, number> {
    getByUser(user: User): Promise<CourseEnrollment[]>;
}

export type CourseUserStatisticsRepository = Repository<CourseUserStatistics, CourseEnrollment>;