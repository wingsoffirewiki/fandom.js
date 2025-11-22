import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RequestManager } from "../src/request/request-manager";
import { TokenType } from "../src/enums/index";
import { APIError } from "../src/errors/api-error";

// Mock cross-fetch
const { fetchMock } = vi.hoisted(() => {
  return { fetchMock: vi.fn() };
});

vi.mock("cross-fetch", () => ({
  default: fetchMock,
}));

describe("RequestManager Advanced", () => {
  let requestManager: RequestManager;
  const baseURL = "https://test.fandom.com";

  beforeEach(() => {
    requestManager = new RequestManager({ baseURL });
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and caches tokens", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        query: {
          tokens: { csrftoken: "test-token" },
        },
      }),
      headers: new Headers(),
    } as Response);

    const token1 = await requestManager.fetchToken(TokenType.Csrf);
    expect(token1).toBe("test-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Should use cache
    const token2 = await requestManager.fetchToken(TokenType.Csrf);
    expect(token2).toBe("test-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws if token fetch fails", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ query: { tokens: {} } }),
      headers: new Headers(),
    } as Response);

    await expect(requestManager.fetchToken(TokenType.Csrf)).rejects.toThrow(
      "Failed to fetch token",
    );
  });

  it("makes a POST request with token", async () => {
    // Mock token fetch
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: { tokens: { csrftoken: "token" } } }),
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers(),
      } as Response);

    await requestManager.post(
      { action: "edit" },
      { tokenType: TokenType.Csrf },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    // Check second call (POST)
    const postCall = fetchMock.mock.calls[1];
    const init = postCall[1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(URLSearchParams);
    expect((init.body as URLSearchParams).get("token")).toBe("token");
  });

  it("retries on network error", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers(),
      } as Response);

    await requestManager.get({ action: "query" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries on HTTP error", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Server Error",
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: new Headers(),
      } as Response);

    await requestManager.get({ action: "query" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws after max retries", async () => {
    fetchMock.mockRejectedValue(new Error("Fail"));

    // Reduce retry delay for test
    requestManager = new RequestManager({ baseURL, maxRetries: 2 });

    await expect(requestManager.get({ action: "query" })).rejects.toThrow(
      "Fail",
    );
    expect(fetchMock).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("handles API errors", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        error: { code: "bad_request", info: "Bad Request" },
      }),
      headers: new Headers(),
    } as Response);

    await expect(requestManager.get({ action: "query" })).rejects.toThrow(
      APIError,
    );
    await expect(requestManager.get({ action: "query" })).rejects.toThrow(
      "bad_request: Bad Request",
    );
  });

  it("handles cookies", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        headers: new Headers({ "set-cookie": "session=123" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        headers: new Headers(),
      } as Response);

    await requestManager.get({ action: "1" });
    await requestManager.get({ action: "2" });

    const secondCall = fetchMock.mock.calls[1];
    const headers = secondCall[1]?.headers as Headers;
    expect(headers.get("Cookie")).toBe("session=123");
  });
});
