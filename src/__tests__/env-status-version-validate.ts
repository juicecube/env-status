import {mockProcessExit} from 'jest-mock-process';
import mockConsole from 'jest-mock-console';
import {EnvStatus} from '../index';
import {Runner} from '../env-status-version-validate';

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

test('exit when branch is OTHERS type', () => {
  const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
    return 'master';
  });
  const spy2 = mockProcessExit();
  runner.run();
  expect(spy2).toHaveBeenCalledTimes(0);
  spy2.mockRestore();
  spy.mockRestore();
});

test('exit normally', () => {
  const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
    return '1.0.0';
  });
  const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
    return '1.0.0';
  });
  const spy3 = mockProcessExit();
  runner.run();
  expect(spy3).toHaveBeenCalledTimes(0);
  spy3.mockRestore();
  spy2.mockRestore();
  spy.mockRestore();
});

test('exit with code 1', () => {
  const spy = jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
    return '1.0.0';
  });
  const spy2 = jest.spyOn(envStatus, 'getVersionFromPackage').mockImplementationOnce(() => {
    return '1.0.1';
  });
  const spy3 = mockProcessExit(new Error('error'));
  const restoreConsole = mockConsole();
  expect(runner.run.bind(runner)).toThrowError('error');
  restoreConsole();
  spy3.mockRestore();
  spy2.mockRestore();
  spy.mockRestore();
});
