import { errorCodes, FastifyReply, FastifyRequest } from "fastify";
import { RouteOptions } from "fastify/types/route";
import { timingSafeEqual } from "crypto";
import { Role } from "../model/user";
import { HTTPRequestPart } from "fastify/types/request";

type AdditionalConfig = Record<string, unknown>;
type PresetRouteOptions = Omit<RouteOptions, "handler">;

interface SecureRequest {
    request_token: string;
}

export interface JsonSchema {
    type: string;
    required: string[];
    properties: Record<string, object>;
    "$defs"?: object
}

export class ControllerConfiguration {

    public get(method: string|string[], route: string): PresetRouteOptions {
        return {
            method: method,
            url: route
        };
    }

}

export abstract class ControllerConfigurationDecorator extends ControllerConfiguration {

    private readonly wrapped: ControllerConfiguration;

    public constructor(wrapped: ControllerConfiguration) {
        super();
        this.wrapped = wrapped;
    }

    public get(method: string|string[], route: string): PresetRouteOptions {
        return this.decorate(this.wrapped.get(method, route));
    }

    protected abstract decorate(config: PresetRouteOptions): PresetRouteOptions;

}

export class CheckTokenDecorator extends ControllerConfigurationDecorator {

    protected decorate(config: PresetRouteOptions): PresetRouteOptions {
        config.schema = {
            body: {
                "type": "object",
                "required": ["request_token"],
                "properties": {
                    "request_token": {
                        "type": "string",
                        "minLength": 32,
                        "maxLength": 32
                    }
                }
            }
        };

        config.preHandler = async (req: FastifyRequest, resp: FastifyReply) => {
            const token = (req.body as SecureRequest).request_token;
            if(req.session?.request_token && timingSafeEqual(Buffer.from(token), Buffer.from(req.session.request_token))) {
                return;
            }

            throw errorCodes.FST_ERR_VALIDATION("Request token missing");
        };

        return config;
    }

}

export class ValidateDecorator extends ControllerConfigurationDecorator {

    private readonly schema: JsonSchema;
    private readonly type: string;

    public constructor(wrapped: ControllerConfiguration, schema: JsonSchema, type: HTTPRequestPart = "body") {
        super(type == "body" ? new CheckTokenDecorator(wrapped) : wrapped);
        this.schema = schema;
        this.type = type;
    }

    protected decorate(config: PresetRouteOptions): PresetRouteOptions {
        if(!config.schema) {
            config.schema = {};
        }

        if(!(config.schema as AdditionalConfig)[this.type]) {
            (config.schema as AdditionalConfig)[this.type] = this.schema;
            return config;
        }

        Object.assign(((config.schema as AdditionalConfig)[this.type] as JsonSchema).properties, this.schema.properties);
        ((config.schema as AdditionalConfig)[this.type] as JsonSchema).required.push(...this.schema.required);
        return config;
    }

}

export class AuthenticationDecorator extends ControllerConfigurationDecorator {

    private readonly roles: Role[];

    public constructor(wrapped: ControllerConfiguration, ...roles: Role[]) {
        super(wrapped);
        this.roles = roles;
    }

    protected decorate(config: PresetRouteOptions): PresetRouteOptions {
        config.preValidation = async (req: FastifyRequest, resp: FastifyReply) => {
            if(req.session?.user && req.session.isAuthenticated(req.ip, req.headers["user-agent"] ?? "")) {
                if(this.roles.length == 0 || this.roles.includes(req.session.user.role)) {
                    return;
                }

                resp.status(401);
            }
            else {
                resp.redirect("/login");
            }
        };

        return config;
    }
    
}

export class GuardNonAuthenticatedDecorator extends ControllerConfigurationDecorator {

    protected decorate(config: PresetRouteOptions): PresetRouteOptions {
        config.preValidation = async (req: FastifyRequest, resp: FastifyReply) => {
            if(req.session?.user) {
                return await resp.redirect("/");
            }
        };
        return config;
    }
    
}

export class IpRateLimitDecorator extends ControllerConfigurationDecorator {

    private readonly ratelimStats: Map<string, {start: EpochTimeStamp, count: number}>;
    private readonly maxRate: number;
    private readonly maxAge: number;

    public constructor(wrapped: ControllerConfiguration, maxRate: number, maxAge: number) {
        super(wrapped);
        this.ratelimStats = new Map();
        this.maxRate = maxRate;
        this.maxAge = maxAge;
    }

    protected decorate(config: PresetRouteOptions): PresetRouteOptions {
        config.onRequest = async (req: FastifyRequest, resp: FastifyReply) => {
            const stats = this.ratelimStats.get(req.ip);
            if(stats) {
                if(Date.now() - stats.start < this.maxAge) {
                    if(stats.count >= this.maxRate) {
                        req.log.warn("Rate limit exceeded for IP %s on route %s", req.ip, config.url);
                        resp.status(429);
                        return;
                    }
                    else {
                        stats.count++;
                        return;
                    }
                }
            }

            if(this.ratelimStats.size >= 100000) {
                const oldest = this.ratelimStats.keys().next().value;
                if(oldest) {
                    this.ratelimStats.delete(oldest);
                }
            }
            this.ratelimStats.set(req.ip, {start: Date.now(), count: 1});
        };
        return config;
    }
}