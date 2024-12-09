import { verify } from "argon2";
import { State } from "../../model/user";
import { Controller, HandlerFunction } from "../controller";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify";
import { Form } from "../form";
import { ControllerConfiguration, GuardNonAuthenticatedDecorator } from "../decorators";

interface LoginForm {
    readonly email: string;
    readonly password: string;
}

export class LoginController extends Form {

    public constructor() {
        super('/login', "login.tpl", {
            type: "object",
            required: ["email", "password"],
            properties: {
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
                }
            }
        }, new GuardNonAuthenticatedDecorator(new ControllerConfiguration()));
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const rf = req.body as LoginForm;

            let user;
            let pwHash;
            try {
                user = await req.server.db.getUserRepository().getByEmail(rf.email);
                pwHash = user.password_hash;
            } catch {
                pwHash = "$argon2id$v=19$m=65536,t=3,p=4$v9XsppRm7tR2bbWZKh0FJA$omERW/5lbkLUvoCeu6h3BcpuBlH+R0PJIskFFrgxrlI";
            }

            if(await verify(pwHash, rf.password) && user) {
                if(user.state != State.active) {
                    resp.showMessage(this.url, "login.state" + user.state);
                    return resp.redirect("/login");
                }

                if(req.session) {
                    req.server.db.getSessionRepository().delete(req.session.token_hash).catch((err: unknown) => {
                        req.log.warn("Error deleting pre-session (token: %s): %o", req.session?.token_hash, err);
                    });
                }
                await Controller.createSession(req.server.db.getSessionRepository(), user, req, resp);
                return resp.redirect("/");
            }
            else {
                resp.showMessage(this.url, "login.authFailed");
            }

            return resp.redirect("/login");
        };
    }

}