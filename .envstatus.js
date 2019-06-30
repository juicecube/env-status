module.exports = {
  envs: ['production', 'staging', 'development'],
  url: function (env) {
    return `https://github.com/webyom/env-status/blob/master/demo/${env}.json`;
  }
};
