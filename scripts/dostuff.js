"use strict";

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

async function getRidOfRandomInURLS(client) {
  try {
    const data = await client.sql`SELECT * FROM itch_analytics_urls`;

    await Promise.all(
      data["rows"].map(async (e) => {
        if (e.url.includes("?random=")) {
          // Find the position of "?random=" and slice the unwanted part.
          let left = e.url.indexOf("?random=");
          let ucube = e.url.slice(left);
          let right = ucube.indexOf("/");

          if (right !== -1) {
            ucube = ucube.slice(0, right);
          }

          // Create the new URL by replacing the random part.
          const newURL = e.url.replace(ucube, "");
          console.log(`Old: ${e.url} - NEW: ${newURL}`);

          // Update the database using a parameterized query
          const response = await client.sql`
            UPDATE itch_analytics_urls
            SET url = ${newURL}
            WHERE id = ${e.id}
            ON CONFLICT (url) DO NOTHING
          `;
          // do update yapıyoruz çünkü url unique olması lazım. ve şimdi ben bu malca ?normal= url hatasını pushladıktan önce zaten bazı urller kayıtlıydı, yani aynı urlnin hem corrupted hem de non corrupted versiyonları var şuan, collision varsa direkten ignore et.
          console.log(response);
        }
      })
    );
  } catch (e) {
    console.error(e);
  }
}

async function removeRandomCollisionBecauseOfMyStupidity(client) {
  try {
    await client.sql`DELETE FROM itch_analytics_urls WHERE LOWER(url) LIKE '%?random=%'`;
  } catch (error) {
    console.error(error);
  }
}

// ----------------------------- //

async function main() {
  console.log("connecting...");
  const client = await db.connect();
  console.log("connected");

  // await getRidOfRandomInURLS(client);
  await removeRandomCollisionBecauseOfMyStupidity(client);
  // await truncateTable(client);
  // await initUrlTable(client);

  await client.end();
  console.log("done.");
}

main();
