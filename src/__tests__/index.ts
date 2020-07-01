import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as fetch from 'fetch';
import { EnvStatus } from '../index';
import { FETCH_ERR, BRANCH_TYPES, IEnvData, IEnvErrData } from '../interfaces';
import { mockEnvData } from './util';

let envStatus: EnvStatus;

beforeEach(() => {
  envStatus = new EnvStatus();
});

afterAll(() => {
  envStatus = null;
});

describe('getShared', () => {
  test('success', () => {
    expect(EnvStatus.getShared() instanceof EnvStatus).toBeTruthy();
  });
});

describe('config', () => {
  test('getConfig success', () => {
    expect(envStatus.getConfig().gen).toEqual('dist/env-status.json');
  });

  test('file not exist', () => {
    jest.spyOn(path, 'resolve').mockImplementationOnce(() => {
      return '';
    });
    expect(envStatus.getConfig()).toEqual(null);
  });

  test('setConfig called in first getConfig, not called in sencond getConfig', () => {
    const spy = jest.spyOn(envStatus, 'setConfig');
    envStatus.getConfig();
    expect(spy.mock.calls.length).toBe(1);
    envStatus.getConfig();
    expect(spy.mock.calls.length).toBe(1);
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
    jest.spyOn(childProcess, 'execFile').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['fetch', 'origin']);
      expect(typeof args[2]).toEqual('function');
      setImmediate(args[2] as () => void);
      return 0 as any;
    });
    return envStatus.fetchOrigin().then(() => {
      //
    });
  });

  test('throw error', () => {
    jest.spyOn(childProcess, 'execFile').mockImplementationOnce((...args) => {
      setImmediate(() => (args[2] as (err: Error) => void)(new Error('error')));
      return 0 as any;
    });
    return envStatus.fetchOrigin().catch((err: Error) => {
      expect(err.message).toEqual('error');
    });
  });

  test('cached success promise', () => {
    jest.spyOn(childProcess, 'execFile').mockImplementationOnce((...args) => {
      setImmediate(args[2] as () => void);
      return 0 as any;
    });
    const promise = envStatus.fetchOrigin();
    return promise.then(() => {
      expect(promise === envStatus.fetchOrigin()).toBeTruthy();
    });
  });

  test('not cache failed promise', () => {
    jest.spyOn(childProcess, 'execFile').mockImplementationOnce((...args) => {
      setImmediate(() => (args[2] as (err: Error) => void)(new Error('error')));
      return 0 as any;
    });
    const promise = envStatus.fetchOrigin();
    return promise.catch(() => {
      expect(promise !== envStatus.fetchOrigin()).toBeTruthy();
    });
  });
});

describe('getLastCommit', () => {
  test('success', () => {
    jest.spyOn(childProcess, 'execFileSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['show', '--stat', '--format={"commit": "%h", "author": "%an", "branch": "%d"}|||']);
      return Buffer.from('{"commit": "282d4e2", "author": "webyom", "branch": " (HEAD -> master, 1.0.0)"}|||');
    });
    const now = new Date();
    const res = envStatus.getLastCommit(now);
    expect(res.branch).toEqual('1.0.0');
    expect(res.date).toEqual(now.getTime());
  });

  test('get from file', () => {
    jest.spyOn(childProcess, 'execFileSync').mockImplementationOnce(() => {
      throw new Error('error');
    });
    jest.spyOn(fs, 'readFileSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('last-commit.txt');
      return '{"commit": "282d4e2", "author": "webyom", "branch": " (HEAD -> master, 1.0.0)"}|||';
    });
    const now = new Date();
    const res = envStatus.getLastCommit(now);
    expect(res.branch).toEqual('1.0.0');
  });
});

describe('getBranchLastCommitId', () => {
  test('success', () => {
    jest.spyOn(childProcess, 'execFileSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['rev-parse', '--short', 'master']);
      return Buffer.from('282d4e2');
    });
    const res = envStatus.getBranchLastCommitId('master');
    expect(res).toEqual('282d4e2');
  });
});

describe('isAncestorCommit', () => {
  test('return false if c1 is empty', () => {
    const res = envStatus.isAncestorCommit('', 'b');
    expect(res).toEqual(false);
  });

  test('return false if c2 is empty', () => {
    const res = envStatus.isAncestorCommit('a', '');
    expect(res).toEqual(false);
  });

  test('return true if exec git command success', () => {
    jest.spyOn(childProcess, 'execFileSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['merge-base', '--is-ancestor', 'a', 'b']);
      return Buffer.from('');
    });
    const res = envStatus.isAncestorCommit('a', 'b');
    expect(res).toEqual(true);
  });

  test('return false if exec git command fail', () => {
    jest.spyOn(childProcess, 'execFileSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['merge-base', '--is-ancestor', 'a', 'b']);
      throw new Error('error');
    });
    const res = envStatus.isAncestorCommit('a', 'b');
    expect(res).toEqual(false);
  });
});

describe('getBranchName', () => {
  test('success', () => {
    jest.spyOn(childProcess, 'execFileSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['branch']);
      return Buffer.from('* 1.0.0');
    });
    expect(envStatus.getBranchName()).toEqual('1.0.0');
  });

  test('empty return', () => {
    jest.spyOn(childProcess, 'execFileSync').mockImplementationOnce(() => {
      return Buffer.from('master');
    });
    expect(envStatus.getBranchName()).toEqual('');
  });
});

