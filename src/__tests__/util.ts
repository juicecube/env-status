import * as ora from 'ora';
import { EnvStatus } from '../index';
import { IEnvData } from '../interfaces';

export function mockFetchOrigin(envStatus: EnvStatus) {
  const spy = jest.spyOn(envStatus, 'fetchOrigin').mockImplementation(() => Promise.resolve());
  return () => {
    spy.mockRestore();
  };
}

export function mockEnvData(data: any): IEnvData {
  return Object.assign({
    env: '',
    branch: '',
    commit: '',
    author: '',
    date: '',
  }, data);
}

export function mockSpinner(spinner: ora.Ora) {
  const startSpy = jest.spyOn(spinner, 'start').mockImplementation((_?: string) => this);
  const failSpy = jest.spyOn(spinner, 'fail').mockImplementation((_?: string) => this);
  const stopSpy = jest.spyOn(spinner, 'stop').mockImplementation((_?: string) => this);
  return () => {
    startSpy.mockRestore();
    failSpy.mockRestore();
    stopSpy.mockRestore();
  };
}
