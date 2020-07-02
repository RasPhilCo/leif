"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const fs = require("fs-extra");
const path = require("path");
const utils_1 = require("../utils");
const workflows_1 = require("../workflows");
const yaml = require('js-yaml');
const readYAMLFromRelativePath = async (relativeFilepath) => {
    const fileContents = await fs.readFile(path.join(process.cwd(), relativeFilepath), 'utf8');
    return yaml.safeLoad(fileContents);
};
class Run extends command_1.Command {
    async run() {
        const { args, flags } = this.parse(Run);
        const dir = flags.dir === '.' ? process.cwd() : flags.dir;
        const dryRun = Boolean(flags['dry-run']);
        const runWorkflowService = async (workflowFilepath) => {
            const yamlContents = await readYAMLFromRelativePath(workflowFilepath);
            const preparedWorkflows = workflows_1.default.workflowsFromYaml(yamlContents, dir, dryRun);
            return workflows_1.default.runMany(preparedWorkflows);
        };
        utils_1.syncProcessArray([args.yaml], runWorkflowService);
    }
}
exports.default = Run;
Run.description = 'run leif state workflows';
Run.flags = {
    'dry-run': command_1.flags.boolean({
        char: 'd',
        description: 'view output without commiting changes',
    }),
    dir: command_1.flags.string({
        char: 'f',
        description: 'absolute path to directory with supporting files',
        required: true,
        default: '.',
    }),
};
Run.args = [
    {
        name: 'yaml',
        description: 'path to a leif yaml file',
        required: true,
    },
];
