import { describe, it, expect, vi, beforeEach } from "vitest";
import { CategoryManager } from "../src/managers/category-manager";
import { MetaManager } from "../src/managers/meta-manager";
import { SearchManager } from "../src/managers/search-manager";
import { RevisionManager } from "../src/managers/revision-manager";
import { UserManager } from "../src/managers/user-manager";
import { Client } from "../src/client/client";
import { Page } from "../src/structures/page-structure";
import { Revision } from "../src/structures/revision-structure";
import { User } from "../src/structures/user-structure";

// Mock Client and RequestManager
const requestManagerGetMock = vi.fn();

const mockClient = {
  requestManager: {
    get: requestManagerGetMock,
  },
  options: {
    cacheSize: 100,
  },
} as unknown as Client;

describe("Managers", () => {
  beforeEach(() => {
    requestManagerGetMock.mockReset();
  });

  describe("CategoryManager", () => {
    const categoryManager = new CategoryManager(mockClient);

    it("fetches category members", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: {
          categorymembers: [
            { pageid: 1, title: "Page 1", ns: 0 },
            { pageid: 2, title: "Page 2", ns: 0 },
          ],
        },
      });

      const members = await categoryManager.fetchMembers("Test Category");

      expect(requestManagerGetMock).toHaveBeenCalledWith({
        action: "query",
        list: "categorymembers",
        cmtitle: "Category:Test Category",
        cmlimit: 50,
        format: "json",
      });
      expect(members).toHaveLength(2);
      expect(members[0]).toBeInstanceOf(Page);
      expect(members[0].title).toBe("Page 1");
    });

    it("handles empty response", async () => {
      requestManagerGetMock.mockResolvedValue({});
      const members = await categoryManager.fetchMembers("Empty Category");
      expect(members).toEqual([]);
    });

    it("adds Category: prefix if missing", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: { categorymembers: [] },
      });
      await categoryManager.fetchMembers("NoPrefix");
      expect(requestManagerGetMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cmtitle: "Category:NoPrefix",
        }),
      );
    });

    it("does not add Category: prefix if present", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: { categorymembers: [] },
      });
      await categoryManager.fetchMembers("Category:HasPrefix");
      expect(requestManagerGetMock).toHaveBeenCalledWith(
        expect.objectContaining({
          cmtitle: "Category:HasPrefix",
        }),
      );
    });
  });

  describe("MetaManager", () => {
    const metaManager = new MetaManager(mockClient);

    it("fetches site info", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: {
          general: { sitename: "Test Wiki" },
        },
      });

      const info = await metaManager.fetchSiteInfo();

      expect(requestManagerGetMock).toHaveBeenCalledWith({
        action: "query",
        meta: "siteinfo",
        siprop: "general|namespaces|statistics",
        format: "json",
      });
      expect(info.general?.sitename).toBe("Test Wiki");
    });

    it("handles empty response", async () => {
      requestManagerGetMock.mockResolvedValue({});
      const info = await metaManager.fetchSiteInfo();
      expect(info).toEqual({});
    });
  });

  describe("SearchManager", () => {
    const searchManager = new SearchManager(mockClient);

    it("searches for pages", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: {
          search: [{ title: "Result 1" }, { title: "Result 2" }],
        },
      });

      const results = await searchManager.search("query");

      expect(requestManagerGetMock).toHaveBeenCalledWith({
        action: "query",
        list: "search",
        srsearch: "query",
        srlimit: 10,
        format: "json",
      });
      expect(results).toEqual(["Result 1", "Result 2"]);
    });

    it("handles empty response", async () => {
      requestManagerGetMock.mockResolvedValue({});
      const results = await searchManager.search("query");
      expect(results).toEqual([]);
    });
  });

  describe("RevisionManager", () => {
    const revisionManager = new RevisionManager(mockClient);

    it("fetches a revision by ID", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: {
          pages: {
            "1": {
              revisions: [
                {
                  revid: 123,
                  user: "User",
                  timestamp: "2023-01-01",
                  comment: "Edit",
                },
              ],
            },
          },
        },
      });

      const revision = await revisionManager.fetch(123);

      expect(requestManagerGetMock).toHaveBeenCalledWith({
        action: "query",
        prop: "revisions",
        revids: 123,
        rvprop: "ids|timestamp|user|comment|content",
        format: "json",
      });
      expect(revision).toBeInstanceOf(Revision);
      expect(revision.revid).toBe(123);
    });

    it("throws if revision not found", async () => {
      requestManagerGetMock.mockResolvedValue({ query: { pages: {} } });
      await expect(revisionManager.fetch(999)).rejects.toThrow(
        "Revision 999 not found",
      );
    });

    it("fetches recent changes", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: {
          recentchanges: [
            {
              revid: 100,
              user: "User1",
              timestamp: "2023-01-01",
              comment: "Edit 1",
              title: "Page 1",
            },
          ],
        },
      });

      const changes = await revisionManager.fetchRecent();
      expect(requestManagerGetMock).toHaveBeenCalledWith({
        action: "query",
        list: "recentchanges",
        rcprop: "ids|timestamp|user|comment|title",
        rclimit: 10,
        format: "json",
      });
      expect(changes).toHaveLength(1);
      expect(changes[0]).toBeInstanceOf(Revision);
    });

    it("handles empty recent changes", async () => {
      requestManagerGetMock.mockResolvedValue({});
      const changes = await revisionManager.fetchRecent();
      expect(changes).toEqual([]);
    });
  });

  describe("UserManager", () => {
    const userManager = new UserManager(mockClient);

    it("fetches user by ID", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: {
          users: [{ name: "TestUser", userid: 123 }],
        },
      });

      const user = await userManager.fetch(123);

      expect(requestManagerGetMock).toHaveBeenCalledWith({
        action: "query",
        list: "users",
        usprop: "groups|registration",
        usids: 123,
        format: "json",
      });
      expect(user).toBeInstanceOf(User);
      expect(user.name).toBe("TestUser");
    });

    it("fetches user by name", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: {
          users: [{ name: "TestUser", userid: 123 }],
        },
      });

      const user = await userManager.fetch("TestUser");

      expect(requestManagerGetMock).toHaveBeenCalledWith({
        action: "query",
        list: "users",
        usprop: "groups|registration",
        ususers: "TestUser",
        format: "json",
      });
      expect(user).toBeInstanceOf(User);
    });

    it("throws if user not found", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: {
          users: [{ missing: "" }],
        },
      });
      await expect(userManager.fetch("MissingUser")).rejects.toThrow(
        "User not found",
      );
    });

    it("fetches user contributions", async () => {
      requestManagerGetMock.mockResolvedValue({
        query: {
          usercontribs: [{ title: "Page 1", timestamp: "2023-01-01" }],
        },
      });

      const contribs = await userManager.fetchContributions("TestUser");

      expect(requestManagerGetMock).toHaveBeenCalledWith({
        action: "query",
        list: "usercontribs",
        ucuser: "TestUser",
        uclimit: 10,
        format: "json",
      });
      expect(contribs).toHaveLength(1);
      expect(contribs[0].title).toBe("Page 1");
    });
  });
});
