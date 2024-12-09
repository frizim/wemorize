import { Config } from "../../schema/config";
import { StorageProvider } from "../provider";
import fs from "node:fs";
import { AuthTokenRepository, SessionRepository, UserRepository } from "../users";
import { AuthTokenTable, PgAuthTokenRepository, PgSessionRepository, PgUserRepository, SessionTable, UserTable } from "./pg_users";
import { CourseEnrollmentRepository } from "../course_users";
import { CourseEnrollmentTable, EnrollmentCardStatsTable, EnrollmentDailyStatsTable, PgCourseEnrollmentRepository } from "./pg_course_users";
import { CourseLanguageRepository } from "../courses";
import { CardTable, CourseLanguageTable, CourseTable, PgCourseLanguageRepository } from "./pg_courses";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { Logger } from "../../util/logger";

export interface WemorizeDatabase {
    users: UserTable,
    sessions: SessionTable,
    auth_tokens: AuthTokenTable,

    courses: CourseTable,
    course_languages: CourseLanguageTable,
    cards: CardTable,

    course_enrollments: CourseEnrollmentTable,
    enrollment_daily_stats: EnrollmentDailyStatsTable,
    enrollment_card_stats: EnrollmentCardStatsTable
}

export class PgStorageProvider implements StorageProvider {

    private pool?: Pool;
    private db?: Kysely<WemorizeDatabase>;
    private userRepo?: UserRepository;
    private sessionRepo?: SessionRepository;
    private authTokenRepo?: AuthTokenRepository;

    private courseLanguageRepo?: CourseLanguageRepository;
    private courseEnrollmentRepo?: CourseEnrollmentRepository;

    private static readonly LATEST_VER = 3;

    init(config: Config): void {
        this.pool = new Pool({
            ...config.storage,
            user: config.storage?.username
        });

        this.db = new Kysely({
            dialect: new PostgresDialect({
                pool: this.pool
            })
        });

        this.userRepo = new PgUserRepository(this.db);
        this.sessionRepo = new PgSessionRepository(this.db);
        this.authTokenRepo = new PgAuthTokenRepository(this.db);

        this.courseLanguageRepo = new PgCourseLanguageRepository(this.db);
        this.courseEnrollmentRepo = new PgCourseEnrollmentRepository(this.db);
    }

    async shutdown(): Promise<void> {
        await this.db?.destroy();
    }

    async migrate(logger: Logger): Promise<void> {
        const pool = this.pool!;

        await pool.query("CREATE TABLE IF NOT EXISTS migrations_done(version integer NOT NULL, CONSTRAINT version_pk PRIMARY KEY(version))");

        const dbVer: number = (await pool.query("SELECT MAX(version) AS latest FROM migrations_done").then(res => {
            if(res.rowCount == 0) {
                return 0;
            }
            else {
                return (res.rows[0] as {latest: number}).latest;
            }
        }));

        if(dbVer >= PgStorageProvider.LATEST_VER) {
            logger.info("Database schema is up to date");
            return;
        }

        for(let ver = dbVer + 1; ver <= PgStorageProvider.LATEST_VER; ver++) {
            const migrationFile = fs.readdirSync("./src/storage/postgres/migrations").find(name => name.startsWith(ver+"_"));
            if(migrationFile) {
                logger.info("Migration %d", ver);
                const conn = await this.pool?.connect();
                await conn?.query("BEGIN");
                try {
                    await conn?.query(fs.readFileSync("./src/storage/postgres/migrations/" + migrationFile).toString());
                } catch(err) {
                    logger.error("Migration %d failed: %o", ver, err);
                    await conn?.query("ROLLBACK");
                    return;
                }
                await conn?.query("INSERT INTO migrations_done(version) VALUES($1)", [ver]);
                await conn?.query("COMMIT");
            }
            else {
                logger.error("No migration file found for %o", ver);
                return;
            }
        }
    }

    getUserRepository(): UserRepository {
        return this.userRepo!;
    }

    getSessionRepository(): SessionRepository {
        return this.sessionRepo!;
    }

    getAuthTokenRepository(): AuthTokenRepository {
        return this.authTokenRepo!;
    }

    getCourseLanguageRepository(): CourseLanguageRepository {
        return this.courseLanguageRepo!;
    }

    getCourseEnrollmentRepository(): CourseEnrollmentRepository {
        return this.courseEnrollmentRepo!;
    }
    
}