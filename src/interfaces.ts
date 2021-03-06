export const enum FETCH_ERR {
  CONFIG_UNDEFINED = 'CONFIG_UNDEFINED',
  URL_FUNCTION_UNDEFINED = 'URL_FUNCTION_UNDEFINED',
  LOAD_ERROR = 'LOAD_ERROR',
  PARSE_RESPONSE_ERROR = 'PARSE_RESPONSE_ERROR',
}

export const enum BRANCH_TYPES {
  SPRINT = 'SPRINT',
  SPRINT_FEATURE = 'SPRINT_FEATURE',
  SPRINT_FIX = 'SPRINT_FIX',
  HOTFIX = 'HOTFIX',
  MASTER = 'MASTER',
  OTHERS = 'OTHERS',
  RELEASE = 'RELEASE',
  TEST = 'TEST',
  STAGING = 'STAGING',
}

export const enum ENV_TYPES {
  PRODUCTION = 'PRODUCTION',
  STAGING = 'STAGING',
  TEST = 'TEST',
  DEV = 'DEV',
  OTHERS = 'OTHERS',
}

export interface IEnvData {
  env: string;
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
