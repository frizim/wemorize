import { createHash, randomBytes } from "crypto";
import { User } from "./user";

export class Session {

    readonly user: User|null;
    readonly token_hash: Uint8Array;
    readonly expires: Date;
    readonly fingerprint: Uint8Array;
    readonly request_token: string;

    constructor(user: User|null, tokenHash: Uint8Array, expires: Date, fingerprint: Uint8Array, request_token: string) {
        this.user = user;
        this.token_hash = tokenHash;
        this.expires = expires;
        this.fingerprint = fingerprint;
        this.request_token = request_token;
    }

    static createNew(token: string, user: User|null, duration: number, area: string, userAgent: string): Session {
        return new Session(
            user,
            createHash('sha512').update(token, 'hex').digest(),
            new Date(Date.now() + duration * 1000),
            createHash('sha512').update(area + "__" + userAgent).digest(),
            randomBytes(16).toString('hex')
        );
    }

    static tokenFormatValid(token: string): boolean {
        return /^[0-9a-f]{64}$/.test(token);
    }

    isValid(area: string, userAgent: string): boolean {
        return Date.now() < this.expires.getTime()
            && createHash('sha512').update(area + "__" + userAgent).digest().equals(this.fingerprint);
    }

    isAuthenticated(area: string, userAgent: string): boolean {
        return this.isValid(area, userAgent) && this.user != null;
    }

}