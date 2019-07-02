const execSync = require('child_process').execSync,
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
  MASTER: 'MASTER',
  ITERATION: 'ITERATION',
  ITERATION_FEATURE: 'ITERATION_FEATURE',
  ITERATION_FIX: 'ITERATION_FIX',
  HOTFIX: 'HOTFIX',
  INVALID: 'INVALID'
};

const _envDataCache = {};

function _getConfig() {
  const configPath = path.resolve('.envstatus.js');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const config = require(configPath);
  _getConfig = function () {
    return config;
  };
  return config;
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
  res.branch = res.branch.match(/-> (.*?),/)[1];
  return res;
};

function getBranchType(branch) {
  if (branch == 'master') {
    return BRANCH_TYPES.MASTER;
  }
  if ((/^\d+\.\d+\.\d+$/).test(branch)) {
    if (_isValidVersion(branch)) {
      return BRANCH_TYPES.ITERATION;
    } else {
      return BRANCH_TYPES.INVALID;
    }
  }
  if ((/^\d+\.\d+\.\d+-feat-.+$/).test(branch)) {
    if (_isValidVersion(branch.split('-')[0])) {
      return BRANCH_TYPES.ITERATION_FEATURE;
    } else {
      return BRANCH_TYPES.INVALID;
    }
  }
  if ((/^\d+\.\d+\.\d+-fix-.+$/).test(branch)) {
    const version = branch.split('-')[0];
    if (_isValidVersion(version)) {
      return BRANCH_TYPES.ITERATION_FIX;
    } else if (_isValidVersion(version, true)) {
      return BRANCH_TYPES.HOTFIX;
    } else {
      return BRANCH_TYPES.INVALID;
    }
  }
  return BRANCH_TYPES.INVALID;
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
  };
  return 0;
}

function fetchEnvData(env) {
  return new Promise(function (resolve) {
    if (_envDataCache[env]) {
      resolve(_envDataCache[env]);
      return;
    }
    const config = _getConfig();
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
  return Promise.all(['production', 'staging', env].map(env => envStatus.fetchEnvData(env))).then(function (envsData) {
    if (!envsData[2].version) {
      return false;
    }
    return isEnvAvailableSync(env, envsData[2].version, envsData[1].version, envsData[0].version);
  });
}

module.exports = {
  FETCH_ERR: FETCH_ERR,
  BRANCH_TYPES: BRANCH_TYPES,
  getLastCommit: getLastCommit,
  getBranchType: getBranchType,
  compareVersion: compareVersion,
  fetchEnvData: fetchEnvData,
  isEnvAvailableSync: isEnvAvailableSync,
  isEnvAvailable: isEnvAvailable
};
