import fastify from "fastify";
import fastifyView from "@fastify/view";
import Handlebars from "handlebars";
import * as fs from 'node:fs';
import { Config, ConfigSchema } from "./schema/config";

const config = new ConfigSchema().fromString(fs.readFileSync("config.json").toString("utf8")) as Config;

if(!config) {
    console.error("Invalid configuration");
    process.exit(1);
}

const server = fastify({
    logger: {
        level: "info"
    }
});
server.decorate("config", config);

server.register(fastifyView, {
    engine: {
        handlebars: Handlebars
    },
    root: "./src/view",
    includeViewExtension: true,
    viewExt: "tpl",
    defaultContext: {
        rootTitle: config.instanceName,
        baseUrl: config.baseUrl
    },
    options: {
        partials: {
            base: "base.tpl"
        },
        compileOptions: {
            strict: true
        }
    }
});

server.listen({host: config.listen.host, port: config.listen.port}, (err, address) => {
    if(err) {
        console.error(`Could not listen on port ${config.listen.port}: ${err}`);
        process.exit(1);
    }

    console.log(`Server listening at ${address}`);
});