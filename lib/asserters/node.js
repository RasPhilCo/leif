"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const base_1 = require("./base");
const utils_1 = require("../utils");
class NodeProjectHasDepsAsserter extends base_1.default {
    async uniqWork() {
        if (!fs.existsSync(path.join(this.workingDir, 'package.json'))) {
            console.log('No package.json file found, skipping...');
            return;
        }
        const manager = this.assertion.manager;
        const depsToInstall = this.assertion.dependencies;
        const devToInstall = this.assertion.dev_dependencies;
        if (manager !== 'yarn' && manager !== 'npm') {
            throw new Error(`Manager ${this.assertion.manager} not found`);
        }
        if (depsToInstall && depsToInstall.length > 0) {
            if (this.assertion.manager === 'yarn') {
                await utils_1.exec(`cd ${this.workingDir}; yarn add ${depsToInstall.join(' ')}`);
            }
            else if (this.assertion.manager === 'npm') {
                await utils_1.exec(`cd ${this.workingDir}; npm install ${depsToInstall.join(' ')}`);
            }
        }
        if (devToInstall && devToInstall.length > 0) {
            if (this.assertion.manager === 'yarn') {
                await utils_1.exec(`cd ${this.workingDir}; yarn add --dev ${devToInstall.join(' ')}`);
            }
            else if (this.assertion.manager === 'npm') {
                await utils_1.exec(`cd ${this.workingDir}; npm install --save-dev ${devToInstall.join(' ')}`);
            }
        }
    }
}
exports.NodeProjectHasDepsAsserter = NodeProjectHasDepsAsserter;
class NodeProjectDoesNotHaveDepsAsserter extends base_1.default {
    async uniqWork() {
        if (!fs.existsSync(path.join(this.workingDir, 'package.json'))) {
            console.log('No package.json file found, skipping...');
            return;
        }
        const manager = this.assertion.manager;
        const depsToUninstall = this.assertion.dependencies;
        if (manager !== 'yarn' || manager !== 'npm') {
            throw new Error(`Manager ${this.assertion.manager} not found`);
        }
        if (depsToUninstall && depsToUninstall.length > 0) {
            try {
                if (this.assertion.manager === 'yarn') {
                    await utils_1.exec(`cd ${this.workingDir}; yarn remove ${depsToUninstall.join(' ')}`);
                }
                else if (this.assertion.manager === 'npm') {
                    await utils_1.exec(`cd ${this.workingDir}; npm uninstall ${depsToUninstall.join(' ')}`);
                }
            }
            catch (error) {
                if (error.toString().match(/This module isn't specified in a/)) {
                    // carry on
                }
                else {
                    console.log(error);
                }
            }
        }
    }
}
exports.NodeProjectDoesNotHaveDepsAsserter = NodeProjectDoesNotHaveDepsAsserter;
