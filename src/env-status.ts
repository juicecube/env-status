import * as asTable from 'as-table';
import * as chalk from 'chalk';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as moment from 'moment';
import * as ora from 'ora';
import * as path from 'path';
import { Arguments } from 'yargs';
import { EnvStatus } from './index';
import { IEnvData, isEnvErrDataType } from './interfaces';

interface IEnvStatusArgv {
  init: boolean;
  gen: boolean;
}

export class Runner {
  public static MESSAGES = {
    CONFIG_ALLREADY_EXIST: chalk.yellow('.envstatus.js file already exists!'),
    CONFIG_FILE_CREATED: chalk.green('.envstatus.js file created!'),
    COMMIT_LOG_GENERATED: chalk.green('Commit log generated!'),
    SPINNER_START: 'Loading .envstatus.js',
    SPINNER_FAIL_NO_CONFIG: `${chalk.yellow('.envstatus.js')} file is missing!`,
    SPINNER_FAIL_REQUESTED_ENV_UNDEFINED: `Requested env undefined!`,
    SPINNER_LOADING_ENV_DATA: 'Loading envs data',
  };

  constructor(private envStatus: EnvStatus, private argv: Arguments<IEnvStatusArgv>, private spinner: ora.Ora) {}

  public getArgv(): Arguments<IEnvStatusArgv> {
    return this.argv;
  }

  public run(): Promise<string> {
    const argv = this.getArgv();
    const config = this.envStatus.getConfig();
    const requestEnv = argv._[0];

    if (argv.init) {
      if (config) {
        console.log(Runner.MESSAGES.CONFIG_ALLREADY_EXIST);
        return Promise.resolve(Runner.MESSAGES.CONFIG_ALLREADY_EXIST);
      } else {
        const configPath = path.resolve(__dirname, '../.envstatus.js');
        fs.writeFileSync(path.resolve('.envstatus.js'), fs.readFileSync(configPath));
        console.log(Runner.MESSAGES.CONFIG_FILE_CREATED);
        return Promise.resolve(Runner.MESSAGES.CONFIG_FILE_CREATED);
      }
    }

    if (argv.gen) {
      const data = this.envStatus.getLastCommit(new Date());

      const outputPath = path.resolve((config && config.gen) || 'dist/env-status.json');
      mkdirp.sync(path.dirname(outputPath));
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(Runner.MESSAGES.COMMIT_LOG_GENERATED);
      return Promise.resolve(Runner.MESSAGES.COMMIT_LOG_GENERATED);
    }

    const spinner = this.spinner;
    spinner.start(Runner.MESSAGES.SPINNER_START);

    if (!config) {
      spinner.fail(Runner.MESSAGES.SPINNER_FAIL_NO_CONFIG);
      return Promise.resolve(Runner.MESSAGES.SPINNER_FAIL_NO_CONFIG);
    }

    const envs = this.getEnvListForPrint(config.envs, requestEnv);

    if (requestEnv && envs.length < 2) {
      spinner.fail(Runner.MESSAGES.SPINNER_FAIL_REQUESTED_ENV_UNDEFINED);
      return Promise.resolve(Runner.MESSAGES.SPINNER_FAIL_REQUESTED_ENV_UNDEFINED);
    }

    spinner.text = Runner.MESSAGES.SPINNER_LOADING_ENV_DATA;

    return Promise.all(envs.map(env => this.envStatus.fetchEnvData(env))).then(async envsData => {
      envsData = envsData.sort((a: IEnvData, b: IEnvData) => {
        return this.getEnvWeight(a.env) - this.getEnvWeight(b.env) + (a.date > b.date ? -1 : a.date < b.date ? 1 : 0);
      });
      const envsData2 = await Promise.all(
        envsData.map(async data => {
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
            status = chalk.yellow('Using');
          }
          const res = {
            env: data.env,
            status,
            branch: data.branch,
            commit: data.commit,
            author: data.author,
            date: data.date && moment(data.date).format('MM/DD HH:mm:ss'),
            since: data.date && moment(data.date).fromNow(),
          };
          return res;
        }),
      );
      spinner.stop();
      this.printTable(envsData2);
      return Promise.resolve('');
    });
  }

  private printTable(envsData: any): void {
    console.log('');
    console.log(asTable.configure({ delimiter: ' | ' })(envsData));
    console.log('');
  }

  private getEnvWeight(env: string): number {
    if (env === 'production') {
      return 10;
    } else if (env === 'staging') {
      return 20;
    } else {
      return 30;
    }
  }

  private getEnvListForPrint(envs: string[], requestEnv?: string): string[] {
    return envs.filter(env => (requestEnv ? env === requestEnv || env === 'production' : true));
  }
}
