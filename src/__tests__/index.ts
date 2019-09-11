import * as child_process from 'child_process';
import {ChildProcess} from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as fetch from 'fetch';
import {EnvStatus} from '../index';
import {FETCH_ERR, BRANCH_TYPES, IEnvData, IEnvErrData} from '../interfaces';
import {mockEnvData} from './util';

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

describe('getOriginBranchVersion', () => {
  test('success', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args): ChildProcess => {
      setImmediate(args[2] as () => void);
      return child_process.exec('echo ok');
    });
    const spy2 = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      return Buffer.from('- "version": "1.0.0"');
    });
    return envStatus.getOriginBranchVersion('dev').then((version) => {
      expect(version).toEqual('1.0.0');
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('get from package.json', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args): ChildProcess => {
      setImmediate(args[2] as () => void);
      return child_process.exec('echo ok');
    });
    const spy2 = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      return Buffer.from('');
    });
    return envStatus.getOriginBranchVersion('dev').then((version) => {
      expect(version).toEqual(require(path.resolve('package.json')).version);
      spy2.mockRestore();
      spy.mockRestore();
    });
  });

  test('fetch error', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args): ChildProcess => {
      setImmediate(() => (args[2] as (err: Error) => void)(new Error('error')));
      return child_process.exec('echo error');
    });
    return envStatus.getOriginBranchVersion('dev').catch((err) => {
      expect(err.message).toEqual('error');
      spy.mockRestore();
    });
  });

  test('diff error', () => {
    const spy = jest.spyOn(child_process, 'execFile').mockImplementationOnce((...args): ChildProcess => {
      setImmediate(args[2] as () => void);
      return child_process.exec('echo ok');
    });
    const spy2 = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce(() => {
      throw new Error('error');
    });
    return envStatus.getOriginBranchVersion('dev').catch((err) => {
      expect(err.message).toEqual('error');
      spy2.mockRestore();
      spy.mockRestore();
    });
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

describe('getVersionFromBranchName', () => {
  test('1.0.0 is version 1.0.0', () => {
    expect(envStatus.getVersionFromBranchName('1.0.0')).toEqual('1.0.0');
  });

  test('1.0.0-feat-xxx is version 1.0.0', () => {
    expect(envStatus.getVersionFromBranchName('1.0.0-feat-xxx')).toEqual('1.0.0');
  });

  test('1.0.0-fix-xxx is version 1.0.0', () => {
    expect(envStatus.getVersionFromBranchName('1.0.0-fix-xxx')).toEqual('1.0.0');
  });

  test('1.0.1-fix-xxx is version 1.0.1', () => {
    expect(envStatus.getVersionFromBranchName('1.0.1-fix-xxx')).toEqual('1.0.1');
  });

  test('empty return', () => {
    expect(envStatus.getVersionFromBranchName('master')).toEqual('');
  });
});

describe('compareVersion', () => {
  test('return 9', () => {
    expect(envStatus.compareVersion('1', '2')).toEqual(9);
    expect(envStatus.compareVersion('1', '2.0.0')).toEqual(9);
    expect(envStatus.compareVersion('1.0.0', '2')).toEqual(9);
  });

  test('return 1', () => {
    expect(envStatus.compareVersion('1.0.0', '0.2.0')).toEqual(1);
    expect(envStatus.compareVersion('1.0.1', '1.0.0')).toEqual(1);
    expect(envStatus.compareVersion('1.1.0', '1.0.2')).toEqual(1);
    expect(envStatus.compareVersion('2.0.0', '1.0.0')).toEqual(1);
  });

  test('return -1', () => {
    expect(envStatus.compareVersion('0.2.0', '1.0.0')).toEqual(-1);
    expect(envStatus.compareVersion('1.0.0', '1.0.1')).toEqual(-1);
    expect(envStatus.compareVersion('1.0.2', '1.1.0')).toEqual(-1);
    expect(envStatus.compareVersion('1.0.0', '2.0.0')).toEqual(-1);
  });

  test('return 0', () => {
    expect(envStatus.compareVersion('1.0.0', '1.0.0')).toEqual(0);
  });
});

describe('appendCurrentTimestampToUrl', () => {
  test('without any param', () => {
    const url = 'https://www.codemao.cn/';
    const now = new Date();
    expect(envStatus.appendCurrentTimestampToUrl(url, now)).toBe(`${url}?t=${now.getTime()}`);
  });

  test('with param', () => {
    const url = 'https://www.codemao.cn/?a=1';
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
    const spy2 = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      return Buffer.from('');
    });
    return envStatus.isEnvAvailable('dev').then((res) => {
      expect(res).toBe(true);
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
    const spy2 = jest.spyOn(child_process, 'execFileSync').mockImplementationOnce((...args) => {
      throw new Error('error');
    });
    return envStatus.isEnvAvailable('dev').then((res) => {
      expect(res).toBe(false);
      spy2.mockRestore();
      spy.mockRestore();
    });
  });
});
