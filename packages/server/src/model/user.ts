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
    new_email?: string|null;
    password_hash: string;
    readonly last_login?: Date|null;
    readonly registered: Date;
    role: Role;
    state: State;
    avatar_id?: string|null;

}

export {
    Role, State
}