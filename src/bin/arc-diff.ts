#!/usr/bin/env node
import * as yargs from 'yargs';
import { EnvStatus } from '../index';
import { Runner } from '../arc-diff';

const argv = yargs
  .scriptName('arc-diff')
  .usage('$0 <target-branch>')
  .help().argv;

new Runner(new EnvStatus(), argv).run();
