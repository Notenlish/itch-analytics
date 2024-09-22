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
  const jamName = searchParams.get("jamname") || null;
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
  addUrl(url);

  const headers = new Headers();
  headers.set("Cache-Control", "no-cache");

  return NextResponse.json(out, { status: 200, headers: headers });
}
