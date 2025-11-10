import { FandomEmitter } from "../events/events.js";
import { RequestManager } from "../request/request-manager.js";
import { LRUCache } from "lru-cache";
import type { ClientOptions, PageSummary } from "../types/index.js";
import { Page } from "../structures/page.js";
import {
  ARTICLES_DETAILS_PATH,
  DEFAULT_ABSTRACT_LENGTH,
  DEFAULT_API_PATH,
  USER_AGENT,
} from "../package-constants.js";

export class Client {
  public options: ClientOptions;
  public events: FandomEmitter;
  private requestManager: RequestManager;
  private cache: LRUCache<string, Page>;

  constructor(options: ClientOptions) {
    this.options = {
      apiPath: DEFAULT_API_PATH,
      userAgent: USER_AGENT,
      maxRetries: 3,
      cacheSize: 100,
      ...options,
    };
    this.events = new FandomEmitter();
    this.requestManager = new RequestManager({
      baseURL: this.options.host,
      apiPath: this.options.apiPath,
      userAgent: this.options.userAgent,
      maxRetries: this.options.maxRetries,
    });
    this.cache = new LRUCache<string, Page>({
      max: this.options.cacheSize ?? 100,
    });
  }

  public async fetchPage(title: string): Promise<Page> {
    const key = `page:${title}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const res = await this.requestManager.get({
      action: "query",
      prop: "extracts",
      exintro: true,
      explaintext: true,
      redirects: true,
      titles: title,
      format: "json",
    });

    // MediaWiki returns pages as object keyed by pageid
    const pages = res?.query?.pages;
    const firstPage = pages ? Object.values(pages)[0] : undefined;
    if (!firstPage) throw new Error("No page data");

    const normalizedTitle = (firstPage as any).title;
    const redirectInfo = Array.isArray(res?.query?.redirects)
      ? (res.query.redirects as Array<{ to?: string }>)
      : undefined;
    const redirectTarget = redirectInfo?.length
      ? redirectInfo[redirectInfo.length - 1]?.to
      : undefined;
    const fallbackTitle = redirectTarget ?? normalizedTitle ?? title;

    let extract =
      typeof (firstPage as any).extract === "string"
        ? ((firstPage as any).extract as string).trim()
        : undefined;

    if (!extract) {
      try {
        const details = await this.requestManager.get(
          {
            titles: fallbackTitle,
            abstract: DEFAULT_ABSTRACT_LENGTH,
          },
          { apiPath: ARTICLES_DETAILS_PATH },
        );
        const items = details?.items;
        const firstItem = items ? Object.values(items)[0] : undefined;
        const abstract =
          firstItem && typeof (firstItem as any).abstract === "string"
            ? ((firstItem as any).abstract as string).trim()
            : undefined;

        if (abstract) {
          extract = abstract;
        }
      } catch {
        // ignore fallback errors so we can still return basic page info
      }
    }

    const pageSummary: PageSummary = {
      pageid: (firstPage as any).pageid,
      ns: (firstPage as any).ns,
      title: fallbackTitle,
      extract,
    };

    this.events.emit("pageFetched", pageSummary);

    const page = new Page(pageSummary as any);
    this.cache.set(key, page);
    return page;
  }

  public async onReady() {
    // emit ready immediately for now
    // TODO: add actual initialization logic
    this.events.emit("ready");
  }
}
