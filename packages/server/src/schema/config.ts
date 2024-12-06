import { Schema } from "./schema";

type ListenConfig = {
    host: string,
    port: number
}

type DatabaseConfig = {
    db: string,
    host: string,
    database: string,
    username: string,
    password?: string
}

export class Config {

    readonly listen: ListenConfig = {
        host: "localhost",
        port: 80
    };
    readonly baseUrl: string = "localhost";
    readonly instanceName: string = "Wemorize";
    readonly enableRegistration: boolean = false;
    readonly storage: DatabaseConfig | undefined;
}

export class ConfigSchema extends Schema<Config> {

    constructor() {
        super({
            type: "object",
            required: ["listen", "baseUrl", "instanceName", "enableRegistration", "storage"],
            properties: {
                listen: {
                    type: "object",
                    required: ["host", "port"],
                    properties: {
                        host: {
                            type: "string"
                        },
                        port: {
                            type: "integer"
                        }
                    }
                },
                baseUrl: {
                    type: "string"
                },
                instanceName: {
                    type: "string"
                },
                enableRegistration: {
                    type: "boolean"
                },
                storage: {
                    type: "object",
                    required: ["provider", "host", "database", "username"],
                    properties: {
                        provider: {
                            type: "string"
                        },
                        host: {
                            type: "string"
                        },
                        database: {
                            type: "string"
                        },
                        username: {
                            type: "string"
                        },
                        password: {
                            type: "string"
                        }
                    }
                }
            }
        });
    }

    makeObject(): Config {
        return new Config();
    }
    
}