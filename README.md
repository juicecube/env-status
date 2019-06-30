# env-status
A command to show each env status, whether it is using for testing or available for using.

## Setup

- Install

  `yarn add -dev env-status`

- Create `.envstatus.js` file in your project root as below.

  ```javascript
  module.exports = {
    envs: ['production', 'staging', 'development'],
    url: function (env) {
      return `https://raw.githubusercontent.com/webyom/env-status/master/envs/${env}.json`;
    }
  };
  ```

  - `envs` is an array of the name of all the envs. (required)
  - `url` is a function returning the json file described next part. (required)

- Everytime you publish your project, publish a json file contains blow information.

  ```json
  {
    "version": "1.1.0",
    "author": "webyom <webyom@gmail.com>",
    "date": 1561874837800
  }
  ```

  - `version` is the version defined in package.json
  - `commit` is the the HEAD commit hash when you publish your project.
  - `author` is the HEAD commit author when you publish your project.
  - `date` is the timestamp when you publish your project.

## Command

`npx env-status` will show all the env status

![npx env-status](https://raw.githubusercontent.com/webyom/env-status/master/img/result-1.png)

`npx env-status staging` will show staging and production (if defined) status

![npx env-status](https://raw.githubusercontent.com/webyom/env-status/master/img/result-2.png)

## Note

The `production` env is important. The status column is generated by comparing each env version with production env version. If an env version is greater than production env version, it means this env is using by someone for tesing a new version, so its status is `Using`, or else its status is `Available`. The status of production env is always empty.
