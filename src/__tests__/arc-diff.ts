import * as child_process from 'child_process';
import mockConsole from 'jest-mock-console';
import {EnvStatus} from '../index';
import {Runner} from '../arc-diff';

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

  test('branch name is not viable for arc-diff', () => {
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
      expect(code).toBe(2);
      consoleRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('feature branch and version compare result is 0', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.0.0-feat-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.0.0';
    });
    const spy3 = jest.spyOn(envStatus, 'compareVersion').mockImplementationOnce((...args) => {
      return 0;
    });
    const spy4 = jest.spyOn(envStatus as any, 'getOriginBranchVersion').mockImplementationOnce(() => {
      return Promise.resolve('1.0.0');
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

  test('feature branch and version compare result is not 0', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.0.0-feat-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.0.0';
    });
    const spy3 = jest.spyOn(envStatus, 'compareVersion').mockImplementationOnce((...args) => {
      return -1;
    });
    const spy4 = jest.spyOn(envStatus as any, 'getOriginBranchVersion').mockImplementationOnce(() => {
      return Promise.resolve('1.1.0');
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(3);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('iteration fix branch and version compare result is 0', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.0.0-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.0.0';
    });
    const spy3 = jest.spyOn(envStatus, 'compareVersion').mockImplementationOnce((...args) => {
      return 0;
    });
    const spy4 = jest.spyOn(envStatus as any, 'getOriginBranchVersion').mockImplementationOnce(() => {
      return Promise.resolve('1.0.0');
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

  test('iteration fix branch and version compare result is not 0', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.0.0-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.0.0';
    });
    const spy3 = jest.spyOn(envStatus, 'compareVersion').mockImplementationOnce((...args) => {
      return -1;
    });
    const spy4 = jest.spyOn(envStatus as any, 'getOriginBranchVersion').mockImplementationOnce(() => {
      return Promise.resolve('1.1.0');
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(3);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('hotfix branch and version compare result is 1', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.0.1-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.0.1';
    });
    const spy3 = jest.spyOn(envStatus, 'compareVersion').mockImplementationOnce((...args) => {
      return 1;
    });
    const spy4 = jest.spyOn(envStatus as any, 'getOriginBranchVersion').mockImplementationOnce(() => {
      return Promise.resolve('1.0.0');
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

  test('hotfix branch and version compare result is not 1', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.0.1-fix-xxx';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.0.1';
    });
    const spy3 = jest.spyOn(envStatus, 'compareVersion').mockImplementationOnce((...args) => {
      return 0;
    });
    const spy4 = jest.spyOn(envStatus as any, 'getOriginBranchVersion').mockImplementationOnce(() => {
      return Promise.resolve('1.0.1');
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(3);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('iteration branch and version compare result is 1', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'compareVersion').mockImplementationOnce((...args) => {
      return 1;
    });
    const spy4 = jest.spyOn(envStatus as any, 'getOriginBranchVersion').mockImplementationOnce(() => {
      return Promise.resolve('1.0.0');
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

  test('iteration branch and version compare result is not 1', () => {
    const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
      return '1.1.0';
    });
    const spy3 = jest.spyOn(envStatus, 'compareVersion').mockImplementationOnce((...args) => {
      return 0;
    });
    const spy4 = jest.spyOn(envStatus as any, 'getOriginBranchVersion').mockImplementationOnce(() => {
      return Promise.resolve('1.1.0');
    });
    const spy5 = jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      return 0 as any;
    });
    const consoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(3);
      consoleRestore();
      spy5.mockRestore();
      spy4.mockRestore();
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });
});
