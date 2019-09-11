#!/usr/bin/env node
import {EnvStatus} from '../index';
import {Runner} from '../env-status-version-validate';

new Runner(new EnvStatus()).run();
