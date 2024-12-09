import { User } from "./user";

enum AuthTokenType {
    password_reset,
    email_verify
}

interface AuthToken {
    readonly user: User;
    readonly type: AuthTokenType;
    readonly expires: EpochTimeStamp;
    readonly token_hash: Uint8Array;
}

export {
    AuthTokenType, type AuthToken
}