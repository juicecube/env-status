import * as childProcess from 'child_process';
import * as chalk from 'chalk';
import { Arguments } from 'yargs';
import { EnvStatus } from './index';
import { BRANCH_TYPES } from './interfaces';

interface IArcLandArgv {
  onto: string;
}

export class Runner {
  constructor(private envStatus: EnvStatus, private argv: Arguments<IArcLandArgv>) {}

  public getArgv(): Arguments<IArcLandArgv> {
    return this.argv;
  }

  public run(): Promise<number> {
    const argv = this.getArgv();
    const targetBranchName = argv.onto;

    if (!targetBranchName) {
      console.log(chalk.red('Please pass --onto argument.'));
      return Promise.resolve(20);
    }

    const targetBranchType = this.envStatus.getBranchType(targetBranchName);
    const branchName = this.envStatus.getBranchName();
    const branchType = this.envStatus.getBranchType(branchName);

    return this.envStatus
      .fetchOrigin()
      .then(() => {
        if (
          (branchType === BRANCH_TYPES.SPRINT || branchType === BRANCH_TYPES.HOTFIX) &&
          targetBranchType !== BRANCH_TYPES.MASTER
        ) {
          console.log(chalk.red('Sprint and hotfix branch must be landed onto master branch.'));
          return 1;
        }

        if (
          (branchType === BRANCH_TYPES.SPRINT_FEATURE || branchType === BRANCH_TYPES.SPRINT_FIX) &&
          targetBranchType !== BRANCH_TYPES.SPRINT
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
          targetBranchCommit = this.envStatus.getBranchLastCommitId(this.envStatus.getOriginBranch(targetBranchName));
        } catch (err) {
          console.log(chalk.red(`Failed to get last commit of "${targetBranchName}".`));
          return 5;
        }

        if (!this.envStatus.isAncestorCommit(targetBranchCommit, branchCommit)) {
          console.log(chalk.red(`Please merge lastest commits from "${targetBranchName}" into "${branchName}" first.`));
          return 6;
        }

        childProcess.spawnSync('arc', ['land', ...this.envStatus.getArgs(process.argv)], { stdio: 'inherit' });
        return 0;
      })
      .catch(() => {
        console.log(chalk.red('Failed to fetch origin.'));
        return 10;
      });
  }
}
