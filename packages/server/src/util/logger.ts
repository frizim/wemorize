export type LogFunction = (msg: string, ...args: unknown[]) => void;

export interface Logger {
    info: LogFunction,
    warn: LogFunction,
    error: LogFunction,
    debug: LogFunction;
}