import { FastifyReply, FastifyRequest } from "fastify";
import { Controller, HandlerFunction } from "../controller";
import { AuthenticationDecorator, ControllerConfiguration, ValidateDecorator } from "../decorators";

interface SearchRequest {
    prefix: string,
    request_token: string
}

export class SearchCoursesController extends Controller {

    public constructor() {
        super("post", "/courses/search", new AuthenticationDecorator(new ValidateDecorator(new ControllerConfiguration(), {
            type: "object",
            required: ["prefix"],
            properties: {
                "prefix": {
                    type: "string",
                    maxLength: 100
                }
            }
        })));
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            if(req.session) {
                const searchReq = req.body as SearchRequest;
                if(searchReq.prefix.length == 0) {
                    return resp.viewAsync("search_results.tpl");
                }

                return resp.viewAsync("search_results.tpl", {
                    results: await req.server.db.getCourseLanguageRepository().match(searchReq.prefix, "de"),
                    reqToken: req.session.request_token
                });
            }

            resp.status(401);
        };
    }
    
}