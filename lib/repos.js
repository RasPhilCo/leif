"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const cli_ux_1 = require("cli-ux");
const utils_1 = require("./utils");
class RepoService {
    static async runMany(repos) {
        await utils_1.syncProcessArray(repos, RepoService.run);
        console.log('');
    }
    static async run(repoFullName) {
        const localDir = `${process.env.HOME}/.leif/github`;
        await fs.ensureDir(localDir);
        const localRepoDir = `${localDir}/${repoFullName}`;
        if (fs.existsSync(localRepoDir)) {
            console.log(`Pulling origin master for repo ${repoFullName}...`);
            await utils_1.exec(`git -C ${localRepoDir} checkout master`);
            await utils_1.exec(`git -C ${localRepoDir} fetch --prune`);
            await utils_1.exec(`git -C ${localRepoDir} pull`);
            await utils_1.exec(`git -C ${localRepoDir} branch -vv | grep ': gone' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`);
            await utils_1.exec(`git -C ${localRepoDir} branch -vv | grep -vE 'origin/' | awk '{print $1}' | xargs git -C ${localRepoDir} branch -D`);
        }
        else {
            cli_ux_1.default.action.start(`Cloning from github repo ${repoFullName}`);
            await utils_1.exec(`git clone git@github.com:${repoFullName}.git ${localRepoDir}`);
            cli_ux_1.default.action.stop();
        }
    }
}
exports.default = RepoService;
