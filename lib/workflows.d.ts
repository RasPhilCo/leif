import { Leif } from './types';
export default class WorkflowService {
    static workflowsFromYaml(yaml: Leif.Yaml.File, templateDir: string, dryRun?: boolean): Leif.Workflow[];
    static runMany(workflows: Leif.Workflow[]): Promise<void>;
    static run(workflow: Leif.Workflow): Promise<void>;
    id: string;
    repos: string[];
    sequences: Leif.Sequence[];
    constructor(config: Leif.Workflow);
    run(): Promise<void>;
}
