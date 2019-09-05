#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
import * as mkdirp from 'mkdirp';
import * as chalkModule from 'chalk';
import * as ora from 'ora';
import * as asTable from 'as-table';
import * as envStatus from '../index';
import {EnvData, isEnvErrDataType} from '../interfaces';

const chalk = chalkModule as any;

const config = envStatus.getConfig();
const requestEnv = process.argv[2];

if (requestEnv == '--init') {
  if (config) {
    console.log(chalk.yellow('.envstatus.js file already exists!'));
  } else {
    const configPath = path.resolve(__dirname, '../../.envstatus.js');
    fs.writeFileSync(path.resolve('.envstatus2.js'), fs.readFileSync(configPath));
    console.log(chalk.green('.envstatus.js file created!'));
  }
  process.exit();
}

if (requestEnv == '--gen') {
  const pkgInfo = require(path.resolve('package.json'));

  const data = envStatus.getLastCommit();
  data.version = pkgInfo.version;

  const outputPath = path.resolve(config && config.gen || 'dist/env-status.json');
  mkdirp.sync(path.dirname(outputPath));
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  process.exit();
}

if (requestEnv == '--version' || requestEnv == '-v') {
  const pkgInfo = require(path.resolve(__dirname, '../../package.json'));

  console.log(pkgInfo.version);
  process.exit();
}

const spinner = ora('Loading .envstatus.js').start();

if (!config) {
  spinner.fail(`${chalk.yellow('.envstatus.js')} file is missing!`);
  process.exit();
}

const envs = (config.envs || []).filter(env =>
  requestEnv ? typeof env === 'string' && (env === requestEnv || env === 'production') : typeof env === 'string'
);

if (requestEnv && envs.length < 2) {
  if (!envs.length || envs[0] != requestEnv) {
    spinner.fail(`env ${chalk.yellow(requestEnv)} undefined!`);
    process.exit();
  }
}

const currentVersion = (() => {
  try {
    const pkgInfo = require(path.resolve('package.json'));

    return pkgInfo.version;
  } catch (err) {
    console.error(err);
  }
})();

spinner.text = 'Loading envs data';

Promise.all(envs.map(env => envStatus.fetchEnvData(env))).then(async envsData => {
  if (envsData.length) {
    envsData = envsData.sort((a: EnvData, b: EnvData) => {
      return getEnvWeight(a.env) - getEnvWeight(b.env) + (a.date > b.date ? -1 : a.date < b.date ? 1 : 0);
    });
    const envsData2 = await Promise.all(envsData.map(async data => {
      let status;
      if (isEnvErrDataType(data)) {
        status = chalk.red(data.err);
        return {
          env: data.env,
          status: status
        };
      }
      if (data.env == 'production') {
        status = '';
      } else if (await envStatus.isEnvAvailable(data.env)) {
        status = chalk.green('Available');
      } else {
        status = chalk.yellow('Using' + (currentVersion == data.version ? ' *' : ''));
      }
      const res = {
        env: data.env,
        status: status,
        version: data.version,
        branch: data.branch,
        commit: data.commit,
        author: data.author,
        date: data.date && moment(data.date).format('MM/DD HH:mm:ss'),
        since: data.date && moment(data.date).fromNow()
      };
      return res;
    }));
    spinner.stop();
    console.log('');
    console.log(asTable.configure({delimiter: ' | '})(envsData2));
    console.log('');
  } else {
    spinner.fail('No env defined');
  }
})
  .catch(err => {
    spinner.stop();
    console.error(err);
  });

function getEnvWeight(env) {
  if (env == 'production') {
    return 10;
  } else if (env == 'staging') {
    return 20;
  } else {
    return 30;
  }
}
