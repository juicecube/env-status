#!/usr/bin/env node
import { EnvStatus } from '../index';
import { Runner } from '../env-build-validate';

process.exit(new Runner(new EnvStatus()).run());
