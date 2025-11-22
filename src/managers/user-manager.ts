import { BaseManager } from "./base-manager.js";
import { User } from "../structures/user-structure.js";
import { LRUCache } from "lru-cache";
import type { Client } from "../client/client.js";
import type {
  QueryParams,
  APIUser,
  UserContribution,
  APIResponse,
} from "../types/index.js";

/**
 * Manager for handling user-related operations.
 */
export class UserManager extends BaseManager {
  /**
   * Cache for storing fetched users.
   * @private
   */
  private cache: LRUCache<string, User>;

  /**
   * Creates a new instance of the UserManager.
   * @param client - The client instance.
   */
  constructor(client: Client) {
    super(client);
    this.cache = new LRUCache<string, User>({
      max: this.client.options.cacheSize ?? 100,
    });
  }

  /**
   * Fetches a user by their username or ID.
   * @param usernameOrID - The username or ID of the user to fetch.
   * @returns A Promise that resolves to the fetched User.
   * @throws {Error} If the user is not found.
   */
  public async fetch(usernameOrID: string | number): Promise<User> {
    const key = `user:${usernameOrID}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const params: QueryParams = {
      action: "query",
      list: "users",
      usprop: "groups|registration",
      format: "json",
    };

    if (typeof usernameOrID === "number") {
      params.usids = usernameOrID;
    } else {
      params.ususers = usernameOrID;
    }

    const res =
      await this.client.requestManager.get<APIResponse<{ users: APIUser[] }>>(
        params,
      );
    const user = res?.query?.users?.[0];

    if (!user || "missing" in user) {
      throw new Error("User not found");
    }

    const userObj = new User(this.client, user);
    this.cache.set(key, userObj);
    return userObj;
  }

  /**
   * Fetches contributions for a specific user.
   * @param username - The username to fetch contributions for.
   * @param limit - The maximum number of contributions to fetch. Defaults to 10.
   * @returns A Promise that resolves to an array of UserContribution objects.
   */
  public async fetchContributions(
    username: string,
    limit: number = 10,
  ): Promise<UserContribution[]> {
    const res = await this.client.requestManager.get<
      APIResponse<{ usercontribs: UserContribution[] }>
    >({
      action: "query",
      list: "usercontribs",
      ucuser: username,
      uclimit: limit,
      format: "json",
    });

    return res?.query?.usercontribs || [];
  }
}
