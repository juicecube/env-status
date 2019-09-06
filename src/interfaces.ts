export interface IEnvData {
  env: string;
  version: string;
  branch: string;
  commit: string;
  author: string;
  date: string;
}

export interface IEnvErrData {
  env: string;
  err: string;
}

export interface IEnvConfig {
  envs: string[];
  gen: string;
  url(env: string): string;
}

export function isEnvErrDataType(type: IEnvData | IEnvErrData): type is IEnvErrData {
  return (type as IEnvErrData).err !== undefined;
}
