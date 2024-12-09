import { AnswerMode, Course, CourseLanguage } from "packages/common/src/model/course";
import { CourseLanguageRepository, CourseRepository } from "../courses";
import { DataNotFoundError } from "../repository";
import { Profile } from "packages/common/src/model/profile";
import { Generated, GeneratedAlways, Kysely } from "kysely";
import { WemorizeDatabase } from "./pg_provider";

export interface CourseTable {
    id: GeneratedAlways<number>,
    creator_id: number|null,
    clicks: Generated<number>,
    created: Generated<Date>,
    last_update: Generated<Date>,
    answer_mode: AnswerMode,
    flip: boolean,
    randomize: boolean,
    show_first: boolean
}

export interface CourseLanguageTable {
    id: GeneratedAlways<number>,
    course_id: number,
    name: string,
    description: string,
    language: string
}

export interface CardTable {
    id: GeneratedAlways<number>,
    course_lang_id: number,
    module: number,
    index: number,
    value: number,
    question_content: string,
    answer_content: string
}

export class PgCourseRepository implements CourseRepository {

    private readonly db: Kysely<WemorizeDatabase>;

    constructor(db: Kysely<WemorizeDatabase>) {
        this.db = db;
    }

    async getById(id: number): Promise<Course> {
        const row = await this.db.selectFrom("courses")
            .leftJoin("users", "courses.creator_id", "users.id")
            .selectAll("courses")
            .select(["users.id as user_id", "users.name as user_name", "users.avatar_id as user_avatar"])
            .where("courses.id", "=", id)
            .executeTakeFirstOrThrow(() => new DataNotFoundError("course"));

            let profile: Profile|null = null;
            if(row.user_id) {
                profile = {
                    id: row.user_id,
                    name: row.user_name!,
                    avatar_id: row.user_avatar!
                };
            }
            return {
                id: id,
                creator: profile,
                clicks: row.clicks,
                created: row.created,
                last_update: row.last_update,
                answer_mode: row.answer_mode,
                flip: row.flip,
                randomize: row.randomize,
                show_first: row.show_first
            };
    }

    async create(item: Course): Promise<number> {
        return (await this.db.insertInto("courses")
            .values({
                ...item,
                creator_id: item.creator?.id ?? null
            })
            .returning("id")
            .executeTakeFirstOrThrow(() => new Error("Could not create course"))).id;
    }

    async update(item: Course): Promise<boolean> {
        return ((await this.db.updateTable("courses")
            .set(item)
            .where("id", "=", item.id)
            .execute())[0]?.numUpdatedRows ?? 0) > 0;
    }

    async delete(id: number): Promise<boolean> {
        return ((await this.db.deleteFrom("courses")
            .where("id", "=", id)
            .execute())[0]?.numDeletedRows ?? 0) > 0;
    }
}

export class PgCourseLanguageRepository implements CourseLanguageRepository {

    private readonly db: Kysely<WemorizeDatabase>;

    constructor(db: Kysely<WemorizeDatabase>) {
        this.db = db;
    }

    async match(namePrefix: string, lang: string): Promise<CourseLanguage[]> {
        return this.db.selectFrom("course_languages")
            .selectAll()
            .where("language", "=", lang)
            .where("name", "ilike", namePrefix + "%")
            .execute();
    }

    getById(id: number): Promise<CourseLanguage> {
        throw new Error("Method not implemented.");
    }

    create(item: CourseLanguage): Promise<number> {
        throw new Error("Method not implemented.");
    }

    update(item: CourseLanguage): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

    delete(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    
}
