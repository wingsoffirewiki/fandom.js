import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARTICLES_DETAILS_PATH,
  DEFAULT_ABSTRACT_LENGTH,
  USER_AGENT,
} from "../src/package-constants";

const { requestManagerGetMock, requestManagerInitMock } = vi.hoisted(() => {
  const getMock = vi.fn();
  const initMock = vi.fn();
  return { requestManagerGetMock: getMock, requestManagerInitMock: initMock };
});

vi.mock("../src/request/request-manager", () => {
  class FakeRequestManager {
    public get = requestManagerGetMock;

    constructor(options: unknown) {
      requestManagerInitMock(options);
    }
  }

  return { RequestManager: FakeRequestManager };
});

import { Client } from "../src/client/client";
import { Page } from "../src/structures/page";

describe("Client", () => {
  const host = "https://test.fandom.com";

  beforeEach(() => {
    requestManagerInitMock.mockClear();
    requestManagerGetMock.mockReset();
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
          },
        },
      },
    };
    requestManagerGetMock.mockResolvedValue(responsePayload);

    const client = new Client({ host });
    const eventSpy = vi.fn();
    client.events.on("pageFetched", eventSpy);

    const first = await client.fetchPage("Test Page");
    expect(requestManagerGetMock).toHaveBeenCalledTimes(1);
    expect(requestManagerGetMock).toHaveBeenCalledWith({
      action: "query",
      prop: "extracts",
      exintro: true,
      explaintext: true,
      redirects: true,
      titles: "Test Page",
      format: "json",
    });
    expect(first).toBeInstanceOf(Page);
    expect(first.title).toBe("Test Page");

    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith({
      pageid: 123,
      ns: 0,
      title: "Test Page",
      extract: "Summary text",
    });

    const second = await client.fetchPage("Test Page");
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
    const page = await client.fetchPage("Test Page");

    expect(requestManagerGetMock).toHaveBeenNthCalledWith(1, {
      action: "query",
      prop: "extracts",
      exintro: true,
      explaintext: true,
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

    await expect(client.fetchPage("Unknown")).rejects.toThrowError(
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
});
