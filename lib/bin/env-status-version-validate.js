#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chalk = require("chalk");
var path = require("path");
var envStatus = require("../index");
var branch = envStatus.getBranchName();
var branchType = envStatus.getBranchType(branch);
if (branchType !== envStatus.BRANCH_TYPES.OTHERS) {
    var versionInBranchName = envStatus.getVersionFromBranchName(branch);
    var versionInPkg = require(path.resolve('package.json')).version;
    if (versionInBranchName !== versionInPkg) {
        console.log(chalk.red("Version in branch name " + versionInBranchName + " is not consistant with version in package.json " + versionInPkg + "!"));
        process.exit(1);
    }
}
