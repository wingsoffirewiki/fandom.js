import { BaseManager } from "./base-manager.js";
import { Page } from "../structures/page-structure.js";
import { LRUCache } from "lru-cache";
import {
  ARTICLES_DETAILS_PATH,
  DEFAULT_ABSTRACT_LENGTH,
} from "../package-constants.js";
import type { PageSummary, APIPage, APIResponse } from "../types/index.js";
import type { Client } from "../client/client.js";

/**
 * Manager for handling page-related operations.
 */
export class PageManager extends BaseManager {
  /**
   * Cache for storing fetched pages.
   * @private
   */
  private cache: LRUCache<string, Page>;

  /**
   * Creates a new instance of the PageManager.
   * @param client - The client instance.
   */
  constructor(client: Client) {
    super(client);
    this.cache = new LRUCache<string, Page>({
      max: this.client.options.cacheSize ?? 100,
    });
  }

  /**
   * Fetches a page by its title.
   * @param title - The title of the page to fetch.
   * @returns A Promise that resolves to the fetched Page.
   * @throws {Error} If no page data is found.
   */
  public async fetch(title: string): Promise<Page> {
    const key = `page:${title}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const res = await this.client.requestManager.get<
      APIResponse<{
        pages: Record<string, APIPage>;
        redirects?: { to: string }[];
      }>
    >({
      action: "query",
      prop: "extracts|revisions|categories",
      exintro: true,
      explaintext: true,
      rvprop: "content",
      cllimit: "max",
      redirects: true,
      titles: title,
      format: "json",
    });

    const pages = res?.query?.pages;
    const firstPage = pages ? Object.values(pages)[0] : undefined;
    if (!firstPage) throw new Error("No page data");

    const normalizedTitle = firstPage.title;
    const redirectInfo = res?.query?.redirects;
    const redirectTarget = redirectInfo?.length
      ? redirectInfo[redirectInfo.length - 1]?.to
      : undefined;
    const fallbackTitle = redirectTarget ?? normalizedTitle ?? title;

    let extract =
      typeof firstPage.extract === "string"
        ? firstPage.extract.trim()
        : undefined;

    if (!extract) {
      try {
        const details = await this.client.requestManager.get<{
          items: Record<string, { abstract: string }>;
        }>(
          {
            titles: fallbackTitle,
            abstract: DEFAULT_ABSTRACT_LENGTH,
          },
          { apiPath: ARTICLES_DETAILS_PATH },
        );
        const items = details?.items;
        const firstItem = items ? Object.values(items)[0] : undefined;
        const abstract =
          firstItem && typeof firstItem.abstract === "string"
            ? firstItem.abstract.trim()
            : undefined;

        if (abstract) {
          extract = abstract;
        }
      } catch {
        // ignore fallback errors so we can still return basic page info
      }
    }

    const pageSummary: PageSummary = {
      pageid: firstPage.pageid,
      ns: firstPage.ns,
      title: fallbackTitle,
      extract,
      revisions: firstPage.revisions,
      categories: firstPage.categories,
    };

    this.client.events.emit("pageFetched", pageSummary);

    const page = new Page(this.client, pageSummary);
    this.cache.set(key, page);
    return page;
  }
}
