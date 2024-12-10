import { FastifyRequest } from "fastify";
import { Page } from "./page";
import { AuthenticationDecorator, ControllerConfiguration } from "./decorators";

export class Dashboard extends Page {

    public constructor() {
        super("/", "dashboard.ts", new AuthenticationDecorator(new ControllerConfiguration()));
    }

    protected async getVariables(req: FastifyRequest): Promise<object> {
        if(req.session?.user) {
            return {
                "courses": await req.server.db.getCourseEnrollmentRepository().getByUser(req.session.user)
            };
        }

        return {};
    }
    
}