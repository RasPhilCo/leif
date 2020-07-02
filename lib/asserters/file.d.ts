import AsserterBase from './base';
export declare class FileExactMatchAsserter extends AsserterBase {
    protected uniqWork(): Promise<void>;
}
export declare class FileDoesNotExistAsserter extends AsserterBase {
    protected uniqWork(): Promise<void>;
}
