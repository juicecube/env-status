#!/usr/bin/env node
import {EnvStatus} from '../index';
import {Runner} from '../env-status';

new Runner(new EnvStatus()).run();
