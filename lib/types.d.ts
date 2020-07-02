export declare namespace Leif {
    namespace Yaml {
        type Repo = {
            group: string;
            github_org: string;
            repos: string[];
        };
        type Sequence = {
            description: string;
            assertions: any[];
        };
        type Workflow = {
            apply_to_repo?: string[];
            apply_to_groups: string[];
            sequences: string[];
        };
        type File = {
            version: string;
            repos: Array<string | Repo>;
            sequences: {
                [key: string]: Sequence;
            };
            workflows: {
                [key: string]: Workflow;
            };
        };
    }
    type Assertion = {
        type: string;
        description?: string;
    };
    type Sequence = {
        id: string;
        description?: string;
        assertions: Assertion[];
        repos: string[];
        templateDir: string;
        dryRun: boolean;
    };
    type Workflow = {
        id: string;
        repos: string[];
        sequences: Sequence[];
    };
}
