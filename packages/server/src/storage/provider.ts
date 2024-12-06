import { Config } from "../schema/config";

export interface StorageProvider {

    init(config: Config): void;
    migrate(): Promise<void>;
    shutdown(): Promise<void>;

}