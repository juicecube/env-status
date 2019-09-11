import * as chalk from 'chalk';
import {spawnSync} from 'child_process';
import {EnvStatus} from './index';
import {BRANCH_TYPES} from './interfaces';

export class Runner {
  constructor(private envStatus: EnvStatus) {}

  public createDiff(branch: string) {
    const args = this.envStatus.getArgs(process.argv);
    spawnSync('arc', ['diff', `origin/${branch}`, ...args], {stdio: 'inherit'});
  }

  public handleBranch(branch: string, result = 0) {
    const branchName = this.envStatus.getBranchName();
    const branchNameVersion = this.envStatus.getVersionFromBranchName(branchName);
    const localVersion = this.envStatus.getVersionFromPackage();

    if (localVersion !== branchNameVersion) {
      console.log(chalk.red(`The '${branchName}' branch has a wrong version or a wrong name.`));
      process.exit(1);
    }
    this.envStatus.getOriginBranchVersion(branch).then((version: string) => {
      if (this.envStatus.compareVersion(localVersion, version) === result) {
        this.createDiff(branch);
      } else {
        console.log(chalk.red(`The '${branchName}' branch has a wrong version.`));
        process.exit(1);
      }
    });
  }

  public run() {
    const branchName = this.envStatus.getBranchName();
    const branchType = this.envStatus.getBranchType(branchName);
    const branchNameVersion = this.envStatus.getVersionFromBranchName(branchName);

    // 当前分支为others的话不处理
    if (branchType === BRANCH_TYPES.OTHERS) {
      console.log(chalk.yellow(`Branch '${branchName}' is not viable for arc-diff.`));
      return;
    }

    // 当前分支为迭代分支，判断本地和远程迭代版本是否一致
    if (branchType === BRANCH_TYPES.ITERATION_FEATURE) {
      this.handleBranch(branchNameVersion, 0);
    }

    // 当前分支为迭代fix分支，判断本地和远程master是否一致
    if (branchType === BRANCH_TYPES.ITERATION_FIX) {
      this.handleBranch('master', 0);
    }

    // 当前分支为hotfix分支或者公共的迭代分支，判断版本是否大于master
    if (branchType === BRANCH_TYPES.HOTFIX || branchType === BRANCH_TYPES.ITERATION) {
      this.handleBranch('master', 1);
    }
  }
}
