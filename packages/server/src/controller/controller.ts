import { Session } from "../model/session";
import { parse } from 'cookie';
import { createHash, randomBytes } from "node:crypto";
import { User } from "../model/user";
import { SessionRepository } from "../storage/users";
import { StorageProvider } from "../storage/provider";
import { FastifyRequest, FastifyReply, FastifyInstance, RouteHandlerMethod } from "fastify";
import { ControllerConfiguration } from "./decorators";

declare module "fastify" {
    export interface FastifyRequest {
        session?: Session
    }

    export interface FastifyInstance {
        db: StorageProvider
    }

    export interface FastifyReply {
        showMessage: (route: string, message: string) => void,
        sendMail: (template: string, vars: object, recipient: string, subj: string) => void;
        sendSessionToken: (token: string, expires: Date) => void;
    }
}

async function getSession(this: FastifyInstance, req: FastifyRequest): Promise<void> {
    if (req.headers.cookie) {
        const cookies = parse(req.headers.cookie);
        if ('wemorize-session' in cookies) {
            const sid = cookies['wemorize-session'] ?? '';
            if (Session.tokenFormatValid(sid)) {
                try {
                    const sess = await this.db.getSessionRepository().getById(createHash('sha512').update(Buffer.from(sid, 'hex')).digest() as Uint8Array);
                    if (sess.isValid(req.ip, req.headers["user-agent"] ?? "")) {
                        req.session = sess;
                    }
                } catch (err) {
                    req.log.warn("Unknown session token %s", sid);
                    throw err;
                }
            }
        }
    }
}

async function createSessionIfNeeded(this: FastifyInstance, req: FastifyRequest, resp: FastifyReply) {
    if (!req.session) {
        await Controller.createSession(this.db.getSessionRepository(), null, req, resp);
    }
}

export type HandlerFunction = (req: FastifyRequest, resp: FastifyReply) => Promise<unknown>;

export abstract class Controller {

    private readonly method: string | string[];
    protected readonly url: string;
    private readonly config: ControllerConfiguration;

    protected constructor(method: string | string[], url: string, config: ControllerConfiguration) {
        this.method = method;
        this.url = url;
        this.config = config;
    }

    protected abstract getHandler(): RouteHandlerMethod;

    public static async createSession(sessionRepo: SessionRepository, user: User | null, req: FastifyRequest, resp: FastifyReply): Promise<void> {
        const token = randomBytes(32).toString("hex");
        const session = Session.createNew(token, user ?? null, (user ? 86400 : 3600), req.ip, req.headers['user-agent'] ?? "");
        await sessionRepo.create(session);
        req.session = session;
        resp.sendSessionToken(token, session.expires);
    }

    public register(server: FastifyInstance): void {
        const config = {
            handler: this.getHandler(),
            preParsing: getSession,
            preHandler: createSessionIfNeeded,
            ...this.config.get(this.method, this.url)
        };

        server.route(config);
    }
}