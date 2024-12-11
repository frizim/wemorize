import { FastifyReply, FastifyRequest, RouteHandlerMethod } from "fastify";
import { Form } from "../form";
import { AuthenticationDecorator, CheckTokenDecorator, ControllerConfiguration, ValidateDecorator } from "../decorators";
import { Role } from "../../model/user";
import { Card, CardQuestion, SelftestCardAnswer } from "../../model/card";
import i18next from "i18next";
import { Controller } from "../controller";

interface EditCardForm {
    card_id: number,
    prev_id?: number,
    next_id?: number,
    module?: number,
    question?: string,
    answer?: string
}

interface CardEditorParams {
    courseId: number,
    courseLangId: number
}

const PARAM_SCHEMA = {
    type: "object",
    required: ["courseId", "courseLangId"],
    properties: {
        "courseId": {
            type: "integer",
            minimum: 1,
            maximum: Math.pow(2, 32)
        },
        "courseLangId": {
            type: "integer",
            minimum: 1,
            maximum: Math.pow(2, 32)
        }
    }
}

export class CreateCardController extends Controller {

    public constructor() {
        super("put", "/courses/:courseId/languages/:courseLangId/cards", new AuthenticationDecorator(new ValidateDecorator(new ValidateDecorator(new ControllerConfiguration(), {
            type: "object",
            required: ["module", "question", "answer"],
            properties: {
                module: {
                    type: "integer",
                    minimum: 0,
                    maximum: Math.pow(2, 32)
                },
                question: {
                    type: "string",
                    minLength: 8,
                    maxLength: 10000
                },
                answer: {
                    type: "string",
                    minLength: 8,
                    maxLength: 10000
                }
            }
        }), PARAM_SCHEMA, "params"), Role.moderator, Role.admin));
    }

    protected getHandler(): RouteHandlerMethod {
        return async(req: FastifyRequest, resp: FastifyReply) => {
            const card = req.body as EditCardForm;
            let courseLang;
            
            try {
                courseLang = await req.server.db.getCourseLanguageRepository().getById((req.params as CardEditorParams).courseLangId);
            } catch(err: unknown) {
                req.log.debug(err);
                return resp.status(404).send();
            }

            try {
                const res = await req.server.db.getCardRepository().create({
                    id: -1,
                    course_language: courseLang,
                    question: new CardQuestion({content: JSON.stringify({text: card.question})}),
                    answer: new SelftestCardAnswer({content: JSON.stringify({text: card.answer})}),
                    module: card.module ?? 1,
                    next_id: null,
                    value: 0
                });

                return await resp.status(200).send(res);
            } catch(err: unknown) {
                req.log.debug(err);
                return resp.status(500).send(i18next.t("card.creationFailed"));
            }
        }
    }
    
}

export class EditCardsController extends Form {

    public constructor() {
        super("/courses/:courseId/languages/:courseLangId/cards", "admin/edit_cards.tpl", {
            type: "object",
            required: ["card_id"],
            properties: {
                card_id: {
                    type: "integer",
                    minimum: 1,
                    maximum: Math.pow(2, 64)
                },
                prev_id: {
                    type: "integer",
                    minimum: 0,
                    maximum: Math.pow(2, 64)
                },
                next_id: {
                    type: "integer",
                    minimum: 0,
                    maximum: Math.pow(2, 64)
                },
                module: {
                    type: "integer",
                    minimum: 0,
                    maximum: Math.pow(2, 32)
                },
                question: {
                    type: "string",
                    minLength: 10,
                    maxLength: 10000
                },
                answer: {
                    type: "string",
                    minLength: 10,
                    maxLength: 10000
                }
            }
        }, new ValidateDecorator(new AuthenticationDecorator(new ControllerConfiguration(), Role.moderator, Role.admin), PARAM_SCHEMA, "params"));
    }

    protected async getVariables(req: FastifyRequest): Promise<object> {
        const {courseId, courseLangId} = req.params as CardEditorParams;

        const modules = await req.server.db.getCardRepository().getAllByCourseLanguage(courseLangId);
        const modulesSorted: Record<number,Card[]> = {};
        for(const [module_idx, module] of modules.entries()) {
            const sorted = [];
            sorted[0] = module.get(null)!;
            for(let i = 0; i < module.size - 1; i++) {
                const next: number = sorted[0].id;
                sorted.unshift(module.get(next)!);
            }
            modulesSorted[module_idx] = sorted;
        }

        return {
            course: await req.server.db.getCourseRepository().getById(courseId),
            courseLangId: courseLangId,
            modules: modulesSorted,
            inlineCss: true
        };
    }

    protected getHandler(): RouteHandlerMethod {
        return async(req: FastifyRequest, resp: FastifyReply) => {
            const {courseId} = req.params as CardEditorParams;
            if(!courseId) {
                return resp.status(400).send();
            }

            const form = req.body as EditCardForm;

            let card;
            try {
                card = await req.server.db.getCardRepository().getById(form.card_id);
            } catch (err: unknown) {
                req.log.debug(err);
                return resp.status(400).send(i18next.t("errors.unknownCard"));
            }

            let changed = false;

            if(form.next_id || form.prev_id) {
                if(card.next_id == form.next_id) {
                    return await resp.status(200).send();
                }

                const oldNextId = card.next_id;
                card.next_id = form.next_id ?? null;
                if(await req.server.db.getCardRepository().updatePosition(card, form.prev_id ?? null, oldNextId ?? null)) {
                    return await resp.status(200).send(i18next.t("editor.card.updated"));
                }
                if(form.module && form.module != card.module) {
                    form.module = card.module;
                    changed = true;
                }
            }
            else if(form.question && form.answer) {
                if(form.question && form.question != card.question.content) {
                    card.question.content = JSON.stringify({text: form.question});
                    changed = true;
                }

                if(form.answer && form.answer != card.answer.content) {
                    card.answer.content = JSON.stringify({text: form.answer});
                    changed = true;
                }
            }

            if(changed) {
                try {
                    if(await req.server.db.getCardRepository().update(card)) {
                        return await resp.status(200).send(i18next.t("editor.card.updated"));
                    }
                } catch(err: unknown) {
                    req.log.debug(err);
                }
                return resp.status(500).send(i18next.t("editor.card.error"));
            }
        };
    }
    
}

interface DeleteCardParams {
    courseId: number,
    courseLangId: number,
    cardId: number
}

export class DeleteCardController extends Controller {

    public constructor() {
        super("delete", "/courses/:courseId/languages/:courseLangId/cards/:cardId", 
            new AuthenticationDecorator(new CheckTokenDecorator(new ValidateDecorator(new ControllerConfiguration(), {
                type: "object",
                required: ["courseId", "courseLangId", "cardId"],
                properties: {
                    "courseId": {
                        type: "integer",
                        minimum: 1,
                        maximum: Math.pow(2, 32)
                    },
                    "courseLangId": {
                        type: "integer",
                        minimum: 1,
                        maximum: Math.pow(2, 32)
                    },
                    "cardId": {
                        type: "integer",
                        minimum: 1,
                        maximum: Math.pow(2, 64)
                    }
                }
            }, "params")), Role.moderator, Role.admin));
    }

    protected getHandler(): RouteHandlerMethod {
        return async(req: FastifyRequest, resp: FastifyReply) => {
            const params = req.params as DeleteCardParams;
            if(await req.server.db.getCardRepository().delete(params.cardId)) {
                return resp.status(200).send();
            }

            return resp.status(500).send();
        };
    }

}