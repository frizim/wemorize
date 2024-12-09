import { createHash, randomBytes } from "crypto";
import { User } from "./user";

export class Session {

    readonly user: User|null;
    readonly tokenHash: Uint8Array;
    readonly expires: EpochTimeStamp;
    readonly fingerprint: Uint8Array;
    readonly request_token: string;

    constructor(token: string, user: User|null, expires: EpochTimeStamp, area: string, userAgent: string) {
        this.user = user;
        this.expires = expires;
        this.tokenHash = createHash('sha512').update(token, 'hex').digest();
        this.fingerprint = createHash('sha512').update(area + "__" + userAgent).digest();
        this.request_token = randomBytes(16).toString('hex');
    }

    static tokenFormatValid(token: string): boolean {
        return /^[0-9a-f]{64}$/.test(token);
    }

    isValid(area: string, userAgent: string): boolean {
        return Date.now() < this.expires
            && createHash('sha512').update(area + "__" + userAgent).digest().equals(this.fingerprint);
    }

    isAuthenticated(area: string, userAgent: string): boolean {
        return this.isValid(area, userAgent) && this.user != null;
    }

}