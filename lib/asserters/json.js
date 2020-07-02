"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const base_1 = require("./base");
class JsonHasPropertiesAsserter extends base_1.default {
    async uniqWork() {
        const sourceJSON = require(path.join(this.templateDir, this.assertion.source_relative_filepath));
        const deepAssign = (target, source) => {
            Object.keys(source).forEach(k => {
                if (typeof source[k] === 'object') {
                    // eslint-disable-next-line no-negated-condition
                    if (!target[k]) {
                        // doesn't exist, just assign it
                        target[k] = source[k];
                    }
                    else {
                        const newTk = deepAssign(target[k], source[k]);
                        target[k] = newTk;
                    }
                }
                else {
                    target[k] = source[k];
                }
            });
            return target;
        };
        const targetJSONPath = path.join(this.workingDir, this.assertion.target_relative_filepath);
        const targetJSON = require(targetJSONPath);
        const assertedJSON = deepAssign(Object.assign({}, targetJSON), sourceJSON);
        await fs.writeFile(targetJSONPath, JSON.stringify(assertedJSON, null, 2) + '\n');
    }
}
exports.JsonHasPropertiesAsserter = JsonHasPropertiesAsserter;
