#!/usr/bin/env node
import * as chalk from 'chalk';
import * as path from 'path';
import * as envStatus from '../index';

const branch = envStatus.getBranchName();
const branchType = envStatus.getBranchType(branch);

if (branchType !== envStatus.BRANCH_TYPES.OTHERS) {
  const versionInBranchName = envStatus.getVersionFromBranchName(branch);
  const versionInPkg = require(path.resolve('package.json')).version;

  if (versionInBranchName !== versionInPkg) {
    console.log(chalk.red(`Version in branch name ${versionInBranchName} is not consistant with version in package.json ${versionInPkg}!`));
    process.exit(1);
  }
}
