import { User } from "../../model/user";
import { HandlerFunction } from "../controller";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify";
import { Form } from "../form";
import { ControllerConfiguration, GuardNonAuthenticatedDecorator, IpRateLimitDecorator } from "../decorators";
import i18next from "i18next";
import { AuthToken, AuthTokenType } from "../../model/auth_token";
import { randomBytes } from "node:crypto";

interface ForgotPasswordForm {
    readonly email: string;
}

export class ForgotPasswordController extends Form {

    public constructor() {
        super('/forgot-password', "forgot_password.tpl", {
            type: "object",
            required: ["email"],
            properties: {
                email: {
                    type: "string",
                    minLength: 6,
                    maxLength: 320,
                    pattern: "\\S+@\\S{1,64}.\\S{2,64}"
                }
            }
        }, new IpRateLimitDecorator(new GuardNonAuthenticatedDecorator(new ControllerConfiguration()), 5, 600_000));
    }

    private async createAndSendToken(user: User, resp: FastifyReply) {
        const tokenStr = randomBytes(32).toString("hex");
        const token = new AuthToken(user, AuthTokenType.password_reset, 43200, tokenStr);
        await resp.server.db.getAuthTokenRepository().create(token);
        resp.sendMail("email_reset_password.tpl", {
            username: user.name,
            authToken: tokenStr
        }, user.email, i18next.t("communications.resetPasswordSubject"));
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const rf = req.body as ForgotPasswordForm;

            let user: User|null;
            try {
                user = await req.server.db.getUserRepository().getByEmail(rf.email);
            } catch {
                user = null;
            }

            if(user) {
                this.createAndSendToken(user, resp).catch((err: unknown) => {
                    resp.log.error("Could not process password reset token request for user %d: %o", user.id, err);
                });
            }

            resp.showMessage("/forgot-password", "forgotPassword.linkSent");
            return resp.redirect("/forgot-password");
        };
    }

}