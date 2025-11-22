import { describe, it, expect, vi, beforeEach } from "vitest";
import { Revision } from "../src/structures/revision-structure";
import { User } from "../src/structures/user-structure";
import { Client } from "../src/client/client";
import { TokenType } from "../src/enums/index";

const requestManagerPostMock = vi.fn();
const mockClient = {
  requestManager: {
    post: requestManagerPostMock,
  },
} as unknown as Client;

describe("Structures", () => {
  beforeEach(() => {
    requestManagerPostMock.mockReset();
  });

  describe("Revision", () => {
    it("parses slots content", () => {
      const revision = new Revision(mockClient, {
        revid: 1,
        timestamp: "2023-01-01",
        user: "User",
        slots: {
          main: { "*": "Slot Content" },
        },
      });

      expect(revision.content).toBe("Slot Content");
    });

    it("parses Main slot content (capitalized)", () => {
      const revision = new Revision(mockClient, {
        revid: 1,
        timestamp: "2023-01-01",
        user: "User",
        slots: {
          Main: { "*": "Slot Content" },
        },
      });

      expect(revision.content).toBe("Slot Content");
    });
  });

  describe("User", () => {
    it("blocks a user", async () => {
      const user = new User(mockClient, { userid: 1, name: "BadUser" });
      await user.block("1 week", "Vandalism");

      expect(requestManagerPostMock).toHaveBeenCalledWith(
        {
          action: "block",
          user: "BadUser",
          expiry: "1 week",
          reason: "Vandalism",
          format: "json",
        },
        {
          tokenType: TokenType.Csrf,
        },
      );
    });

    it("parses registration date", () => {
      const user = new User(mockClient, {
        userid: 1,
        name: "User",
        registration: "2023-01-01T00:00:00Z",
      });
      expect(user.registrationDate).toBeInstanceOf(Date);
      expect(user.registrationDate?.toISOString()).toBe(
        "2023-01-01T00:00:00.000Z",
      );
    });
  });
});
