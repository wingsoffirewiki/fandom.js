export type WikiHost = string; // e.g. "https://community.fandom.com"

export interface ClientOptions {
  host: WikiHost;
  apiPath?: string; // default "/api.php"
  userAgent?: string;
  maxRetries?: number;
  cacheSize?: number;
}

export interface QueryParams {
  [key: string]: string | number | boolean | (string | number | boolean)[];
}

export interface PageSummary {
  pageid: number;
  ns: number;
  title: string;
  extract?: string;
}
