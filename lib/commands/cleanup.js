"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const command_1 = require("@oclif/command");
class Cleanup extends command_1.Command {
    async run() {
        const { args } = this.parse(Cleanup);
        const localDir = `${process.env.HOME}/.leif/github/${args.scope}`;
        await fs.ensureDir(localDir);
    }
}
exports.default = Cleanup;
Cleanup.description = 'remove managed repos';
Cleanup.args = [
    { name: 'scope', description: 'scope of repos to remove' },
];
Cleanup.flags = {};
