import postgres from "postgres";
import { User } from "../../model/user";
import { AuthTokenRepository, SessionRepository, UserRepository } from "../users";
import { DataNotFoundError } from "../repository";
import { Session } from "../../model/session";
import { AuthToken } from "../../model/auth_token";

class PgUserRepository implements UserRepository {

    private readonly pool: postgres.Sql;

    constructor(pool: postgres.Sql) {
        this.pool = pool;
    }

    async getById(id: number): Promise<User> {
        return this.pool<User[]>`SELECT id,name,email,new_email,password_hash,last_login,registered,role,state FROM users WHERE id = ${id}`
        .then(result => {
            if(result.length == 0) {
                return Promise.reject(new DataNotFoundError("user"));
            }

            return result[0];
        }, err => {
            return Promise.reject(new Error(err));
        }) as Promise<User>;
    }

    async getByEmail(email: string): Promise<User> {
        return this.pool<User[]>`SELECT id,name,email,new_email,password_hash,last_login,registered,role,state FROM users WHERE email = ${email}`
        .then(result => {
            if(result.length == 0) {
                return Promise.reject(new DataNotFoundError("user"));
            }

            return result[0];
        }, err => {
            return Promise.reject(new Error(err));
        }) as Promise<User>;
    }

    async create(item: User): Promise<number> {
        return this.pool`INSERT INTO users(name, email, password_hash, role, state)
            VALUES(${item.name}, ${item.email}, ${item.password_hash}, ${item.role}, ${item.state}) RETURNING id`
            .then(result => {
                return result[0];
            }) as Promise<number>;
    }

    async update(item: User): Promise<boolean> {
        return this.pool`UPDATE users SET ${this.pool(item)} WHERE id = ${item.id}`
        .then(result => {
            return Promise.resolve(result.count > 0);
        });
    }

    async delete(id: number): Promise<boolean> {
        return this.pool`DELETE FROM users WHERE id=${id}`
        .then(result => {
            return Promise.resolve(result.count > 0);
        });
    }
    
}

class PgSessionRepository implements SessionRepository {

    private readonly pool: postgres.Sql;

    constructor(pool: postgres.Sql) {
        this.pool = pool;
    }

    async getById(id: Uint8Array): Promise<Session> {
        return this.pool`SELECT user_id,name,email,new_email,password_hash,last_login,registered,role,state,
        token_hash, expires, fingerprint, request_token FROM sessions LEFT JOIN users ON sessions.user_id = users.id
        WHERE token_hash = ${id} AND expires > ${Date.now()}`
            .then(rows => {
                const row = rows.length > 0 ? rows[0] : null;
                if(!row) {
                    return Promise.reject(new DataNotFoundError("session"));
                }

                let user: User|null = null;
                if(row.user_id) {
                    user = {
                        id: row.user_id,
                        name: row.name,
                        email: row.email,
                        password_hash: row.password_hash,
                        registered: row.registered,
                        role: row.role,
                        state: row.state
                    };
                }
                
                return {
                    user: user,
                    tokenHash: row.token_hash,
                    expires: row.expires,
                    fingerprint: row.fingerprint,
                    request_token: row.request_token
                } as Session;
            }, (err: Error) => {
                return Promise.reject(err);
            });
    }

    async create(item: Session): Promise<Uint8Array> {
        return this.pool`INSERT INTO sessions(token_hash, user_id, expires, fingerprint, request_token) VALUES(${item.tokenHash}, ${item.user ? item.user.id : null}, ${item.expires}, ${item.fingerprint}, ${item.request_token})`
            .then(res => {
                if(res.count > 0) {
                    return item.tokenHash;
                }
                return Promise.reject(new Error("No session created"));
            });
    }

    async delete(id: Uint8Array): Promise<boolean> {
        return this.pool`DELETE FROM sessions WHERE token_hash=${id}`
        .then(res => {
            return res.count > 0;
        });
    }
    
}

class PgAuthTokenRepository implements AuthTokenRepository {

    private readonly pool: postgres.Sql;

    constructor(pool: postgres.Sql) {
        this.pool = pool;
    }

    async getById(id: Uint8Array): Promise<AuthToken> {
        return this.pool`SELECT user_id,name,email,new_email,password_hash,last_login,registered,role,state,
            type,expires FROM auth_tokens
            JOIN users ON users.id = auth_tokens.user_id
            WHERE token = ${id} AND expires > ${Date.now()}`
            .then(rows => {
                const row = rows.length > 0 ? rows[0] : null;
                if(!row) {
                    return Promise.reject(new DataNotFoundError("auth token"));
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
                    state: row.state
                };

                const token: AuthToken = {
                    user: user,
                    expires: row.expires,
                    type: row.type,
                    token_hash: id
                };

                return token;
            });
    }

    async create(item: AuthToken): Promise<Uint8Array> {
        return this.pool`INSERT INTO auth_tokens(token_hash,user_id,type,expires)
            VALUES(${item.token_hash},${item.user.id}, ${item.type}, ${item.expires})`
        .then(res => {
            return Promise.resolve(item.token_hash);
        });
    }

    async delete(id: Uint8Array): Promise<boolean> {
        return this.pool`DELETE FROM auth_tokens WHERE token_hash=${id}`
        .then(res => {
            return Promise.resolve(res.count > 0);
        });
    }
    
}

export { PgUserRepository, PgSessionRepository, PgAuthTokenRepository }