describe('getBranchType', () => {
  test('sprint/xxx is SPRINT', () => {
    expect(envStatus.getBranchType('sprint/xxx')).toEqual(BRANCH_TYPES.SPRINT);
  });

  test('feat/xxx is SPRINT_FEATURE', () => {
    expect(envStatus.getBranchType('feat/xxx')).toEqual(BRANCH_TYPES.SPRINT_FEATURE);
  });

  test('fix/xxx is SPRINT_FIX', () => {
    expect(envStatus.getBranchType('fix/xxx')).toEqual(BRANCH_TYPES.SPRINT_FIX);
  });

  test('hotfix/xxx is HOTFIX', () => {
    expect(envStatus.getBranchType('hotfix/xxx')).toEqual(BRANCH_TYPES.HOTFIX);
  });

  test('master is MASTER', () => {
    expect(envStatus.getBranchType('master')).toEqual(BRANCH_TYPES.MASTER);
  });

  test('others is OTHERS', () => {
    expect(envStatus.getBranchType('others')).toEqual(BRANCH_TYPES.OTHERS);
  });
});

describe('appendCurrentTimestampToUrl', () => {
  test('without any param', () => {
    const url = 'https://www.mydomain.com/';
    const now = new Date();
    expect(envStatus.appendCurrentTimestampToUrl(url, now)).toBe(`${url}?t=${now.getTime()}`);
  });

  test('with param', () => {
    const url = 'https://www.mydomain.com/?a=1';
    const now = new Date();
    expect(envStatus.appendCurrentTimestampToUrl(url, now)).toBe(`${url}&t=${now.getTime()}`);
  });
});

describe('fetchEnvData', () => {
  test('success and cached data', () => {
    const spy = jest.spyOn(fetch, 'fetchUrl').mockImplementationOnce((url: string, callback: any) => {
      callback(null, { status: 200 }, '{}');
    });
    const spy2 = jest.spyOn(envStatus, 'setEnvDataCache');
    return envStatus.fetchEnvData('dev').then((data: IEnvData) => {
      expect(data.env).toEqual('dev');
      expect(spy2.mock.calls.length === 1).toBeTruthy();
      return envStatus.fetchEnvData('dev').then((data2: IEnvData) => {
        expect(data2.env).toEqual('dev');
        expect(spy2.mock.calls.length === 1).toBeTruthy();
        spy2.mockRestore();
        spy.mockRestore();
      });
    });
  });

  test('fetch error', () => {
    jest.spyOn(fetch, 'fetchUrl').mockImplementationOnce((url: string, callback: any) => {
      callback(new Error('error'), { status: 500 }, '{}');
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      expect(data.err).toEqual(FETCH_ERR.LOAD_ERROR);
    });
  });

  test('fetch 404', () => {
    jest.spyOn(fetch, 'fetchUrl').mockImplementationOnce((url: string, callback: any) => {
      callback(null, { status: 404 }, '{}');
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      expect(data.err).toEqual(FETCH_ERR.LOAD_ERROR);
    });
  });

  test('parse body error', () => {
    jest.spyOn(fetch, 'fetchUrl').mockImplementationOnce((url: string, callback: any) => {
      callback(null, { status: 200 }, '{data}');
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      expect(data.err).toEqual(FETCH_ERR.PARSE_RESPONSE_ERROR);
    });
  });

  test('config undefined', () => {
    jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      expect(data.err).toEqual(FETCH_ERR.CONFIG_UNDEFINED);
    });
  });

  test('url function undefined', () => {
    jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      const res: any = { url: '' };
      return res;
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      expect(data.err).toEqual(FETCH_ERR.URL_FUNCTION_UNDEFINED);
    });
  });
});

describe('isEnvAvailable', () => {
  test('production is always available', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation(env => {
      return Promise.resolve(
        mockEnvData({
          env,
        }),
      );
    });
    return envStatus.isEnvAvailable('production').then(res => {
      expect(res).toBe(true);
      spy.mockRestore();
    });
  });

  test('env is available when env commit is ancestor of production commit', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation(env => {
      return Promise.resolve(
        mockEnvData({
          env,
        }),
      );
    });
    const spy2 = jest.spyOn(envStatus, 'isAncestorCommit').mockImplementation(() => {
      return true;
    });
    return envStatus.isEnvAvailable('sprint/xxx').then(res => {
      expect(res).toBe(true);
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('env is available when env commit is ancestor of production commit', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation(env => {
      return Promise.resolve(
        mockEnvData({
          env,
        }),
      );
    });
    const spy2 = jest.spyOn(envStatus, 'isAncestorCommit').mockImplementation(() => {
      return true;
    });
    return envStatus.isEnvAvailable('sprint/xxx').then(res => {
      expect(res).toBe(true);
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('env is available when env commit is not ancestor of production commit \
but is ancestor of staging commit', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation(env => {
      return Promise.resolve(
        mockEnvData({
          env,
          commit: env,
        }),
      );
    });
    const spy2 = jest.spyOn(envStatus, 'isAncestorCommit').mockImplementation((c1, c2) => {
      return c2 === 'staging';
    });
    return envStatus.isEnvAvailable('sprint/xxx').then(res => {
      expect(res).toBe(true);
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('env is not available when env commit is not ancestor of production commit \
and is not ancestor of staging commit', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation(env => {
      return Promise.resolve(
        mockEnvData({
          env,
        }),
      );
    });
    const spy2 = jest.spyOn(envStatus, 'isAncestorCommit').mockImplementation(() => {
      return false;
    });
    return envStatus.isEnvAvailable('sprint/xxx').then(res => {
      expect(res).toBe(false);
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('staging is not available when staging commit is not ancestor of production commit', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation(env => {
      return Promise.resolve(
        mockEnvData({
          env,
        }),
      );
    });
    const spy2 = jest.spyOn(envStatus, 'isAncestorCommit').mockImplementation(() => {
      return false;
    });
    return envStatus.isEnvAvailable('staging').then(res => {
      expect(res).toBe(false);
      spy2.mockRestore();
      spy.mockRestore();
    });
  });
});
