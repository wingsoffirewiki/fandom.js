import type { Client } from "../client/client.js";

/**
 * The base structure class that all other structures extend.
 * @template T - The type of data this structure holds.
 */
export abstract class BaseStructure<T = unknown> {
  /**
   * The client that instantiated this structure.
   */
  public client: Client;

  /**
   * Creates a new instance of the BaseStructure.
   * @param client - The client instance.
   */
  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Patches the structure with new data.
   * @param data - The data to patch with.
   * @returns The updated structure.
   * @internal
   */
  public abstract _patch(data: T): this;
}
