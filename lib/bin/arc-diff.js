#!/usr/bin/env node
"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var path = require("path");
var chalkModule = require("chalk");
var envStatus = require("../index");
var chalk = chalkModule;
var args = process.argv.slice(2);
var BRANCH_TYPES = envStatus.BRANCH_TYPES;
var branchName = envStatus.getBranchName(), branchType = envStatus.getBranchType(branchName), branchNameVersion = envStatus.getVersionFromBranchName(branchName), localVersion = require(path.resolve('package.json')).version;
var createDiff = function (branch) {
    child_process_1.spawnSync('arc', __spreadArrays(['diff', "origin/" + branch], args), { stdio: 'inherit' });
};
var handleBranch = function (branch, result) {
    if (result === void 0) { result = 0; }
    if (localVersion !== branchNameVersion) {
        console.log(chalk.red("The '" + branchName + "' branch has a wrong version or a wrong name."));
        process.exit(1);
    }
    envStatus.getOriginBranchVersion(branch).then(function (version) {
        if (envStatus.compareVersion(localVersion, version) === result) {
            createDiff(branch);
            process.exit(0);
        }
        console.log(chalk.red("The '" + branchName + "' branch has a wrong version."));
        process.exit(1);
    });
};
// 当前分支为others的话不处理
if (branchType === BRANCH_TYPES.OTHERS) {
    console.log(chalk.yellow("Branch '" + branchName + "' is not viable for arc-diff."));
    process.exit(0);
}
// 当前分支为迭代分支，判断本地和远程迭代版本是否一致
if (branchType === BRANCH_TYPES.ITERATION_FEATURE) {
    handleBranch(branchNameVersion, 0);
}
// 当前分支为迭代fix分支，判断本地和远程master是否一致
if (branchType === BRANCH_TYPES.ITERATION_FIX) {
    handleBranch('master', 0);
}
// 当前分支为hotfix分支或者公共的迭代分支，判断版本是否大于master
if (branchType == BRANCH_TYPES.HOTFIX || branchType == BRANCH_TYPES.ITERATION) {
    handleBranch('master', 1);
}
