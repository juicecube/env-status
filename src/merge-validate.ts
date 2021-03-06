import * as chalk from 'chalk';
import { Arguments } from 'yargs';
import { EnvStatus } from './index';
import { BRANCH_TYPES } from './interfaces';

export class Runner {
  constructor(private envStatus: EnvStatus, private argv: Arguments) {}

  public getArgv(): Arguments {
    return this.argv;
  }

  public run(): Promise<number> {
    const argv = this.getArgv();
    const targetBranchName = argv._[1] || '';
    const branchName = argv._[0] || '';

    if (!branchName || !targetBranchName) {
      console.log(chalk.red('Please specify source branch and target branch.'));
      return Promise.resolve(20);
    }

    const targetBranchType = this.envStatus.getBranchType(targetBranchName);
    const branchType = this.envStatus.getBranchType(branchName);

    return this.envStatus
      .fetchOrigin()
      .then(() => {
        if (
          (branchType === BRANCH_TYPES.SPRINT || branchType === BRANCH_TYPES.HOTFIX) &&
          targetBranchType !== BRANCH_TYPES.MASTER &&
          targetBranchType !== BRANCH_TYPES.RELEASE
        ) {
          console.log(chalk.red('Sprint and hotfix branch must be merged into master or release branch.'));
          return 1;
        }

        // 兼容dev,test,staging,master固定分支对应各个环境的情况，带来的问题是feature分支可以直接合并到master
        if (
          (branchType === BRANCH_TYPES.SPRINT_FEATURE || branchType === BRANCH_TYPES.SPRINT_FIX) &&
          targetBranchType !== BRANCH_TYPES.SPRINT &&
          targetBranchType !== BRANCH_TYPES.TEST &&
          targetBranchType !== BRANCH_TYPES.STAGING &&
          targetBranchType !== BRANCH_TYPES.MASTER
        ) {
          console.log(chalk.red('Feature and fix branch must be merged into sprint/test/staging/master branch.'));
          return 2;
        }

        if (branchType === BRANCH_TYPES.OTHERS) {
          console.log(chalk.red(`Source branch name "${branchName}" is invalid.`));
          return 3;
        }

        if (branchType === BRANCH_TYPES.MASTER) {
          return 0;
        }

        let branchCommit;
        let targetBranchCommit;
        try {
          branchCommit = this.envStatus.getBranchLastCommitId('origin/' + branchName);
        } catch (err) {
          console.log(chalk.red(`Failed to get last commit of "${branchName}".`));
          return 4;
        }

        try {
          targetBranchCommit = this.envStatus.getBranchLastCommitId('origin/' + targetBranchName);
        } catch (err) {
          console.log(chalk.red(`Failed to get last commit of "${targetBranchName}".`));
          return 5;
        }

        if (!this.envStatus.isAncestorCommit(targetBranchCommit, branchCommit)) {
          console.log(chalk.red(`Please merge lastest commits from "${targetBranchName}" into "${branchName}" first.`));
          return 6;
        }

        return 0;
      })
      .catch(() => {
        console.log(chalk.red('Failed to fetch origin.'));
        return 10;
      });
  }
}
