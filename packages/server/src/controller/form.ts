import { FastifyInstance, FastifyRequest } from "fastify";
import { Controller } from "./controller";
import { Page } from "./page";
import { ControllerConfiguration, ControllerConfigurationDecorator, JsonSchema, ValidateDecorator } from "./decorators";

export abstract class Form extends Controller {

    private readonly viewTemplate: string;
    private readonly decorators: ControllerConfigurationDecorator | undefined;

    protected constructor(url: string, viewTemplate: string, schema: JsonSchema, configDecorators?: ControllerConfigurationDecorator) {
        super("post", url, new ValidateDecorator(configDecorators ?? new ControllerConfiguration(), schema));
        this.decorators = configDecorators;
        this.viewTemplate = viewTemplate;
    }

    protected getVariables(req: FastifyRequest): Promise<object> {
        return Promise.resolve({});
    }

    public register(server: FastifyInstance): void {
        super.register(server);
        const form = this;
        new class extends Page {

            protected getVariables(req: FastifyRequest): Promise<object> {
                return form.getVariables(req);
            }

        }(this.url, this.viewTemplate, this.decorators).register(server);
    }
    
}