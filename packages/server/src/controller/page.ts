import { FastifyRequest } from "fastify";
import { Controller, HandlerFunction } from "./controller";
import { ControllerConfiguration, ControllerConfigurationDecorator } from "./decorators";

export abstract class Page extends Controller {

    readonly viewTemplate: string;

    public constructor(url: string, viewTemplate: string, configDecorators?: ControllerConfigurationDecorator) {
        super("get", url, configDecorators ?? new ControllerConfiguration());
        this.viewTemplate = viewTemplate;
    }

    protected getHandler(): HandlerFunction {
        const page = this;
        return async (req, resp) => {
            return resp.viewAsync(this.viewTemplate, {
                reqToken: req.session?.request_token ?? "",
                user: req.session?.user,
                avatarImg: req.session?.user?.avatar_id ? "img/" + req.session.user.avatar_id + ".jpg" : "img/default_avatar.svg",
                ...await page.getVariables(req)
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