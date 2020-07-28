# env-status

[![CircleCI](https://circleci.com/gh/juicecube/env-status.svg?style=svg)](https://circleci.com/gh/juicecube/env-status)
[![codecov](https://codecov.io/gh/juicecube/env-status/branch/master/graph/badge.svg)](https://codecov.io/gh/juicecube/env-status)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

This package includes below features:

* Command for showing each env status, whether it is using for testing or available for using.
* Commands for easing arc diff and arc land.
* Command for identifying whether a source branch can be merged into a target branch.

Recommended git flow as below:

![npx -p env-status env-status staging](https://raw.githubusercontent.com/juicecube/env-status/master/img/gitflow.png)

## Setup

- Install

  `npm install --save-dev env-status`

- Create `.envstatus.js` file in your project root as below.

  ```javascript
  module.exports = {
    envs: ['production', 'staging', 'dev', 'dev1', 'dev2', 'dev3'],
    url: function (env) {
      return `https://raw.githubusercontent.com/juicecube/env-status/master/envs/${env}.json`;
    },
    gen: 'dist/env-status.json'
  };
  ```

  - `envs` is an array of the name of all the envs. (required)
  - `url` is a function returning the json file described next part. (required)
  - `gen` the env status file output path.

- Everytime you publish your project, publish a json file contains blow information.

  ```json
  {
    "branch": "master",
    "commit": "17f53ca090d44fd89f805425dee8f21a801a967d",
    "author": "webyom <webyom@gmail.com>",
    "date": 1561874837800
  }
  ```

  - `branch` is the branch you checkout when you publish your project.
  - `commit` is the the HEAD commit hash when you publish your project.
  - `author` is the HEAD commit author when you publish your project.
  - `date` is the timestamp when you publish your project.

## Command

- **env-status**

  `env-status` will show all the env status

  ![env-status](https://raw.githubusercontent.com/juicecube/env-status/master/img/result-1.png)

  `env-status staging` will show staging and production (if defined) status

  ![env-status staging](https://raw.githubusercontent.com/juicecube/env-status/master/img/result-2.png)

  `env-status --init` will create `.envstatus.js` config file in your project root.

  `env-status --gen` will generate the json file for publishing.

- **merge-validate**

  Validate whether a source branch can be merged into target branch.

  `merge-validate <srouce-branch> <target-branch>`

- **env-build-validate**

  Validate whether a branch can be built in current environment.

  `env-build-validate`

- **arc-diff**

  This command will do some consistance and confliction validation, then do arc diff.

  `arc-diff <target-branch>`

- **arc-land**

  This command will do some consistance and confliction validation, then do arc land.

  `arc-land --onto <target-branch> --revision <revision>`

## API

- **getLastCommit(now: Date): object**

  Return the last commit information of current branch as below.
  ```javascript
  {
    branch: 'master',
    commit: '197b0c4',
    author: 'webyom',
    date: 1562055960000
  }
  ```

- **getBranchName(): string**

  Return current working branch name.

- **getBranchType(branch: string): string**

  Return branch type, refer to `BRANCH_TYPES` for full possible value list.

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
    SPRINT: 'SPRINT', // sprint/xxx
    SPRINT_FEATURE: 'SPRINT_FEATURE', // feat/xxx
    SPRINT_FIX: 'SPRINT_FIX', // fix/xxx
    HOTFIX: 'HOTFIX', // hotfix/xxx
    MASTER: 'MASTER', // master
    OTHERS: 'OTHERS'
  }
  ```

## How to identify an env is available or using

![npx -p env-status env-status staging](https://raw.githubusercontent.com/juicecube/env-status/master/img/status-rule.png)
