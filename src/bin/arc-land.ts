#!/usr/bin/env node
import * as yargs from 'yargs';
import { EnvStatus } from '../index';
import { Runner } from '../arc-land';

const argv = yargs
  .scriptName('arc-land')
  .usage('$0 [args]')
  .string('onto')
  .describe('onto', 'Target branch')
  .help().argv;

new Runner(new EnvStatus(), argv).run();
