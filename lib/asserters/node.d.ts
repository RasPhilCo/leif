import AsserterBase from './base';
export declare class NodeProjectHasDepsAsserter extends AsserterBase {
    protected uniqWork(): Promise<void>;
}
export declare class NodeProjectDoesNotHaveDepsAsserter extends AsserterBase {
    protected uniqWork(): Promise<void>;
}
