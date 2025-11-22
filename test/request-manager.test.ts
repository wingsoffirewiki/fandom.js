import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fetchMock, removeTokensMock, rateLimiterInitMock } = vi.hoisted(() => {
  const fetchFn = vi.fn();
  const removeTokensFn = vi.fn(() => Promise.resolve());
  const rateLimiterInitFn = vi.fn();
  return {
    fetchMock: fetchFn,
    removeTokensMock: removeTokensFn,
    rateLimiterInitMock: rateLimiterInitFn,
  };
});

vi.mock("cross-fetch", () => ({
  __esModule: true,
  default: fetchMock,
}));

vi.mock("../src/request/rate-limiter", () => {
  class FakeRateLimiter {
    public removeTokens = removeTokensMock;

    constructor(options: unknown) {
      rateLimiterInitMock(options);
    }
  }

  return { RateLimiter: FakeRateLimiter };
});

import { RequestManager } from "../src/request/request-manager";

describe("RequestManager", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    removeTokensMock.mockReset();
    removeTokensMock.mockResolvedValue(undefined);
    rateLimiterInitMock.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds a GET request with query params and arrays", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: () => Promise.resolve({ success: true }),
    });

    const manager = new RequestManager({ baseURL: "https://example.com" });
    await manager.get({
      action: "query",
      list: ["one", "two"],
      limit: 5,
      format: "json",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const parsed = new URL(url as string);

    expect(parsed.pathname).toBe("/api.php");
    expect(parsed.searchParams.getAll("list")).toEqual(["one", "two"]);
    expect(parsed.searchParams.get("limit")).toBe("5");
    expect(parsed.searchParams.get("action")).toBe("query");
    expect(init?.method).toBe("GET");
    expect(removeTokensMock).toHaveBeenCalledTimes(1);
  });

  it("allows overriding the API path per request", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: () => Promise.resolve({}),
    });

    const manager = new RequestManager({ baseURL: "https://example.com" });
    await manager.get({ action: "query" }, { apiPath: "/custom" });

    const [url] = fetchMock.mock.calls[0];
    const parsed = new URL(url as string);
    expect(parsed.pathname).toBe("/custom");
  });

  it("sets the User-Agent header when provided", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      json: () => Promise.resolve({}),
    });

    const manager = new RequestManager({
      baseURL: "https://example.com",
      userAgent: "custom-agent",
    });

    await manager.get({ action: "query" });

    const [, init] = fetchMock.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get("User-Agent")).toBe("custom-agent");
  });

  it("retries failed responses up to maxRetries with exponential backoff", async () => {
    vi.useFakeTimers();

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "error",
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "error",
        headers: { get: () => null },
      })
      .mockResolvedValue({
        ok: true,
        headers: { get: () => null },
        json: () => Promise.resolve({ done: true }),
      });

    const manager = new RequestManager({
      baseURL: "https://example.com",
      maxRetries: 2,
    });

    const requestPromise = manager.get({ action: "query" });

    await vi.runAllTimersAsync();
    const result = await requestPromise;

    expect(result).toEqual({ done: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(removeTokensMock).toHaveBeenCalledTimes(3);
  });

  it("throws after exceeding max retries", async () => {
    vi.useFakeTimers();

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "error",
        headers: { get: () => null },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "error",
        headers: { get: () => null },
      });

    const manager = new RequestManager({
      baseURL: "https://example.com",
      maxRetries: 1,
    });

    const expectation = expect(
      manager.get({ action: "query" }),
    ).rejects.toThrow("HTTP 500 error");

    await vi.runAllTimersAsync();
    await expectation;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
