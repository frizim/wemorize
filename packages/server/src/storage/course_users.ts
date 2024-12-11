import { Profile } from "packages/common/src/model/profile";
import { Repository } from "./repository";
import { CourseEnrollment, CourseUserStatistics } from "packages/common/src/model/course_user";

export interface CourseEnrollmentRepository extends Repository<CourseEnrollment, number> {
    getByUser(user: Profile): Promise<CourseEnrollment[]>;
}

export type CourseUserStatisticsRepository = Repository<CourseUserStatistics, number>;