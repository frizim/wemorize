import postgres, { Row, Sql } from "postgres";
import { Config } from "../../schema/config";
import { StorageProvider } from "../provider";
import fs from "node:fs";
import { AuthTokenRepository, SessionRepository, UserRepository } from "../users";
import { PgAuthTokenRepository, PgSessionRepository, PgUserRepository } from "./pg_users";

export class PgStorageProvider implements StorageProvider {

    private pool?: Sql;
    private userRepo?: UserRepository;
    private sessionRepo?: SessionRepository;
    private authTokenRepo?: AuthTokenRepository;

    private static readonly LATEST_VER = 1;

    init(config: Config): void {
        this.pool = postgres({
            ...config.storage,
            prepare: true,
            transform: {
                undefined: null
            }
        });

        this.userRepo = new PgUserRepository(this.pool);
        this.sessionRepo = new PgSessionRepository(this.pool);
        this.authTokenRepo = new PgAuthTokenRepository(this.pool);
    }

    async shutdown(): Promise<void> {
        await this.pool?.end({
            timeout: 20
        });
    }

    async migrate(): Promise<void> {
        const pool = this.pool as Sql;

        await pool`CREATE TABLE IF NOT EXISTS migrations_done(version integer NOT NULL, CONSTRAINT version_pk PRIMARY KEY(version))`;

        const dbVer: number = (await pool`SELECT MAX(version) AS latest FROM migrations_done`.then(res => {
            if(res.length == 0) {
                return 0;
            }
            else {
                return (res[0] as Row).latest;
            }
        })) as number ?? 0;

        if(dbVer >= PgStorageProvider.LATEST_VER) {
            console.log("Database schema is up to date");
            return;
        }

        for(let ver = dbVer + 1; ver <= PgStorageProvider.LATEST_VER; ver++) {
            const migrationFile = fs.readdirSync("./src/storage/postgres/migrations").filter(name => name.startsWith(ver+"_"))[0];
            if(migrationFile) {
                const migration = JSON.parse(fs.readFileSync("./src/storage/postgres/migrations/" + migrationFile).toString("utf8"));
                console.log(`Migration ${ver}: ${migration.description}`);
                await this.pool?.begin(async conn => {
                    for(const task of migration.tasks) {
                        await conn.unsafe(task);
                    }
                    await conn`INSERT INTO migrations_done(version) VALUES(${ver})`;
                });
            }
            else {
                console.error("No migration file found for " + ver);
            }
        }
    }

    getUserRepository(): UserRepository {
        return this.userRepo as UserRepository;
    }

    getSessionRepository(): SessionRepository {
        return this.sessionRepo as SessionRepository;
    }

    getAuthTokenRepository(): AuthTokenRepository {
        return this.authTokenRepo as AuthTokenRepository;
    }
    
}