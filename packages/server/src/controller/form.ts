import { FastifyInstance } from "fastify";
import { Controller } from "./controller";
import { SimplePage } from "./page";
import { ControllerConfiguration, ControllerConfigurationDecorator, JsonSchema, ValidateDecorator } from "./decorators";

export abstract class Form extends Controller {

    private readonly viewTemplate: string;
    private readonly decorators: ControllerConfigurationDecorator | undefined;

    protected constructor(url: string, viewTemplate: string, schema: JsonSchema, configDecorators?: ControllerConfigurationDecorator) {
        super("post", url, new ValidateDecorator(configDecorators ?? new ControllerConfiguration(), schema));
        this.decorators = configDecorators;
        this.viewTemplate = viewTemplate;
    }

    public register(server: FastifyInstance): void {
        super.register(server);
        new SimplePage(this.url, this.viewTemplate, this.decorators).register(server);
    }
    
}