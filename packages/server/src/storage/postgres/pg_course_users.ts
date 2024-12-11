import { CourseEnrollment, CourseUserStatistics, DailyStatistics } from "packages/common/src/model/course_user";
import { CourseEnrollmentRepository, CourseUserStatisticsRepository } from "../course_users";
import { Profile } from "packages/common/src/model/profile";
import { Course, CourseLanguage } from "packages/common/src/model/course";
import { WemorizeDatabase } from "./pg_provider";
import { Generated, GeneratedAlways, Kysely, sql } from "kysely";

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
    card_id: number,
    last_attempt: Generated<Date>,
    correct: Generated<number>,
    wrong: Generated<number>
}

export class PgCourseEnrollmentRepository implements CourseEnrollmentRepository {

    private readonly db: Kysely<WemorizeDatabase>;

    constructor(db: Kysely<WemorizeDatabase>) {
        this.db = db;
    }

    async getByUser(user: Profile): Promise<CourseEnrollment[]> {
        const rows = await this.db.selectFrom("course_enrollments as ce")
            .innerJoin("course_languages", "ce.course_lang_id", "course_languages.id")
            .innerJoin("courses", "courses.id", "course_languages.course_id")
            .leftJoin("users", "courses.creator_id", "users.id")
            .selectAll(["ce", "course_languages", "courses"])
            .select(["users.id as creator_id", "users.name as creator_name", "users.avatar_id as creator_avatar", "course_lang_id as clid"])
            .select((eb) => eb.selectFrom("cards")
                .select(({fn}) => fn.count<number>("cards.id").as("count"))
                .whereRef("course_lang_id", "=", "ce.course_lang_id")
                .$narrowType<{count: number}>()
                .as("card_count")
            )
            .select((eb) => eb.selectFrom("enrollment_card_stats")
                .select(({fn}) => fn.count<number>("enrollment_card_stats.card_id").as("learned"))
                .innerJoin("course_enrollments", "course_enrollments.id", "enrollment_card_stats.enrollment_id")
                .whereRef("course_enrollments.id", "=", "ce.id")
                .where(sql<number>`correct - wrong`, '<', 4)
                .$narrowType<{learned: number}>()
                .as("learned")
            )
            .where("ce.user_id", "=", user.id)
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
                };

                const stats: CourseUserStatistics = {
                    course,
                    progress: row.learned && row.card_count && row.card_count > 0 ? Math.round((row.learned / row.card_count) * 100) : 0,
                    rank: 1,
                    cards_per_day: [8]
                }

                const data: CourseEnrollment = {
                    id: row.id,
                    course_language: course_lang,
                    course_stats: stats,
                    daily_goal: row.daily_goal,
                    enrolled: row.enrolled,
                    reminder: row.reminder
                };

                res.push(data);
            }

            return res;
    }

    async create(item: CourseEnrollment): Promise<number> {
        if(item.user?.id) {
            return (await this.db.insertInto("course_enrollments")
            .values({
                user_id: item.user.id,
                course_lang_id: item.course_language.id,
                daily_goal: item.daily_goal,
                reminder: item.reminder
            })
            .returning("id")
            .executeTakeFirstOrThrow(() => new Error("Could not insert course enrollment"))).id;
        }

        throw new Error("Missing user profile in course enrollment");
    }

    update(item: CourseEnrollment): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    delete(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    
}

export class PgCourseUserStatisticsRepository implements CourseUserStatisticsRepository {

    private readonly db: Kysely<WemorizeDatabase>;

    constructor(db: Kysely<WemorizeDatabase>) {
        this.db = db;
    }

    create(item: CourseUserStatistics): Promise<number> {
        throw new Error("NYI");
    }

    async getDaily(enrollment_id: number, limit = 5): Promise<DailyStatistics[]> {
        const rows = await this.db.selectFrom("enrollment_daily_stats")
            .select(["date", "goal_met", "correct", "wrong"])
            .where("enrollment_id", "=", enrollment_id)
            .orderBy("date desc")
            .limit(limit)
            .execute();
        
        const res = [];
        for(const row of rows) {
            res.push(row as DailyStatistics);
        }

        return res;
    }

    update?(item: CourseUserStatistics): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    delete(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    
}