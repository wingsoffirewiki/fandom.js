import fetch from "cross-fetch";
import type { QueryParams, APIResponse } from "../types/index.js";
import { RateLimiter } from "./rate-limiter.js";
import { TokenType } from "../enums/index.js";
import { APIError } from "../errors/api-error.js";

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
  private tokenCache: Map<TokenType, string> = new Map();
  private cookies: string[] = [];

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
      if (v === undefined) return;
      if (Array.isArray(v)) {
        v.forEach((item) => url.searchParams.append(k, String(item)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
    return url.toString();
  }

  public async get<T = APIResponse>(
    params: QueryParams,
    options?: { apiPath?: string },
  ): Promise<T> {
    const url = this.buildURL(params, options?.apiPath);
    return this.request<T>(url, { method: "GET" });
  }

  public async post<T = APIResponse>(
    params: QueryParams,
    options?: { apiPath?: string; tokenType?: TokenType },
  ): Promise<T> {
    const body = new URLSearchParams();

    if (options?.tokenType) {
      const token = await this.fetchToken(options.tokenType);
      body.append("token", token);
    }

    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined) return;
      if (Array.isArray(v)) {
        v.forEach((item) => body.append(k, String(item)));
      } else {
        body.append(k, String(v));
      }
    });

    const url = this.buildURL({}, options?.apiPath);
    return this.request<T>(url, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  }

  public async fetchToken(type: TokenType): Promise<string> {
    if (this.tokenCache.has(type)) return this.tokenCache.get(type)!;

    const res = await this.get<APIResponse<{ tokens: Record<string, string> }>>(
      {
        action: "query",
        meta: "tokens",
        type: type,
        format: "json",
      },
    );

    const token = res?.query?.tokens?.[`${type}token`];
    if (!token) throw new Error(`Failed to fetch token of type ${type}`);

    this.tokenCache.set(type, token);
    return token;
  }

  private async request<T>(
    url: string,
    init: RequestInit,
    attempt = 0,
  ): Promise<T> {
    await this.limiter.removeTokens(1);
    const headers = new Headers(init.headers);
    if (this.userAgent) headers.set("User-Agent", this.userAgent);
    if (this.cookies.length > 0) headers.set("Cookie", this.cookies.join("; "));

    try {
      const res = await fetch(url, { ...init, headers });

      const setCookie = res.headers.get("set-cookie");
      if (setCookie) {
        this.cookies.push(setCookie);
      }

      if (!res.ok) {
        if (attempt < this.maxRetries) {
          const backoff = 2 ** attempt * 200;
          await new Promise((r) => setTimeout(r, backoff));
          return this.request<T>(url, init, attempt + 1);
        }
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (data.error) {
        throw new APIError(data.error.code, data.error.info);
      }
      return data as T;
    } catch (err) {
      if (attempt < this.maxRetries) {
        const backoff = 2 ** attempt * 200;
        await new Promise((r) => setTimeout(r, backoff));
        return this.request<T>(url, init, attempt + 1);
      }
      throw err;
    }
  }
}
