import { FastifyReply, FastifyRequest } from "fastify";
import { Controller, HandlerFunction } from "./controller";
import { createHash } from "crypto";
import { AuthToken, AuthTokenType } from "../model/auth_token";
import { ControllerConfiguration, ControllerConfigurationDecorator, ValidateDecorator } from "./decorators";

interface TokenParam {
    token: string
}

export abstract class AuthTokenController extends Controller {

    protected readonly authTokenType: AuthTokenType;

    protected constructor(route: string, type: AuthTokenType, config?: ControllerConfigurationDecorator, method = "get") {
        super(method, route + "/:token", new ValidateDecorator(config ?? new ControllerConfiguration(), {
            type: "object",
            required: ["token"],
            properties: {
                "token": {
                    type: "string",
                    minLength: 64,
                    maxLength: 64,
                    pattern: "[0-9a-f]+"
                }
            }
        }, "params"));
        this.authTokenType = type;
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const tokenStr = (req.params as TokenParam).token;
            const tokenHash = createHash('sha512').update(tokenStr, 'hex').digest();
            const token = await req.server.db.getAuthTokenRepository().getById(tokenHash);
            if(token.type == this.authTokenType) {
                return this.handleAuthToken(tokenStr, token, req, resp);
            }

            resp.statusCode = 404;
        };
    }

    protected abstract handleAuthToken(tokenStr: string, token: AuthToken, req: FastifyRequest, resp: FastifyReply): Promise<unknown>;
    
}