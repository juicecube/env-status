import * as child_process from 'child_process';
import * as chalk from 'chalk';
import {EnvStatus} from './index';
import {BRANCH_TYPES, isEnvErrDataType} from './interfaces';

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

    if (branchType === BRANCH_TYPES.ITERATION_FEATURE) {
      this.createLand(branchNameVersion);
      return Promise.resolve(0);
    } else if (branchType === BRANCH_TYPES.ITERATION) {
      return Promise.all([
        this.envStatus.isEnvAvailable('staging'),
        this.envStatus.fetchEnvData('staging'),
        this.envStatus.fetchEnvData('production'),
      ]).then((values) => {
        const stagingAvailable = values[0];
        const stgInfo = values[1];
        const prdInfo = values[2];
        if (isEnvErrDataType(stgInfo) || isEnvErrDataType(prdInfo)) {
          console.log(chalk.red('Failed to fetch env data!'));
          return 11;
        }
        if (stagingAvailable && this.envStatus.compareVersion(localVersion, prdInfo.version) !== 1) {
          console.log(chalk.red('New version must be greater than production version!'));
          return 12;
        }
        if (!stagingAvailable && this.envStatus.compareVersion(localVersion, stgInfo.version) !== 0) {
          console.log(chalk.red('Version must be same as staging version!'));
          return 13;
        }
        this.createLand('master');
        return 0;
      }).catch((err) => {
        console.log(chalk.red('Failed to fetch env data!'));
        return 14;
      });
    } else if (branchType === BRANCH_TYPES.ITERATION_FIX) {
      return Promise.all([
        this.envStatus.isEnvAvailable('staging'),
        this.envStatus.fetchEnvData('staging'),
      ]).then((values) => {
        const stagingAvailable = values[0];
        const stgInfo = values[1];
        if (isEnvErrDataType(stgInfo)) {
          console.log(chalk.red('Failed to fetch env data!'));
          return 21;
        }
        if (stagingAvailable) {
          console.log(chalk.red('Staging status does not compliant!'));
          return 22;
        }
        if (!stagingAvailable && this.envStatus.compareVersion(localVersion, stgInfo.version) !== 0) {
          console.log(chalk.red('Version must be same as staging version!'));
          return 23;
        }
        this.createLand('master');
        return 0;
      }).catch((err) => {
        console.log(chalk.red('Failed to fetch env data!'));
        return 24;
      });
    } else if (branchType === BRANCH_TYPES.HOTFIX) {
      return Promise.all([
        this.envStatus.isEnvAvailable('staging'),
        this.envStatus.fetchEnvData('production'),
      ]).then((values) => {
        const stagingAvailable = values[0];
        const prdInfo = values[1];
        if (isEnvErrDataType(prdInfo)) {
          console.log(chalk.red('Failed to fetch env data!'));
          return 31;
        }
        if (!stagingAvailable) {
          console.log(chalk.red('Staging status does not compliant!'));
          return 32;
        }
        if (stagingAvailable && this.envStatus.compareVersion(localVersion, prdInfo.version) !== 1) {
          console.log(chalk.red('New version must be greater than production version!'));
          return 33;
        }
        this.createLand('master');
        return 0;
      }).catch((err) => {
        console.log(chalk.red('Failed to fetch env data!'));
        return 34;
      });
    } else {
      console.log(chalk.yellow(`Branch '${branchName}' is not viable for arc-land.`));
      return Promise.resolve(99);
    }
  }

  private createLand(branch: string) {
    const args = this.envStatus.getArgs(process.argv);
    child_process.spawnSync('arc', ['land', '--onto', branch, ...args], {stdio: 'inherit'});
  }
}
