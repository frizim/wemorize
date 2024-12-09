import { Schema } from "./schema";

interface ListenConfig {
    host: string,
    port: number
}

interface DatabaseConfig {
    db: string,
    host: string,
    database: string,
    username: string,
    password?: string
}

interface SmtpConfig {
    sender: string,
    host: string,
    port: number,
    secure: boolean,
    auth: {
        user: string,
        pass: string
    }
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
    readonly smtp: SmtpConfig | undefined;
}

export class ConfigSchema extends Schema<Config> {

    constructor() {
        super({
            type: "object",
            required: ["listen", "baseUrl", "instanceName", "enableRegistration", "storage", "smtp"],
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
                },
                cookie: {
                    type: "object",
                    required: ["secure", "domain", "path"],
                    properties: {
                        secure: {
                            type: "boolean"
                        },
                        domain: {
                            type: "string"
                        },
                        path: {
                            type: "string"
                        }
                    }
                },
                smtp: {
                    type: "object",
                    required: ["sender", "host", "port", "secure", "auth"],
                    properties: {
                        sender: {
                            type: "string"
                        },
                        host: {
                            type: "string"
                        },
                        port: {
                            type: "number"
                        },
                        secure: {
                            type: "boolean"
                        },
                        auth: {
                            type: "object",
                            required: ["user", "pass"],
                            properties: {
                                user: {
                                    type: "string"
                                },
                                pass: {
                                    type: "string"
                                }
                            }
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