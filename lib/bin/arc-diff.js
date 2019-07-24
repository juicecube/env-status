#!/usr/bin/env node
"use strict";

const path = require('path'),
      chalk = require('chalk'),
      envStatus = require('../index');

const {
  spawnSync
} = require('child_process');

const args = process.argv.slice(2);
const {
  BRANCH_TYPES
} = envStatus;

const branchName = envStatus.getBranchName(),
      branchType = envStatus.getBranchType(branchName),
      branchNameVersion = envStatus.getVersionFromBranchName(branchName),
      localVersion = require(path.resolve('package.json')).version;

const createDiff = branch => {
  spawnSync('arc', ['diff', `origin/${branch}`, ...args], {
    stdio: 'inherit'
  });
};

const handleBranch = (branch, result = 0) => {
  if (localVersion !== branchNameVersion) {
    console.log(chalk.red(`Your local version is wrong.`));
    process.exit(1);
  }

  envStatus.getOriginBranchVersion(branch).then(version => {
    if (envStatus.compareVersion(localVersion, version) === result) {
      createDiff(branch);
      process.exit(0);
    }

    console.log(chalk.red(`Not ready for arc diff, please check the local/remote version to confirm the version is correct.`));
    process.exit(1);
  });
}; // 当前分支为others的话不处理


if (branchType === BRANCH_TYPES.OTHERS) {
  console.log(chalk.yellow(`This branch is not suit for this tool.`));
  process.exit(0);
} // 当前分支为迭代分支，判断本地和远程迭代版本是否一致


if (branchType === BRANCH_TYPES.ITERATION_FEATURE) {
  handleBranch(branchNameVersion, 0);
} // 当前分支为迭代fix分支，判断本地和远程master是否一致


if (branchType === BRANCH_TYPES.ITERATION_FIX) {
  handleBranch('master', 0);
} // 当前分支为hotfix分支或者公共的迭代分支，判断版本是否大于master


if (branchType == BRANCH_TYPES.HOTFIX || branchType == BRANCH_TYPES.ITERATION) {
  handleBranch('master', 1);
}