"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const base_1 = require("./base");
class FileExactMatchAsserter extends base_1.default {
    async uniqWork() {
        await fs.copy(path.join(this.templateDir, this.assertion.source_relative_filepath), path.join(this.workingDir, this.assertion.target_relative_filepath));
    }
}
exports.FileExactMatchAsserter = FileExactMatchAsserter;
class FileDoesNotExistAsserter extends base_1.default {
    async uniqWork() {
        await fs.remove(path.join(this.workingDir, this.assertion.target_relative_filepath));
    }
}
exports.FileDoesNotExistAsserter = FileDoesNotExistAsserter;
