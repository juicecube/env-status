import * as childProcess from 'child_process';
import mockConsole from 'jest-mock-console';
import { EnvStatus } from '../index';
import { Runner } from '../merge-validate';
import { mockFetchOrigin } from './util';

let envStatus: EnvStatus;
let runner: Runner;

beforeEach(() => {
  envStatus = new EnvStatus();
  mockFetchOrigin(envStatus);
  runner = new Runner(envStatus, {
    _: [],
    $0: 'merge-validate',
  });
});

afterAll(() => {
  envStatus = null;
  runner = null;
});

describe('run', () => {
  test('getArgv', () => {
    expect(runner.getArgv()).toEqual({
      _: [],
      $0: 'merge-validate',
    });
  });

  test('should specify target branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['sprint/xxx'],
        $0: 'merge-validate',
      };
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(20);
      mockConsoleRestore();
    });
  });

  test('should specify source branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['', 'sprint/xxx'],
        $0: 'merge-validate',
      };
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(20);
      mockConsoleRestore();
    });
  });

  test('sprint branch must be merged into master branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['sprint/xxx', 'dev'],
        $0: 'merge-validate',
      };
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(() => {
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(1);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('hotfix branch must be merged into master branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['hotfix/xxx', 'dev'],
        $0: 'merge-validate',
      };
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(() => {
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(1);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('feature branch must be merged into sprint branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['feat/xxx', 'dev'],
        $0: 'merge-validate',
      };
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(() => {
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(2);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('fix branch must be merged into sprint branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['fix/xxx', 'dev'],
        $0: 'merge-validate',
      };
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(() => {
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(2);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('source branch name is invalid', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['xxx', 'master'],
        $0: 'merge-validate',
      };
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(() => {
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(3);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('catch error when get source branch last commit', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['sprint/xxx', 'master'],
        $0: 'merge-validate',
      };
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(branchName => {
      if (branchName === 'origin/sprint/xxx') {
        throw new Error('error');
      }
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(4);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('catch error when get target branch last commit', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['sprint/xxx', 'master'],
        $0: 'merge-validate',
      };
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(branchName => {
      if (branchName === 'origin/master') {
        throw new Error('error');
      }
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(5);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('target branch commit must be ancestor of current branch commit', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['sprint/xxx', 'master'],
        $0: 'merge-validate',
      };
    });
    jest.spyOn(envStatus, 'isAncestorCommit').mockImplementationOnce(() => {
      return false;
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(() => {
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(6);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('fetch origin fail', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['sprint/xxx', 'master'],
        $0: 'merge-validate',
      };
    });
    jest.spyOn(envStatus, 'fetchOrigin').mockImplementationOnce(() => {
      return Promise.reject();
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(() => {
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(10);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('success', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: ['sprint/xxx', 'master'],
        $0: 'merge-validate',
      };
    });
    jest.spyOn(envStatus, 'isAncestorCommit').mockImplementationOnce(() => {
      return true;
    });
    jest.spyOn(childProcess, 'spawnSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('arc');
      expect(args[1]).toEqual(['diff', 'master']);
      return 0 as any;
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(() => {
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(0);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });
});
