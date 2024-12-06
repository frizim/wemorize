import Ajv, { ValidateFunction } from 'ajv';

export abstract class Schema<T extends object> {
    readonly jsonSchema: ValidateFunction<T>;
    static readonly ajv = new Ajv();

    constructor(jsonSchema: object) {
        this.jsonSchema = Schema.ajv.compile<T>(jsonSchema);
    }

    abstract makeObject(): T;

    get(input: object): T | boolean {
        if(this.jsonSchema(input)) {
            return Object.assign(this.makeObject(), input);
        }
        return false;
    }

    fromString(input: string): T | boolean {
        return this.get(JSON.parse(input));
    }
}