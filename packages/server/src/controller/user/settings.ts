import { HandlerFunction } from "../controller";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify";
import { Form } from "../form";
import { AuthenticationDecorator, ControllerConfiguration } from "../decorators";
import { AuthToken, AuthTokenType } from "../../model/auth_token";
import { randomBytes } from "crypto";
import { hash } from "argon2";
import i18next from "i18next";

interface SettingsForm {
    readonly username: string;
    readonly email: string;
    readonly password: string;
    readonly confirm_password: string;
}

export class SettingsController extends Form {

    public constructor() {
        super('/settings', "user_settings.tpl", {
            type: "object",
            required: ["email", "password"],
            properties: {
                username: {
                    type: "string",
                    minLength: 3,
                    maxLength: 200,
                    pattern: "[\\p{L}\\p{M}\\p{N}\\p{S}]+( [\\p{L}\\p{M}\\p{N}\\p{S}]+)?"
                },
                email: {
                    type: "string",
                    minLength: 6,
                    maxLength: 320,
                    pattern: "\\S+@\\S{1,64}.\\S{2,64}"
                },
                password: {
                    type: "string",
                    minLength: 6,
                    maxLength: 500
                },
                confirm_password: {
                    type: "string",
                    minLength: 6,
                    maxLength: 500
                }
            }
        }, new AuthenticationDecorator(new ControllerConfiguration()));
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const user = req.session?.user;
            if(!user) {
                return resp.redirect(this.url);
            }

            const settings = req.body as SettingsForm;
            let changed = false;
            if(settings.email && settings.email != user.email && settings.email != user.new_email) {
                user.new_email = settings.email;
                if(await req.server.db.getUserRepository().hasEmail(settings.email)) {
                    resp.showMessage(this.url, "settings.emailTaken");
                    return await resp.redirect(this.url);
                } else {
                    const token = new AuthToken(user, AuthTokenType.email_verify, 86400, randomBytes(32).toString("hex"));
                    await req.server.db.getAuthTokenRepository().create(token);
                    resp.sendMail("email_verify.tpl", {
                        username: user.name,
                        authToken: token
                    }, user.email, i18next.t("communications.changeVerifySubject"));
                    changed = true;
                }
            }

            if(settings.username && settings.username !== user.name) {
                user.name = settings.username;
                changed = true;
            }

            if(settings.password && settings.confirm_password && settings.password === settings.confirm_password) {
                user.password_hash = await hash(settings.password, {raw: false});
                changed = true;
            }

            if(changed) {
                try {
                    await req.server.db.getUserRepository().update(user);
                    resp.redirect(this.url);
                } catch {
                    resp.showMessage(this.url, "settings.errorSaving");
                    resp.redirect(this.url);
                }
            }
        };
    }

}