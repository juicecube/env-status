#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var asTable = require("as-table");
var chalk = require("chalk");
var fs = require("fs");
var mkdirp = require("mkdirp");
var moment = require("moment");
var ora = require("ora");
var path = require("path");
var envStatus = require("../index");
var interfaces_1 = require("../interfaces");
var config = envStatus.getConfig();
var requestEnv = process.argv[2];
if (requestEnv === '--init') {
    if (config) {
        console.log(chalk.yellow('.envstatus.js file already exists!'));
    }
    else {
        var configPath = path.resolve(__dirname, '../../.envstatus.js');
        fs.writeFileSync(path.resolve('.envstatus2.js'), fs.readFileSync(configPath));
        console.log(chalk.green('.envstatus.js file created!'));
    }
    process.exit();
}
if (requestEnv === '--gen') {
    var pkgInfo = require(path.resolve('package.json'));
    var data = envStatus.getLastCommit();
    data.version = pkgInfo.version;
    var outputPath = path.resolve(config && config.gen || 'dist/env-status.json');
    mkdirp.sync(path.dirname(outputPath));
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    process.exit();
}
if (requestEnv === '--version' || requestEnv === '-v') {
    var pkgInfo = require(path.resolve(__dirname, '../../package.json'));
    console.log(pkgInfo.version);
    process.exit();
}
var spinner = ora('Loading .envstatus.js').start();
if (!config) {
    spinner.fail(chalk.yellow('.envstatus.js') + " file is missing!");
    process.exit();
}
var envs = (config.envs || []).filter(function (env) {
    return requestEnv ? typeof env === 'string' && (env === requestEnv || env === 'production') : typeof env === 'string';
});
if (requestEnv && envs.length < 2) {
    if (!envs.length || envs[0] !== requestEnv) {
        spinner.fail("env " + chalk.yellow(requestEnv) + " undefined!");
        process.exit();
    }
}
var currentVersion = (function () {
    try {
        var pkgInfo = require(path.resolve('package.json'));
        return pkgInfo.version;
    }
    catch (err) {
        console.error(err);
    }
})();
spinner.text = 'Loading envs data';
Promise.all(envs.map(function (env) { return envStatus.fetchEnvData(env); })).then(function (envsData) { return __awaiter(void 0, void 0, void 0, function () {
    var envsData2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!envsData.length) return [3 /*break*/, 2];
                envsData = envsData.sort(function (a, b) {
                    return getEnvWeight(a.env) - getEnvWeight(b.env) + (a.date > b.date ? -1 : a.date < b.date ? 1 : 0);
                });
                return [4 /*yield*/, Promise.all(envsData.map(function (data) { return __awaiter(void 0, void 0, void 0, function () {
                        var status, res;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (interfaces_1.isEnvErrDataType(data)) {
                                        status = chalk.red(data.err);
                                        return [2 /*return*/, {
                                                env: data.env,
                                                status: status,
                                            }];
                                    }
                                    if (!(data.env === 'production')) return [3 /*break*/, 1];
                                    status = '';
                                    return [3 /*break*/, 3];
                                case 1: return [4 /*yield*/, envStatus.isEnvAvailable(data.env)];
                                case 2:
                                    if (_a.sent()) {
                                        status = chalk.green('Available');
                                    }
                                    else {
                                        status = chalk.yellow('Using' + (currentVersion === data.version ? ' *' : ''));
                                    }
                                    _a.label = 3;
                                case 3:
                                    res = {
                                        env: data.env,
                                        status: status,
                                        version: data.version,
                                        branch: data.branch,
                                        commit: data.commit,
                                        author: data.author,
                                        date: data.date && moment(data.date).format('MM/DD HH:mm:ss'),
                                        since: data.date && moment(data.date).fromNow(),
                                    };
                                    return [2 /*return*/, res];
                            }
                        });
                    }); }))];
            case 1:
                envsData2 = _a.sent();
                spinner.stop();
                console.log('');
                console.log(asTable.configure({ delimiter: ' | ' })(envsData2));
                console.log('');
                return [3 /*break*/, 3];
            case 2:
                spinner.fail('No env defined');
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); })
    .catch(function (err) {
    spinner.stop();
    console.error(err);
});
function getEnvWeight(env) {
    if (env === 'production') {
        return 10;
    }
    else if (env === 'staging') {
        return 20;
    }
    else {
        return 30;
    }
}
