import { BaseStructure } from "./base-structure.js";
import type { Client } from "../client/client.js";
import type { APIRevision } from "../types/index.js";

/**
 * Represents a revision of a page.
 */
export class Revision extends BaseStructure<Partial<APIRevision>> {
  /**
   * The ID of the revision.
   */
  public revid!: number;
  /**
   * The timestamp of the revision.
   */
  public timestamp!: Date;
  /**
   * The user who created the revision.
   */
  public user!: string;
  /**
   * The content of the revision.
   */
  public content?: string;
  /**
   * The comment associated with the revision.
   */
  public comment?: string;
  /**
   * The title of the page this revision belongs to.
   */
  public title?: string;

  /**
   * Creates a new instance of the Revision.
   * @param client - The client instance.
   * @param data - The data to initialize the revision with.
   */
  constructor(client: Client, data: Partial<APIRevision>) {
    super(client);
    this._patch(data);
  }

  /**
   * Patches the revision with new data.
   * @param data - The data to patch with.
   * @returns The updated revision.
   * @internal
   */
  public _patch(data: Partial<APIRevision>): this {
    if (data.revid !== undefined) this.revid = data.revid;
    if (data.timestamp !== undefined) this.timestamp = new Date(data.timestamp);
    if (data.user !== undefined) this.user = data.user;
    if (data.comment !== undefined) this.comment = data.comment;
    if (data.title) this.title = data.title;

    if (data["*"]) this.content = data["*"];
    else if (data.slots) {
      const main = data.slots.main || data.slots.Main;
      if (main && main["*"]) this.content = main["*"];
    }
    return this;
  }
}
