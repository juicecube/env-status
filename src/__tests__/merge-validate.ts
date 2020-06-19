import * as child_process from 'child_process';
import mockConsole from 'jest-mock-console';
import { EnvStatus } from '../index';
import { Runner } from '../merge-validate';
import { mockFetchOrigin } from './util';

let envStatus: EnvStatus;
let runner: Runner;

beforeEach(() => {
  envStatus = new EnvStatus();
  mockFetchOrigin(envStatus);
  runner = new Runner(envStatus);
});

afterAll(() => {
  envStatus = null;
  runner = null;
});

describe('run', () => {
  test('sprint branch must be merged into master branch', () => {
    jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['sprint/xxx', 'dev'];
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
    jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['hotfix/xxx', 'dev'];
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
    jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['feat/xxx', 'dev'];
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
    jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['fix/xxx', 'dev'];
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
    jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['xxx', 'master'];
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

  test('target branch commit must be ancestor of current branch commit', () => {
    jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['sprint/xxx', 'master'];
    });
    jest.spyOn(envStatus, 'isAncestorCommit').mockImplementationOnce(() => {
      return false;
    });
    const spy = jest.spyOn(envStatus, 'getBranchLastCommitId').mockImplementation(() => {
      return 'a';
    });
    const mockConsoleRestore = mockConsole();
    return runner.run().then((code: number) => {
      expect(code).toBe(4);
      mockConsoleRestore();
      spy.mockRestore();
    });
  });

  test('fetch origin fail', () => {
    jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['sprint/xxx', 'master'];
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
    jest.spyOn(envStatus, 'getArgs').mockImplementationOnce(() => {
      return ['sprint/xxx', 'master'];
    });
    jest.spyOn(envStatus, 'isAncestorCommit').mockImplementationOnce(() => {
      return true;
    });
    jest.spyOn(child_process, 'spawnSync').mockImplementationOnce((...args) => {
      console.log(111, args);
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
