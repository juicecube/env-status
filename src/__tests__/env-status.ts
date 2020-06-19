import * as fs from 'fs';
import * as path from 'path';
import * as ora from 'ora';
import mockConsole from 'jest-mock-console';
import { EnvStatus } from '../index';
import { Runner } from '../env-status';
import { FETCH_ERR } from '../interfaces';
import { mockSpinner, mockEnvData } from './util';

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
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.CONFIG_ALLREADY_EXIST);
      consoleRestore();
      spy.mockRestore();
    });
  });

  test('--init config file created', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['--init'];
    });
    const spy2 = jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.CONFIG_FILE_CREATED);
      consoleRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('--gen success', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['--gen'];
    });
    const spy2 = jest.spyOn(fs, 'writeFileSync');
    const consoleRestore = mockConsole();
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.COMMIT_LOG_GENERATED);
      consoleRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('--gen without config success', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['--gen'];
    });
    const spy2 = jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.COMMIT_LOG_GENERATED);
      consoleRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('--version success', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['--version'];
    });
    const consoleRestore = mockConsole();
    return runner.run().then((msg: string) => {
      expect(msg).toBe(require(path.resolve(__dirname, '../../package.json')).version);
      consoleRestore();
      spy.mockRestore();
    });
  });

  test('spinner fail with no config', () => {
    const spy = jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    const spinnerRestore = mockSpinner(spinner);
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.SPINNER_FAIL_NO_CONFIG);
      spinnerRestore();
      spy.mockRestore();
    });
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
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.SPINNER_FAIL_REQUESTED_ENV_UNDEFINED);
      spinnerRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
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
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.SPINNER_FAIL_REQUESTED_ENV_UNDEFINED);
      spinnerRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('success', () => {
    const spy = jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return [];
    });
    const spy2 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      if (env === 'production') {
        return Promise.resolve(mockEnvData({env, version: '1.0.0', date: 10}));
      } else if (env === 'staging') {
        return Promise.resolve(mockEnvData({env, version: '1.0.0', date: 5}));
      } else if (env === 'dev') {
        return Promise.resolve(mockEnvData({env, version: '1.1.0', date: 7}));
      } else if (env === 'dev1') {
        return Promise.resolve(mockEnvData({env, version: '1.2.0', date: 7}));
      } else {
        return Promise.resolve({env, err: FETCH_ERR.LOAD_ERROR, date: 7});
      }
    });
    const consoleRestore = mockConsole();
    const spinnerRestore = mockSpinner(spinner);
    return runner.run().then((msg: string) => {
      expect(msg).toBe('');
      spinnerRestore();
      consoleRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });
});
