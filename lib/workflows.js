"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequences_1 = require("./sequences");
const repos_1 = require("./repos");
const utils_1 = require("./utils");
class WorkflowService {
    constructor(config) {
        this.id = config.id;
        this.repos = config.repos;
        this.sequences = config.sequences;
    }
    static workflowsFromYaml(yaml, templateDir, dryRun = false) {
        return Object.keys(yaml.workflows).map((id) => {
            const workflow = yaml.workflows[id];
            const prepared = { id, repos: [], sequences: [] };
            // 1. turn apply_to_X to repos
            prepared.repos = prepared.repos.concat(workflow.apply_to_repo || []);
            workflow.apply_to_groups.forEach((groupId) => {
                const matchingGroupIndx = yaml.repos.findIndex(r => {
                    return typeof r !== 'string' && r.group === groupId;
                });
                if (matchingGroupIndx < 0)
                    return;
                const matchingGroup = yaml.repos[matchingGroupIndx];
                const matchingRepos = matchingGroup.repos.map((repo) => `${matchingGroup.github_org}/${repo}`);
                prepared.repos = prepared.repos.concat(matchingRepos);
            });
            // 2. turn sequence id's to sequence arrays
            workflow.sequences.forEach((yamlSeqId) => {
                const yamlSeq = yaml.sequences[yamlSeqId];
                const seq = Object.assign(Object.assign({ id: yamlSeqId }, yamlSeq), { repos: prepared.repos, templateDir, dryRun });
                prepared.sequences = prepared.sequences.concat(seq);
            });
            return prepared;
        });
    }
    static async runMany(workflows) {
        await utils_1.syncProcessArray(workflows, WorkflowService.run);
    }
    static async run(workflow) {
        const w = new WorkflowService(workflow);
        return w.run();
    }
    async run() {
        utils_1.indentLog(0, `Running workflow ${this.id}`);
        utils_1.indentLog(0, '=================\n');
        // 1. pull repo's origin master/main
        await repos_1.default.runMany(this.repos);
        // 2. run sequences
        await sequences_1.default.runMany(this.sequences);
    }
}
exports.default = WorkflowService;
