#!/usr/bin/env node
import * as yargs from 'yargs';
import * as ora from 'ora';
import { EnvStatus } from '../index';
import { Runner } from '../env-status';

const argv = yargs
  .scriptName('env-status')
  .usage('$0 [args]')
  .boolean('init')
  .describe('init', 'Init config file')
  .boolean('gen')
  .describe('gen', 'Generate env-status data from current branch HEAD')
  .help().argv;

new Runner(new EnvStatus(), argv, ora()).run();
