import type { Client } from "../client/client.js";

/**
 * The base manager class that all other managers extend.
 */
export abstract class BaseManager {
  /**
   * The client that instantiated this manager.
   */
  public client: Client;

  /**
   * Creates a new instance of the BaseManager.
   * @param client - The client instance.
   */
  constructor(client: Client) {
    this.client = client;
  }
}
