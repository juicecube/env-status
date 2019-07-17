#!/usr/bin/env node
"use strict";

const path = require('path'),
      Promise = require('bluebird'),
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

const createLand = branch => {
  spawnSync('arc', ['land', '--onto', branch, ...args], {
    stdio: 'inherit'
  });
};

const landLocalBranch = (branch, result = 0) => {
  if (localVersion !== branchNameVersion) {
    console.log(chalk.red(`The '${branchName}' branch has a wrong version or a wrong name.`));
    process.exit(1);
  }

  envStatus.getOriginBranchVersion(branch).then(version => {
    if (envStatus.compareVersion(localVersion, version) === result) {
      createLand(branch);

      if (branch === 'master') {
        spawnSync('git', ['tag', 'v' + version]);
        spawnSync('git', ['push', '--tags']);
      }

      process.exit(0);
    }

    console.log(chalk.red(`The '${branchName}' branch has a wrong version.`));
    process.exit(1);
  });
}; // 当前分支为others的话不处理


if (branchType === BRANCH_TYPES.OTHERS) {
  console.log(chalk.yellow(`Branch '${branchName}' is not viable for arc-land.`));
  process.exit(0);
} // 当前分支为迭代分支，判断本地和远程迭代版本是否一致


if (branchType === BRANCH_TYPES.ITERATION_FEATURE) {
  landLocalBranch(branchNameVersion, 0);
} // 当前分支为迭代公共分支


if (branchType == BRANCH_TYPES.ITERATION) {
  Promise.all([envStatus.getOriginBranchVersion('master'), envStatus.fetchEnvData('staging')]).then(values => {
    const masterVersion = values[0];
    const stagingInfo = values[1]; // staging环境是否异常

    if (stagingInfo.version !== masterVersion || stagingInfo.err) {
      console.log(chalk.red('Staging environment should keep same version with master!'));
      process.exit(1);
    }

    envStatus.fetchEnvData('production').then(pInfo => {
      // production环境是否和master一致并且当前分支版本大于master
      if (pInfo.version === masterVersion && envStatus.compareVersion(localVersion, masterVersion) === 1) {
        createLand('master');
      } else {
        console.log(chalk.red(`The '${branchName}' branch is not viable for arc-land`));
        process.exit(1);
      }
    });
  }).catch(err => {
    console.log(chalk.red('Need more Staging or Production environment info!'));
    process.exit(1);
  });
} // 当前分支为迭代fix分支


if (branchType === BRANCH_TYPES.ITERATION_FIX) {
  Promise.all([envStatus.getOriginBranchVersion('master'), envStatus.fetchEnvData('production')]).then(values => {
    const masterVersion = values[0];
    const prodVersion = values[1].version;

    if (envStatus.compareVersion(masterVersion, prodVersion) === 1) {
      landLocalBranch('master', 0);
    }
  }).catch(err => {
    console.log(chalk.red('Need more Staging or Production environment info!'));
    process.exit(1);
  });
} // 当前分支为hotfix分支


if (branchType == BRANCH_TYPES.HOTFIX) {
  landLocalBranch('master', 1);
}