module.exports = {
  envs: ['production', 'staging', 'dev', 'dev1', 'dev2', 'dev3'],
  url: function (env) {
    return `https://raw.githubusercontent.com/webyom/env-status/master/envs/${env}.json`;
  },
  gen: 'build/env-status.json'
};
