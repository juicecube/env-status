import mockConsole from 'jest-mock-console';
import { EnvStatus } from '../index';
import { Runner } from '../env-build-validate';
import { ENV_TYPES } from '../interfaces';

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
  test('invalid branch name xxx', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.DEV;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(1);
    mockConsoleRestore();
  });

  test('build feat branch in production env should fail', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'feat/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.PRODUCTION;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(2);
    mockConsoleRestore();
  });

  test('build fix branch in production env should fail', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'fix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.PRODUCTION;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(2);
    mockConsoleRestore();
  });

  test('build master branch in production env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'master';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.PRODUCTION;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build sprint branch in production env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.PRODUCTION;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build hotfix branch in production env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'hotfix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.PRODUCTION;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build feat branch in staging env should fail', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'feat/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.STAGING;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(2);
    mockConsoleRestore();
  });

  test('build fix branch in staging env should fail', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'fix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.STAGING;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(2);
    mockConsoleRestore();
  });

  test('build master branch in staging env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'master';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.STAGING;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build sprint branch in staging env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.STAGING;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build hotfix branch in staging env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'hotfix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.STAGING;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build feat branch in test env should fail', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'feat/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.TEST;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(2);
    mockConsoleRestore();
  });

  test('build fix branch in test env should fail', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'fix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.TEST;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(2);
    mockConsoleRestore();
  });

  test('build master branch in test env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'master';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.TEST;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build sprint branch in test env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.TEST;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build hotfix branch in test env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'hotfix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.TEST;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build feat branch in dev env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'feat/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.DEV;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build fix branch in dev env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'fix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.DEV;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build master branch in dev env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'master';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.DEV;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build sprint branch in dev env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.DEV;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build hotfix branch in dev env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'hotfix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.DEV;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build feat branch in others env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'feat/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.OTHERS;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build fix branch in others env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'fix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.OTHERS;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build master branch in others env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'master';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.OTHERS;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build sprint branch in others env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'sprint/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.OTHERS;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });

  test('build hotfix branch in others env should success', () => {
    jest.spyOn(envStatus, 'getBranchName').mockImplementationOnce(() => {
      return 'hotfix/xxx';
    });
    jest.spyOn(envStatus, 'getEnvType').mockImplementationOnce(() => {
      return ENV_TYPES.OTHERS;
    });
    const mockConsoleRestore = mockConsole();
    expect(runner.run()).toBe(0);
    mockConsoleRestore();
  });
});
