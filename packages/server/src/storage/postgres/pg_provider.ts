import { Config } from "../../schema/config";
import { StorageProvider } from "../provider";
import fs from "node:fs";
import { AuthTokenRepository, SessionRepository, UserRepository } from "../users";
import { AuthTokenTable, PgAuthTokenRepository, PgSessionRepository, PgUserRepository, SessionTable, UserTable } from "./pg_users";
import { CourseEnrollmentRepository } from "../course_users";
import { CourseEnrollmentTable, EnrollmentCardStatsTable, EnrollmentDailyStatsTable, PgCourseEnrollmentRepository } from "./pg_course_users";
import { CardRepository, CourseLanguageRepository, CourseRepository } from "../courses";
import { CardTable, CourseLanguageTable, CourseTable, PgCardRepository, PgCourseLanguageRepository, PgCourseRepository } from "./pg_courses";
import { Pool, types } from "pg";
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

    private readonly pool: Pool;
    private readonly db: Kysely<WemorizeDatabase>;
    private readonly userRepo: UserRepository;
    private readonly sessionRepo: SessionRepository;
    private readonly authTokenRepo: AuthTokenRepository;

    private readonly courseRepo: CourseRepository;
    private readonly courseLanguageRepo: CourseLanguageRepository;
    private readonly courseEnrollmentRepo: CourseEnrollmentRepository;
    private readonly cardRepo: CardRepository;

    private static readonly LATEST_VER = 3;
    private static readonly MIGRATION_PROPERTIES = /^--([A-Z]+)=(.+)$/;

    public constructor(config: Config, logger: Logger) {
        this.pool = new Pool({
            ...config.storage,
            user: config.storage?.username
        });

        types.setTypeParser(20, val => {
            return parseInt(val, 10);
        });

        this.db = new Kysely({
            dialect: new PostgresDialect({
                pool: this.pool
            }),
            log(event) {
                if(event.level == "query") {
                    logger.debug("Running query: %s", event.query.sql);
                }
                else {
                    logger.error("DB operation failed: %o", event.error);
                }
            }
        });

        this.userRepo = new PgUserRepository(this.db);
        this.sessionRepo = new PgSessionRepository(this.db);
        this.authTokenRepo = new PgAuthTokenRepository(this.db);

        this.courseRepo = new PgCourseRepository(this.db);
        this.courseLanguageRepo = new PgCourseLanguageRepository(this.db);
        this.courseEnrollmentRepo = new PgCourseEnrollmentRepository(this.db);
        this.cardRepo = new PgCardRepository(this.db);
    }

    async shutdown(): Promise<void> {
        await this.db.destroy();
    }

    async migrate(logger: Logger): Promise<void> {
        const pool = this.pool;

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
                const conn = await this.pool.connect();
                await conn.query("BEGIN");
                try {
                    const migration = fs.readFileSync("./src/storage/postgres/migrations/" + migrationFile).toString();
                    const properties = migration.matchAll(PgStorageProvider.MIGRATION_PROPERTIES);
                    let desc = "";
                    for(const match of properties) {
                        if(match[0] == "DESC") {
                            desc = match[1] ?? "";
                        }
                    }

                    logger.info("Running Migration %d: %s", ver, desc);
                    await conn.query(migration);
                } catch(err) {
                    logger.error("Migration %d failed: %o", ver, err);
                    await conn.query("ROLLBACK");
                    return;
                }
                await conn.query("INSERT INTO migrations_done(version) VALUES($1)", [ver]);
                await conn.query("COMMIT");
            }
            else {
                logger.error("No migration file found for %o", ver);
                return;
            }
        }
    }

    getUserRepository(): UserRepository {
        return this.userRepo;
    }

    getSessionRepository(): SessionRepository {
        return this.sessionRepo;
    }

    getAuthTokenRepository(): AuthTokenRepository {
        return this.authTokenRepo;
    }

    getCourseRepository(): CourseRepository {
        return this.courseRepo;
    }

    getCourseLanguageRepository(): CourseLanguageRepository {
        return this.courseLanguageRepo;
    }

    getCourseEnrollmentRepository(): CourseEnrollmentRepository {
        return this.courseEnrollmentRepo;
    }
    
    getCardRepository(): CardRepository {
        return this.cardRepo;
    }
    
}