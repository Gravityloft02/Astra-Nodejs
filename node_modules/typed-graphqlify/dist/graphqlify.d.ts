import { Params } from './render';
interface QueryObject {
    [x: string]: any;
}
export declare const query: {
    (queryObject: QueryObject): string;
    (operationName: string, queryObject: QueryObject): string;
};
export declare const mutation: {
    (queryObject: QueryObject): string;
    (operationName: string, queryObject: QueryObject): string;
};
export declare const subscription: {
    (queryObject: QueryObject): string;
    (operationName: string, queryObject: QueryObject): string;
};
export declare function params<T>(params: Params, input: T): T;
export declare function alias<T extends string>(alias: T, target: string): T;
export declare function fragment<T extends Record<string, unknown>>(name: string, typeName: string, input: T): T;
export declare function rawString(input: string): string;
export {};
