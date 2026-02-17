import { sql } from "@vercel/postgres";



export async function getAllUrls() {
  try {
    const data = await sql`SELECT * FROM itch_analytics_urls`;
    return data;
  } catch (error) {
    console.error(error);
  }
}
