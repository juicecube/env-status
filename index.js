const {execSync, exec} = require('child_process'),
  os = require('os'),
  fs = require('fs'),
  path = require('path'),
  fetch = require('fetch'),
  moment = require('moment');

const FETCH_ERR = {
  CONFIG_UNDEFINED: 'CONFIG_UNDEFINED',
  URL_FUNCTION_UNDEFINED: 'URL_FUNCTION_UNDEFINED',
  LOAD_ERROR: 'LOAD_ERROR',
  PARSE_RESPONSE_ERROR: 'PARSE_RESPONSE_ERROR'
};

const BRANCH_TYPES = {
  ITERATION: 'ITERATION',
  ITERATION_FEATURE: 'ITERATION_FEATURE',
  ITERATION_FIX: 'ITERATION_FIX',
  HOTFIX: 'HOTFIX',
  OTHERS: 'OTHERS'
};

const _envDataCache = {};

let _config;

function getConfig() {
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

function _isValidVersion(version, fix) {
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

function getLastCommit() {
  const jsonStr = execSync('git show --stat --format="{\\"commit\\": \\"%h\\", \\"author\\": \\"%an\\", \\"date\\": \\"%aD\\", \\"branch\\": \\"%D\\"}|"').toString().split('|')[0];
  const res = JSON.parse(jsonStr);
  res.date = moment(res.date).valueOf();
  res.branch = res.branch.match(/-> (.*?)(,|$)/)[1];
  return res;
}

function getBranchName() {
  const res = execSync('git branch').toString().split(os.EOL).find(x => x.startsWith('*'));
  if (res) {
    return res.slice(1).trim();
  } else {
    return '';
  }
}

function getBranchType(branch) {
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

function getOriginBranchVersion(branch) {
  return new Promise(function (resolve, reject) {
    exec(`git fetch origin ${branch}`, function (err, stdout, stderr) {
      if (err) {
        reject(err);
        return;
      }
      try {
        const m = execSync(`git diff origin/${branch} package.json`).toString().match(/-\s*"version":\s*"(.*?)"/);
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

function getVersionFromBranchName(branch) {
  if (getBranchType(branch) != BRANCH_TYPES.OTHERS) {
    return branch.split('-')[0];
  } else {
    return '';
  }
}

function compareVersion(a, b) {
  const r = /^\d+\.\d+\.\d+$/;
  if (!r.test(a) || !r.test(b)) {
    return 9;
  }
  a = a.split('.');
  b = b.split('.');
  for (let i = 0, l = a.length; i < l; i++) {
    const ai = parseInt(a[i]);
    const bi = parseInt(b[i]);
    if (ai > bi) {
      return 1;
    } else if (ai < bi) {
      return -1;
    }
  }
  return 0;
}

function fetchEnvData(env) {
  return new Promise(function (resolve) {
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
    fetch.fetchUrl(`${url}${url.indexOf('?') > 0 ? '&' : '?'}t=${Date.now()}`, function (error, meta, body) {
      if (error || meta.status != 200) {
        resolve({err: FETCH_ERR.LOAD_ERROR, env: env});
        return;
      }
      try {
        const data = Object.assign({env: env}, JSON.parse(body.toString()));
        _envDataCache[env] = data;
        resolve(data);
      } catch (err) {
        resolve({err: FETCH_ERR.PARSE_RESPONSE_ERROR, env: env});
      }
    });
  });
}

function isEnvAvailableSync(env, envVersion, stgVersion, prdVersion) {
  if (env == 'production') {
    return true;
  } else if (compareVersion(envVersion, prdVersion) != 1) {
    return true;
  } else if (env != 'staging' && compareVersion(envVersion, stgVersion) == 0) {
    return true;
  } else {
    return false;
  }
}

function isEnvAvailable(env) {
  return Promise.all(['production', 'staging', env].map(env => fetchEnvData(env))).then(function (envsData) {
    if (!envsData[2].version) {
      return false;
    }
    return isEnvAvailableSync(env, envsData[2].version, envsData[1].version, envsData[0].version);
  });
}

module.exports = {
  FETCH_ERR: FETCH_ERR,
  BRANCH_TYPES: BRANCH_TYPES,
  getConfig: getConfig,
  getLastCommit: getLastCommit,
  getBranchName: getBranchName,
  getBranchType: getBranchType,
  getOriginBranchVersion: getOriginBranchVersion,
  getVersionFromBranchName: getVersionFromBranchName,
  compareVersion: compareVersion,
  fetchEnvData: fetchEnvData,
  isEnvAvailableSync: isEnvAvailableSync,
  isEnvAvailable: isEnvAvailable
};
