"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rest_1 = require("@octokit/rest");
const asserters_1 = require("./asserters");
const utils_1 = require("./utils");
const masterMain = utils_1.masterBranchName();
const GitHubClient = new rest_1.Octokit({
    auth: process.env.GITHUB_OAUTH_TOKEN || process.env.GITHUB_TOKEN,
});
class SequenceService {
    static async runMany(seqs) {
        await utils_1.syncProcessArray(seqs, SequenceService.run);
    }
    static async run(seq) {
        utils_1.indentLog(0, `# Running sequence ${seq.id}`, '');
        utils_1.indentLog(0, `## With ${seq.assertions.length} assertions: `);
        utils_1.indentLog(2, ...seq.assertions.map((a) => '- ' + a.description || a.type), '');
        utils_1.indentLog(2, 'On repos:');
        utils_1.indentLog(2, ...seq.repos, '');
        for (const repoFullName of seq.repos) {
            // eslint-disable-next-line no-await-in-loop
            await SequenceService.applyAssertionsToRepo(repoFullName, seq);
        }
    }
    static async applyAssertionsToRepo(repoFullName, sequence) {
        // 0. check if PR exists already
        // 1. create working branch (if it doesn't exist)
        // 2. do work
        // 3. check if work created changes
        // 4. if changes, commit changes
        // 5. push commit
        // 6. create PR
        // pre-work
        const sequenceLength = sequence.assertions.length;
        const workingDir = `${process.env.HOME}/.leif/github/${repoFullName}`;
        const prDescription = sequence.description || `leif sequence ${sequence.id}`;
        const branchName = sequence.id;
        const dryRun = sequence.dryRun;
        utils_1.indentLog(4, repoFullName);
        // 0.
        const [owner, repoShortName] = repoFullName.split('/');
        const { data: pullRequests } = await GitHubClient.pulls.list({
            owner,
            repo: repoShortName,
        });
        const pullReqExists = pullRequests.find((p) => p.head.ref === branchName);
        if (pullReqExists) {
            utils_1.indentLog(6, `leif has already pushed a PR for this assertion on branch ${branchName}...`);
            utils_1.indentLog(6, 'But checking for changes...');
        }
        // 1. & 2. & 3. & 4.
        // moved inside asserter service
        const meta = {
            length: sequenceLength,
        };
        for (let i = 0; i < sequenceLength; i++) {
            meta.current = i + 1;
            meta.first = i + 1 === 1;
            meta.last = i + 1 === sequenceLength;
            const assertion = sequence.assertions[i];
            sequence = Object.assign(sequence, meta);
            // eslint-disable-next-line no-await-in-loop
            utils_1.indentLog(6, `Assert: ${assertion.description} (type: ${assertion.type})`);
            const Asserter = asserters_1.AsserterLookup[assertion.type];
            const asserter = new Asserter({
                assertion,
                repoFullName,
                dryRun,
                branchName,
                templateDir: sequence.templateDir,
            });
            // eslint-disable-next-line no-await-in-loop
            await asserter.run();
        }
        // 5.
        let skipCreatingPR = false;
        const { stdout } = await utils_1.exec(`git -C ${workingDir} diff ${branchName} origin/${masterMain} --name-only`);
        if (stdout) {
            if (dryRun) {
                // clean-up dryRun
                utils_1.indentLog(6, '(In --dry-run mode, output below does not actually happen)');
                if (meta.last) {
                    await utils_1.exec(`git -C ${workingDir} branch -D ${branchName}`);
                }
            }
            else {
                await utils_1.exec(`git -C ${workingDir} push origin ${branchName}`);
            }
            utils_1.indentLog(6, `Pushing branch ${branchName} to GitHub...`);
        }
        else {
            skipCreatingPR = true;
            utils_1.indentLog(6, `Deleting empty branch ${branchName}...`);
            await utils_1.exec(`git -C ${workingDir} branch -D ${branchName} `);
        }
        // 6.0
        if (pullReqExists || skipCreatingPR || !meta.last)
            return utils_1.indentLog(0, '');
        try {
            utils_1.indentLog(6, 'Creating PR...');
            if (!dryRun) {
                await GitHubClient.pulls.create({
                    owner,
                    repo: repoShortName,
                    title: prDescription,
                    head: branchName,
                    base: masterMain,
                });
            }
        }
        catch (error) {
            console.error(error);
        }
        utils_1.indentLog(0, '');
    }
}
exports.default = SequenceService;
