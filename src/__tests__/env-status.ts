import * as fs from 'fs';
import * as ora from 'ora';
import mockConsole from 'jest-mock-console';
import { EnvStatus } from '../index';
import { Runner } from '../env-status';
import { FETCH_ERR } from '../interfaces';
import { mockSpinner, mockEnvData, mockFetchOrigin } from './util';

let envStatus: EnvStatus;
let spinner: ora.Ora;
let runner: Runner;

beforeEach(() => {
  envStatus = new EnvStatus();
  mockFetchOrigin(envStatus);
  spinner = ora();
  runner = new Runner(
    envStatus,
    {
      _: [],
      $0: 'env-status',
      init: false,
      gen: false,
    },
    spinner,
  );
});

afterAll(() => {
  envStatus = null;
  spinner = null;
  runner = null;
});

describe('run', () => {
  test('getArgv', () => {
    expect(runner.getArgv()).toEqual({
      _: [],
      $0: 'env-status',
      init: false,
      gen: false,
    });
  });

  test('--init config allreay exist', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'env-status',
        init: true,
        gen: false,
      };
    });
    const consoleRestore = mockConsole();
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.CONFIG_ALLREADY_EXIST);
      consoleRestore();
    });
  });

  test('--init config file created', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'env-status',
        init: true,
        gen: false,
      };
    });
    jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.CONFIG_FILE_CREATED);
      consoleRestore();
    });
  });

  test('--gen success', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'env-status',
        init: false,
        gen: true,
      };
    });
    const spy = jest.spyOn(fs, 'writeFileSync');
    const consoleRestore = mockConsole();
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.COMMIT_LOG_GENERATED);
      consoleRestore();
      spy.mockRestore();
    });
  });

  test('--gen without config success', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'env-status',
        init: false,
        gen: true,
      };
    });
    jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.COMMIT_LOG_GENERATED);
      consoleRestore();
    });
  });

  test('spinner fail with no config', () => {
    jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    const spinnerRestore = mockSpinner(spinner);
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.SPINNER_FAIL_NO_CONFIG);
      spinnerRestore();
    });
  });

  test('spinner fail no evn defined', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['dev'],
        $0: 'env-status',
        init: false,
        gen: false,
      };
    });
    jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      const res: any = { envs: [] };
      return res;
    });
    const spinnerRestore = mockSpinner(spinner);
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.SPINNER_FAIL_REQUESTED_ENV_UNDEFINED);
      spinnerRestore();
    });
  });

  test('spinner fail requested env undefined', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['dev'],
        $0: 'env-status',
        init: false,
        gen: false,
      };
    });
    jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      const res: any = { envs: ['staging', 'production'] };
      return res;
    });
    const spinnerRestore = mockSpinner(spinner);
    return runner.run().then((msg: string) => {
      expect(msg).toBe(Runner.MESSAGES.SPINNER_FAIL_REQUESTED_ENV_UNDEFINED);
      spinnerRestore();
    });
  });

  test('success', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [''],
        $0: 'env-status',
        init: false,
        gen: false,
      };
    });
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      if (env === 'production') {
        return Promise.resolve(mockEnvData({ env, commit: env, date: 10 }));
      } else if (env === 'staging') {
        return Promise.resolve(mockEnvData({ env, commit: env, date: 5 }));
      } else if (env === 'dev') {
        return Promise.resolve(mockEnvData({ env, commit: env, date: 7 }));
      } else if (env === 'dev1') {
        return Promise.resolve(mockEnvData({ env, commit: env, date: 7 }));
      } else {
        return Promise.resolve({ env, err: FETCH_ERR.LOAD_ERROR, date: 7 });
      }
    });
    const spy2 = jest.spyOn(envStatus, 'isAncestorCommit').mockImplementation((c1, c2) => {
      return c2 === 'staging';
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
