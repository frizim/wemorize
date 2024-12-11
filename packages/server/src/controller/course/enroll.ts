import { FastifyReply, FastifyRequest } from "fastify";
import { Controller, HandlerFunction } from "../controller";
import { AuthenticationDecorator, CheckTokenDecorator, ControllerConfiguration, ValidateDecorator } from "../decorators";

interface EnrollRequest {
    courseLangId: number;
}

export class EnrollController extends Controller {

    public constructor() {
        super("post", "/courses/enroll/:courseLangId", new AuthenticationDecorator(new CheckTokenDecorator(new ValidateDecorator(new ControllerConfiguration(), {
            type: "object",
            required: ["courseLangId"],
            properties: {
                "courseLangId": {
                    type: "integer",
                    minimum: 1,
                    exclusiveMaximum: Math.pow(2, 64)
                }
            }
        }, "params"))));
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const {courseLangId} = req.params as EnrollRequest;
            if(courseLangId && req.session?.user) {
                const courseLang = await req.server.db.getCourseLanguageRepository().getById(courseLangId);
                await req.server.db.getCourseEnrollmentRepository().create({
                    id: 1,
                    user: req.session.user,
                    course_language: courseLang,
                    daily_goal: 10,
                    enrolled: new Date(),
                    reminder: true
                });

                return resp.send(JSON.stringify({
                    success: true
                }));
            }

            return resp.status(404);
        };
    }
    
}