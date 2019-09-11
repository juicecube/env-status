import * as chalk from 'chalk';
import * as path from 'path';
import { EnvStatus } from './index';
import {BRANCH_TYPES} from './interfaces';

export class Runner {
  constructor(private envStatus: EnvStatus) {}

  public run() {
    const branch = this.envStatus.getBranchName();
    const branchType = this.envStatus.getBranchType(branch);

    if (branchType !== BRANCH_TYPES.OTHERS) {
      const versionInBranchName = this.envStatus.getVersionFromBranchName(branch);
      const versionInPkg = this.envStatus.getVersionFromPackage();

      if (versionInBranchName !== versionInPkg) {
        console.log(chalk.red(`Version in branch name ${versionInBranchName} is not consistant with version in package.json ${versionInPkg}!`));
        process.exit(1);
      }
    }
  }
}
