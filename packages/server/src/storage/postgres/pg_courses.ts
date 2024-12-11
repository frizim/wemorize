import { AnswerMode, Course, CourseLanguage } from "packages/common/src/model/course";
import { CardRepository, CourseLanguageRepository, CourseRepository } from "../courses";
import { DataNotFoundError } from "../repository";
import { Profile } from "packages/common/src/model/profile";
import { Generated, GeneratedAlways, Kysely, SelectQueryBuilder, sql } from "kysely";
import { WemorizeDatabase } from "./pg_provider";
import { Card, CardQuestion, SelftestCardAnswer } from "../../model/card";

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
    next_id: number|null,
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
            if(row.user_id && row.user_name) {
                profile = {
                    id: row.user_id,
                    name: row.user_name,
                    avatar_id: row.user_avatar ?? null
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
            .set({
                last_update: item.last_update,
                creator_id: item.creator?.id,
                answer_mode: item.answer_mode,
                flip: item.flip,
                randomize: item.randomize,
                show_first: item.show_first
            })
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

    async match(namePrefix: string, lang: string, max_results = 100, offset = 100): Promise<CourseLanguage[]> {
        return this.db.selectFrom("course_languages")
            .selectAll()
            .where("language", "=", lang)
            .where("name", "ilike", namePrefix + "%")
            .limit(max_results).offset(offset)
            .execute();
    }

    async getById(id: number): Promise<CourseLanguage> {
        return this.db.selectFrom("course_languages")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirstOrThrow(() => new DataNotFoundError("course_language"));
    }

    async getAllByCourse(courseId: number): Promise<CourseLanguage[]> {
        return this.db.selectFrom("course_languages")
            .selectAll()
            .where("course_id", "=", courseId)
            .execute();
    }

    async create(item: CourseLanguage): Promise<number> {
        return (await this.db.insertInto("course_languages")
            .values({
                course_id: item.course!.id,
                name: item.name,
                description: item.description,
                language: item.language
            }).returning("id").executeTakeFirstOrThrow(() => new Error("course_languages"))).id;
    }

    async update(item: CourseLanguage): Promise<boolean> {
        return ((await this.db.updateTable("course_languages")
            .set(item)
            .where("id", "=", item.id)
            .execute())[0]?.numUpdatedRows ?? 0) > 0;
    }

    async delete(id: number): Promise<boolean> {
        return ((await this.db.deleteFrom("course_languages")
            .where("id", "=", id)
            .execute())[0]?.numDeletedRows ?? 0) > 0;
    }
    
}

export class PgCardRepository implements CardRepository {

    private readonly db: Kysely<WemorizeDatabase>;

    constructor(db: Kysely<WemorizeDatabase>) {
        this.db = db;
    }

    async create(item: Card): Promise<number> {
        return await this.db.transaction().execute(async tx => {
            await tx.executeQuery(sql<void>`SET CONSTRAINTS ALL DEFERRED`.compile(tx));

            const id = (await tx.insertInto("cards").values({
                course_lang_id: item.course_language.id,
                next_id: null,
                module: item.module,
                value: item.value,
                question_content: item.question.content,
                answer_content: item.answer.content
            }).returning("id").executeTakeFirstOrThrow()).id;

            await tx.updateTable("cards").set({
                next_id: id
            }).where("next_id", "is", null).where("module", "=", item.module).where("id", "!=", id).execute();

            return id;
        });
    }

    private getCard(): SelectQueryBuilder<WemorizeDatabase, "course_languages" | "cards", { id: number; } & Omit<CardTable, "id"> & Omit<CourseLanguageTable, "id">> {
        return this.db.selectFrom("cards")
        .innerJoin("course_languages", "cards.course_lang_id", "course_languages.id")
        .selectAll("cards")
        .select(["course_languages.course_id", "course_languages.language", "course_languages.name", "course_languages.description"]);
    }

    private createCard(row: {id: number} & Omit<CardTable, "id"> & Omit<CourseLanguageTable, "id">): Card {
        return {
            id: row.id,
            course_language: {
                id: row.course_lang_id,
                language: row.language,
                name: row.name,
                description: row.description
            },
            module: row.module,
            next_id: row.next_id,
            value: row.value,
            answer: new SelftestCardAnswer({content: row.answer_content}), // TODO
            question: new CardQuestion({content: row.question_content})
        };
    }

    async getById(id: number): Promise<Card> {
        const row = await this.getCard()
            .where("cards.id", "=", id).executeTakeFirstOrThrow(() => new DataNotFoundError("card"));
        return this.createCard(row);
    }

    async getAllByCourseLanguage(courseLangId: number): Promise<Map<number, Map<number | null,Card>>> {
        const rows = await this.getCard()
            .where("course_lang_id", "=", courseLangId)
            .orderBy("module", "asc")
            .execute();
        const res = new Map<number, Map<number|null, Card>>();
        for(const row of rows) {
            let m = res.get(row.module);
            if(!m) {
                m = new Map();
                res.set(row.module, m);
            }
            const card = this.createCard(row);
            m.set(card.next_id ?? null, card);
        }
        return res;
    }

    async update(item: Card): Promise<boolean> {
        return ((await this.db.updateTable("cards")
            .set({
                module: item.module,
                value: item.value,
                question_content: item.question.content,
                answer_content: item.answer.content
            }).where("id", "=", item.id).execute())[0]?.numUpdatedRows ?? 0) > 0;
    }

    async updatePosition(item: Card, prevCardId: number, oldNextId: number): Promise<boolean> {
        return await this.db.transaction().execute(async (tx) => {
            await tx.executeQuery(sql<void>`SET CONSTRAINTS ALL DEFERRED`.compile(tx));
            await tx.updateTable("cards")
            .set({
                next_id: oldNextId
            }).where("id", "=", eb => eb.selectFrom("cards")
                .select("id")
                .where("next_id", "=", item.id)
                .where("module", "=", item.module)
            )
            .where("module", "=", item.module).execute();
            
            await tx.updateTable("cards")
            .set({
                next_id: item.next_id
            }).where("id", "=", item.id)
            .where("module", "=", item.module).execute();
            
            await tx.updateTable("cards")
            .set({
                next_id: item.id
            }).where("id", "=", prevCardId)
            .where("module", "=", item.module).execute(); 
        }).then(r => true).catch((e: unknown) => false);
    }

    async delete(id: number): Promise<boolean> {
        return await this.db.transaction().execute(async tx => {
            await tx.executeQuery(sql<void>`SET CONSTRAINTS ALL DEFERRED`.compile(tx));
            await tx.updateTable("cards")
            .set({
                next_id: eb => eb.selectFrom("cards").select("next_id").where("id", "=", id)
            }).where("next_id", "=", id).execute();
            await tx.deleteFrom("cards")
                .where("id", "=", id).execute();
        }).then(r => true).catch((e: unknown) => false);
    }
    
}