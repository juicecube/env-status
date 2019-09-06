export enum FETCH_ERR {
  CONFIG_UNDEFINED = 'CONFIG_UNDEFINED',
  URL_FUNCTION_UNDEFINED = 'URL_FUNCTION_UNDEFINED',
  LOAD_ERROR = 'LOAD_ERROR',
  PARSE_RESPONSE_ERROR = 'PARSE_RESPONSE_ERROR',
}

export enum BRANCH_TYPES {
  ITERATION = 'ITERATION',
  ITERATION_FEATURE = 'ITERATION_FEATURE',
  ITERATION_FIX = 'ITERATION_FIX',
  HOTFIX = 'HOTFIX',
  OTHERS = 'OTHERS',
}

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
  err: FETCH_ERR;
}

export interface IEnvConfig {
  envs: string[];
  gen: string;
  url(env: string): string;
}

export function isEnvErrDataType(type: IEnvData | IEnvErrData): type is IEnvErrData {
  return (type as IEnvErrData).err !== undefined;
}
