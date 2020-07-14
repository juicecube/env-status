import { EnvStatus } from './index';
import { BRANCH_TYPES, ENV_TYPES } from './interfaces';

export class Runner {
  constructor(private envStatus: EnvStatus) {}

  public run(): number {
    const branchName = this.envStatus.getBranchName();
    const branchType = this.envStatus.getBranchType(branchName);
    const envType = this.envStatus.getEnvType(process.env.NODE_ENV);
    if (
      (envType === ENV_TYPES.PRODUCTION || envType === ENV_TYPES.STAGING || envType === ENV_TYPES.TEST) &&
      !(branchType === BRANCH_TYPES.MASTER || branchType === BRANCH_TYPES.SPRINT || branchType === BRANCH_TYPES.HOTFIX)
    ) {
      console.log('Only master, sprint and hotfix branches can be built in production, staging and test environment.');
      return 1;
    }
    return 0;
  }
}
