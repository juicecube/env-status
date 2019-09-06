"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var fetch = require("fetch");
var fs = require("fs");
var moment = require("moment");
var os = require("os");
var path = require("path");
exports.FETCH_ERR = {
    CONFIG_UNDEFINED: 'CONFIG_UNDEFINED',
    URL_FUNCTION_UNDEFINED: 'URL_FUNCTION_UNDEFINED',
    LOAD_ERROR: 'LOAD_ERROR',
    PARSE_RESPONSE_ERROR: 'PARSE_RESPONSE_ERROR',
};
exports.BRANCH_TYPES = {
    ITERATION: 'ITERATION',
    ITERATION_FEATURE: 'ITERATION_FEATURE',
    ITERATION_FIX: 'ITERATION_FIX',
    HOTFIX: 'HOTFIX',
    OTHERS: 'OTHERS',
};
var envDataCache = {};
var fetchOriginPromise;
function fetchOrigin() {
    if (fetchOriginPromise) {
        return fetchOriginPromise;
    }
    return fetchOriginPromise = new Promise(function (resolve, reject) {
        child_process_1.execFile('git', ['fetch', 'origin'], function (err) {
            if (err) {
                fetchOriginPromise = null;
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
var envConfig;
function getConfig() {
    if (envConfig) {
        return envConfig;
    }
    var configPath = path.resolve('.envstatus.js');
    if (!fs.existsSync(configPath)) {
        return null;
    }
    envConfig = require(configPath);
    return envConfig;
}
exports.getConfig = getConfig;
function isValidVersion(version, fix) {
    if ((/^\d+\.\d+\.\d+$/).test(version)) {
        var parts = version.split('.');
        if (parts[0] === '0' && parts[1] === '0') {
            return false;
        }
        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
            var x = parts_1[_i];
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
function getLastCommit() {
    var jsonStr;
    try {
        jsonStr = child_process_1.execFileSync('git', ['show', '--stat', '--format={"commit": "%h", "author": "%an", "branch": "%d"}|||'])
            .toString()
            .split('|||')[0];
    }
    catch (err) {
        jsonStr = fs.readFileSync('last-commit.txt').toString().split('|||')[0];
    }
    var res = JSON.parse(jsonStr);
    res.date = moment(new Date()).valueOf();
    res.branch = res.branch.match(/\S*?(?=\))/)[0];
    return res;
}
exports.getLastCommit = getLastCommit;
function getBranchName() {
    var res = child_process_1.execFileSync('git', ['branch']).toString().split(os.EOL).find(function (x) { return x.startsWith('*'); });
    if (res) {
        return res.slice(1).trim();
    }
    else {
        return '';
    }
}
exports.getBranchName = getBranchName;
function getBranchType(branch) {
    if ((/^\d+\.\d+\.\d+$/).test(branch)) {
        if (isValidVersion(branch)) {
            return exports.BRANCH_TYPES.ITERATION;
        }
        else {
            return exports.BRANCH_TYPES.OTHERS;
        }
    }
    if ((/^\d+\.\d+\.\d+-feat-.+$/).test(branch)) {
        if (isValidVersion(branch.split('-')[0])) {
            return exports.BRANCH_TYPES.ITERATION_FEATURE;
        }
        else {
            return exports.BRANCH_TYPES.OTHERS;
        }
    }
    if ((/^\d+\.\d+\.\d+-fix-.+$/).test(branch)) {
        var version = branch.split('-')[0];
        if (isValidVersion(version)) {
            return exports.BRANCH_TYPES.ITERATION_FIX;
        }
        else if (isValidVersion(version, true)) {
            return exports.BRANCH_TYPES.HOTFIX;
        }
        else {
            return exports.BRANCH_TYPES.OTHERS;
        }
    }
    return exports.BRANCH_TYPES.OTHERS;
}
exports.getBranchType = getBranchType;
function getOriginBranchVersion(branch) {
    return new Promise(function (resolve, reject) {
        child_process_1.execFile('git', ['fetch', 'origin', branch], function (err) {
            if (err) {
                reject(err);
                return;
            }
            try {
                var m = child_process_1.execFileSync('git', ['diff', "origin/" + branch, 'package.json']).toString().match(/-\s*"version":\s*"(.*?)"/);
                if (m) {
                    resolve(m[1]);
                }
                else {
                    resolve(require(path.resolve('package.json')).version);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    });
}
exports.getOriginBranchVersion = getOriginBranchVersion;
function getVersionFromBranchName(branch) {
    if (getBranchType(branch) !== exports.BRANCH_TYPES.OTHERS) {
        return branch.split('-')[0];
    }
    else {
        return '';
    }
}
exports.getVersionFromBranchName = getVersionFromBranchName;
function compareVersion(a, b) {
    var r = /^\d+\.\d+\.\d+$/;
    if (!r.test(a) || !r.test(b)) {
        return 9;
    }
    var aArr = a.split('.');
    var bArr = b.split('.');
    for (var i = 0, l = aArr.length; i < l; i++) {
        var ai = parseInt(aArr[i], 10);
        var bi = parseInt(bArr[i], 10);
        if (ai > bi) {
            return 1;
        }
        else if (ai < bi) {
            return -1;
        }
    }
    return 0;
}
exports.compareVersion = compareVersion;
function fetchEnvData(env) {
    return new Promise(function (resolve) {
        if (envDataCache[env]) {
            resolve(envDataCache[env]);
            return;
        }
        var config = getConfig();
        if (!config) {
            resolve({ err: exports.FETCH_ERR.CONFIG_UNDEFINED, env: env });
            return;
        }
        if (typeof config.url !== 'function') {
            resolve({ err: exports.FETCH_ERR.URL_FUNCTION_UNDEFINED, env: env });
            return;
        }
        var url = config.url(env);
        fetch.fetchUrl("" + url + (url.indexOf('?') > 0 ? '&' : '?') + "t=" + Date.now(), function (error, meta, body) {
            var data;
            if (error || meta.status !== 200) {
                data = { err: exports.FETCH_ERR.LOAD_ERROR, env: env };
            }
            else {
                try {
                    data = Object.assign({ env: env }, JSON.parse(body.toString()));
                }
                catch (err) {
                    data = { err: exports.FETCH_ERR.PARSE_RESPONSE_ERROR, env: env };
                }
            }
            envDataCache[env] = data;
            resolve(data);
        });
    });
}
exports.fetchEnvData = fetchEnvData;
function isEnvAvailable(env) {
    return Promise.all(['production', 'staging', env].map(function (e) { return fetchEnvData(e); })).then(function (envsData) {
        var envData = envsData[2] || {};
        var stgData = envsData[1] || {};
        var prdData = envsData[0] || {};
        if (!envData.version) {
            return false;
        }
        if (envData.env === 'production') {
            return true;
        }
        else if (envData.env === 'staging') {
            if (compareVersion(envData.version, prdData.version) === 1) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            var compareRes = compareVersion(envData.version, stgData.version);
            if (compareRes === 1) {
                return false;
            }
            else if (compareRes === 0) {
                return true;
            }
            else {
                compareRes = compareVersion(envData.version, prdData.version);
                if (compareRes === 1) {
                    return false;
                }
                else if (compareRes === 0) {
                    return true;
                }
                else {
                    return fetchOrigin().then(function () {
                        try {
                            child_process_1.execFileSync('git', ['merge-base', '--is-ancestor', envData.commit, prdData.commit]);
                            return true;
                        }
                        catch (err) {
                            return false;
                        }
                    }).catch(function (err) {
                        console.error(err);
                        return false;
                    });
                }
            }
        }
    });
}
exports.isEnvAvailable = isEnvAvailable;
