import { AuthToken } from "../model/auth_token";
import { Session } from "../model/session";
import { User } from "../model/user";
import { Repository } from "./repository";

//Key is an auto-generated integer
export interface UserRepository extends Repository<User, number> {
    getByEmail(email: string): Promise<User>;
}

//Key is a hash in binary form
export type SessionRepository = Repository<Session, Uint8Array>;

export type AuthTokenRepository = Repository<AuthToken, Uint8Array>;