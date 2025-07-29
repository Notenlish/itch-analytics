import type { MetadataRoute } from "next";
import { getAllUrls } from "@/lib/db";
import { unstable_noStore } from "next/cache";

type CustomUrl = {
  id: number;
  lastmodified: Date;
  createdat: Date;
  url: string;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  unstable_noStore(); // DONT CACHE IT.

  const result = await getAllUrls();
  // @ts-ignore
  const data: CustomUrl[] = result.rows;
  console.log("DATA IS", data);

  const base = process.env.BASE_URL;
  let urls = [
    {
      url: "/",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    /*
    {
      url: "/jam/",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    */
  ];

  /*
  // Add URLs from the database
  data.forEach((obj) => {
    const escapedUrl = obj.url.replace(/&/g, "&amp;");
    urls.push({
      url: escapedUrl,
      priority: 0.6,
      lastModified: obj.lastmodified,
      changeFrequency: "monthly",
    });
  });
  */

  // Format URLs and return
  const out = urls.map((obj) => {
    const _url = obj.url.endsWith("/") ? obj.url.slice(0, obj.url.length - 1) : obj.url;
    const url = `${base}${_url}`;
    return { ...obj, url };
  }) as MetadataRoute.Sitemap;

  console.log("OUT IS", out);

  return out;
}
