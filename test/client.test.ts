import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARTICLES_DETAILS_PATH,
  DEFAULT_ABSTRACT_LENGTH,
  USER_AGENT,
} from "../src/package-constants";

const {
  requestManagerGetMock,
  requestManagerInitMock,
  requestManagerPostMock,
  requestManagerFetchTokenMock,
} = vi.hoisted(() => {
  const getMock = vi.fn();
  const initMock = vi.fn();
  const postMock = vi.fn();
  const fetchTokenMock = vi.fn();
  return {
    requestManagerGetMock: getMock,
    requestManagerInitMock: initMock,
    requestManagerPostMock: postMock,
    requestManagerFetchTokenMock: fetchTokenMock,
  };
});

vi.mock("../src/request/request-manager", () => {
  class FakeRequestManager {
    public get = requestManagerGetMock;
    public post = requestManagerPostMock;
    public fetchToken = requestManagerFetchTokenMock;

    constructor(options: unknown) {
      requestManagerInitMock(options);
    }
  }

  return { RequestManager: FakeRequestManager };
});

import { Client } from "../src/client/client";
import { Page } from "../src/structures/page-structure";
import { TokenType } from "../src/enums/index";

describe("Client", () => {
  const host = "https://test.fandom.com";

  beforeEach(() => {
    requestManagerInitMock.mockClear();
    requestManagerGetMock.mockReset();
    requestManagerPostMock.mockReset();
    requestManagerFetchTokenMock.mockReset();
  });

  it("constructs RequestManager with expected defaults", () => {
    const client = new Client({ host });

    expect(requestManagerInitMock).toHaveBeenCalledWith({
      baseURL: host,
      apiPath: "/api.php",
      userAgent: USER_AGENT,
      maxRetries: 3,
    });
    expect(client.options.cacheSize).toBe(100);
  });

  it("fetches pages via RequestManager, emits events, and caches results", async () => {
    const responsePayload = {
      query: {
        pages: {
          "123": {
            pageid: 123,
            ns: 0,
            title: "Test Page",
            extract: "Summary text",
            revisions: [
              {
                "*": "Page content",
              },
            ],
          },
        },
      },
    };
    requestManagerGetMock.mockResolvedValue(responsePayload);

    const client = new Client({ host });
    const eventSpy = vi.fn();
    client.events.on("pageFetched", eventSpy);

    const first = await client.pages.fetch("Test Page");
    expect(requestManagerGetMock).toHaveBeenCalledTimes(1);
    expect(requestManagerGetMock).toHaveBeenCalledWith({
      action: "query",
      prop: "extracts|revisions|categories",
      exintro: true,
      explaintext: true,
      rvprop: "content",
      cllimit: "max",
      redirects: true,
      titles: "Test Page",
      format: "json",
    });
    expect(first).toBeInstanceOf(Page);
    expect(first.title).toBe("Test Page");
    expect(first.content).toBe("Page content");

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith({
      pageid: 123,
      ns: 0,
      title: "Test Page",
      extract: "Summary text",
      revisions: [
        {
          "*": "Page content",
        },
      ],
      categories: undefined,
    });

    const second = await client.pages.fetch("Test Page");
    expect(requestManagerGetMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
    expect(eventSpy).toHaveBeenCalledTimes(1);
  });

  it("falls back to article details when the initial extract is empty", async () => {
    requestManagerGetMock
      .mockResolvedValueOnce({
        query: {
          redirects: [{ from: "Test Page", to: "Real Page" }],
          pages: {
            "123": {
              pageid: 123,
              ns: 0,
              title: "Test Page",
              extract: " ",
            },
          },
        },
      })
      .mockResolvedValueOnce({
        items: {
          "123": {
            abstract: "Trimmed abstract text",
          },
        },
      });

    const client = new Client({ host });
    const page = await client.pages.fetch("Test Page");

    expect(requestManagerGetMock).toHaveBeenNthCalledWith(1, {
      action: "query",
      prop: "extracts|revisions|categories",
      exintro: true,
      explaintext: true,
      rvprop: "content",
      cllimit: "max",
      redirects: true,
      titles: "Test Page",
      format: "json",
    });

    expect(requestManagerGetMock).toHaveBeenNthCalledWith(
      2,
      { titles: "Real Page", abstract: DEFAULT_ABSTRACT_LENGTH },
      { apiPath: ARTICLES_DETAILS_PATH },
    );

    expect(page.title).toBe("Real Page");
    expect(page.extract).toBe("Trimmed abstract text");
  });

  it("throws an error when the API does not return page data", async () => {
    requestManagerGetMock.mockResolvedValue({ query: { pages: {} } });
    const client = new Client({ host });

    await expect(client.pages.fetch("Unknown")).rejects.toThrowError(
      "No page data",
    );
  });

  it("emits ready immediately when onReady is called", () => {
    const client = new Client({ host });
    const readySpy = vi.fn();
    client.events.on("ready", readySpy);

    client.onReady();

    expect(readySpy).toHaveBeenCalledTimes(1);
  });

  it("does not start polling if polling option is false", () => {
    const client = new Client({ host, polling: false });
    const startPollingSpy = vi.spyOn(client.events, "startPolling");

    client.onReady();

    expect(startPollingSpy).not.toHaveBeenCalled();
  });

  it("starts polling by default", () => {
    const client = new Client({ host });
    const startPollingSpy = vi.spyOn(client.events, "startPolling");
    // Mock startPolling implementation to avoid actual interval
    startPollingSpy.mockImplementation(() => {});

    client.onReady();

    expect(startPollingSpy).toHaveBeenCalled();
  });

  it("logs in successfully", async () => {
    requestManagerFetchTokenMock.mockResolvedValue("login-token");
    requestManagerPostMock.mockResolvedValue({ login: { result: "Success" } });

    const client = new Client({ host });
    await client.login("user", "pass");

    expect(requestManagerFetchTokenMock).toHaveBeenCalledWith(TokenType.Login);
    expect(requestManagerPostMock).toHaveBeenCalledWith({
      action: "login",
      lgname: "user",
      lgpassword: "pass",
      lgtoken: "login-token",
      format: "json",
    });
  });

  it("throws on login failure", async () => {
    requestManagerFetchTokenMock.mockResolvedValue("login-token");
    requestManagerPostMock.mockResolvedValue({
      login: { result: "Failed", reason: "BadPass" },
    });

    const client = new Client({ host });
    await expect(client.login("user", "pass")).rejects.toThrow(
      "Login failed: BadPass",
    );
  });
});
