import { createHash } from "node:crypto";
import { User } from "./user";

enum AuthTokenType {
    password_reset = "password_reset",
    email_verify = "email_verify"
}

class AuthToken {
    readonly user: User;
    readonly type: AuthTokenType;
    readonly expires: Date;
    readonly token_hash: Uint8Array;

    constructor(user: User, type: AuthTokenType, duration: number, token: string) {
        this.user = user;
        this.type = type;
        this.expires = new Date(Date.now() + duration * 1000);
        this.token_hash = createHash('sha512').update(token, 'hex').digest();
    }
}

export {
    AuthTokenType, AuthToken
}