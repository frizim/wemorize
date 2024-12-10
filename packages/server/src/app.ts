import { StorageProvider } from "./storage/provider";
import { PgStorageProvider } from "./storage/postgres/pg_provider";

import { Config } from "./schema/config";
import { LoginController } from "./controller/user/login";
import { LogoutController } from "./controller/user/logout";
import { RegisterController } from "./controller/user/register";
import { VerifyController } from "./controller/user/verify";

import { fastify, FastifyInstance } from "fastify";
import formbody from "@fastify/formbody";
import fastifyView from "@fastify/view";
import { serialize } from "cookie";
import Handlebars from "handlebars";
import i18next from "i18next";
import fs from "node:fs/promises";
import { Dashboard } from "./controller/dashboard";

export class WemorizeApplication {

    private readonly config: Config;
    private readonly storageProvider: StorageProvider;
    private readonly server: FastifyInstance;

    public constructor(server: FastifyInstance, storageProvider: StorageProvider, cfg: Config) {
        this.server = server;
        this.storageProvider = storageProvider;
        this.config = cfg;
    }

    public static async create(cfg: Config): Promise<WemorizeApplication> {
        const server = await fastify({
            logger: {
                level: "debug"
            }
        });

        server.decorate("config", cfg);
        server.register(formbody);

        const db = new PgStorageProvider();
        db.init(cfg);
        await db.migrate(server.log);
        server.decorate('db', db);

        const app = new WemorizeApplication(server, db, cfg);

        server.addHook("onClose", async (instance) => {
            instance.log.info("Shutting down Wemorize backend");
            await app.stop();
        });
        process.on("SIGINT", () => {
            server.log.info("Received SIGINT, shutting down...");
            void app.stop();
        });

        process.on("unhandledRejection", (reason: string, p: Promise<unknown>) => {
            server.log.error("Promise rejection not handled");
            server.log.error("Got '" + reason + "' from ", p);
        });

        process.on("uncaughtException", (error: Error) => {
            try {
                server.log.error("Unhandled exception %o", error);
            } catch {
                console.error("Unhandled exception: ", error);
            }

            app.stop().then(res => {
                process.exit(1);
            }, (err: unknown) => {
                console.error("Could not perform clean shutdown: ", err);
                process.exit(1);
            });
        });

        app.session();
        await app.i18n();
        app.view();
        app.errorHandlers();
        app.routes();

        return app;
    }

    public start(): void {
        this.server.listen({host: this.config.listen.host, port: this.config.listen.port}, (err, address) => {
            if(err) {
                this.server.log.error("Could not listen on port %s: %o", this.config.listen.port, err);
                process.exit(1);
            }
        });
    }

    private view() {
        this.server.register(fastifyView, {
            engine: {
                handlebars: Handlebars
            },
            root: "./src/view",
            includeViewExtension: true,
            viewExt: "tpl",
            defaultContext: {
                instanceName: this.config.instanceName,
                baseUrl: this.config.baseUrl,
                logoFilename: "logo.svg"
            },
            options: {
                partials: {
                    base: "base.tpl",
                    email: "email.tpl"
                },
                compileOptions: {
                    strict: true
                }
            }
        });

        Handlebars.registerHelper("reqTokenField", (token: string) => {
            return new Handlebars.SafeString('<input type="hidden" name="request_token" value="' + Handlebars.Utils.escapeExpression(token) + '">');
        });

        this.server.decorateReply("showMessage", function(route: string, messageId: string) {
            this.header("set-cookie", serialize("msg-" + route, messageId, {
                httpOnly: true,
                sameSite: "strict"
            }));
        });
    }

    private async i18n() {
        await i18next.init({
            lng: "de",
            resources: {}
        });

        const files = await fs.readdir("./src/view/i18n");
        for(const file of files) {
            i18next.addResourceBundle(file.replace(".json", ""), "", JSON.parse((await fs.readFile("./src/view/i18n/" + file)).toString()));
        }
    
        Handlebars.registerHelper("i18n", (key: string, args: {hash: Record<string, string>}) => {
            return new Handlebars.SafeString(i18next.t(key, {
                ...args.hash,
                returnObject: false
            }));
        });
    }

    private errorHandlers() {
        this.server.setNotFoundHandler(async (req, resp) => {
            return resp.status(404).viewAsync("error.tpl", {
                errTitle: "errors.notFound.title",
                errDescription: "errors.notFound.description"
            });
        });
    
        this.server.setErrorHandler(async (err, req, resp) => {
            let errTemplate = "generic";
            let status = 500;
    
            if(err.code === "FST_ERR_VALIDATION") {
                if(req.method === "get") {
                    errTemplate = "badRequest";
                    status = 400;
                }
                else {
                    const route = req.routeOptions.url ?? "/";
                    resp.showMessage(route, "errors.badRequest.description");
                    return resp.redirect(route);
                }
            }
            else if(err.code === "FST_ERR_NOT_FOUND") {
                errTemplate = "notFound";
                status = 404;
            }
            else {
                this.server.log.error(err);
            }
    
            return resp.status(status).viewAsync("error.tpl", {
                errTitle: `errors.${errTemplate}.title`,
                errDescription: `errors.${errTemplate}.description`
            });
        });
    }

    private routes() {
        new RegisterController().register(this.server);
        new LoginController().register(this.server);
        new LogoutController().register(this.server);
        new VerifyController().register(this.server);

        new Dashboard().register(this.server);
    }

    private session() {
        const splPath = this.config.baseUrl.substring(this.config.baseUrl.indexOf("//")).split("/", 2);
        this.server.decorateReply("sendSessionToken", function(token: string, expires: Date) {
            this.header("set-cookie", serialize("wemorize-session", token, {
                httpOnly: true,
                secure: splPath[0]?.startsWith("https") ?? false,
                sameSite: "strict",
                domain: splPath[0] ?? "",
                path: splPath[1] ?? "",
                expires: expires
            }));
        });
    }

    public async stop() {
        await this.server.close();
        await this.storageProvider.shutdown();
    }

}