import { BaseManager } from "./base-manager.js";
import { Page } from "../structures/page-structure.js";
import type { APIPage, APIResponse } from "../types/index.js";

/**
 * Manager for handling category-related operations.
 */
export class CategoryManager extends BaseManager {
  /**
   * Fetches members of a category.
   * @param category - The name of the category.
   * @param limit - The maximum number of members to fetch. Defaults to 50.
   * @returns A Promise that resolves to an array of Page objects representing the category members.
   */
  public async fetchMembers(
    category: string,
    limit: number = 50,
  ): Promise<Page[]> {
    const res = await this.client.requestManager.get<
      APIResponse<{ categorymembers: APIPage[] }>
    >({
      action: "query",
      list: "categorymembers",
      cmtitle: category.startsWith("Category:")
        ? category
        : `Category:${category}`,
      cmlimit: limit,
      format: "json",
    });

    if (!res?.query?.categorymembers) return [];

    return res.query.categorymembers.map(
      (data: APIPage) => new Page(this.client, data),
    );
  }
}
