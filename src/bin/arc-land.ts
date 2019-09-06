#!/usr/bin/env node
import {spawnSync} from 'child_process';
import * as path from 'path';
import * as chalk from 'chalk';
import * as envStatus from '../index';
import {EnvData, isEnvErrDataType} from '../interfaces';

const args = process.argv.slice(2);
const {BRANCH_TYPES} = envStatus;
const branchName = envStatus.getBranchName(),
  branchType = envStatus.getBranchType(branchName),
  branchNameVersion = envStatus.getVersionFromBranchName(branchName),
  localVersion = require(path.resolve('package.json')).version;

const createLand = (branch: string) => {
  spawnSync('arc', ['land', '--onto', branch, ...args], {stdio: 'inherit'});
};

const landLocalBranch = (branch: string, result = 0) => {
  if (localVersion !== branchNameVersion) {
    console.log(chalk.red(`The '${branchName}' branch has a wrong version or a wrong name.`));
    process.exit(1);
  }
  envStatus.getOriginBranchVersion(branch).then((version: string) => {
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
};

// 当前分支为others的话不处理
if (branchType === BRANCH_TYPES.OTHERS) {
  console.log(chalk.yellow(`Branch '${branchName}' is not viable for arc-land.`));
  process.exit(0);
}

// 当前分支为迭代分支，判断本地和远程迭代版本是否一致
if (branchType === BRANCH_TYPES.ITERATION_FEATURE) {
  landLocalBranch(branchNameVersion, 0);
}

// 当前分支为迭代公共分支
if (branchType == BRANCH_TYPES.ITERATION) {
  Promise.all([
    envStatus.getOriginBranchVersion('master'),
    envStatus.fetchEnvData('staging'),
  ]).then((values) => {
    const masterVersion = values[0];
    const stagingInfo = values[1];

    // staging环境是否异常
    if (isEnvErrDataType(stagingInfo)) {
      console.log(chalk.red('Failed to fetch env data!'));
      process.exit(1);
    } else if (stagingInfo.version !== masterVersion) {
      console.log(chalk.red('Staging environment should keep same version with master!'));
      process.exit(1);
    }
    envStatus.fetchEnvData('production').then((pInfo) => {
      // production环境是否和master一致并且当前分支版本大于master
      if (isEnvErrDataType(pInfo)) {
        console.log(chalk.red('Failed to fetch env data!'));
        process.exit(1);
      } else if (pInfo.version === masterVersion && envStatus.compareVersion(localVersion, masterVersion) === 1) {
        createLand('master');
      } else {
        console.log(chalk.red(`The '${branchName}' branch is not viable for arc-land`));
        process.exit(1);
      }
    });
  }).catch((err) => {
    console.log(chalk.red('Need more Staging or Production environment info!'));
    process.exit(1);
  });
}

// 当前分支为迭代fix分支
if (branchType === BRANCH_TYPES.ITERATION_FIX) {
  Promise.all([
    envStatus.getOriginBranchVersion('master'),
    envStatus.fetchEnvData('production'),
  ]).then((values: [string, EnvData]) => {
    if (isEnvErrDataType(values[1])) {
      console.log(chalk.red('Failed to fetch env data!'));
      process.exit(1);
      return;
    }

    const masterVersion = values[0];
    const prodVersion = values[1].version;

    if (envStatus.compareVersion(masterVersion, prodVersion) === 1) {
      landLocalBranch('master', 0);
    }
  }).catch((err) => {
    console.log(chalk.red('Need more Staging or Production environment info!'));
    process.exit(1);
  });
}

// 当前分支为hotfix分支
if (branchType == BRANCH_TYPES.HOTFIX) {
  landLocalBranch('master', 1);
}
