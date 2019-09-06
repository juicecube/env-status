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
var chalk = require("chalk");
var child_process_1 = require("child_process");
var path = require("path");
var envStatus = require("../index");
var interfaces_1 = require("../interfaces");
var args = process.argv.slice(2);
var branchName = envStatus.getBranchName();
var branchType = envStatus.getBranchType(branchName);
var branchNameVersion = envStatus.getVersionFromBranchName(branchName);
var localVersion = require(path.resolve('package.json')).version;
var createLand = function (branch) {
    child_process_1.spawnSync('arc', __spreadArrays(['land', '--onto', branch], args), { stdio: 'inherit' });
};
var landLocalBranch = function (branch, result) {
    if (result === void 0) { result = 0; }
    if (localVersion !== branchNameVersion) {
        console.log(chalk.red("The '" + branchName + "' branch has a wrong version or a wrong name."));
        process.exit(1);
    }
    envStatus.getOriginBranchVersion(branch).then(function (version) {
        if (envStatus.compareVersion(localVersion, version) === result) {
            createLand(branch);
            if (branch === 'master') {
                child_process_1.spawnSync('git', ['tag', 'v' + version]);
                child_process_1.spawnSync('git', ['push', '--tags']);
            }
            process.exit(0);
        }
        console.log(chalk.red("The '" + branchName + "' branch has a wrong version."));
        process.exit(1);
    });
};
// 当前分支为others的话不处理
if (branchType === interfaces_1.BRANCH_TYPES.OTHERS) {
    console.log(chalk.yellow("Branch '" + branchName + "' is not viable for arc-land."));
    process.exit(0);
}
// 当前分支为迭代分支，判断本地和远程迭代版本是否一致
if (branchType === interfaces_1.BRANCH_TYPES.ITERATION_FEATURE) {
    landLocalBranch(branchNameVersion, 0);
}
// 当前分支为迭代公共分支
if (branchType === interfaces_1.BRANCH_TYPES.ITERATION) {
    Promise.all([
        envStatus.getOriginBranchVersion('master'),
        envStatus.fetchEnvData('staging'),
    ]).then(function (values) {
        var masterVersion = values[0];
        var stagingInfo = values[1];
        // staging环境是否异常
        if (interfaces_1.isEnvErrDataType(stagingInfo)) {
            console.log(chalk.red('Failed to fetch env data!'));
            process.exit(1);
        }
        else if (stagingInfo.version !== masterVersion) {
            console.log(chalk.red('Staging environment should keep same version with master!'));
            process.exit(1);
        }
        envStatus.fetchEnvData('production').then(function (pInfo) {
            // production环境是否和master一致并且当前分支版本大于master
            if (interfaces_1.isEnvErrDataType(pInfo)) {
                console.log(chalk.red('Failed to fetch env data!'));
                process.exit(1);
            }
            else if (pInfo.version === masterVersion && envStatus.compareVersion(localVersion, masterVersion) === 1) {
                createLand('master');
            }
            else {
                console.log(chalk.red("The '" + branchName + "' branch is not viable for arc-land"));
                process.exit(1);
            }
        });
    }).catch(function (err) {
        console.log(chalk.red('Need more Staging or Production environment info!'));
        process.exit(1);
    });
}
// 当前分支为迭代fix分支
if (branchType === interfaces_1.BRANCH_TYPES.ITERATION_FIX) {
    Promise.all([
        envStatus.getOriginBranchVersion('master'),
        envStatus.fetchEnvData('production'),
    ]).then(function (values) {
        if (interfaces_1.isEnvErrDataType(values[1])) {
            console.log(chalk.red('Failed to fetch env data!'));
            process.exit(1);
            return;
        }
        var masterVersion = values[0];
        var prodVersion = values[1].version;
        if (envStatus.compareVersion(masterVersion, prodVersion) === 1) {
            landLocalBranch('master', 0);
        }
    }).catch(function (err) {
        console.log(chalk.red('Need more Staging or Production environment info!'));
        process.exit(1);
    });
}
// 当前分支为hotfix分支
if (branchType === interfaces_1.BRANCH_TYPES.HOTFIX) {
    landLocalBranch('master', 1);
}
