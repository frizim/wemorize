import { Schema } from "./schema";

export class Config {

    readonly listen: any;
    readonly baseUrl: string | undefined;
    readonly instanceName: string | undefined;
    readonly enableRegistration: boolean = false;
    readonly db: any;
}

export class ConfigSchema extends Schema<Config> {

    constructor() {
        super({
            type: "object",
            required: ["listen", "baseUrl", "instanceName", "enableRegistration", "db"],
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
                db: {
                    type: "object",
                    required: ["engine", "host", "database", "username"],
                    properties: {
                        engine: {
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