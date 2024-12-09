import { Role, State, User } from "../../model/user";
import { AuthTokenRepository, SessionRepository, UserRepository } from "../users";
import { DataNotFoundError } from "../repository";
import { Session } from "../../model/session";
import { AuthToken, AuthTokenType } from "../../model/auth_token";
import {Generated, GeneratedAlways, Kysely, sql} from "kysely";
import { WemorizeDatabase } from "./pg_provider";

export interface UserTable {
    id: GeneratedAlways<number>;
    name: string,
    email: string,
    new_email: string|null,
    password_hash: string,
    last_login: Date|null,
    registered: Generated<Date>,
    role: Generated<Role>,
    state: Generated<State>,
    avatar_id: string|null
};

export interface SessionTable {
    token_hash: Uint8Array,
    user_id: number|null,
    expires: Date,
    fingerprint: Uint8Array,
    request_token: string
};

export interface AuthTokenTable {
    token_hash: Uint8Array,
    user_id: number,
    type: AuthTokenType,
    expires: Date
};

class PgUserRepository implements UserRepository {

    private readonly db: Kysely<WemorizeDatabase>;

    constructor(db: Kysely<WemorizeDatabase>) {
        this.db = db;
    }

    async getById(id: number): Promise<User> {
        return await this.db.selectFrom("users")
            .selectAll()
            .where("id", "=", id)
            .executeTakeFirstOrThrow(() => new DataNotFoundError("user"));
    }

    async getByEmail(email: string): Promise<User> {
        return await this.db.selectFrom("users")
            .selectAll()
            .where("email", "=", email)
            .executeTakeFirstOrThrow(() => new DataNotFoundError("user"));
    }

    async create(item: User): Promise<number> {
        return (await this.db.insertInto("users")
            .values({
                name: item.name,
                email: item.email,
                password_hash: item.password_hash,
                state: item.state
            })
            .returning("id")
            .executeTakeFirstOrThrow(() => new DataNotFoundError("user"))).id;
    }

    async update(item: User): Promise<boolean> {
        return ((await this.db.updateTable("users")
            .set(item)
            .where("id", "=", item.id)
            .execute())[0]?.numChangedRows ?? 0) > 0;
    }

    async delete(id: number): Promise<boolean> {
        return ((await this.db.deleteFrom("users")
            .where("id", "=", id)
            .execute())[0]?.numDeletedRows ?? 0) > 0;
    }
    
}

class PgSessionRepository implements SessionRepository {

    private readonly db: Kysely<WemorizeDatabase>;

    constructor(db: Kysely<WemorizeDatabase>) {
        this.db = db;
    }

    async getById(id: Uint8Array): Promise<Session> {
        const row = await this.db.selectFrom("sessions")
            .leftJoin("users", "sessions.user_id", "users.id")
            .selectAll()
            .where("token_hash", "=", id)
            .where("expires", ">", sql<Date>`(CURRENT_TIMESTAMP AT TIME ZONE 'utc')`)
            .executeTakeFirstOrThrow(() => new DataNotFoundError("session"));

        let user: User|null = null;
        if(row.user_id) {
            user = {
                id: row.user_id,
                name: row.name!,
                email: row.email!,
                password_hash: row.password_hash!,
                registered: row.registered!,
                role: row.role!,
                state: row.state!,
                avatar_id: row.avatar_id
            };
        }

        return new Session(
            user,
            row.token_hash,
            row.expires,
            row.fingerprint,
            row.request_token
        );
    }

    async create(item: Session): Promise<Uint8Array> {
        return ((
            await this.db.insertInto("sessions")
                .values({
                    token_hash: item.token_hash,
                    user_id: item.user?.id,
                    expires: item.expires,
                    fingerprint: item.fingerprint,
                    request_token: item.request_token
                })
                .execute()
        )[0]?.numInsertedOrUpdatedRows ?? 0) > 0 ? item.token_hash : Promise.reject(new Error("No session created"));
    }

    async delete(id: Uint8Array): Promise<boolean> {
        return (
            (await this.db.deleteFrom("sessions")
                .where("token_hash", "=", id)
                .execute())[0]?.numDeletedRows ?? 0
        ) > 0;
    }
    
}

class PgAuthTokenRepository implements AuthTokenRepository {

    private readonly db: Kysely<WemorizeDatabase>;

    constructor(db: Kysely<WemorizeDatabase>) {
        this.db = db;
    }

    async getById(id: Uint8Array): Promise<AuthToken> {
        const row = await this.db.selectFrom("auth_tokens")
            .innerJoin("users", "auth_tokens.user_id", "users.id")
            .selectAll()
            .where("token_hash", "=", id)
            .executeTakeFirst();

        if(!row) {
            return Promise.reject(new DataNotFoundError("auth_token"));
        }

        const user: User = {
            id: row.user_id,
            name: row.name,
            email: row.email,
            new_email: row.new_email,
            password_hash: row.password_hash,
            last_login: row.last_login,
            registered: row.registered,
            role: row.role,
            state: row.state,
            avatar_id: row.avatar_id
        };

        const token: AuthToken = {
            user: user,
            expires: row.expires,
            type: row.type,
            token_hash: id
        };

        return token;
    }

    async create(item: AuthToken): Promise<Uint8Array> {
        return ((await this.db.insertInto("auth_tokens")
            .values({
                token_hash: item.token_hash,
                user_id: item.user.id,
                type: item.type,
                expires: item.expires
            })
            .execute())[0]?.numInsertedOrUpdatedRows ?? 0) > 0 ? item.token_hash : Promise.reject(new Error("Could not create auth token"));
    }

    async delete(id: Uint8Array): Promise<boolean> {
        return ((await this.db.deleteFrom("auth_tokens")
            .where("token_hash", "=", id)
            .execute())[0]?.numDeletedRows ?? 0) > 0;
    }
    
}

export { PgUserRepository, PgSessionRepository, PgAuthTokenRepository }