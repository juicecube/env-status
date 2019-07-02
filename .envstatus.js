module.exports = {
  envs: ['production', 'staging', 'development', 'development-1', 'development-2'],
  url: function (env) {
    return `https://raw.githubusercontent.com/webyom/env-status/master/envs/${env}.json`;
  }
};
