"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
exports.exec = util.promisify(require('child_process').exec);
exports.indentLog = (spaces, ...loglines) => {
    loglines.forEach(line => {
        console.log(`${''.padEnd(spaces)}${line}`);
    });
};
exports.syncProcessArray = async (array, fn) => {
    for (let i = 0; i < array.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await fn(array[i]);
    }
    return Promise.resolve();
};
function masterBranchName() {
    const { stdout } = require('child_process').execSync(`git symbolic-ref --short HEAD`);
    return stdout.trim('\n');
}
exports.masterBranchName = masterBranchName;
