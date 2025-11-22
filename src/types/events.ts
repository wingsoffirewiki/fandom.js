import { RCType } from "../enums/index.js";

/**
 * Represents a recent change on the wiki.
 */
export interface RecentChange {
  /**
   * The type of change.
   */
  type: RCType;
  /**
   * The namespace ID.
   */
  ns: number;
  /**
   * The title of the page.
   */
  title: string;
  /**
   * The page ID.
   */
  pageid: number;
  /**
   * The revision ID.
   */
  revid: number;
  /**
   * The old revision ID.
   */
  old_revid: number;
  /**
   * The recent change ID.
   */
  rcid: number;
  /**
   * The user who made the change.
   */
  user: string;
  /**
   * The timestamp of the change.
   */
  timestamp: string;
  /**
   * The comment associated with the change.
   */
  comment: string;
  /**
   * Whether the change was made by a bot.
   */
  bot?: boolean;
  /**
   * Whether the page is new.
   */
  new?: boolean;
  /**
   * Whether the change is minor.
   */
  minor?: boolean;
  /**
   * The log ID (if applicable).
   */
  logid?: number;
  /**
   * The log type (if applicable).
   */
  logtype?: string;
  /**
   * The log action (if applicable).
   */
  logaction?: string;
}

/**
 * Represents a log event.
 */
export interface LogEvent {
  /**
   * The log ID.
   */
  logid: number;
  /**
   * The namespace ID.
   */
  ns: number;
  /**
   * The title of the page.
   */
  title: string;
  /**
   * The page ID.
   */
  pageid: number;
  /**
   * The log type.
   */
  logtype: string;
  /**
   * The log action.
   */
  logaction: string;
  /**
   * The user who performed the action.
   */
  user: string;
  /**
   * The timestamp of the event.
   */
  timestamp: string;
  /**
   * The comment associated with the event.
   */
  comment: string;
  /**
   * Additional parameters for the log event.
   */
  params?: Record<string, unknown>; // Log params vary widely
}

/**
 * Represents a file upload event.
 */
export interface FileUploadEvent {
  /**
   * The title of the file.
   */
  title: string;
  /**
   * The user who uploaded the file.
   */
  user: string;
  /**
   * The timestamp of the upload.
   */
  timestamp: string;
  /**
   * The comment associated with the upload.
   */
  comment: string;
  /**
   * The URL of the uploaded file.
   */
  url: string;
}
