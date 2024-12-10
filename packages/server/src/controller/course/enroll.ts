import { FastifyReply, FastifyRequest } from "fastify";
import { Controller, HandlerFunction } from "../controller";
import { AuthenticationDecorator, ControllerConfiguration, ValidateDecorator } from "../decorators";

interface EnrollRequest {
    courseLangId: number;
}

export class EnrollController extends Controller {

    public constructor() {
        super("post", "/courses/enroll/:courseId", new AuthenticationDecorator(new ValidateDecorator(new ControllerConfiguration(), {
            type: "object",
            required: ["courseLangId"],
            properties: {
                "courseLangId": {
                    type: "number",
                    min: 1
                }
            }
        }, "params")));
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const {courseLangId} = req.params as EnrollRequest;
            if(courseLangId) {
                const courseLang = await req.server.db.getCourseLanguageRepository().getById(courseLangId);
                await req.server.db.getCourseEnrollmentRepository().create({
                    id: 1,
                    course_language: courseLang,
                    daily_goal: 10,
                    enrolled: new Date(),
                    reminder: true
                });

                return resp.send(JSON.stringify({
                    success: true
                }));
            }

            return resp.status(400);
        };
    }
    
}