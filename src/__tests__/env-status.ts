import * as fs from 'fs';
import * as path from 'path';
import * as ora from 'ora';
import {mockProcessExit} from 'jest-mock-process';
import mockConsole from 'jest-mock-console';
import {EnvStatus} from '../index';
import {Runner} from '../env-status';
import {mockSpinner} from './util';

let envStatus: EnvStatus;
let spinner: ora.Ora;
let runner: Runner;

beforeEach(() => {
  envStatus = new EnvStatus();
  spinner = ora();
  runner = new Runner(envStatus, spinner);
});

afterAll(() => {
  envStatus = null;
  spinner = null;
  runner = null;
});

describe('run', () => {
  test('--init config allreay exist', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['--init'];
    });
    const consoleRestore = mockConsole();
    runner.run();
    expect(console.log).toBeCalledWith(Runner.MESSAGES.CONFIG_ALLREADY_EXIST);
    consoleRestore();
    spy.mockRestore();
  });

  test('--init config file created', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['--init'];
    });
    const spy2 = jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    const consoleRestore = mockConsole();
    runner.run();
    expect(console.log).toBeCalledWith(Runner.MESSAGES.CONFIG_FILE_CREATED);
    consoleRestore();
    spy2.mockRestore();
    spy.mockRestore();
  });

  test('--gen success', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['--gen'];
    });
    const spy2 = jest.spyOn(fs, 'writeFileSync');
    runner.run();
    const fp = path.resolve('dist/env-status.json');
    expect(fs.writeFileSync).toBeCalledWith(fp, fs.readFileSync(fp).toString());
    spy2.mockRestore();
    spy.mockRestore();
  });

  test('--version success', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['--version'];
    });
    const consoleRestore = mockConsole();
    runner.run();
    expect(console.log).toBeCalledWith(require(path.resolve(__dirname, '../../package.json')).version);
    consoleRestore();
    spy.mockRestore();
  });

  test('spinner fail with no config', () => {
    const spy = jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    const spinnerRestore = mockSpinner(spinner);
    runner.run();
    expect(spinner.fail).toBeCalledWith(Runner.MESSAGES.SPINNER_FAIL_NO_CONFIG);
    spinnerRestore();
    spy.mockRestore();
  });

  test('spinner fail no evn defined', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['dev'];
    });
    const spy2 = jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      const res: any = {envs: []};
      return res;
    });
    const spinnerRestore = mockSpinner(spinner);
    runner.run();
    expect(spinner.fail).toBeCalledWith(Runner.MESSAGES.SPINNER_FAIL_REQUESTED_ENV_UNDEFINED);
    spinnerRestore();
    spy2.mockRestore();
    spy.mockRestore();
  });

  test('spinner fail requested env undefined', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['dev'];
    });
    const spy2 = jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      const res: any = {envs: ['staging', 'production']};
      return res;
    });
    const spinnerRestore = mockSpinner(spinner);
    runner.run();
    expect(spinner.fail).toBeCalledWith(Runner.MESSAGES.SPINNER_FAIL_REQUESTED_ENV_UNDEFINED);
    spinnerRestore();
    spy2.mockRestore();
    spy.mockRestore();
  });

  test('spinner start', () => {
    const spinnerRestore = mockSpinner(spinner);
    runner.run();
    expect(spinner.start).toBeCalledWith(Runner.MESSAGES.SPINNER_START);
    spinnerRestore();
  });
});
