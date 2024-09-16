import { sql } from "@vercel/postgres";

export async function addUrl(url: string) {
  try {
    if (url.length > 1024) {
      throw new Error("URL too long");
    }
    const lastModified = new Date().toUTCString();
    const createdAt = new Date().toUTCString();

    await sql`INSERT INTO itch_analytics_urls (createdAt, lastmodified, url)
        VALUES (${createdAt}, ${lastModified}, ${url})
        ON CONFLICT (url) DO NOTHING;`;
    console.log(`added ${url} url.`);
  } catch (e) {
    console.error(e);
  }
}

export async function getAllUrls() {
  try {
    const data = await sql`SELECT * FROM itch_analytics_urls`;
    return data;
  } catch (error) {
    console.error(error);
  }
}
