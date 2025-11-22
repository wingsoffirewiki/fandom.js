/**
 * Represents general site information.
 */
export interface GeneralSiteInfo {
  /**
   * The main page of the wiki.
   */
  mainpage: string;
  /**
   * The base URL of the wiki.
   */
  base: string;
  /**
   * The name of the site.
   */
  sitename: string;
  /**
   * The URL of the logo.
   */
  logo: string;
  /**
   * The generator used by the wiki.
   */
  generator: string;
  /**
   * The PHP version.
   */
  phpversion: string;
  /**
   * The PHP SAPI.
   */
  phpsapi: string;
  /**
   * The database type.
   */
  dbtype: string;
  /**
   * The database version.
   */
  dbversion: string;
  /**
   * Whether image whitelist is enabled.
   */
  imagewhitelistenabled: string;
  /**
   * Language conversion settings.
   */
  langconversion: string;
  /**
   * Title conversion settings.
   */
  titleconversion: string;
  /**
   * Link prefix charset.
   */
  linkprefixcharset: string;
  /**
   * Link prefix.
   */
  linkprefix: string;
  /**
   * Link trail.
   */
  linktrail: string;
  /**
   * Legal title characters.
   */
  legaltitlechars: string;
  /**
   * Invalid username characters.
   */
  invalidusernamechars: string;
  /**
   * Fix Arabic unicode.
   */
  fixarabicunicode: string;
  /**
   * Fix Malayalam unicode.
   */
  fixmalayalamunicode: string;
  /**
   * Case sensitivity.
   */
  case: string;
  /**
   * Language code.
   */
  lang: string;
  /**
   * Fallback languages.
   */
  fallback: {
    code: string;
  }[];
  /**
   * Fallback 8-bit encoding.
   */
  fallback8bitEncoding: string;
  /**
   * Whether write API is enabled.
   */
  writeapi: string;
  /**
   * Maximum article size.
   */
  maxarticlesize: number;
  /**
   * Timezone.
   */
  timezone: string;
  /**
   * Time offset.
   */
  timeoffset: number;
  /**
   * Article path.
   */
  articlepath: string;
  /**
   * Script path.
   */
  scriptpath: string;
  /**
   * Script URL.
   */
  script: string;
  /**
   * Variant article path.
   */
  variantarticlepath: string;
  /**
   * Server URL.
   */
  server: string;
  /**
   * Server name.
   */
  servername: string;
  /**
   * Wiki ID.
   */
  wikiid: string;
  /**
   * Current time.
   */
  time: string;
  /**
   * Miser mode.
   */
  misermode: string;
  /**
   * Whether uploads are enabled.
   */
  uploadsenabled: string;
  /**
   * Maximum upload size.
   */
  maxuploadsize: number;
  /**
   * Minimum upload chunk size.
   */
  minuploadchunksize: number;
  /**
   * Gallery options.
   */
  galleryoptions: {
    imagesPerRow: number;
    imageWidth: number;
    imageHeight: number;
    captionLength: number;
    showBytes: string;
    showDimensions: string;
    mode: string;
  };
  /**
   * Thumbnail limits.
   */
  thumblimits: number[];
  /**
   * Image limits.
   */
  imagelimits: {
    width: number;
    height: number;
  }[];
  /**
   * Favicon URL.
   */
  favicon: string;
  /**
   * Central ID.
   */
  centralid: string;
  /**
   * All central IDs.
   */
  allcentralids: Record<string, string>;
}

/**
 * Represents namespace information.
 */
export interface NamespaceInfo {
  /**
   * The ID of the namespace.
   */
  id: number;
  /**
   * Case sensitivity.
   */
  case: string;
  /**
   * Canonical name.
   */
  canonical?: string;
  /**
   * Local name.
   */
  "*": string;
  /**
   * Subpages enabled.
   */
  subpages?: string;
  /**
   * Content namespace.
   */
  content?: string;
  /**
   * Non-includable.
   */
  nonincludable?: string;
}

/**
 * Represents site statistics.
 */
export interface SiteStatistics {
  /**
   * Total pages.
   */
  pages: number;
  /**
   * Total articles.
   */
  articles: number;
  /**
   * Total edits.
   */
  edits: number;
  /**
   * Total images.
   */
  images: number;
  /**
   * Total users.
   */
  users: number;
  /**
   * Active users.
   */
  activeusers: number;
  /**
   * Admins.
   */
  admins: number;
  /**
   * Job queue length.
   */
  jobs: number;
}

/**
 * Represents site information.
 */
export interface SiteInfo {
  /**
   * General site information.
   */
  general: GeneralSiteInfo;
  /**
   * Namespace information.
   */
  namespaces: Record<string, NamespaceInfo>;
  /**
   * Site statistics.
   */
  statistics: SiteStatistics;
  /**
   * Allow other properties.
   */
  [key: string]: unknown;
}
