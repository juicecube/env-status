const envStatus = require('../index');

test('getConfig', () => {
  expect(envStatus.getConfig().gen).toEqual('env-status.json');
});

describe('getBranchType', () => {
  test('1.0.0 is ITERATION', () => {
    expect(envStatus.getBranchType('1.0.0')).toEqual(envStatus.BRANCH_TYPES.ITERATION);
  });

  test('1.0.0-feat-xxx is ITERATION_FEATURE', () => {
    expect(envStatus.getBranchType('1.0.0-feat-xxx')).toEqual(envStatus.BRANCH_TYPES.ITERATION_FEATURE);
  });

  test('1.0.0-fix-xxx is ITERATION_FIX', () => {
    expect(envStatus.getBranchType('1.0.0-fix-xxx')).toEqual(envStatus.BRANCH_TYPES.ITERATION_FIX);
  });

  test('1.0.1-fix-xxx is HOTFIX', () => {
    expect(envStatus.getBranchType('1.0.1-fix-xxx')).toEqual(envStatus.BRANCH_TYPES.HOTFIX);
  });

  test('master is OTHERS', () => {
    expect(envStatus.getBranchType('master')).toEqual(envStatus.BRANCH_TYPES.OTHERS);
  });
});
