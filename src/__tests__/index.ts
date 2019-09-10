import * as child_process from 'child_process';
import {ChildProcess} from 'child_process';
import {EnvStatus} from '../index';
import {BRANCH_TYPES} from '../interfaces';

let envStatus: EnvStatus;

beforeEach(() => {
  envStatus = new EnvStatus();
});

afterAll(() => {
  envStatus = null;
});

describe('config', () => {
  test('getConfig success', () => {
    expect(envStatus.getConfig().gen).toEqual('dist/env-status.json');
  });

  test('setConfig called in first getConfig, not called in sencond getConfig', () => {
    const spy = jest.spyOn(envStatus, 'setConfig');
    envStatus.getConfig();
    expect(spy.mock.calls.length === 1).toBeTruthy();
    envStatus.getConfig();
    expect(spy.mock.calls.length === 1).toBeTruthy();
    spy.mockRestore();
  });
});

describe('getArgs', () => {
  test('success', () => {
    expect(envStatus.getArgs(['1', '2', '3', '4'])).toEqual(['3', '4']);
  });
});

describe('fetchOrigin', () => {
  test('success', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args): ChildProcess => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['fetch', 'origin']);
      expect(typeof args[2]).toEqual('function');
      setImmediate(args[2] as () => void);
      return child_process.exec('echo ok');
    });
    return envStatus.fetchOrigin().then(() => {
      spy.mockRestore();
    });
  });

  test('throw error', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args): ChildProcess => {
      setImmediate(() => (args[2] as (err: Error) => void)(new Error('error')));
      return child_process.exec('echo error');
    });
    return envStatus.fetchOrigin().catch((err: Error) => {
      expect(err.message).toEqual('error');
      spy.mockRestore();
    });
  });

  test('cached success promise', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args): ChildProcess => {
      setImmediate(args[2] as () => void);
      return child_process.exec('echo ok');
    });
    const promise = envStatus.fetchOrigin();
    return promise.then(() => {
      expect(promise === envStatus.fetchOrigin()).toBeTruthy();
      spy.mockRestore();
    });
  });

  test('not cache failed promise', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args): ChildProcess => {
      setImmediate(() => (args[2] as (err: Error) => void)(new Error('error')));
      return child_process.exec('echo error');
    });
    const promise = envStatus.fetchOrigin();
    return promise.catch(() => {
      expect(promise !== envStatus.fetchOrigin()).toBeTruthy();
      spy.mockRestore();
    });
  });
});

describe('isValidVersion', () => {
  test('1.0.0 is valid', () => {
    expect(envStatus.isValidVersion('1.0.0')).toBeTruthy();
  });

  test('0.1.0 is valid', () => {
    expect(envStatus.isValidVersion('0.1.0')).toBeTruthy();
  });

  test('0.1.1 with fix param is valid', () => {
    expect(envStatus.isValidVersion('0.1.1', true)).toBeTruthy();
  });

  test('0.0.1 is not valid', () => {
    expect(envStatus.isValidVersion('0.0.1')).toBeFalsy();
  });

  test('0.0.0 is not valid', () => {
    expect(envStatus.isValidVersion('0.0.0')).toBeFalsy();
  });

  test('01.0.0 is not valid', () => {
    expect(envStatus.isValidVersion('01.0.0')).toBeFalsy();
  });

  test('0.01.0 is not valid', () => {
    expect(envStatus.isValidVersion('0.01.0')).toBeFalsy();
  });

  test('1.0.01 is not valid', () => {
    expect(envStatus.isValidVersion('1.0.01')).toBeFalsy();
  });

  test('1.0.1 without fix param is not valid', () => {
    expect(envStatus.isValidVersion('1.0.1')).toBeFalsy();
  });

  test('1.0.0 with fix param is not valid', () => {
    expect(envStatus.isValidVersion('1.0.0', true)).toBeFalsy();
  });

  test('1.0.0.0 is not valid', () => {
    expect(envStatus.isValidVersion('1.0.0.0')).toBeFalsy();
  });
});

describe('getLastCommit', () => {
  test('success', () => {
    const spy = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['show', '--stat', '--format={"commit": "%h", "author": "%an", "branch": "%d"}|||']);
      return Buffer.from('{"commit": "282d4e2", "author": "webyom", "branch": " (HEAD -> master, 1.0.0)"}|||');
    });
    const now = new Date();
    const res = envStatus.getLastCommit(now);
    expect(res.branch).toEqual('1.0.0');
    expect(res.date).toEqual(now.getTime());
    spy.mockRestore();
  });
});

describe('getBranchType', () => {
  test('1.0.0 is ITERATION', () => {
    expect(envStatus.getBranchType('1.0.0')).toEqual(BRANCH_TYPES.ITERATION);
  });

  test('1.0.0-feat-xxx is ITERATION_FEATURE', () => {
    expect(envStatus.getBranchType('1.0.0-feat-xxx')).toEqual(BRANCH_TYPES.ITERATION_FEATURE);
  });

  test('1.0.0-fix-xxx is ITERATION_FIX', () => {
    expect(envStatus.getBranchType('1.0.0-fix-xxx')).toEqual(BRANCH_TYPES.ITERATION_FIX);
  });

  test('1.0.1-fix-xxx is HOTFIX', () => {
    expect(envStatus.getBranchType('1.0.1-fix-xxx')).toEqual(BRANCH_TYPES.HOTFIX);
  });

  test('master is OTHERS', () => {
    expect(envStatus.getBranchType('master')).toEqual(BRANCH_TYPES.OTHERS);
  });
});
