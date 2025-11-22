import { BaseStructure } from "./base-structure.js";
import type { Client } from "../client/client.js";
import { TokenType, ProtectionLevel } from "../enums/index.js";
import { Revision } from "./revision-structure.js";
import type {
  APIPage,
  QueryParams,
  APIResponse,
  APIRevision,
} from "../types/index.js";

/**
 * Represents a wiki page.
 */
export class Page extends BaseStructure<Partial<APIPage>> {
  /**
   * The ID of the page.
   */
  public pageid!: number;
  /**
   * The namespace ID of the page.
   */
  public ns!: number;
  /**
   * The title of the page.
   */
  public title!: string;
  /**
   * The extract (summary) of the page.
   */
  public extract?: string;
  /**
   * The content of the page.
   */
  public content?: string;
  /**
   * The categories the page belongs to.
   */
  public categories: string[] = [];

  /**
   * Creates a new instance of the Page.
   * @param client - The client instance.
   * @param data - The data to initialize the page with.
   */
  constructor(client: Client, data: Partial<APIPage>) {
    super(client);
    this._patch(data);
  }

  /**
   * Patches the page with new data.
   * @param data - The data to patch with.
   * @returns The updated page.
   * @internal
   */
  public _patch(data: Partial<APIPage>): this {
    if (data.pageid !== undefined) this.pageid = data.pageid;
    if (data.ns !== undefined) this.ns = data.ns;
    if (data.title !== undefined) this.title = data.title;
    if (data.extract !== undefined) this.extract = data.extract;

    if (
      data.revisions &&
      Array.isArray(data.revisions) &&
      data.revisions.length > 0
    ) {
      const rev = data.revisions[0];
      if (rev["*"]) this.content = rev["*"];
      else if (rev.slots) {
        const main = rev.slots.main || rev.slots.Main;
        if (main && main["*"]) this.content = main["*"];
      }
    }

    if (data.categories && Array.isArray(data.categories)) {
      this.categories = data.categories.map((c) => c.title);
    }
    return this;
  }

  /**
   * Edits the page content.
   * @param text - The new content of the page.
   * @param summary - The edit summary.
   * @returns A Promise that resolves to the updated Page.
   */
  public async edit(text: string, summary?: string): Promise<Page> {
    const params: QueryParams = {
      action: "edit",
      title: this.title,
      text: text,
      format: "json",
    };
    if (summary) params.summary = summary;

    await this.client.requestManager.post(params, {
      tokenType: TokenType.Csrf,
    });
    return this;
  }

  /**
   * Deletes the page.
   * @param reason - The reason for deletion.
   * @returns A Promise that resolves when the page is deleted.
   */
  public async delete(reason?: string): Promise<void> {
    const params: QueryParams = {
      action: "delete",
      title: this.title,
      format: "json",
    };
    if (reason) params.reason = reason;

    await this.client.requestManager.post(params, {
      tokenType: TokenType.Csrf,
    });
  }

  /**
   * Protects the page.
   * @param level - The protection level.
   * @param expiry - The expiry time for the protection.
   * @param reason - The reason for protection.
   * @returns A Promise that resolves when the page is protected.
   */
  public async protect(
    level: ProtectionLevel,
    expiry: string,
    reason?: string,
  ): Promise<void> {
    const params: QueryParams = {
      action: "protect",
      title: this.title,
      protections: `edit=${level}|move=${level}`,
      expiry: expiry,
      format: "json",
    };
    if (reason) params.reason = reason;

    await this.client.requestManager.post(params, {
      tokenType: TokenType.Csrf,
    });
  }

  /**
   * Fetches the revision history of the page.
   * @returns A Promise that resolves to an array of Revision objects.
   */
  public async fetchHistory(): Promise<Revision[]> {
    const res = await this.client.requestManager.get<
      APIResponse<{ pages: Record<string, APIPage> }>
    >({
      action: "query",
      prop: "revisions",
      titles: this.title,
      rvprop: "ids|timestamp|user|content",
      rvlimit: 50,
      format: "json",
    });

    const pages = res?.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (!page || !page.revisions) return [];

    return page.revisions.map(
      (rev: APIRevision) => new Revision(this.client, rev),
    );
  }

  /**
   * Reverts the page to a specific revision.
   * @param revid - The revision ID to revert to.
   * @param summary - The edit summary.
   * @returns A Promise that resolves to the updated Page.
   */
  public async revertTo(revid: number, summary?: string): Promise<Page> {
    const res = await this.client.requestManager.get<
      APIResponse<{ pages: Record<string, APIPage> }>
    >({
      action: "query",
      prop: "info",
      titles: this.title,
      format: "json",
    });

    const pages = res?.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    const currentRevid = page.lastrevid;

    if (currentRevid === revid) return this;

    const params: QueryParams = {
      action: "edit",
      title: this.title,
      undo: currentRevid!,
      undoafter: revid,
      format: "json",
    };
    if (summary) params.summary = summary;

    await this.client.requestManager.post(params, {
      tokenType: TokenType.Csrf,
    });
    return this;
  }
}
