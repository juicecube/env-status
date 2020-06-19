import * as child_process from 'child_process';
import mockConsole from 'jest-mock-console';
import { EnvStatus } from '../index';
import { Runner } from '../arc-land';
import { mockEnvData } from './util';
import { FETCH_ERR } from '../interfaces';

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

describe('run', () => {
  //
});
