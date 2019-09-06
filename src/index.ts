import {execFileSync, execFile} from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as fetch from 'fetch';
import * as moment from 'moment';
import {EnvData, EnvErrData, EnvConfig} from './interfaces';

export const FETCH_ERR = {
  CONFIG_UNDEFINED: 'CONFIG_UNDEFINED',
  URL_FUNCTION_UNDEFINED: 'URL_FUNCTION_UNDEFINED',
  LOAD_ERROR: 'LOAD_ERROR',
  PARSE_RESPONSE_ERROR: 'PARSE_RESPONSE_ERROR'
};

export const BRANCH_TYPES = {
  ITERATION: 'ITERATION',
  ITERATION_FEATURE: 'ITERATION_FEATURE',
  ITERATION_FIX: 'ITERATION_FIX',
  HOTFIX: 'HOTFIX',
  OTHERS: 'OTHERS'
};

const _envDataCache: {[key: string]: EnvData} = {};

let _fetchOriginPromise: Promise<void>;
function _fetchOrigin(): Promise<void> {
  if (_fetchOriginPromise) {
    return _fetchOriginPromise;
  }
  return _fetchOriginPromise = new Promise((resolve: () => void, reject: Function) => {
    execFile('git', ['fetch', 'origin'], err => {
      if (err) {
        _fetchOriginPromise = null;
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

let _config: EnvConfig;
export function getConfig(): EnvConfig {
  if (_config) {
    return _config;
  }
  const configPath = path.resolve('.envstatus.js');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  _config = require(configPath);
  return _config;
}

function _isValidVersion(version: string, fix?: boolean) {
  if ((/^\d+\.\d+\.\d+$/).test(version)) {
    const parts = version.split('.');
    if (parts[0] == '0' && parts[1] == '0') {
      return false;
    }
    for (const x of parts) {
      if (x.length > 1 && x.startsWith('0')) {
        return false;
      }
    }
    if (fix && parts[2] == '0' || !fix && parts[2] != '0') {
      return false;
    }
    return true;
  }
  return false;
}

export function getLastCommit() {
  let jsonStr;
  try {
    jsonStr = execFileSync('git', ['show', '--stat', '--format={"commit": "%h", "author": "%an", "branch": "%d"}|||']).toString().split('|||')[0];
  } catch (err) {
    jsonStr = fs.readFileSync('last-commit.txt').toString().split('|||')[0];
  }
  const res = JSON.parse(jsonStr);
  res.date = moment(new Date()).valueOf();
  res.branch = res.branch.match(/(?<= )\S*(?=\))/)[0];
  return res;
}

export function getBranchName() {
  const res = execFileSync('git', ['branch']).toString().split(os.EOL).find(x => x.startsWith('*'));
  if (res) {
    return res.slice(1).trim();
  } else {
    return '';
  }
}

export function getBranchType(branch: string) {
  if ((/^\d+\.\d+\.\d+$/).test(branch)) {
    if (_isValidVersion(branch)) {
      return BRANCH_TYPES.ITERATION;
    } else {
      return BRANCH_TYPES.OTHERS;
    }
  }
  if ((/^\d+\.\d+\.\d+-feat-.+$/).test(branch)) {
    if (_isValidVersion(branch.split('-')[0])) {
      return BRANCH_TYPES.ITERATION_FEATURE;
    } else {
      return BRANCH_TYPES.OTHERS;
    }
  }
  if ((/^\d+\.\d+\.\d+-fix-.+$/).test(branch)) {
    const version = branch.split('-')[0];
    if (_isValidVersion(version)) {
      return BRANCH_TYPES.ITERATION_FIX;
    } else if (_isValidVersion(version, true)) {
      return BRANCH_TYPES.HOTFIX;
    } else {
      return BRANCH_TYPES.OTHERS;
    }
  }
  return BRANCH_TYPES.OTHERS;
}

export function getOriginBranchVersion(branch: string) {
  return new Promise((resolve, reject) => {
    execFile('git', ['fetch', 'origin', branch], err => {
      if (err) {
        reject(err);
        return;
      }
      try {
        const m = execFileSync('git', ['diff', `origin/${branch}`, 'package.json']).toString().match(/-\s*"version":\s*"(.*?)"/);
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

export function getVersionFromBranchName(branch: string) {
  if (getBranchType(branch) != BRANCH_TYPES.OTHERS) {
    return branch.split('-')[0];
  } else {
    return '';
  }
}

export function compareVersion(a: string, b: string) {
  const r = /^\d+\.\d+\.\d+$/;
  if (!r.test(a) || !r.test(b)) {
    return 9;
  }
  const aArr = a.split('.');
  const bArr = b.split('.');
  for (let i = 0, l = aArr.length; i < l; i++) {
    const ai = parseInt(aArr[i]);
    const bi = parseInt(bArr[i]);
    if (ai > bi) {
      return 1;
    } else if (ai < bi) {
      return -1;
    }
  }
  return 0;
}

export function fetchEnvData(env: string): Promise<EnvData | EnvErrData> {
  return new Promise((resolve: (res: EnvData | EnvErrData) => void) => {
    if (_envDataCache[env]) {
      resolve(_envDataCache[env]);
      return;
    }
    const config = getConfig();
    if (!config) {
      resolve({err: FETCH_ERR.CONFIG_UNDEFINED, env: env});
      return;
    }
    if (typeof config.url != 'function') {
      resolve({err: FETCH_ERR.URL_FUNCTION_UNDEFINED, env: env});
      return;
    }
    const url = config.url(env);
    fetch.fetchUrl(`${url}${url.indexOf('?') > 0 ? '&' : '?'}t=${Date.now()}`, (error: any, meta: any, body: any) => {
      let data;
      if (error || meta.status != 200) {
        data = {err: FETCH_ERR.LOAD_ERROR, env: env};
      } else {
        try {
          data = Object.assign({env: env}, JSON.parse(body.toString()));
        } catch (err) {
          data = {err: FETCH_ERR.PARSE_RESPONSE_ERROR, env: env};
        }
      }
      _envDataCache[env] = data;
      resolve(data);
    });
  });
}

export function isEnvAvailable(env: string) {
  return Promise.all(['production', 'staging', env].map(env => fetchEnvData(env))).then(envsData => {
    const envData: any = envsData[2] || {}, stgData: any = envsData[1] || {}, prdData: any = envsData[0] || {};
    if (!envData.version) {
      return false;
    }
    if (envData.env == 'production') {
      return true;
    } else if (envData.env == 'staging') {
      if (compareVersion(envData.version, prdData.version) == 1) {
        return false;
      } else {
        return true;
      }
    } else {
      let compareRes = compareVersion(envData.version, stgData.version);
      if (compareRes == 1) {
        return false;
      } if (compareRes == 0) {
        return true;
      } else {
        compareRes = compareVersion(envData.version, prdData.version);
        if (compareRes == 1) {
          return false;
        } if (compareRes == 0) {
          return true;
        } else {
          return _fetchOrigin().then(() => {
            try {
              execFileSync('git', ['merge-base', '--is-ancestor', envData.commit, prdData.commit]);
              return true;
            } catch (err) {
              return false;
            }
          }).catch(err => {
            console.error(err);
            return false;
          });
        }
      }
    }
  });
}
