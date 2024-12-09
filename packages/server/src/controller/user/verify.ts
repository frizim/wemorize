import { FastifyRequest, FastifyReply } from "fastify";
import { AuthTokenController } from "../token";
import { AuthToken, AuthTokenType } from "../../model/auth_token";
import { State } from "../../model/user";

export class VerifyController extends AuthTokenController {

    public constructor() {
        super("/verify", AuthTokenType.email_verify);
    }

    protected async handleAuthToken(tokenStr: string, token: AuthToken, req: FastifyRequest, resp: FastifyReply) {
        if(token.user.state == State.unverified) {
            if(req.session?.user) {
                return resp.redirect("/");
            }

            token.user.state = State.active;
        }
        else if(token.user.new_email) {
            token.user.email = token.user.new_email;
            token.user.new_email = null;
        }
        else {
            return resp.redirect("/");
        }

        if(await req.server.db.getUserRepository().update(token.user)) {
            await req.server.db.getAuthTokenRepository().delete(token.token_hash);
            return resp.redirect("/login");
        }
    }
    
}