import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { AuthToken, AuthTokenType } from "../../model/auth_token";
import { AuthTokenController } from "../token";
import { hash } from "argon2";
import { ControllerConfiguration, ValidateDecorator } from "../decorators";
import { State } from "../../model/user";

interface ResetPasswordForm {
    password: string,
    confirm_password: string,
    request_token: string
};

export class ResetPasswordController extends AuthTokenController {

    public constructor() {
        super("/reset-password", AuthTokenType.password_reset, new ValidateDecorator(new ControllerConfiguration(), {
            type: "object",
            required: ["password", "confirm_password"],
            properties: {
                "password": {
                    type: "string",
                    minLength: 1,
                    maxLength: 500
                },
                "confirm_password": {
                    type: "string",
                    minLength: 1,
                    maxLength: 500
                }
            }
        }),
        "post");
    }

    protected async handleAuthToken(tokenStr: string, token: AuthToken, req: FastifyRequest, resp: FastifyReply) {
        if(req.method == "get") {
            await resp.viewAsync("reset_password.tpl", {
                "token": tokenStr
            });
            return;
        }

        const form = req.body as ResetPasswordForm;

        if(form.password !== form.confirm_password) {
            resp.showMessage(this.url, "resetPassword.notMatching");
            resp.redirect("/verify/" + tokenStr);
            return;
        }

        await req.server.db.getAuthTokenRepository().delete(token.token_hash);

        token.user.password_hash = await hash(form.password, {raw: false});
        if(token.user.state == State.unverified) {
            token.user.state = State.active;
        }

        await req.server.db.getUserRepository().update(token.user);
        return resp.redirect("/login");
    }

    public register(server: FastifyInstance): void {
        super.register(server);
        new class extends AuthTokenController {
            protected async handleAuthToken(tokenStr: string, token: AuthToken, req: FastifyRequest, resp: FastifyReply) {
                return resp.viewAsync("reset_password.tpl", {
                    "token": tokenStr
                });
            }
        }("/reset-password", AuthTokenType.password_reset).register(server);
    }
    
}