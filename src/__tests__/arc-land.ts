import * as child_process from 'child_process';
import mockConsole from 'jest-mock-console';
import { EnvStatus } from '../index';
import { Runner } from '../arc-land';
import { mockFetchOrigin } from './util';

let envStatus: EnvStatus;
let runner: Runner;

beforeEach(() => {
  envStatus = new EnvStatus();
  mockFetchOrigin(envStatus);
  runner = new Runner(envStatus, {
    _: [],
    $0: 'arc-land',
    onto: 'master',
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
      $0: 'arc-land',
      onto: 'master',
    });
  });

  test('pass --onto argument', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'arc-land',
        onto: '',
      };
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(20);
      mockConsoleRestore();
    });
  });

  test('sprint branch must be landed to master branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'arc-land',
        onto: 'dev',
      };
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
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

  test('hotfix branch must be landed to master branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'arc-land',
        onto: 'dev',
      };
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'hotfix/xxx';
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

  test('feature branch must be landed to sprint branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'arc-land',
        onto: 'dev',
      };
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'feat/xxx';
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

  test('fix branch must be landed to sprint branch', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'arc-land',
        onto: 'dev',
      };
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'fix/xxx';
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

  test('working branch name is invalid', () => {
    jest.spyOn(runner, 'getArgv').mockImplementationOnce(() => {
      return {
        _: [],
        $0: 'arc-land',
        onto: 'master',
      };
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'xxx';
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
        _: [],
        $0: 'arc-land',
        onto: 'master',
      };
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation((branchName) => {
      if (branchName === 'sprint/xxx') {
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
        _: [],
        $0: 'arc-land',
        onto: 'master',
      };
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation((branchName) => {
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
        _: [],
        $0: 'arc-land',
        onto: 'master',
      };
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
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
        _: [],
        $0: 'arc-land',
        onto: 'master',
      };
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
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
        _: [],
        $0: 'arc-land',
        onto: 'master',
      };
    });
    jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['--onto', 'master'];
    });
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
    });
    jest.spyOn(envStatus, 'isAncestorCommit').mockImplementationOnce(() => {
      return true;
    });
    jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('arc');
      expect(args[1]).toEqual(['land', '--onto', 'master']);
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
