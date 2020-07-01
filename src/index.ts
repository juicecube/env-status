import * as childProcess from 'child_process';
import * as fetch from 'fetch';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FETCH_ERR, BRANCH_TYPES, IEnvConfig, IEnvData, IEnvErrData } from './interfaces';

export class EnvStatus {
  public static getShared(): EnvStatus {
    return EnvStatus.instance || (EnvStatus.instance = new EnvStatus());
  }

  private static instance: EnvStatus;

  private envDataCache: { [key: string]: IEnvData } = {};
  private fetchOriginPromise: Promise<void>;
  private envConfig: IEnvConfig;

  public setConfig(config: IEnvConfig): IEnvConfig {
    return (this.envConfig = config);
  }

  public getConfig(): IEnvConfig | null {
    if (this.envConfig) {
      return this.envConfig;
    }
    const configPath = path.resolve('.envstatus.js');
    if (!fs.existsSync(configPath)) {
      return null;
    }
    return this.setConfig(require(configPath));
  }

  public getArgs(argv: string[]): string[] {
    return argv.slice(2);
  }

  public fetchOrigin(): Promise<void> {
    if (this.fetchOriginPromise) {
      return this.fetchOriginPromise;
    }
    return (this.fetchOriginPromise = new Promise((resolve: () => void, reject: (err: any) => void) => {
      childProcess.execFile('git', ['fetch', 'origin'], err => {
        if (err) {
          this.fetchOriginPromise = null;
          reject(err);
        } else {
          resolve();
        }
      });
    }));
  }

  public getLastCommit(now: Date): Record<string, string> {
    let jsonStr;
    try {
      jsonStr = childProcess
        .execFileSync('git', ['show', '--stat', '--format={"commit": "%h", "author": "%an", "branch": "%d"}|||'])
        .toString()
        .split('|||')[0];
    } catch (err) {
      jsonStr = fs
        .readFileSync('last-commit.txt')
        .toString()
        .split('|||')[0];
    }
    const res = JSON.parse(jsonStr);
    res.date = now.getTime();
    res.branch = res.branch.match(/\S*?(?=\))/)[0];
    return res;
  }

  public getBranchLastCommitId(branchName: string): string {
    return childProcess
      .execFileSync('git', ['rev-parse', '--short', branchName])
      .toString()
      .trim();
  }

  public isAncestorCommit(c1: string, c2: string): boolean {
    if (!c1 || !c2) {
      return false;
    }

    try {
      childProcess.execFileSync('git', ['merge-base', '--is-ancestor', c1, c2]);
      return true;
    } catch (err) {
      return false;
    }
  }

  public getBranchName(): string {
    const res = childProcess
      .execFileSync('git', ['branch'])
      .toString()
      .split(os.EOL)
      .find(x => x.startsWith('*'));
    if (res) {
      return res.slice(1).trim();
    } else {
      return '';
    }
  }

  public getBranchType(branch: string): BRANCH_TYPES {
    if (branch === 'master') {
      return BRANCH_TYPES.MASTER;
    }

    if (branch.startsWith('sprint/')) {
      return BRANCH_TYPES.SPRINT;
    }

    if (branch.startsWith('feat/')) {
      return BRANCH_TYPES.SPRINT_FEATURE;
    }

    if (branch.startsWith('fix/')) {
      return BRANCH_TYPES.SPRINT_FIX;
    }

    if (branch.startsWith('hotfix/')) {
      return BRANCH_TYPES.HOTFIX;
    }
    return BRANCH_TYPES.OTHERS;
  }

  public setEnvDataCache(env: string, data: IEnvData): void {
    this.envDataCache[env] = data;
  }

  public appendCurrentTimestampToUrl(url: string, now: Date): string {
    return `${url}${url.indexOf('?') > 0 ? '&' : '?'}t=${now.getTime()}`;
  }

  public fetchEnvData(env: string): Promise<IEnvData | IEnvErrData> {
    return new Promise((resolve: (res: IEnvData | IEnvErrData) => void) => {
      if (this.envDataCache[env]) {
        resolve(this.envDataCache[env]);
        return;
      }
      const config = this.getConfig();
      if (!config) {
        resolve({ err: FETCH_ERR.CONFIG_UNDEFINED, env });
        return;
      }

      if (typeof config.url !== 'function') {
        resolve({ err: FETCH_ERR.URL_FUNCTION_UNDEFINED, env });
        return;
      }
      const url = config.url(env);
      fetch.fetchUrl(this.appendCurrentTimestampToUrl(url, new Date()), (error: any, meta: any, body: any) => {
        let data;
        if (error || meta.status !== 200) {
          data = { err: FETCH_ERR.LOAD_ERROR, env };
        } else {
          try {
            data = Object.assign({ env }, JSON.parse(body.toString()));
          } catch (err) {
            data = { err: FETCH_ERR.PARSE_RESPONSE_ERROR, env };
          }
        }
        this.setEnvDataCache(env, data);
        resolve(data);
      });
    });
  }

  public isEnvAvailable(env: string): Promise<boolean> {
    return Promise.all(['production', 'staging', env].map(e => this.fetchEnvData(e))).then(envsData => {
      const envData: any = envsData[2];
      const stgData: any = envsData[1];
      const prdData: any = envsData[0];
      return this.fetchOrigin().then(() => {
        if (envData.env === 'production') {
          return true;
        } else {
          if (this.isAncestorCommit(envData.commit, prdData.commit)) {
            return true;
          } else if (envData.env === 'staging') {
            return false;
          } else {
            return this.isAncestorCommit(envData.commit, stgData.commit);
          }
        }
      });
    });
  }
}
