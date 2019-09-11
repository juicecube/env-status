import * as child_process from 'child_process';
import * as fetch from 'fetch';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {FETCH_ERR, BRANCH_TYPES, IEnvConfig, IEnvData, IEnvErrData} from './interfaces';

export class EnvStatus {
  public static getShared(): EnvStatus {
    return EnvStatus.instance || (EnvStatus.instance = new EnvStatus());
  }

  private static instance: EnvStatus;

  private envDataCache: {[key: string]: IEnvData} = {};
  private fetchOriginPromise: Promise<void>;
  private envConfig: IEnvConfig;

  public setConfig(config: IEnvConfig): IEnvConfig {
    return this.envConfig = config;
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
    return this.fetchOriginPromise = new Promise((resolve: () => void, reject: (err: any) => void) => {
      child_process.execFile('git', ['fetch', 'origin'], (err) => {
        if (err) {
          this.fetchOriginPromise = null;
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public isValidVersion(version: string, fix?: boolean) {
    if ((/^\d+\.\d+\.\d+$/).test(version)) {
      const parts = version.split('.');
      if (parts[0] === '0' && parts[1] === '0') {
        return false;
      }
      for (const x of parts) {
        if (x.length > 1 && x.startsWith('0')) {
          return false;
        }
      }
      if (fix && parts[2] === '0' || !fix && parts[2] !== '0') {
        return false;
      }
      return true;
    }
    return false;
  }

  public getLastCommit(now: Date) {
    let jsonStr;
    try {
      jsonStr = child_process.execFileSync('git', ['show', '--stat', '--format={"commit": "%h", "author": "%an", "branch": "%d"}|||'])
        .toString()
        .split('|||')[0];
    } catch (err) {
      jsonStr = fs.readFileSync('last-commit.txt').toString().split('|||')[0];
    }
    const res = JSON.parse(jsonStr);
    res.date = now.getTime();
    res.branch = res.branch.match(/\S*?(?=\))/)[0];
    return res;
  }

  public getBranchName() {
    const res = child_process.execFileSync('git', ['branch']).toString().split(os.EOL).find((x) => x.startsWith('*'));
    if (res) {
      return res.slice(1).trim();
    } else {
      return '';
    }
  }

  public getBranchType(branch: string): BRANCH_TYPES {
    if ((/^\d+\.\d+\.\d+$/).test(branch)) {
      if (this.isValidVersion(branch)) {
        return BRANCH_TYPES.ITERATION;
      } else {
        return BRANCH_TYPES.OTHERS;
      }
    }
    if ((/^\d+\.\d+\.\d+-feat-.+$/).test(branch)) {
      if (this.isValidVersion(branch.split('-')[0])) {
        return BRANCH_TYPES.ITERATION_FEATURE;
      } else {
        return BRANCH_TYPES.OTHERS;
      }
    }
    if ((/^\d+\.\d+\.\d+-fix-.+$/).test(branch)) {
      const version = branch.split('-')[0];
      if (this.isValidVersion(version)) {
        return BRANCH_TYPES.ITERATION_FIX;
      } else if (this.isValidVersion(version, true)) {
        return BRANCH_TYPES.HOTFIX;
      } else {
        return BRANCH_TYPES.OTHERS;
      }
    }
    return BRANCH_TYPES.OTHERS;
  }

  public getOriginBranchVersion(branch: string): Promise<string> {
    return new Promise((resolve, reject) => {
      child_process.execFile('git', ['fetch', 'origin', branch], (err) => {
        if (err) {
          reject(err);
          return;
        }
        try {
          const m = child_process.execFileSync('git', ['diff', `origin/${branch}`, 'package.json']).toString().match(/-\s*"version":\s*"(.*?)"/);
          if (m) {
            resolve(m[1]);
          } else {
            resolve(require(path.resolve('package.json')).version);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  public getVersionFromBranchName(branch: string) {
    if (this.getBranchType(branch) !== BRANCH_TYPES.OTHERS) {
      return branch.split('-')[0];
    } else {
      return '';
    }
  }

  public compareVersion(a: string, b: string) {
    const r = /^\d+\.\d+\.\d+$/;
    if (!r.test(a) || !r.test(b)) {
      return 9;
    }
    const aArr = a.split('.');
    const bArr = b.split('.');
    for (let i = 0, l = aArr.length; i < l; i++) {
      const ai = parseInt(aArr[i], 10);
      const bi = parseInt(bArr[i], 10);
      if (ai > bi) {
        return 1;
      } else if (ai < bi) {
        return -1;
      }
    }
    return 0;
  }

  public setEnvDataCache(env: string, data: IEnvData) {
    this.envDataCache[env] = data;
  }

  public appendCurrentTimestampToUrl(url: string, now: Date) {
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
        resolve({err: FETCH_ERR.CONFIG_UNDEFINED, env});
        return;
      }
      if (typeof config.url !== 'function') {
        resolve({err: FETCH_ERR.URL_FUNCTION_UNDEFINED, env});
        return;
      }
      const url = config.url(env);
      fetch.fetchUrl(this.appendCurrentTimestampToUrl(url, new Date()), (error: any, meta: any, body: any) => {
        let data;
        if (error || meta.status !== 200) {
          data = {err: FETCH_ERR.LOAD_ERROR, env};
        } else {
          try {
            data = Object.assign({env}, JSON.parse(body.toString()));
          } catch (err) {
            data = {err: FETCH_ERR.PARSE_RESPONSE_ERROR, env};
          }
        }
        this.setEnvDataCache(env, data);
        resolve(data);
      });
    });
  }

  public isEnvAvailable(env: string): Promise<boolean> {
    return Promise.all(['production', 'staging', env].map((e) => this.fetchEnvData(e))).then((envsData) => {
      const envData: any = envsData[2];
      const stgData: any = envsData[1];
      const prdData: any = envsData[0];
      if (!envData.version) {
        return false;
      }
      if (envData.env === 'production') {
        return true;
      } else if (envData.env === 'staging') {
        if (this.compareVersion(envData.version, prdData.version) === 1) {
          return false;
        } else {
          return true;
        }
      } else {
        let compareRes = this.compareVersion(envData.version, stgData.version);
        if (compareRes === 1) {
          return false;
        } else if (compareRes === 0) {
          return true;
        } else {
          compareRes = this.compareVersion(envData.version, prdData.version);
          if (compareRes === 1) {
            return false;
          } else if (compareRes === 0) {
            return true;
          } else {
            return this.fetchOrigin().then(() => {
              try {
                child_process.execFileSync('git', ['merge-base', '--is-ancestor', envData.commit, prdData.commit]);
                return true;
              } catch (err) {
                return false;
              }
            });
          }
        }
      }
    });
  }
}
