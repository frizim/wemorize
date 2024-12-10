import { Controller, HandlerFunction } from "../controller";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify";
import { AuthenticationDecorator, ControllerConfiguration, ValidateDecorator } from "../decorators";
import { State } from "../../model/user";
import { verify } from "argon2";
import { setInterval } from "node:timers";
import { UserRepository } from "../../storage/users";

interface DeleteForm {
    readonly current_password: string;
}

export class DeleteController extends Controller {

    private delQueue?: ReturnType<typeof setInterval> | null;

    public constructor() {
        super(["post"], "/user/delete", new AuthenticationDecorator(new ValidateDecorator(new ControllerConfiguration(), {
            type: "object",
            required: ["current_password"],
            properties: {
                current_password: {
                    type: "string",
                    minLength: 1,
                    maxLength: 500
                }
            }
        })));
    }

    private onDelete(userRepo: UserRepository) {
        if(!this.delQueue) {
            this.delQueue = setInterval(async () => {
                if(this.delQueue && !(await userRepo.deletePending(1))) {
                    clearInterval(this.delQueue);
                    this.delQueue = null;
                }
            }, 300_000);
        }
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const user = req.session!.user;
            if(!user) {
                return resp.redirect("/");
            }

            const {current_password} = req.body as DeleteForm;
            if(!await verify(user.password_hash, current_password)) {
                resp.showMessage("/settings", "errors.wrongPassword");
                return resp.redirect("/settings");
            }

            user.state = State.deletion_pending;
            await req.server.db.getUserRepository().update(user);
            this.onDelete(req.server.db.getUserRepository());
        };
    }

}