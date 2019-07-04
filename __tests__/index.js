const envStatus = require('../index');

test('getConfig', () => {
  expect(envStatus.getConfig().gen).toEqual('build/env-status.json');
});
