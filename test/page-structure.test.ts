import { describe, it, expect, vi, beforeEach } from "vitest";
import { Page } from "../src/structures/page-structure";
import { Client } from "../src/client/client";
import { TokenType, ProtectionLevel } from "../src/enums/index";
import { Revision } from "../src/structures/revision-structure";

const requestManagerGetMock = vi.fn();
const requestManagerPostMock = vi.fn();

const mockClient = {
  requestManager: {
    get: requestManagerGetMock,
    post: requestManagerPostMock,
  },
} as unknown as Client;

describe("Page Structure", () => {
  let page: Page;

  beforeEach(() => {
    requestManagerGetMock.mockReset();
    requestManagerPostMock.mockReset();
    page = new Page(mockClient, { title: "Test Page", pageid: 1, ns: 0 });
  });

  it("edits the page", async () => {
    await page.edit("New content", "Summary");

    expect(requestManagerPostMock).toHaveBeenCalledWith(
      {
        action: "edit",
        title: "Test Page",
        text: "New content",
        summary: "Summary",
        format: "json",
      },
      {
        tokenType: TokenType.Csrf,
      },
    );
  });

  it("deletes the page", async () => {
    await page.delete("Reason");

    expect(requestManagerPostMock).toHaveBeenCalledWith(
      {
        action: "delete",
        title: "Test Page",
        reason: "Reason",
        format: "json",
      },
      {
        tokenType: TokenType.Csrf,
      },
    );
  });

  it("protects the page", async () => {
    await page.protect(ProtectionLevel.Sysop, "1 week", "Reason");

    expect(requestManagerPostMock).toHaveBeenCalledWith(
      {
        action: "protect",
        title: "Test Page",
        protections: `edit=${ProtectionLevel.Sysop}|move=${ProtectionLevel.Sysop}`,
        expiry: "1 week",
        reason: "Reason",
        format: "json",
      },
      {
        tokenType: TokenType.Csrf,
      },
    );
  });

  it("fetches history", async () => {
    requestManagerGetMock.mockResolvedValue({
      query: {
        pages: {
          "1": {
            revisions: [
              {
                revid: 100,
                user: "User1",
                timestamp: "2023-01-01",
                content: "Content",
              },
            ],
          },
        },
      },
    });

    const history = await page.fetchHistory();

    expect(requestManagerGetMock).toHaveBeenCalledWith({
      action: "query",
      prop: "revisions",
      titles: "Test Page",
      rvprop: "ids|timestamp|user|content",
      rvlimit: 50,
      format: "json",
    });
    expect(history).toHaveLength(1);
    expect(history[0]).toBeInstanceOf(Revision);
  });

  it("reverts to a revision", async () => {
    // Mock fetching current info
    requestManagerGetMock.mockResolvedValue({
      query: {
        pages: {
          "1": { lastrevid: 200 },
        },
      },
    });

    await page.revertTo(100, "Revert summary");

    expect(requestManagerPostMock).toHaveBeenCalledWith(
      {
        action: "edit",
        title: "Test Page",
        undo: 200,
        undoafter: 100,
        summary: "Revert summary",
        format: "json",
      },
      {
        tokenType: TokenType.Csrf,
      },
    );
  });

  it("does not revert if already at revision", async () => {
    requestManagerGetMock.mockResolvedValue({
      query: {
        pages: {
          "1": { lastrevid: 100 },
        },
      },
    });

    await page.revertTo(100);
    expect(requestManagerPostMock).not.toHaveBeenCalled();
  });
});
