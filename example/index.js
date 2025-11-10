import { Client } from "fandom.js";

const client = new Client({
  host: "https://sonic.fandom.com",
  cacheSize: 200,
});

client.events.on("ready", () => console.log("client ready"));
client.events.on("pageFetched", (p) => console.log("got page", p.title));

await client.onReady();

const page = await client.fetchPage("Sonic_The_Hedgehog");
console.log(page.title);
console.log(page.extract);
