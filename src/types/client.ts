/**
 * Represents the base URL of a wiki.
 * @example "https://community.fandom.com"
 */
export type WikiHost = string;

/**
 * Options for configuring the client.
 */
export interface ClientOptions {
  /**
   * The base URL of the wiki.
   */
  host: WikiHost;
  /**
   * The path to the API. Defaults to "/api.php".
   */
  apiPath?: string;
  /**
   * The user agent to use for requests.
   */
  userAgent?: string;
  /**
   * The maximum number of retries for failed requests.
   */
  maxRetries?: number;
  /**
   * The maximum number of items to cache.
   */
  cacheSize?: number;
  /**
   * Whether to enable polling for recent changes.
   */
  polling?: boolean;
  /**
   * The interval in milliseconds for polling.
   */
  pollingInterval?: number;
}
