"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
class AsserterBase {
    constructor({ assertion, repoFullName, dryRun, branchName, templateDir }) {
        this.assertion = assertion;
        this.branchName = branchName;
        this.templateDir = templateDir;
        this.dryRun = dryRun;
        this.repoFullName = repoFullName;
    }
    get workingDir() {
        return `${process.env.HOME}/.leif/github/${this.repoFullName}`;
    }
    async run() {
        const masterMain = utils_1.masterBranchName(this.workingDir);
        // 1.
        await utils_1.exec(`git -C ${this.workingDir} checkout ${masterMain}`); // branch from master/main
        try {
            await utils_1.exec(`git -C ${this.workingDir} checkout ${this.branchName}`);
            utils_1.indentLog(8, `Checking out branch ${this.branchName}...`);
        }
        catch (error) {
            if (error.toString().match(/did not match/)) {
                await utils_1.exec(`git -C ${this.workingDir} checkout -b ${this.branchName}`);
                utils_1.indentLog(8, `Creating branch ${this.branchName}...`);
            }
            else {
                throw new Error('Error creating a working branch');
            }
        }
        // 2.
        if (this.assertion.if) {
            try {
                await new Promise((res, rej) => {
                    utils_1.exec(`cd ${this.workingDir} && ${this.assertion.if}`, (error, _stdout, _stderr) => {
                        if (error)
                            rej();
                        res();
                    });
                });
                utils_1.indentLog(8, 'Passed `if` guard, continuing assertion...');
            }
            catch (error) {
                utils_1.indentLog(8, 'Did not pass `if` guard, skipping assertion...');
                await utils_1.exec(`git -C ${this.workingDir} checkout ${masterMain}`);
                return;
            }
        }
        await this.uniqWork();
        // 3.
        const { stdout } = await utils_1.exec(`git -C ${this.workingDir} status`);
        if (stdout.toString().match(/nothing to commit, working tree clean/)) {
            // if working dir clean
            utils_1.indentLog(8, 'Working directory clean, no changes to push...');
        }
        else {
            // 4.
            await utils_1.exec(`git -C ${this.workingDir} add --all`);
            await utils_1.exec(`git -C ${this.workingDir} commit -m "${this.commitDescription}" -m "Authored via Leif"`);
            utils_1.indentLog(8, `Commiting changes to branch ${this.branchName}...`);
        }
        // work is done, return to master/main
        await utils_1.exec(`git -C ${this.workingDir} checkout ${masterMain}`);
    }
    async uniqWork() {
        // not implemented==
    }
    get commitDescription() {
        return this.assertion.description || `leif ${this.assertion.type} assertion`;
    }
}
exports.default = AsserterBase;
