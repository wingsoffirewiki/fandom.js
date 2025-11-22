import { APIRevision, RevisionData } from "./revision.js";

/**
 * Represents category data for a page.
 */
export interface CategoryData {
  /**
   * The namespace ID of the category.
   */
  ns: number;
  /**
   * The title of the category.
   */
  title: string;
}

/**
 * Represents a page object returned by the API.
 */
export interface APIPage {
  /**
   * The ID of the page.
   */
  pageid: number;
  /**
   * The namespace ID of the page.
   */
  ns: number;
  /**
   * The title of the page.
   */
  title: string;
  /**
   * The extract (summary) of the page.
   */
  extract?: string;
  /**
   * The revisions of the page.
   */
  revisions?: APIRevision[];
  /**
   * The categories the page belongs to.
   */
  categories?: CategoryData[];
  /**
   * The ID of the last revision.
   */
  lastrevid?: number;
  /**
   * The length of the page content.
   */
  length?: number;
  /**
   * The timestamp when the page was last touched.
   */
  touched?: string;
  /**
   * Allow other properties from the API.
   */
  [key: string]: unknown; // Allow other props from API
}

/**
 * Represents a summary of a page.
 */
export interface PageSummary {
  /**
   * The ID of the page.
   */
  pageid: number;
  /**
   * The namespace ID of the page.
   */
  ns: number;
  /**
   * The title of the page.
   */
  title: string;
  /**
   * The extract (summary) of the page.
   */
  extract?: string;
  /**
   * The revisions of the page.
   */
  revisions?: RevisionData[];
  /**
   * The categories the page belongs to.
   */
  categories?: CategoryData[];
  /**
   * The ID of the last revision.
   */
  lastrevid?: number;
  /**
   * The length of the page content.
   */
  length?: number;
  /**
   * The timestamp when the page was last touched.
   */
  touched?: string;
  /**
   * Allow other properties.
   */
  [key: string]: unknown;
}
