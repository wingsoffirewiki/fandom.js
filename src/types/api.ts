export interface QueryParams {
  [key: string]:
    | string
    | number
    | boolean
    | (string | number | boolean)[]
    | undefined;
}

export interface APIResponse<T = unknown> {
  batchcomplete?: string;
  continue?: Record<string, string>;
  query?: T;
  error?: {
    code: string;
    info: string;
    [key: string]: unknown;
  };
}
