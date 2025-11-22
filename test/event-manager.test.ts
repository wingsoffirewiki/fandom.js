import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventManager } from "../src/managers/event-manager";
import { Client } from "../src/client/client";

const requestManagerGetMock = vi.fn();
const mockClient = {
  requestManager: {
    get: requestManagerGetMock,
  },
} as unknown as Client;

describe("EventManager", () => {
  let eventManager: EventManager;

  beforeEach(() => {
    vi.useFakeTimers();
    requestManagerGetMock.mockReset();
    eventManager = new EventManager(mockClient);
  });

  afterEach(() => {
    vi.useRealTimers();
    eventManager.stopPolling();
  });

  it("starts and stops polling", () => {
    const pollSpy = vi.spyOn(eventManager as any, "poll");
    eventManager.startPolling(1000);

    vi.advanceTimersByTime(1000);
    expect(pollSpy).toHaveBeenCalledTimes(1);

    eventManager.stopPolling();
    vi.advanceTimersByTime(1000);
    expect(pollSpy).toHaveBeenCalledTimes(1);
  });

  it("does not start polling if already polling", () => {
    const pollSpy = vi.spyOn(eventManager as any, "poll");
    eventManager.startPolling(1000);
    eventManager.startPolling(1000);

    vi.advanceTimersByTime(1000);
    expect(pollSpy).toHaveBeenCalledTimes(1);
  });

  it("polls and emits events", async () => {
    const emitSpy = vi.spyOn(eventManager, "emit");

    // First poll: sets lastTimestamp
    requestManagerGetMock.mockResolvedValueOnce({
      query: {
        recentchanges: [
          { timestamp: "2023-01-01T00:00:00Z", type: "edit", title: "Page 1" },
        ],
      },
    });

    // Second poll: new changes
    requestManagerGetMock.mockResolvedValueOnce({
      query: {
        recentchanges: [
          { timestamp: "2023-01-01T00:00:01Z", type: "edit", title: "Page 1" },
          { timestamp: "2023-01-01T00:00:00Z", type: "edit", title: "Page 1" }, // Old, should be ignored
        ],
      },
    });

    // Trigger poll manually to avoid waiting for timers in async test
    await (eventManager as any).poll();
    expect(emitSpy).not.toHaveBeenCalled(); // First poll just sets timestamp

    await (eventManager as any).poll();
    expect(emitSpy).toHaveBeenCalledWith(
      "pageUpdate",
      expect.objectContaining({ timestamp: "2023-01-01T00:00:01Z" }),
    );
  });

  it("handles different event types", async () => {
    const emitSpy = vi.spyOn(eventManager, "emit");
    (eventManager as any).lastTimestamp = "2023-01-01T00:00:00Z";

    requestManagerGetMock.mockResolvedValue({
      query: {
        recentchanges: [
          { timestamp: "2023-01-01T00:00:01Z", type: "new", title: "New Page" },
          {
            timestamp: "2023-01-01T00:00:01Z",
            type: "log",
            logtype: "upload",
            title: "File:Image.png",
            user: "User1",
            comment: "Upload",
          },
          {
            timestamp: "2023-01-01T00:00:01Z",
            type: "log",
            logtype: "block",
            title: "User:BadUser",
            user: "Admin",
            comment: "Block",
          },
        ],
      },
    });

    await (eventManager as any).poll();

    expect(emitSpy).toHaveBeenCalledWith(
      "pageCreate",
      expect.objectContaining({ title: "New Page" }),
    );
    expect(emitSpy).toHaveBeenCalledWith(
      "fileUpload",
      expect.objectContaining({ title: "File:Image.png" }),
    );
    expect(emitSpy).toHaveBeenCalledWith(
      "userBlock",
      expect.objectContaining({ user: "BadUser" }),
    );
  });

  it("handles polling errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    requestManagerGetMock.mockRejectedValue(new Error("Network error"));

    await (eventManager as any).poll();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Polling error:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("handles empty response", async () => {
    requestManagerGetMock.mockResolvedValue({});
    await (eventManager as any).poll();
    // Should not throw
  });
});
