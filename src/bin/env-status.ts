#!/usr/bin/env node
import * as ora from 'ora';
import {EnvStatus} from '../index';
import {Runner} from '../env-status';

new Runner(new EnvStatus(), ora()).run();
