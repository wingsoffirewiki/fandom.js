import fetch from "cross-fetch";
import type { QueryParams } from "../types/index.js";
import { RateLimiter } from "./rate-limiter.js";

export interface RequestManagerOptions {
  baseURL: string;
  apiPath?: string;
  userAgent?: string;
  maxRetries?: number;
}

export class RequestManager {
  private baseURL: string;
  private apiPath: string;
  private userAgent?: string;
  private maxRetries: number;
  private limiter: RateLimiter;

  constructor(opt: RequestManagerOptions) {
    this.baseURL = opt.baseURL;
    this.apiPath = opt.apiPath ?? "/api.php";
    this.userAgent = opt.userAgent;
    this.maxRetries = opt.maxRetries ?? 3;
    this.limiter = new RateLimiter({ capacity: 5, refillPerSecond: 1 });
  }

  private buildURL(params: QueryParams, apiPath?: string) {
    const url = new URL(apiPath ?? this.apiPath, this.baseURL);
    Object.entries(params).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach((item) => url.searchParams.append(k, String(item)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
    return url.toString();
  }

  public async get(params: QueryParams, options?: { apiPath?: string }) {
    const url = this.buildURL(params, options?.apiPath);
    return this.request(url, { method: "GET" });
  }

  private async request(
    url: string,
    init: RequestInit,
    attempt = 0,
  ): Promise<any> {
    await this.limiter.removeTokens(1);
    const headers = new Headers(init.headers);
    if (this.userAgent) headers.set("User-Agent", this.userAgent);

    try {
      const res = await fetch(url, { ...init, headers });
      if (!res.ok) {
        if (attempt < this.maxRetries) {
          const backoff = 2 ** attempt * 200;
          await new Promise((r) => setTimeout(r, backoff));
          return this.request(url, init, attempt + 1);
        }
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return res.json();
    } catch (err) {
      if (attempt < this.maxRetries) {
        const backoff = 2 ** attempt * 200;
        await new Promise((r) => setTimeout(r, backoff));
        return this.request(url, init, attempt + 1);
      }
      throw err;
    }
  }
}
