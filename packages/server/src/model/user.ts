export class User {
    readonly id: number;
    #name: string;
    #email: string;
    

    constructor(name: string, email: string = '', id: number = -1) {
        this.id = id;
        this.#name = name;
        this.#email = email;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.#name;
    }

    public getEmail(): string {
        return this.#email;
    }

    public hasEmail(): boolean {
        return this.#email != '';
    }
}