import * as child_process from 'child_process';
import * as chalk from 'chalk';
import { EnvStatus } from './index';
import { BRANCH_TYPES } from './interfaces';

export class Runner {
  constructor(private envStatus: EnvStatus) {}

  public run(): Promise<number> {
    const args = this.envStatus.getArgs(process.argv);
    const targetBranchName = args[1] || '';
    const targetBranchType = this.envStatus.getBranchType(targetBranchName);
    const branchName = args[0] || '';
    const branchType = this.envStatus.getBranchType(branchName);

    return this.envStatus.fetchOrigin().then(() => {
      if (
        (branchType === BRANCH_TYPES.SPRINT || branchType === BRANCH_TYPES.HOTFIX)
        && targetBranchType !== BRANCH_TYPES.MASTER
      ) {
        console.log(chalk.red('Sprint and hotfix branch must be merged into master branch.'));
        return 1;
      }
      if (
        (branchType === BRANCH_TYPES.SPRINT_FEATURE || branchType === BRANCH_TYPES.SPRINT_FIX)
        && targetBranchType !== BRANCH_TYPES.SPRINT
      ) {
        console.log(chalk.red('Feature and fix branch must be merged into sprint branch.'));
        return 2;
      }
      if (branchType === BRANCH_TYPES.MASTER || branchType === BRANCH_TYPES.OTHERS) {
        console.log(chalk.red(`Source branch name "${branchName}" is invalid.`));
        return 3;
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
    }).catch(() => {
      console.log(chalk.red('Failed to fetch origin.'));
      return 10;
    });
  }
}
