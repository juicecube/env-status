import * as child_process from 'child_process';
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
    const spy = jest.spyOn(path, 'resolve').mockImplementationOnce((...args) => {
      return '';
    });
    expect(envStatus.getConfig()).toEqual(null);
    spy.mockRestore();
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
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['fetch', 'origin']);
      expect(typeof args[2]).toEqual('function');
      setImmediate(args[2] as () => void);
      return 0 as any;
    });
    return envStatus.fetchOrigin().then(() => {
      spy.mockRestore();
    });
  });

  test('throw error', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args) => {
      setImmediate(() => (args[2] as (err: Error) => void)(new Error('error')));
      return 0 as any;
    });
    return envStatus.fetchOrigin().catch((err: Error) => {
      expect(err.message).toEqual('error');
      spy.mockRestore();
    });
  });

  test('cached success promise', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args) => {
      setImmediate(args[2] as () => void);
      return 0 as any;
    });
    const promise = envStatus.fetchOrigin();
    return promise.then(() => {
      expect(promise === envStatus.fetchOrigin()).toBeTruthy();
      spy.mockRestore();
    });
  });

  test('not cache failed promise', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args) => {
      setImmediate(() => (args[2] as (err: Error) => void)(new Error('error')));
      return 0 as any;
    });
    const promise = envStatus.fetchOrigin();
    return promise.catch(() => {
      expect(promise !== envStatus.fetchOrigin()).toBeTruthy();
      spy.mockRestore();
    });
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

  test('get from file', () => {
    const spy = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      throw new Error('error');
    });
    const spy2 = jest.spyOn(fs, 'readFileSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('last-commit.txt');
      return '{"commit": "282d4e2", "author": "webyom", "branch": " (HEAD -> master, 1.0.0)"}|||';
    });
    const now = new Date();
    const res = envStatus.getLastCommit(now);
    expect(res.branch).toEqual('1.0.0');
    spy.mockRestore();
    spy2.mockRestore();
  });
});

describe('getBranchName', () => {
  test('success', () => {
    const spy = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      expect(args[0]).toEqual('git');
      expect(args[1]).toEqual(['branch']);
      return Buffer.from('* 1.0.0');
    });
    expect(envStatus.getBranchName()).toEqual('1.0.0');
    spy.mockRestore();
  });

  test('empty return', () => {
    const spy = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      return Buffer.from('master');
    });
    expect(envStatus.getBranchName()).toEqual('');
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

  test('01.0.0 is OTHERS', () => {
    expect(envStatus.getBranchType('01.0.0')).toEqual(BRANCH_TYPES.OTHERS);
  });

  test('01.0.0-feat-xxx is OTHERS', () => {
    expect(envStatus.getBranchType('01.0.0-feat-xxx')).toEqual(BRANCH_TYPES.OTHERS);
  });

  test('01.0.0-fix-xxx is OTHERS', () => {
    expect(envStatus.getBranchType('01.0.0-fix-xxx')).toEqual(BRANCH_TYPES.OTHERS);
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
      callback(null, {status: 200}, '{}');
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
    const spy = jest.spyOn(fetch, 'fetchUrl').mockImplementationOnce((url: string, callback: any) => {
      callback(new Error('error'), {status: 500}, '{}');
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      spy.mockRestore();
      expect(data.err).toEqual(FETCH_ERR.LOAD_ERROR);
    });
  });

  test('fetch 404', () => {
    const spy = jest.spyOn(fetch, 'fetchUrl').mockImplementationOnce((url: string, callback: any) => {
      callback(null, {status: 404}, '{}');
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      spy.mockRestore();
      expect(data.err).toEqual(FETCH_ERR.LOAD_ERROR);
    });
  });

  test('parse body error', () => {
    const spy = jest.spyOn(fetch, 'fetchUrl').mockImplementationOnce((url: string, callback: any) => {
      callback(null, {status: 200}, '{data}');
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      spy.mockRestore();
      expect(data.err).toEqual(FETCH_ERR.PARSE_RESPONSE_ERROR);
    });
  });

  test('config undefined', () => {
    const spy = jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      return null;
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      spy.mockRestore();
      expect(data.err).toEqual(FETCH_ERR.CONFIG_UNDEFINED);
    });
  });

  test('url function undefined', () => {
    const spy = jest.spyOn(envStatus, 'getConfig').mockImplementationOnce(() => {
      const res: any = {url: ''};
      return res;
    });
    return envStatus.fetchEnvData('dev').then((data: IEnvErrData) => {
      spy.mockRestore();
      expect(data.err).toEqual(FETCH_ERR.URL_FUNCTION_UNDEFINED);
    });
  });
});

