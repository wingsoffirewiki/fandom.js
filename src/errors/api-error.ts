export class APIError extends Error {
  public code: string;
  public info: string;

  constructor(code: string, info: string) {
    super(`${code}: ${info}`);
    this.name = "APIError";
    this.code = code;
    this.info = info;
  }
}
