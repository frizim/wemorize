import { Config } from "../schema/config";
import { AuthTokenRepository, SessionRepository, UserRepository } from "./users";
import { Logger } from "../util/logger";

export interface StorageProvider {

    init(config: Config): void;
    migrate(logger: Logger): Promise<void>;
    shutdown(): Promise<void>;

    getUserRepository(): UserRepository;
    getSessionRepository(): SessionRepository;
    getAuthTokenRepository(): AuthTokenRepository;

}