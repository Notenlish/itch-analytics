const { db } = require("@vercel/postgres");

async function initUrlTable(client) {
  try {
    // 1024 in case a maniac has a really long game name
    await client.sql`CREATE TABLE IF NOT EXISTS itch_analytics_urls (
      id SERIAL PRIMARY KEY,
      lastmodified TIMESTAMP NOT NULL,
      createdAt TIMESTAMP NOT NULL,
      url VARCHAR(1024) UNIQUE
    );`;
    console.log("initted itch_analytics_urls table");
  } catch (error) {
    console.error(error);
  }
}

async function truncateTable(client) {
  try {
    await client.sql`TRUNCATE TABLE itch_analytics_urls`;
    console.log("truncated itch_analytics_urls");
  } catch (e) {
    console.error(e);
  }
}

async function dropTable(client) {
  try {
    await client.sql`DROP TABLE IF EXISTS itch_analytics_urls`;
    console.log("dropped");
  } catch (error) {
    console.error(error);
  }
}

async function main() {
  console.log("connecting...");
  const client = await db.connect();
  console.log("connected");

  await truncateTable(client);
  // await initUrlTable(client);

  await client.end();
  console.log("done.");
}

main();
