export namespace Leif {
  export namespace Yaml {
    export type Repo = { group: string; github_org: string; repos: string[] }
    export type Sequence = { description: string; assertions: any[] }
    export type Workflow = { apply_to_repos?: string[]; apply_to_groups?: string[]; sequences: string[] }
    export type File = {
      version: string;
      repos: Array<string | Repo>;
      sequences: { [key: string]: Sequence };
      workflows: { [key: string]: Workflow };
    }
  }

  export type Assertion = {
    type: string;
    description?: string;
  }

  export type Sequence = {
    id: string;
    description?: string;
    branch_name?: string;
    assertions: Assertion[];
    repos: string[];
    templateDir: string;
    dryRun: boolean;
  }

  export type Workflow = {
    id: string;
    repos: string[];
    sequences: Sequence[];
  }
}
