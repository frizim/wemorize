import { FastifyRequest } from "fastify";
import { Controller, HandlerFunction } from "./controller";
import { ControllerConfiguration, ControllerConfigurationDecorator } from "./decorators";
import { parse, serialize } from "cookie";

export abstract class Page extends Controller {

    private static readonly msgPattern: RegExp = /^[a-zA-Z0-9._]{1,40}$/;
    private readonly viewTemplate: string;

    public constructor(url: string, viewTemplate: string, configDecorators?: ControllerConfigurationDecorator) {
        super("get", url, configDecorators ?? new ControllerConfiguration());
        this.viewTemplate = viewTemplate;
    }

    protected getHandler(): HandlerFunction {
        return async (req, resp) => {
            let msg = "";
            if(req.headers.cookie?.includes("msg-")) {
                msg = parse(req.headers.cookie)["msg-" + this.url] ?? "";
                if(!Page.msgPattern.test(msg)) {
                    req.log.warn(`Invalid message variable value %s, possible attack! Page: %s`, msg, this.url);
                    msg = "";
                }
    
                resp.header("set-cookie", serialize("msg-" + this.url, "", {
                    expires: new Date(0)
                }));
            }

            return resp.viewAsync(this.viewTemplate, {
                reqToken: req.session?.request_token ?? "",
                user: req.session?.user,
                avatarImg: req.session?.user?.avatar_id ? "avatar/" + req.session.user.avatar_id : "img/default_avatar.svg",
                message: msg,
                ...await this.getVariables(req)
            });
        };
    }

    protected abstract getVariables(req: FastifyRequest): Promise<object>;

}

export class SimplePage extends Page {

    private static readonly empty = Promise.resolve({});

    protected getVariables(req: FastifyRequest): Promise<object> {
        return SimplePage.empty;
    }
    
}