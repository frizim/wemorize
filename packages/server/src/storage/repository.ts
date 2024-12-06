export interface Repository<T, K> {
    getById?(id: K): Promise<T>;
    create(item: T): Promise<K>;
    update?(item: T): Promise<boolean>;
    delete(id: K): Promise<boolean>;
}

export class DataNotFoundError extends Error {

    constructor(type: string) {
        super(type + " not found");
    }

}