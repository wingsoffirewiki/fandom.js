import { BaseStructure } from "./base-structure.js";
import type { Client } from "../client/client.js";
import { TokenType } from "../enums/index.js";
import type { APIUser } from "../types/index.js";

/**
 * Represents a wiki user.
 */
export class User extends BaseStructure<Partial<APIUser>> {
  /**
   * The ID of the user.
   */
  public id!: number;
  /**
   * The name of the user.
   */
  public name!: string;
  /**
   * The registration date of the user.
   */
  public registrationDate?: Date;
  /**
   * The groups the user belongs to.
   */
  public groups: string[] = [];

  /**
   * Creates a new instance of the User.
   * @param client - The client instance.
   * @param data - The data to initialize the user with.
   */
  constructor(client: Client, data: Partial<APIUser>) {
    super(client);
    this._patch(data);
  }

  /**
   * Patches the user with new data.
   * @param data - The data to patch with.
   * @returns The updated user.
   * @internal
   */
  public _patch(data: Partial<APIUser>): this {
    if (data.userid !== undefined) this.id = data.userid;
    if (data.name !== undefined) this.name = data.name;
    if (data.registration) this.registrationDate = new Date(data.registration);
    if (data.groups) this.groups = data.groups;
    return this;
  }

  /**
   * Blocks the user.
   * @param expiry - The expiry time for the block.
   * @param reason - The reason for the block.
   * @returns A Promise that resolves when the user is blocked.
   */
  public async block(expiry: string, reason: string): Promise<void> {
    await this.client.requestManager.post(
      {
        action: "block",
        user: this.name,
        expiry: expiry,
        reason: reason,
        format: "json",
      },
      { tokenType: TokenType.Csrf },
    );
  }
}
