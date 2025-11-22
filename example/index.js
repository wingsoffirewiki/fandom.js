import { Client } from "../dist/index.js";

// Replace with your credentials and wiki
// (Be cautious when running write operations on a live wiki)
//
// You can obtain bot credentials from the wiki's Special:BotPasswords page
// Example wiki: https://sonic.fandom.com
// Example Special:BotPasswords: https://sonic.fandom.com/wiki/Special:BotPasswords

const USERNAME = "YourBotUsername";
const PASSWORD = "YourBotPassword";

const client = new Client({
  host: "https://sonic.fandom.com",
  apiPath: "/api.php",
  cacheSize: 200,
});

// Event Listeners
client.events.on("ready", () => {
  console.log(`Logged in as ${USERNAME}! Client is ready.`);
});

client.events.on("pageFetched", (page) => {
  console.log(`Fetched page: ${page.title} (ID: ${page.pageid})`);
});

client.events.on("pageUpdate", (change) => {
  console.log(`[UPDATE] ${change.title} by ${change.user}`);
});

client.events.on("pageCreate", (change) => {
  console.log(`[CREATE] ${change.title} by ${change.user}`);
});

async function main() {
  try {
    // 1. Login
    console.log("Logging in...");
    await client.login(USERNAME, PASSWORD);

    // 2. Fetch a Page (Read)
    console.log("\n--- Fetching Page ---");
    const page = await client.pages.fetch("Sonic_the_Hedgehog");
    console.log(`Title: ${page.title}`);
    console.log(`Extract: ${page.extract?.substring(0, 100)}...`);
    console.log(`Content Length: ${page.content?.length ?? 0} chars`);
    console.log(`Categories: ${page.categories.join(", ")}`);

    // 3. Edit a Page (Write)
    // Note: Be careful running this on a real wiki!
    /*
    console.log("\n--- Editing Page ---");
    const sandbox = await client.pages.fetch("User:YourBotUsername/Sandbox");
    await sandbox.edit("Hello from fandom.js! Updated content.", "Testing edit");
    console.log("Sandbox edited!");
    */

    // 4. Page History
    console.log("\n--- Page History ---");
    const history = await page.fetchHistory();
    console.log(`Fetched ${history.length} revisions.`);
    if (history.length > 0) {
      console.log(
        `Latest revision by: ${history[0].user} at ${history[0].timestamp}`,
      );
    }

    // 5. User Info
    console.log("\n--- User Info ---");
    const user = await client.users.fetch("Sonic"); // Fetching a user named "Sonic" (if exists)
    console.log(`User: ${user.name} (ID: ${user.id})`);
    console.log(`Groups: ${user.groups.join(", ")}`);

    // 6. Advanced: Revert (Example)
    /*
    if (history.length > 1) {
        const previousRev = history[1];
        console.log(`Reverting to revision ${previousRev.revid}...`);
        await page.revertTo(previousRev.revid, "Reverting to previous version");
    }
    */

    // 7. Revisions
    console.log("\n--- Revisions ---");
    const recentChanges = await client.revisions.fetchRecent(5);
    console.log("Recent Changes:");
    recentChanges.forEach((rev) =>
      console.log(`- ${rev.title} by ${rev.user}`),
    );

    if (recentChanges.length > 0) {
      const rev = await client.revisions.fetch(recentChanges[0].revid);
      console.log(`Fetched specific revision: ${rev.revid} by ${rev.user}`);
    }

    // 8. Search
    console.log("\n--- Search ---");
    const searchResults = await client.search.search("Tails", 5);
    console.log("Search results for 'Tails':", searchResults);

    // 9. Categories
    console.log("\n--- Categories ---");
    const categoryMembers = await client.categories.fetchMembers(
      "Category:Characters",
      5,
    );
    console.log("Members of Category:Characters:");
    categoryMembers.forEach((page) => console.log(`- ${page.title}`));

    // 10. Meta
    console.log("\n--- Site Info ---");
    const siteInfo = await client.meta.fetchSiteInfo();
    console.log(`Site Name: ${siteInfo.general.sitename}`);
    console.log(`Wiki Version: ${siteInfo.general.generator}`);

    // 11. User Contributions
    console.log("\n--- User Contributions ---");
    const contribs = await client.users.fetchContributions("Sonic", 5);
    console.log("Contributions by Sonic:");
    contribs.forEach((c) => console.log(`- ${c.title} (${c.timestamp})`));
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();