describe('isEnvAvailable', () => {
  test('not available without version', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
      }));
    });
    return envStatus.isEnvAvailable('production').then((res) => {
      expect(res).toBe(false);
      spy.mockRestore();
    });
  });

  test('production is always available', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
        version: '1.0.0',
      }));
    });
    return envStatus.isEnvAvailable('production').then((res) => {
      expect(res).toBe(true);
      spy.mockRestore();
    });
  });

  test('staging is not available when version > production', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
        version: env === 'staging' ? '1.0.1' : '1.0.0',
      }));
    });
    return envStatus.isEnvAvailable('staging').then((res) => {
      expect(res).toBe(false);
      spy.mockRestore();
    });
  });

  test('staging is available when version <= production', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
        version: env === 'staging' ? '1.0.0' : '1.0.1',
      }));
    });
    return envStatus.isEnvAvailable('staging').then((res) => {
      expect(res).toBe(true);
      spy.mockRestore();
    });
  });

  test('env is not available when version > staging', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
        version: env === 'dev' ? '1.0.1' : '1.0.0',
      }));
    });
    return envStatus.isEnvAvailable('dev').then((res) => {
      expect(res).toBe(false);
      spy.mockRestore();
    });
  });

  test('env is available when version == staging', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
        version: '1.0.0',
      }));
    });
    return envStatus.isEnvAvailable('dev').then((res) => {
      expect(res).toBe(true);
      spy.mockRestore();
    });
  });

  test('env is not available when version < staging and version > production', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
        version: env === 'dev' ? '1.0.1' : env === 'staging' ? '1.1.0' : '1.0.0',
      }));
    });
    return envStatus.isEnvAvailable('dev').then((res) => {
      expect(res).toBe(false);
      spy.mockRestore();
    });
  });

  test('env is available when version < staging and version == production', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
        version: env === 'dev' ? '1.0.1' : env === 'staging' ? '1.1.0' : '1.0.1',
      }));
    });
    return envStatus.isEnvAvailable('dev').then((res) => {
      expect(res).toBe(true);
      spy.mockRestore();
    });
  });

  test('env is available when version < staging and version < production \
and production head commit is ancestor of env head commit', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
        version: env === 'dev' ? '1.0.0' : '1.0.1',
      }));
    });
    const spy2 = jest.spyOn(envStatus, 'fetchOrigin').mockImplementationOnce(() => {
      return Promise.resolve();
    });
    const spy3 = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      return Buffer.from('');
    });
    return envStatus.isEnvAvailable('dev').then((res) => {
      expect(res).toBe(true);
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('env is not available when version < staging and version < production \
and production head commit is not ancestor of env head commit', () => {
    const spy = jest.spyOn(envStatus, 'fetchEnvData').mockImplementation((env) => {
      return Promise.resolve(mockEnvData({
        env,
        version: env === 'dev' ? '1.0.0' : '1.0.1',
      }));
    });
    const spy2 = jest.spyOn(envStatus, 'fetchOrigin').mockImplementationOnce(() => {
      return Promise.resolve();
    });
    const spy3 = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      throw new Error('error');
    });
    return envStatus.isEnvAvailable('dev').then((res) => {
      expect(res).toBe(false);
      spy3.mockRestore();
      spy2.mockRestore();
      spy.mockRestore();
    });
  });
});
