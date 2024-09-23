import { NextResponse } from "next/server";

import { scrapeJamJSONLink, analyzeAll } from "@/lib/data";
import { addUrl } from "@/lib/db";

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

  const random = searchParams.get("random") || null;

  console.log(`Got random with: ${random}`);

  if (!ratelink || !entrieslink) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }
  // console.log(entrieslink, ratelink)
  const { json_url, jamTitle, gameTitle, color, optionsData } = await scrapeJamJSONLink(
    entrieslink,
    ratelink
  );
  // console.log(json_url, jamTitle)
  const _out = await analyzeAll(json_url, ratelink, jamTitle, gameTitle, optionsData);
  const out = { color, ..._out };

  // reconstructing url in api
  // sounds like a good idea, what could go wrong.
  const url = `/jam/${jamName}/${rateID}`;
  // why am I not checking if its localhost :cry:
  if (!process.env.NEXT_PUBLIC_IS_DEV) {
    // not running in localhost, so add url.
    addUrl(url);
  }

  // probably this isnt the correct way
  const headers = new Headers();
  headers.set("Cache-Control", "no-cache");

  return NextResponse.json(out, { status: 200, headers: headers });
}
