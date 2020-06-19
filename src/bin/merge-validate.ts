#!/usr/bin/env node
import { EnvStatus } from '../index';
import { Runner } from '../merge-validate';

new Runner(new EnvStatus()).run().then((code) => process.exit(code));
