import { BaseManager } from "./base-manager.js";
import type { APIResponse, SiteInfo } from "../types/index.js";

/**
 * Manager for handling metadata-related operations.
 */
export class MetaManager extends BaseManager {
  /**
   * Fetches site information.
   * @param prop - The properties to fetch. Defaults to "general|namespaces|statistics".
   * @returns A Promise that resolves to the site information.
   */
  public async fetchSiteInfo(
    prop: string = "general|namespaces|statistics",
  ): Promise<Partial<SiteInfo>> {
    const res = await this.client.requestManager.get<
      APIResponse<Partial<SiteInfo>>
    >({
      action: "query",
      meta: "siteinfo",
      siprop: prop,
      format: "json",
    });

    return res?.query || {};
  }
}
