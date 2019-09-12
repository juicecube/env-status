import * as child_process from 'child_process';
import mockConsole from 'jest-mock-console';
import {EnvStatus} from '../index';
import {Runner} from '../arc-land';
import {mockEnvData} from './util';
import {FETCH_ERR} from '../interfaces';

let envStatus: EnvStatus;
let runner: Runner;

beforeEach(() => {
  envStatus = new EnvStatus();
  runner = new Runner(envStatus);
});

afterAll(() => {
  envStatus = null;
  runner = null;
});

describe('run', () => {
  test('local version != branch name version', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'master';
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(1);
      consoleRestore();
      spy.mockRestore();
    });
  });

  test('branch type is not viable for arc-land', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'master';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromBranchName').mockImplementationOnce(() => {
      return '1.0.0';
    });
    const spy3 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.0.0';
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(99);
      consoleRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('iteration feature branch land to remote iteration branch, pass', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.0.0-feat-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.0.0';
    });
    const spy3 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(0);
      consoleRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

});

describe('iteration branch land to remote master branch', () => {
  test('fetch env data error, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.reject(new Error('error'));
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(14);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('failed to fetch staging data, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return env === 'staging' ? Promise.resolve({env, err: FETCH_ERR.LOAD_ERROR})
                      : Promise.resolve(mockEnvData({version: '1.0.0'}));
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(11);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('failed to fetch production data, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return env === 'production' ? Promise.resolve({env, err: FETCH_ERR.LOAD_ERROR})
                      : Promise.resolve(mockEnvData({version: '1.0.0'}));
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(11);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is available and branch version > production version, pass', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.0.0'}));
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(0);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is available and branch version <= production version, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.2.0'}));
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(12);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is not available and branch version == staging version, pass', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(false);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.1.0'}));
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(0);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is not available and branch version != staging version, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(false);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.0.0'}));
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(13);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });
});

describe('iteration fix branch land to remote master branch', () => {
  test('fetch env data error, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.reject(new Error('error'));
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(24);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('failed to fetch staging data, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve({env, err: FETCH_ERR.LOAD_ERROR});
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(21);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is available, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.1.0'}));
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(22);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is not available and branch version == staging version, pass', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(false);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.1.0'}));
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(0);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is not available and branch version != staging version, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(false);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.2.0'}));
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(23);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });
});

describe('hotfix branch land to remote master branch', () => {
  test('fetch env data error, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.1-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.1';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.reject(new Error('error'));
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(34);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('failed to fetch staging data, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.1-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.1';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve({env, err: FETCH_ERR.LOAD_ERROR});
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(31);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is not available, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.1-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.1';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(false);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.1.1'}));
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(32);
      consoleRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is available and branch version > production version, pass', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.1-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.1';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.0.0'}));
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(0);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is available and branch version <= production version, fail', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.1-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.1';
    });
    const spy3 = jest.spyOn(envStatus, 'isEnvAvailable').mockImplementationOnce(() => {
      return Promise.resolve(true);
    });
    const spy4 = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env: string) => {
      return Promise.resolve(mockEnvData({version: '1.2.0'}));
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(33);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });
});
