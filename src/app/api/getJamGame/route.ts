import { NextResponse } from "next/server";

import { scrapeJamJSONLink, analyzeAll } from "@/lib/data";
import { addUrl } from "@/lib/db";

type GetJamPageFormData = {
  ratelink: string;
  entriesLink: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // https://itch.io/jam/gmtk-2024/rate/2913552
  const ratelink = searchParams.get("ratelink") || null;

  const rateID = ratelink?.split("/rate/")[1];

  const entrieslink = searchParams.get("entrieslink") || null;
  const jamName = searchParams.get("jamname") || null;

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
  return NextResponse.json(out, { status: 200 });
}
