import { BaseManager } from "./base-manager.js";
import type { APIResponse } from "../types/index.js";

/**
 * Manager for handling search operations.
 */
export class SearchManager extends BaseManager {
  /**
   * Searches the wiki for pages matching the query.
   * @param query - The search query.
   * @param limit - The maximum number of results to return. Defaults to 10.
   * @returns A Promise that resolves to an array of page titles matching the query.
   */
  public async search(query: string, limit: number = 10): Promise<string[]> {
    const res = await this.client.requestManager.get<
      APIResponse<{ search: { title: string }[] }>
    >({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: limit,
      format: "json",
    });

    if (!res?.query?.search) return [];

    return res.query.search.map((item) => item.title);
  }
}
