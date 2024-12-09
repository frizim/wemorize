import { Profile } from "@wemorize/common/src/model/profile";

enum Role {
    user = "user",
    contributor = "contributor",
    moderator = "moderator",
    admin = "admin"
}

enum State {
    active = "active",
    unverified = "unverified",
    blocked = "blocked",
    deletion_pending = "deletion_pending"
}

export interface User extends Profile {

    readonly id: number;
    name: string;
    email: string;
    new_email?: string;
    password_hash: string;
    readonly last_login?: EpochTimeStamp;
    readonly registered: EpochTimeStamp;
    role: Role;
    state: State;
}

export {
    Role, State
}