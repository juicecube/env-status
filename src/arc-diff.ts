import * as child_process from 'child_process';
import * as chalk from 'chalk';
import {EnvStatus} from './index';
import {BRANCH_TYPES} from './interfaces';

export class Runner {
  constructor(private envStatus: EnvStatus) {}

  public run(): Promise<number> {
    const branchName = this.envStatus.getBranchName();
    const branchType = this.envStatus.getBranchType(branchName);
    const branchNameVersion = this.envStatus.getVersionFromBranchName(branchName);
    const localVersion = this.envStatus.getVersionFromPackage();

    if (localVersion !== branchNameVersion) {
      console.log(chalk.red(`The '${branchName}' branch has a wrong version or a wrong name.`));
      return Promise.resolve(1);
    }

    let diffBranch: string;
    let compareResult: number;

    if (branchType === BRANCH_TYPES.ITERATION_FEATURE) {
      // 当前分支为迭代分支，判断本地和远程迭代版本是否一致
      diffBranch = branchNameVersion;
      compareResult = 0;
    } else if (branchType === BRANCH_TYPES.ITERATION_FIX) {
      // 当前分支为迭代fix分支，判断本地和远程master是否一致
      diffBranch = 'master';
      compareResult = 0;
    } else if (branchType === BRANCH_TYPES.HOTFIX || branchType === BRANCH_TYPES.ITERATION) {
      // 当前分支为hotfix分支或者公共的迭代分支，判断版本是否大于master
      diffBranch = 'master';
      compareResult = 1;
    } else {
      console.log(chalk.yellow(`Branch '${branchName}' is not viable for arc-diff.`));
      return Promise.resolve(2);
    }

    return this.envStatus.getOriginBranchVersion(diffBranch).then((version: string) => {
      if (this.envStatus.compareVersion(localVersion, version) === compareResult) {
        this.createDiff(diffBranch);
        return 0;
      } else {
        console.log(chalk.red(`The '${branchName}' branch has a wrong version.`));
        return 3;
      }
    });
  }

  private createDiff(branch: string) {
    const args = this.envStatus.getArgs(process.argv);
    child_process.spawnSync('arc', ['diff', `origin/${branch}`, ...args], {stdio: 'inherit'});
  }
}
