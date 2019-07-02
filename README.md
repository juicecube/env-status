# env-status
A command to show each env status, whether it is using for testing or available for using.

## Setup

- Install

  `yarn add --dev env-status`

- Create `.envstatus.js` file in your project root as below.

  ```javascript
  module.exports = {
    envs: ['production', 'staging', 'dev', 'dev1', 'dev2', 'dev3'],
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
    "branch": "master",
    "commit": "17f53ca090d44fd89f805425dee8f21a801a967d",
    "author": "webyom <webyom@gmail.com>",
    "date": 1561874837800
  }
  ```

  - `version` is the version defined in package.json
  - `branch` is the branch you checkout when you publish your project.
  - `commit` is the the HEAD commit hash when you publish your project.
  - `author` is the HEAD commit author when you publish your project.
  - `date` is the timestamp when you publish your project.

## Command

`npx env-status` will show all the env status

![npx env-status](https://raw.githubusercontent.com/webyom/env-status/master/img/result-1.png)

`npx env-status staging` will show staging and production (if defined) status

![npx env-status staging](https://raw.githubusercontent.com/webyom/env-status/master/img/result-2.png)

## API

- **getLastCommit(): object**

  Return the last commit information of current branch as below.
  ```javascript
  {
    branch: 'master',
    commit: '197b0c4',
    author: 'webyom',
    date: 1562055960000
  }
  ```

- **getBranchType(branch: string): string**

  Return branch type, refer to `BRANCH_TYPES` for full possible value list.

- **getBranchVersion(branch: string): Promise\<string\>**

  Return a promise of version string of the given branch name.

- **compareVersion(v1: string, v2: string): number**

  Return value:
  - `1` - v1 > v2
  - `0` - v1 == v2
  - `-1` - v1 < v2
  - `9` - v1 or v2 is invalid version

- **fetchEnvData(env: string): Promise\<object\>**

  Return the last commit information of current branch as below.
  ```javascript
  {
    env: 'production',
    version: '1.1.0',
    branch: 'master',
    commit: '17f53ca090d44fd89f805425dee8f21a801a967d',
    author: 'webyom <webyom@gmail.com>',
    date: 1561874837800
  }
  ```
  or
  ```javascript
  {
    env: 'production',
    err: 'CONFIG_UNDEFINED' // refer to FETCH_ERR for full possible value list
  }
  ```

- **isEnvAvailable(env: string): Promise\<bool\>**

  Return a promise of bool, telling whether an env available.

- **FETCH_ERR**
  ```javascript
  {
    CONFIG_UNDEFINED: 'CONFIG_UNDEFINED',
    URL_FUNCTION_UNDEFINED: 'URL_FUNCTION_UNDEFINED',
    LOAD_ERROR: 'LOAD_ERROR',
    PARSE_RESPONSE_ERROR: 'PARSE_RESPONSE_ERROR'
  }
  ```

- **BRANCH_TYPES**
  ```javascript
  {
    MASTER: 'MASTER', // master
    ITERATION: 'ITERATION', // x.x.0
    ITERATION_FEATURE: 'ITERATION_FEATURE', // x.x.0-feat-xxx
    ITERATION_FIX: 'ITERATION_FIX', // x.x.0-fix-xxx
    HOTFIX: 'HOTFIX', // x.x.y-fix-xxx, y > 0
    INVALID: 'INVALID'
  }
  ```

## How to identify an env is available or using

If the env version is less or equal to production version, then it is available, else if env is not staging and env version is equal to staging version, then it is available, else it is using.
