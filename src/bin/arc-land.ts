#!/usr/bin/env node
import {EnvStatus} from '../index';
import {Runner} from '../arc-land';

new Runner(new EnvStatus()).run();
