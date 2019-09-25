#!/usr/bin/env node
import { EnvStatus } from '../index';
import { Runner } from '../arc-diff';

new Runner(new EnvStatus()).run();
