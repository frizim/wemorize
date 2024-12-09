import { AuthToken } from "../model/auth_token";
import { Session } from "../model/session";
import { User } from "../model/user";
import { Repository } from "./repository";

//Key is an auto-generated integer
export interface UserRepository extends Repository<User, number> {
    getById(id: number): Promise<User>;
    getByEmail(email: string): Promise<User>;

    update(user: User): Promise<boolean>;
}

//Key is a hash in binary form
export interface SessionRepository extends Repository<Session, Uint8Array> {
    getById(id: Uint8Array): Promise<Session>;
}

export interface AuthTokenRepository extends Repository<AuthToken, Uint8Array> {
    getById(id: Uint8Array): Promise<AuthToken>;
}