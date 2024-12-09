import { Config } from "../schema/config";
import { AuthTokenRepository, SessionRepository, UserRepository } from "./users";

export interface StorageProvider {

    init(config: Config): void;
    migrate(): Promise<void>;
    shutdown(): Promise<void>;

    getUserRepository(): UserRepository;
    getSessionRepository(): SessionRepository;
    getAuthTokenRepository(): AuthTokenRepository;

}