import { CourseEnrollment, CourseUserStatistics } from "packages/common/src/model/course_user";
import { CourseEnrollmentRepository, CourseUserStatisticsRepository } from "../course_users";
import { User } from "../../model/user";
import { Profile } from "packages/common/src/model/profile";
import { Course, CourseLanguage } from "packages/common/src/model/course";
import { WemorizeDatabase } from "./pg_provider";
import { Generated, GeneratedAlways, Kysely } from "kysely";

export interface CourseEnrollmentTable {
    id: GeneratedAlways<number>,
    user_id: number,
    course_lang_id: number,
    daily_goal: number,
    reminder: boolean,
    enrolled: Generated<Date>
}

export interface EnrollmentDailyStatsTable {
    enrollment_id: number,
    date: Generated<Date>,
    correct: Generated<number>,
    wrong: Generated<number>,
    goal_met: Generated<boolean>
}

export interface EnrollmentCardStatsTable {
    enrollment_id: number,
    card_it: number,
    last_attempt: Generated<Date>,
    correct: Generated<number>,
    wrong: Generated<number>
}

export class PgCourseEnrollmentRepository implements CourseEnrollmentRepository {

    private readonly db: Kysely<WemorizeDatabase>;

    constructor(db: Kysely<WemorizeDatabase>) {
        this.db = db;
    }

    async getByUser(user: User): Promise<CourseEnrollment[]> {
        const rows = await this.db.selectFrom("course_enrollments")
            .innerJoin("course_languages", "course_enrollments.course_lang_id", "course_languages.id")
            .innerJoin("courses", "courses.id", "course_languages.course_id")
            .leftJoin("users", "courses.creator_id", "users.id")
            .selectAll(["course_enrollments", "course_languages", "courses"])
            .select(["users.id as creator_id", "users.name as creator_name", "users.avatar_id as creator_avatar"])
            .where("course_enrollments.user_id", "=", user.id)
            .execute();

            const res = [];
            for(const row of rows) {

                let creator: Profile|null = null;

                if(row.creator_id) {
                    creator = {
                        id: row.creator_id,
                        name: row.creator_name!,
                        avatar_id: row.creator_avatar
                    };
                }

                const course: Course = {
                    id: row.course_id,
                    creator: creator,
                    clicks: row.clicks,
                    created: row.created,
                    last_update: row.last_update,
                    answer_mode: row.answer_mode,
                    flip: row.flip,
                    randomize: row.randomize,
                    show_first: row.show_first
                };

                const course_lang: CourseLanguage = {
                    id: row.course_lang_id,
                    language: row.language,
                    course: course,
                    name: row.name,
                    description: row.description
                }

                const data: CourseEnrollment = {
                    id: row.id,
                    course_language: course_lang,
                    daily_goal: row.daily_goal,
                    enrolled: row.enrolled,
                    reminder: row.reminder
                };

                res.push(data);
            }

            return res;
    }

    create(item: CourseEnrollment): Promise<number> {
        throw new Error("Method not implemented.");
    }

    update(item: CourseEnrollment): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    delete(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    
}

export class PgCourseUserStatisticsRepository implements CourseUserStatisticsRepository {

    create(item: CourseUserStatistics): Promise<CourseEnrollment> {
        throw new Error("Method not implemented.");
    }

    update?(item: CourseUserStatistics): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    delete(id: CourseEnrollment): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    
}