/**
 * Represents a revision object returned by the API.
 */
export interface APIRevision {
  /**
   * The ID of the revision.
   */
  revid: number;
  /**
   * The ID of the parent revision.
   */
  parentid: number;
  /**
   * The user who created the revision.
   */
  user: string;
  /**
   * The timestamp of the revision.
   */
  timestamp: string;
  /**
   * The comment associated with the revision.
   */
  comment: string;
  /**
   * The content of the revision (legacy format).
   */
  "*"?: string;
  /**
   * The title of the page.
   */
  title?: string;
  /**
   * The slots of the revision (modern format).
   */
  slots?: {
    main?: {
      "*"?: string;
    };
    Main?: {
      "*"?: string;
    };
    [key: string]: unknown;
  };
  /**
   * Whether the revision is minor.
   */
  minor?: boolean;
}

/**
 * Represents processed revision data.
 */
export interface RevisionData {
  /**
   * The ID of the revision.
   */
  revid: number;
  /**
   * The ID of the parent revision.
   */
  parentid: number;
  /**
   * The user who created the revision.
   */
  user: string;
  /**
   * The timestamp of the revision.
   */
  timestamp: string;
  /**
   * The comment associated with the revision.
   */
  comment: string;
  /**
   * The content of the revision.
   */
  content?: string;
  /**
   * Whether the revision is minor.
   */
  minor?: boolean;
}
