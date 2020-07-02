export interface AsserterServiceConfig {
    assertion: {
        apply_only_to_repos: string[];
    };
    dryRun: boolean;
    repoFullName: string;
    branchName: string;
    templateDir: string;
}
export default abstract class AsserterBase {
    protected assertion: any;
    protected branchName: string;
    protected dryRun: boolean;
    protected templateDir: string;
    protected repoFullName: string;
    constructor({ assertion, repoFullName, dryRun, branchName, templateDir }: AsserterServiceConfig);
    protected get workingDir(): string;
    run(): Promise<void>;
    protected uniqWork(): Promise<void>;
    private get commitDescription();
}
