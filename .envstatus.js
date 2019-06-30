module.exports = {
  envs: ['production', 'staging', 'development'],
  url: function (env) {
    return `https://raw.githubusercontent.com/webyom/env-status/master/envs/${env}.json`;
  }
};
