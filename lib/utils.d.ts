export declare const exec: Function;
export declare const indentLog: (spaces: number, ...loglines: string[]) => void;
export declare const syncProcessArray: (array: any[], fn: (x: any) => void) => Promise<void>;
export declare function masterBranchName(): string;
