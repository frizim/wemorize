import { FastifyReply, FastifyRequest, RouteHandlerMethod } from "fastify";
import { AuthenticationDecorator, ControllerConfiguration, ValidateDecorator } from "../decorators";
import { Controller } from "../controller";

interface ProfileParam {
    id: number;
}

export class ProfilePage extends Controller {

    public constructor() {
        super("get", "/profile/:id", new AuthenticationDecorator(new ValidateDecorator(new ControllerConfiguration(), {
            type: "object",
            required: ["id"],
            properties: {
                "id": {
                    type: "integer"
                }
            }
        }, "params")));
    }

    protected getHandler(): RouteHandlerMethod {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const profile_id = (req.params as ProfileParam).id;
            const ownProfile = profile_id == req.session?.user?.id
    
            const enrollments = await req.server.db.getCourseEnrollmentRepository().getByUser({
                id: profile_id,
                name: ""
            });
    
            let profile;
            try {
                profile = ownProfile ? req.session?.user : await req.server.db.getUserRepository().getById(profile_id);
            } catch {
                return resp.viewAsync("error.tpl", {
                    user: req.session?.user,
                    avatarImg: req.session?.user?.avatar_id ? "avatar/" + req.session.user.avatar_id : "img/default_avatar.svg",
                    errTitle: "errors.profileNotFound.title",
                    errDescription: "errors.profileNotFound.description"
                });
            }
    
            return resp.viewAsync("profile.tpl", {
                user: req.session?.user,
                avatarImg: req.session?.user?.avatar_id ? "avatar/" + req.session.user.avatar_id : "img/default_avatar.svg",
                avatar: profile?.avatar_id,
                ownProfile: ownProfile,
                profile: profile,
                courseCount: enrollments.length,
                courses: enrollments
            });
        };
    }

}