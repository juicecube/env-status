import * as child_process from 'child_process';
import * as chalk from 'chalk';
import { EnvStatus } from './index';
import { BRANCH_TYPES, isEnvErrDataType } from './interfaces';

export class Runner {
  constructor(private envStatus: EnvStatus) {}

  public run(): Promise<number> {
    const args = this.envStatus.getArgs(process.argv);

    if (args[0] !== '--onto') {
      console.log(chalk.red('Please pass --onto argument first.'));
      return Promise.resolve(20);
    }

    const targetBranchName = args[1] || '';
    const targetBranchType = this.envStatus.getBranchType(targetBranchName);
    const branchName = this.envStatus.getBranchName();
    const branchType = this.envStatus.getBranchType(branchName);

    return this.envStatus.fetchOrigin().then(() => {
      if (
        (branchType === BRANCH_TYPES.SPRINT || branchType === BRANCH_TYPES.HOTFIX)
        && targetBranchType !== BRANCH_TYPES.MASTER
      ) {
        console.log(chalk.red('Sprint and hotfix branch must be landed onto master branch.'));
        return 1;
      }
      if (
        (branchType === BRANCH_TYPES.SPRINT_FEATURE || branchType === BRANCH_TYPES.SPRINT_FIX)
        && targetBranchType !== BRANCH_TYPES.SPRINT
      ) {
        console.log(chalk.red('Feature and fix branch must be landed onto sprint branch.'));
        return 2;
      }
      if (branchType === BRANCH_TYPES.MASTER || branchType === BRANCH_TYPES.OTHERS) {
        console.log(chalk.red(`Working branch name "${branchName}" is invalid.`));
        return 3;
      }

      let branchCommit;
      let targetBranchCommit;
      try {
        branchCommit = this.envStatus.getBranchLastCommitId(branchName);
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

      child_process.spawnSync('arc', ['land', ...args], {stdio: 'inherit'});
      return 0;
    }).catch(() => {
      console.log(chalk.red('Failed to fetch origin.'));
      return 10;
    });
  }
}
