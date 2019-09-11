import * as chalk from 'chalk';
import {spawnSync} from 'child_process';
import {EnvStatus} from './index';
import {BRANCH_TYPES, IEnvData, isEnvErrDataType} from './interfaces';

export class Runner {
  constructor(private envStatus: EnvStatus) {}

  public createLand(branch: string) {
    const args = this.envStatus.getArgs(process.argv);
    spawnSync('arc', ['land', '--onto', branch, ...args], {stdio: 'inherit'});
  }

  public landLocalBranch(branch: string, result = 0) {
    const branchName = this.envStatus.getBranchName();
    const branchNameVersion = this.envStatus.getVersionFromBranchName(branchName);
    const localVersion = this.envStatus.getVersionFromPackage();

    if (localVersion !== branchNameVersion) {
      console.log(chalk.red(`The '${branchName}' branch has a wrong version or a wrong name.`));
      process.exit(1);
    }
    this.envStatus.getOriginBranchVersion(branch).then((version: string) => {
      if (this.envStatus.compareVersion(localVersion, version) === result) {
        this.createLand(branch);
        if (branch === 'master') {
          spawnSync('git', ['tag', 'v' + version]);
          spawnSync('git', ['push', '--tags']);
        }
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
    const localVersion = this.envStatus.getVersionFromPackage();

    // 当前分支为others的话不处理
    if (branchType === BRANCH_TYPES.OTHERS) {
      console.log(chalk.yellow(`Branch '${branchName}' is not viable for arc-land.`));
      return;
    }

    // 当前分支为迭代分支，判断本地和远程迭代版本是否一致
    if (branchType === BRANCH_TYPES.ITERATION_FEATURE) {
      this.landLocalBranch(branchNameVersion, 0);
    }

    // 当前分支为迭代公共分支
    if (branchType === BRANCH_TYPES.ITERATION) {
      Promise.all([
        this.envStatus.getOriginBranchVersion('master'),
        this.envStatus.fetchEnvData('staging'),
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
        this.envStatus.fetchEnvData('production').then((pInfo) => {
          // production环境是否和master一致并且当前分支版本大于master
          if (isEnvErrDataType(pInfo)) {
            console.log(chalk.red('Failed to fetch env data!'));
            process.exit(1);
          } else if (pInfo.version === masterVersion &&
            this.envStatus.compareVersion(localVersion, masterVersion) === 1) {
            this.createLand('master');
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
        this.envStatus.getOriginBranchVersion('master'),
        this.envStatus.fetchEnvData('production'),
      ]).then((values: [string, IEnvData]) => {
        if (isEnvErrDataType(values[1])) {
          console.log(chalk.red('Failed to fetch env data!'));
          process.exit(1);
          return;
        }

        const masterVersion = values[0];
        const prodVersion = values[1].version;

        if (this.envStatus.compareVersion(masterVersion, prodVersion) === 1) {
          this.landLocalBranch('master', 0);
        }
      }).catch((err) => {
        console.log(chalk.red('Need more Staging or Production environment info!'));
        process.exit(1);
      });
    }

    // 当前分支为hotfix分支
    if (branchType === BRANCH_TYPES.HOTFIX) {
      this.landLocalBranch('master', 1);
    }
  }
}
