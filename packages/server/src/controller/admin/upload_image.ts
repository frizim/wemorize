import { Controller, HandlerFunction } from "../controller";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify";
import { AuthenticationDecorator, ControllerConfiguration, ValidateDecorator } from "../decorators";
import { createHash } from "crypto";
import i18next from "i18next";
import { Role } from "../../model/user";
import sharp from "sharp";
import fs from "node:fs";
import path from "path";

interface UploadBody {
    readonly add_image: Buffer;
}

export class UploadImageController extends Controller {

    private static readonly ALLOWED_FORMATS = ["jpg", "jpeg", "png", "avif", "heif", "webp", "svg"];
    private static readonly MIN_RES = 8;
    private static readonly MAX_RES = 5000;
    private static readonly TARGET_RES = 1920;

    public constructor() {
        super("put", "/card-image", new ValidateDecorator(new AuthenticationDecorator(new ControllerConfiguration(), Role.moderator, Role.admin), {
            type: "object",
            required: ["add_image"],
            properties: {
                add_image: {
                    type: "object",
                }
            }
        }));
    }

    private async upload(image: Buffer, resp: FastifyReply): Promise<unknown> {
        const filename = createHash("sha1").update(image).digest().toString("hex") + ".jpg";
        const filePath = path.join(resp.server.config.dataDir, "card-img", filename);

        if(!fs.existsSync(filePath)) {
            try {
                const parsed = sharp(image, {
                    animated: false,
                    ignoreIcc: true
                });
                const meta = await parsed.metadata();

                if(meta.width! < UploadImageController.MIN_RES || meta.height! < UploadImageController.MIN_RES || meta.width! > UploadImageController.MAX_RES || meta.height! > UploadImageController.MAX_RES) {
                    return await resp.status(400).send(i18next.t("errors.image.invalidSize", {
                        "min": UploadImageController.MIN_RES,
                        "max": UploadImageController.MAX_RES
                    }));
                }

                if(!meta.format || !UploadImageController.ALLOWED_FORMATS.includes(meta.format)) {
                    return await resp.status(400).send(i18next.t("errors.image.invalidFormat", {"formats": UploadImageController.ALLOWED_FORMATS.join(", ")}));
                }

                await parsed.resize({
                    width: UploadImageController.TARGET_RES,
                    fit: "cover",
                    withoutEnlargement: true
                }).jpeg({quality: 100}).toFile(filePath);

                return await resp.status(201).send({image: resp.server.config.baseUrl + "/card-img/" + filename});
            } catch (err: unknown) {
                resp.log.error("Error processing image: %o", err);
                return await resp.status(400).send(i18next.t("errors.image.invalidContent"));
            }
        }

        return await resp.status(201).send();
    }


    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const user = req.session?.user;
            if(!user) {
                return resp.redirect(this.url);
            }

            return this.upload((req.body as UploadBody).add_image, resp);
        };
    }

}