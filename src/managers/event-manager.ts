import { FandomEmitter } from "../events/events.js";
import type { Client } from "../client/client.js";
import type { QueryParams, RecentChange, APIResponse } from "../types/index.js";

/**
 * Manager for handling wiki events via polling.
 */
export class EventManager extends FandomEmitter {
  /**
   * The client instance.
   * @private
   */
  private client: Client;
  /**
   * The polling interval.
   * @private
   */
  private interval: NodeJS.Timeout | null = null;
  /**
   * The timestamp of the last processed change.
   * @private
   */
  private lastTimestamp: string | null = null;

  /**
   * Creates a new instance of the EventManager.
   * @param client - The client instance.
   */
  constructor(client: Client) {
    super();
    this.client = client;
  }

  /**
   * Starts polling for recent changes.
   * @param intervalMs - The polling interval in milliseconds. Defaults to 5000.
   */
  public startPolling(intervalMs: number = 5000) {
    if (this.interval) return;
    this.interval = setInterval(() => this.poll(), intervalMs);
  }

  /**
   * Stops polling for recent changes.
   */
  public stopPolling() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Polls for recent changes.
   * @private
   */
  private async poll() {
    try {
      const params: QueryParams = {
        action: "query",
        list: "recentchanges",
        rcprop: "title|ids|timestamp|user|userid|comment|flags|loginfo",
        rclimit: 50,
        format: "json",
      };

      if (this.lastTimestamp) {
        params.rcend = this.lastTimestamp;
      }

      const res =
        await this.client.requestManager.get<
          APIResponse<{ recentchanges: RecentChange[] }>
        >(params);
      const changes = res?.query?.recentchanges;

      if (!changes || changes.length === 0) return;

      if (!this.lastTimestamp) {
        this.lastTimestamp = changes[0].timestamp;
        return;
      }

      for (const change of changes) {
        if (change.timestamp <= this.lastTimestamp) continue;
        this.processChange(change);
      }

      this.lastTimestamp = changes[0].timestamp;
    } catch (err) {
      console.error("Polling error:", err);
    }
  }

  /**
   * Processes a recent change and emits relevant events.
   * @param change - The recent change to process.
   * @private
   */
  private processChange(change: RecentChange) {
    if (change.type === "edit") {
      this.emit("pageUpdate", change);
    } else if (change.type === "new") {
      this.emit("pageCreate", change);
    } else if (change.type === "log") {
      if (change.logtype === "upload") {
        this.emit("fileUpload", {
          title: change.title,
          user: change.user,
          timestamp: change.timestamp,
          comment: change.comment,
          url: "",
        });
      } else if (change.logtype === "block") {
        this.emit("userBlock", {
          user: change.title.replace("User:", ""),
          by: change.user,
          timestamp: change.timestamp,
          expiry: "",
          reason: change.comment,
        });
      }
    }
  }
}
