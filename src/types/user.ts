/**
 * Represents a user object returned by the API.
 */
export interface APIUser {
  /**
   * The ID of the user.
   */
  userid: number;
  /**
   * The name of the user.
   */
  name: string;
  /**
   * The registration date of the user.
   */
  registration?: string;
  /**
   * The groups the user belongs to.
   */
  groups?: string[];
  /**
   * Allow other properties.
   */
  [key: string]: unknown;
}

/**
 * Represents a user contribution.
 */
export interface UserContribution {
  /**
   * The ID of the user.
   */
  userid: number;
  /**
   * The name of the user.
   */
  user: string;
  /**
   * The ID of the page.
   */
  pageid: number;
  /**
   * The ID of the revision.
   */
  revid: number;
  /**
   * The ID of the parent revision.
   */
  parentid: number;
  /**
   * The namespace ID.
   */
  ns: number;
  /**
   * The title of the page.
   */
  title: string;
  /**
   * The timestamp of the contribution.
   */
  timestamp: string;
  /**
   * The comment associated with the contribution.
   */
  comment: string;
  /**
   * The size of the contribution.
   */
  size: number;
  /**
   * Allow other properties.
   */
  [key: string]: unknown;
}

/**
 * Represents a user block event.
 */
export interface UserBlockEvent {
  /**
   * The user who was blocked.
   */
  user: string;
  /**
   * The user who performed the block.
   */
  by: string;
  /**
   * The timestamp of the block.
   */
  timestamp: string;
  /**
   * The expiry time of the block.
   */
  expiry: string;
  /**
   * The reason for the block.
   */
  reason: string;
}
