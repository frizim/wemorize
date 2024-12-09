import { Controller, HandlerFunction } from "../controller";
import { serialize } from "cookie";
import { CheckTokenDecorator, ControllerConfiguration } from "../decorators";

export class LogoutController extends Controller {

    public constructor() {
        super("post", "/logout", new CheckTokenDecorator(new ControllerConfiguration()));
    }

    protected getHandler(): HandlerFunction {
        return async (req, resp) => {
            if(req.session?.user) {
                req.server.db.getSessionRepository().delete(req.session.token_hash).catch((err: unknown) => {
                    req.log.warn("Error deleting session of user %d: %o", req.session?.user?.id, err);
                });
            }
            resp.header('set-cookie', serialize("wemorize-session", "", {
                        httpOnly: true,
                        expires: new Date(0)
                    }
                )
            );

            return resp.redirect("/");
        };
    }
    
}