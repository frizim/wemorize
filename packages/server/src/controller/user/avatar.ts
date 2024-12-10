import { Controller, HandlerFunction } from "../controller";
import { FastifyReply } from "fastify/types/reply";
import { FastifyRequest } from "fastify";
import { AuthenticationDecorator, ControllerConfiguration, UserRateLimitDecorator, ValidateDecorator } from "../decorators";
import { createHash } from "crypto";
import fs from "node:fs";
import { unlink } from "node:fs/promises";
import sharp from "sharp";
import path from "path";
import i18next from "i18next";
import { User } from "../../model/user";
import { UserRepository } from "../../storage/users";

interface AvatarForm {
    readonly new_avatar?: Buffer;
}

export class AvatarController extends Controller {

    private static readonly ALLOWED_FORMATS = ["jpg", "jpeg", "png", "avif", "heif", "webp"];
    private static readonly MIN_RES = 250;
    private static readonly MAX_RES = 2000;
    private static readonly TARGET_RES = 512;

    public constructor() {
        super("post", "/settings/avatar", new UserRateLimitDecorator(new AuthenticationDecorator(new ValidateDecorator(new ControllerConfiguration(), {
            type: "object",
            required: [],
            properties: {
                new_avatar: {
                    type: "object"
                }
            }
        })), 3, 60));
    }

    private async deleteAvatarFile(userRepo: UserRepository, dataDir: string, filename: string) {
        if(await userRepo.countAvatarUsers(filename) == 0) {
            await unlink(path.join(dataDir, "avatars", filename));
        }
    }

    private async uploadAvatar(user: User, new_avatar: Buffer, resp: FastifyReply): Promise<unknown> {
        const filename = createHash("sha1").update(new_avatar).digest().toString("hex") + ".jpg";
        const filePath = path.join(resp.server.config.dataDir, "avatars", filename);

        if(!fs.existsSync(filePath)) {
            try {
                const parsed = sharp(new_avatar, {
                    animated: false,
                    ignoreIcc: true
                });
                const meta = await parsed.metadata();

                if(meta.width! < AvatarController.MIN_RES || meta.height! < AvatarController.MIN_RES || meta.width! > AvatarController.MAX_RES || meta.height! > AvatarController.MAX_RES) {
                    return await resp.status(400).send(i18next.t("errors.image.invalidSize", {
                        "min": AvatarController.MIN_RES,
                        "max": AvatarController.MAX_RES
                    }));
                }

                if(!meta.format || !AvatarController.ALLOWED_FORMATS.includes(meta.format)) {
                    return await resp.status(400).send(i18next.t("errors.image.invalidFormat", {"formats": AvatarController.ALLOWED_FORMATS.join(", ")}));
                }

                await parsed.resize({
                    width: AvatarController.TARGET_RES,
                    height: AvatarController.TARGET_RES,
                    fit: "cover",
                    withoutEnlargement: true
                }).jpeg({
                    quality: 100
                }).toFile(filePath);
            } catch (err: unknown) {
                resp.log.error("Error processing image: %o", err);
                return await resp.status(400).send(i18next.t("errors.image.invalidContent"));
            }
        }

        const oldAvatar = user.avatar_id;
        user.avatar_id = filename;

        try {
            await resp.server.db.getUserRepository().update(user);
        } catch (err: unknown) {
            resp.log.error("Error saving image: %o", err);
            return await resp.status(500).send(i18next.t("errors.image.errorSaving"));
        }

        if(oldAvatar) {
            this.deleteAvatarFile(resp.server.db.getUserRepository(), resp.server.config.dataDir, oldAvatar).catch((err: unknown) => {
                resp.server.log.error("Could not delete old avatar: %o", err);
            });
        }

        return await resp.status(201).send();
    }

    private async deleteAvatar(user: User, resp: FastifyReply): Promise<unknown> {
        if(user.avatar_id) {
            try {
                const avatarId = user.avatar_id;
                user.avatar_id = null;
                await resp.server.db.getUserRepository().update(user);
                await this.deleteAvatarFile(resp.server.db.getUserRepository(), resp.server.config.dataDir, avatarId);
            } catch (err: unknown) {
                resp.log.error("Error deleting avatar: %o", err);
                return resp.status(500).send(i18next.t("errors.deletingAvatar"));
            }
        }
        return resp.status(204).send();
    }

    protected getHandler(): HandlerFunction {
        return async (req: FastifyRequest, resp: FastifyReply) => {
            const user = req.session!.user!;
            const settings = req.body as AvatarForm;

            if(settings.new_avatar) {
                return this.uploadAvatar(user, settings.new_avatar, resp);
            }
            else {
                return this.deleteAvatar(user, resp);
            }
        };
    }

}