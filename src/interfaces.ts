export interface EnvData {
  env: string;
  version: string;
  branch: string;
  commit: string;
  author: string;
  date: string;
}

export interface EnvErrData {
  env: string;
  err: string;
}

export interface EnvConfig {
  envs: Array<string>;
  gen: string;
  url(env: string): string;
}

export function isEnvErrDataType(type: EnvData | EnvErrData): type is EnvErrData {
  return (type as EnvErrData).err !== undefined;
}
