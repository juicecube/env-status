#!/usr/bin/env node
import * as yargs from 'yargs';
import { EnvStatus } from '../index';
import { Runner } from '../merge-validate';

const argv = yargs.scriptName('merge-validate')
  .usage('$0 sourceBranch targetBranch')
  .help()
  .argv;

new Runner(new EnvStatus(), argv).run().then((code) => process.exit(code));
