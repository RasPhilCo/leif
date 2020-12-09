"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const { exec: execz, execSync } = require('child_process');
exports.exec = util.promisify(execz);
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
function masterBranchName(cwd) {
    return String(execSync(`git -C ${cwd} symbolic-ref --short HEAD`)).replace('\n', '');
}
exports.masterBranchName = masterBranchName;
