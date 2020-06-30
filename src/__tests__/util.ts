import * as ora from 'ora';
import { EnvStatus } from '../index';
import { IEnvData } from '../interfaces';

export function mockFetchOrigin(envStatus: EnvStatus): () => void {
  const spy = jest.spyOn(envStatus, 'fetchOrigin').mockImplementation(() => Promise.resolve());
  return (): void => {
    spy.mockRestore();
  };
}

export function mockEnvData(data: any): IEnvData {
  return Object.assign(
    {
      env: '',
      branch: '',
      commit: '',
      author: '',
      date: '',
    },
    data,
  );
}

export function mockSpinner(spinner: ora.Ora): () => void {
  const startSpy = jest.spyOn(spinner, 'start').mockImplementation(() => this);
  const failSpy = jest.spyOn(spinner, 'fail').mockImplementation(() => this);
  const stopSpy = jest.spyOn(spinner, 'stop').mockImplementation(() => this);
  return (): void => {
    startSpy.mockRestore();
    failSpy.mockRestore();
    stopSpy.mockRestore();
  };
}
