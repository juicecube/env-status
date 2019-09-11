import * as asTable from 'as-table';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as moment from 'moment';
import * as ora from 'ora';
import * as path from 'path';
import {EnvStatus} from './index';
import {IEnvData, isEnvErrDataType} from './interfaces';

export class Runner {
  constructor(private envStatus: EnvStatus) {}

  public getEnvWeight(env: string) {
    if (env === 'production') {
      return 10;
    } else if (env === 'staging') {
      return 20;
    } else {
      return 30;
    }
  }

  public getPackageVersion(): string {
    return require(path.resolve(__dirname, '../package.json')).version;
  }

  public run() {
    const config = this.envStatus.getConfig();
    const args = this.envStatus.getArgs(process.argv);
    const requestEnv = args[0];

    if (requestEnv === '--init') {
      if (config) {
        console.log(chalk.yellow('.envstatus.js file already exists!'));
      } else {
        const configPath = path.resolve(__dirname, '../.envstatus.js');
        fs.writeFileSync(path.resolve('.envstatus.js'), fs.readFileSync(configPath));
        console.log(chalk.green('.envstatus.js file created!'));
      }
      return;
    }

    if (requestEnv === '--gen') {
      const data = this.envStatus.getLastCommit(new Date());
      data.version = this.envStatus.getVersionFromPackage();

      const outputPath = path.resolve(config && config.gen || 'dist/env-status.json');
      mkdirp.sync(path.dirname(outputPath));
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      return;
    }

    if (requestEnv === '--version') {
      console.log(this.getPackageVersion());
      return;
    }

    const spinner = ora('Loading .envstatus.js').start();

    if (!config) {
      spinner.fail(`${chalk.yellow('.envstatus.js')} file is missing!`);
      return;
    }

    const envs = (config.envs || []).filter((env) =>
      requestEnv ? typeof env === 'string' && (env === requestEnv || env === 'production') : typeof env === 'string',
    );

    if (requestEnv && envs.length < 2) {
      if (!envs.length || envs[0] !== requestEnv) {
        spinner.fail(`env ${chalk.yellow(requestEnv)} undefined!`);
        return;
      }
    }

    const currentVersion = this.envStatus.getVersionFromPackage();

    spinner.text = 'Loading envs data';

    Promise.all(envs.map((env) => this.envStatus.fetchEnvData(env))).then(async (envsData) => {
      if (envsData.length) {
        envsData = envsData.sort((a: IEnvData, b: IEnvData) => {
          return this.getEnvWeight(a.env) - this.getEnvWeight(b.env) + (a.date > b.date ? -1 : a.date < b.date ? 1 : 0);
        });
        const envsData2 = await Promise.all(envsData.map(async (data) => {
          let status;
          if (isEnvErrDataType(data)) {
            status = chalk.red(data.err);
            return {
              env: data.env,
              status,
            };
          }
          if (data.env === 'production') {
            status = '';
          } else if (await this.envStatus.isEnvAvailable(data.env)) {
            status = chalk.green('Available');
          } else {
            status = chalk.yellow('Using' + (currentVersion === data.version ? ' *' : ''));
          }
          const res = {
            env: data.env,
            status,
            version: data.version,
            branch: data.branch,
            commit: data.commit,
            author: data.author,
            date: data.date && moment(data.date).format('MM/DD HH:mm:ss'),
            since: data.date && moment(data.date).fromNow(),
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
      .catch((err) => {
        spinner.stop();
        console.error(err);
      });
  }
}
