import * as fs from 'node:fs';
import { Config, ConfigSchema } from "./schema/config";
import { WemorizeApplication } from "./app";

const config = new ConfigSchema().fromString(fs.readFileSync("config.json").toString("utf8"));

if(!config) {
    console.error("Invalid configuration");
    process.exit(1);
}

WemorizeApplication.create(config as Config).then(res => {
    res.start();
}).catch((err: unknown) => {
    console.error("Error initializing Wemorize server: ", err);
});