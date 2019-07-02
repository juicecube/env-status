module.exports = {
  envs: ['production', 'staging', 'development', 'development-1'],
  url: function (env) {
    return `https://raw.githubusercontent.com/webyom/env-status/master/envs/${env}.json`;
  }
};
