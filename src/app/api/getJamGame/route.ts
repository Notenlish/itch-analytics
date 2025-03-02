import { NextResponse } from "next/server";

import { scrapeJamJSONLink, analyzeAll } from "@/lib/data";
import { addUrl as addUrlToDB } from "@/lib/db";

type GetJamPageFormData = {
  ratelink: string;
  entriesLink: string;
};

// wait, im not catching this???
// does this mean that the cache problem is at data.ts?

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // https://itch.io/jam/gmtk-2024/rate/2913552
  const ratelink = searchParams.get("ratelink") || null;

  const rateID = ratelink?.split("/rate/")[1];

  const entrieslink = searchParams.get("entrieslink") || null;
  let jamName = searchParams.get("jamname") || null;
  if (!jamName) {
    return NextResponse.json({ error: "Invalid Jam Name" }, { status: 400 });
  }
  jamName = jamName?.split("?")[0]; // get rid of the ?random=1231251.15133 part

  // I assume this was to make the code not use the cache?? or something?? idk.
  const random = searchParams.get("random") || null;
  console.log(`Got random with: ${random}`);

  if (!ratelink || !entrieslink) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  const { json_url, jamTitle, gameTitle, color, optionsData } = await scrapeJamJSONLink(
    entrieslink,
    ratelink
  );
  const _out = await analyzeAll(json_url, ratelink, jamTitle, gameTitle, optionsData);
  const out = { color, ..._out };

  const url = `/jam/${jamName}/${rateID}`;

  if (!process.env.NEXT_PUBLIC_IS_DEV) {
    // not running in dev, so add url to db.
    addUrlToDB(url);
  }

  // Use the past content, but always check with the server to get the most up-to-date data.
  const headers = new Headers();
  headers.set("Cache-Control", "no-cache");

  return NextResponse.json(out, { status: 200, headers: headers });
}
