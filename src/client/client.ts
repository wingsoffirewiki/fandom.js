import { RequestManager } from "../request/request-manager.js";
import { PageManager } from "../managers/page-manager.js";
import { UserManager } from "../managers/user-manager.js";
import { EventManager } from "../managers/event-manager.js";
import { RevisionManager } from "../managers/revision-manager.js";
import { SearchManager } from "../managers/search-manager.js";
import { CategoryManager } from "../managers/category-manager.js";
import { MetaManager } from "../managers/meta-manager.js";
import type { ClientOptions } from "../types/index.js";
import { TokenType } from "../enums/index.js";
import { DEFAULT_API_PATH, USER_AGENT } from "../package-constants.js";

/**
 * The main client class for interacting with the Fandom API.
 */
export class Client {
  /**
   * The options for the client.
   */
  public options: ClientOptions;
  /**
   * The event manager for handling wiki events.
   */
  public events: EventManager;
  /**
   * The request manager for handling API requests.
   * @internal
   */
  public requestManager: RequestManager;
  /**
   * The manager for interacting with pages.
   */
  public pages: PageManager;
  /**
   * The manager for interacting with users.
   */
  public users: UserManager;
  /**
   * The manager for interacting with revisions.
   */
  public revisions: RevisionManager;
  /**
   * The manager for searching the wiki.
   */
  public search: SearchManager;
  /**
   * The manager for interacting with categories.
   */
  public categories: CategoryManager;
  /**
   * The manager for retrieving wiki metadata.
   */
  public meta: MetaManager;

  /**
   * Creates a new instance of the Client.
   * @param options - The options for the client.
   */
  constructor(options: ClientOptions) {
    this.options = {
      apiPath: DEFAULT_API_PATH,
      userAgent: USER_AGENT,
      maxRetries: 3,
      cacheSize: 100,
      polling: true,
      ...options,
    };
    this.events = new EventManager(this);
    this.requestManager = new RequestManager({
      baseURL: this.options.host,
      apiPath: this.options.apiPath,
      userAgent: this.options.userAgent,
      maxRetries: this.options.maxRetries,
    });
    this.pages = new PageManager(this);
    this.users = new UserManager(this);
    this.revisions = new RevisionManager(this);
    this.search = new SearchManager(this);
    this.categories = new CategoryManager(this);
    this.meta = new MetaManager(this);
  }

  /**
   * Logs in to the wiki.
   * @param username - The username to login with.
   * @param password - The password to login with.
   * @throws {Error} If the login fails.
   */
  public async login(username?: string, password?: string) {
    if (username && password) {
      const loginToken = await this.requestManager.fetchToken(TokenType.Login);
      const res = await this.requestManager.post<{
        login: { result: string; reason?: string };
      }>({
        action: "login",
        lgname: username,
        lgpassword: password,
        lgtoken: loginToken,
        format: "json",
      });

      if (res.login?.result === "Failed") {
        throw new Error(`Login failed: ${res.login.reason}`);
      }
    }
    await this.onReady();
  }

  /**
   * Called when the client is ready.
   * Emits the 'ready' event and starts polling if enabled.
   */
  public async onReady() {
    this.events.emit("ready");
    if (this.options.polling) {
      this.events.startPolling();
    }
  }
}
