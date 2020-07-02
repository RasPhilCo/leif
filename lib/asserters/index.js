"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_1 = require("./file");
const json_1 = require("./json");
const node_1 = require("./node");
exports.AsserterLookup = {
    'file-is-exact': file_1.FileExactMatchAsserter,
    'file-does-not-exist': file_1.FileDoesNotExistAsserter,
    'json-has-properties': json_1.JsonHasPropertiesAsserter,
    'node-project-has-deps': node_1.NodeProjectHasDepsAsserter,
    'node-project-does-not-have-deps': node_1.NodeProjectDoesNotHaveDepsAsserter,
};
