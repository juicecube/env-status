import {mockProcessExit} from 'jest-mock-process';
import mockConsole from 'jest-mock-console';
import {EnvStatus} from '../index';
import {Runner} from '../env-status';

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

describe('getEnvWeight', () => {
  test('return 10 for production', () => {
    expect(runner.getEnvWeight('production')).toBe(10);
  });

  test('return 20 for staging', () => {
    expect(runner.getEnvWeight('staging')).toBe(20);
  });

  test('return 30 for others', () => {
    expect(runner.getEnvWeight('dev')).toBe(30);
  });
});
