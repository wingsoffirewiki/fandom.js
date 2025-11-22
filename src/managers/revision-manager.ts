import { BaseManager } from "./base-manager.js";
import { Revision } from "../structures/revision-structure.js";
import { LRUCache } from "lru-cache";
import type { Client } from "../client/client.js";
import type { APIResponse, APIPage, RecentChange } from "../types/index.js";

/**
 * Manager for handling revision-related operations.
 */
export class RevisionManager extends BaseManager {
  /**
   * Cache for storing fetched revisions.
   * @private
   */
  private cache: LRUCache<number, Revision>;

  /**
   * Creates a new instance of the RevisionManager.
   * @param client - The client instance.
   */
  constructor(client: Client) {
    super(client);
    this.cache = new LRUCache<number, Revision>({
      max: this.client.options.cacheSize ?? 100,
    });
  }

  /**
   * Fetches a revision by its ID.
   * @param id - The ID of the revision to fetch.
   * @returns A Promise that resolves to the fetched Revision.
   * @throws {Error} If the revision is not found.
   */
  public async fetch(id: number): Promise<Revision> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const res = await this.client.requestManager.get<
      APIResponse<{ pages: Record<string, APIPage> }>
    >({
      action: "query",
      prop: "revisions",
      revids: id,
      rvprop: "ids|timestamp|user|comment|content",
      format: "json",
    });

    const pages = res?.query?.pages;
    const firstPage = pages ? Object.values(pages)[0] : undefined;
    const revisions = firstPage?.revisions;
    const revisionData = revisions ? revisions[0] : undefined;

    if (!revisionData) throw new Error(`Revision ${id} not found`);

    const revision = new Revision(this.client, revisionData);
    this.cache.set(id, revision);
    return revision;
  }

  /**
   * Fetches recent changes from the wiki.
   * @param limit - The maximum number of recent changes to fetch. Defaults to 10.
   * @returns A Promise that resolves to an array of Revision objects representing the recent changes.
   */
  public async fetchRecent(limit: number = 10): Promise<Revision[]> {
    const res = await this.client.requestManager.get<
      APIResponse<{ recentchanges: RecentChange[] }>
    >({
      action: "query",
      list: "recentchanges",
      rcprop: "ids|timestamp|user|comment|title",
      rclimit: limit,
      format: "json",
    });

    const changes = res?.query?.recentchanges;
    if (!changes) return [];

    return changes.map(
      (data: RecentChange) =>
        new Revision(this.client, {
          revid: data.revid,
          timestamp: data.timestamp,
          user: data.user,
          comment: data.comment,
          title: data.title,
        }),
    );
  }
}
