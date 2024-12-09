import { fastify, FastifyInstance } from "fastify";
import { Config } from "./schema/config";
import formbody from "@fastify/formbody";
import { StorageProvider } from "./storage/provider";
import { PgStorageProvider } from "./storage/postgres/pg_provider";

export class WemorizeApplication {

    readonly config: Config;
    readonly storageProvider: StorageProvider;
    readonly server: FastifyInstance;

    constructor(server: FastifyInstance, storageProvider: StorageProvider, cfg: Config) {
        this.server = server;
        this.storageProvider = storageProvider;
        this.config = cfg;
    }

    static async create(cfg: Config): Promise<WemorizeApplication> {
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

        server.addHook("onClose", async (instance) => {
            instance.log.info("Shutting down Wemorize backend");
            await db.shutdown();
        });
        process.on("SIGINT", () => {
            server.log.info("Received SIGINT, shutting down...");
            void server.close().then(_res => {
                server.log.info("Server shut down");
            });
        });

        process.on("unhandledRejection", (reason: string, p: Promise<unknown>) => {
            server.log.error("Promise rejection not handled");
            server.log.error("Got '" + reason + "' from " + JSON.stringify(p));
        });

        process.on("uncaughtException", (error: Error) => {
            try {
                server.log.error("Unhandled exception %o", error);
            } catch {
                console.error("Unhandled exception: " + JSON.stringify(error));
            }

            server.close().then(() => {
                process.exit(1);
            }, () => {
                process.exit(1);
            });
        });

        return new WemorizeApplication(server, db, cfg);
    }

    start(): void {
        this.server.listen({host: this.config.listen.host, port: this.config.listen.port}, (err, address) => {
            if(err) {
                this.server.log.error("Could not listen on port %s: %o", this.config.listen.port, err);
                process.exit(1);
            }
        });
    }

}