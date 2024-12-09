import { hash } from "argon2";
import { Role, State, User } from "../../model/user";
import { FastifyReply, FastifyRequest } from "fastify";
import { Form } from "../form";
import { AuthToken, AuthTokenType } from "../../model/auth_token";
import { randomBytes } from "crypto";
import { HandlerFunction } from "../controller";
import { ControllerConfiguration, GuardNonAuthenticatedDecorator } from "../decorators";
import i18next from "i18next";

interface RegisterForm {
    readonly username: string;
    readonly email: string;
    readonly password: string;
    readonly confirm_password: string;
    readonly tos_accepted: string;
    readonly privacy_policy_accepted: string;
}

export class RegisterController extends Form {

    public constructor() {
        super("/register", "register.tpl", {
            type: "object",
            required: ["username", "email", "password", "confirm_password", "tos_accepted", "privacy_policy_accepted"],
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
                    minLength: 1,
                    maxLength: 500
                },
                confirm_password: {
                    type: "string",
                    minLength: 1,
                    maxLength: 500
                },
                tos_accepted: {
                    type: "string",
                    pattern: "on"
                },
                privacy_policy_accepted: {
                    type: "string",
                    pattern: "on"
                }
            }
        }, new GuardNonAuthenticatedDecorator(new ControllerConfiguration()));
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const rf = req.body as RegisterForm;
            if(rf.password != rf.confirm_password) {
                resp.showMessage("/register", "register.passwordsNotMatching");
                return resp.redirect("/register");
            }

            const user: User = {
                id: 0,
                name: rf.username,
                email: rf.email,
                password_hash: await hash(rf.password, {raw: false}),
                registered: new Date(),
                role: Role.user,
                state: State.unverified
            };

            const id = await req.server.db.getUserRepository().create(user);

            const token = randomBytes(32).toString("hex");
            await req.server.db.getAuthTokenRepository().create(new AuthToken({
                id: id
            } as User, AuthTokenType.email_verify, 86400, token));

            resp.sendMail("email_verify.tpl", {
                username: rf.username,
                authToken: token
            }, user.email, i18next.t("communications.registerVerifySubject"));

            resp.showMessage("/login", "register.confirmationPending");
            return await resp.redirect("/login");
        }
   }

}