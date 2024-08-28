import { NextResponse } from 'next/server';

import { scrapeJamJSONLink, analyzeAll } from '@/lib/data';


type GetJamPageFormData = {
    ratelink:string,
    entriesLink:string
}

export async function GET(request:Request) {
    const { searchParams } = new URL(request.url);
    const ratelink = searchParams.get('ratelink') || null;
    const entrieslink = searchParams.get("entrieslink") || null;
    if (!ratelink || !entrieslink) {
        return NextResponse.json({error:"Invalid link"}, {status:400})
    }
    // console.log(entrieslink, ratelink)
    const {json_url, jamTitle, gameTitle, color, optionsData} = await scrapeJamJSONLink(entrieslink, ratelink);
    // console.log(json_url, jamTitle)
    const _out = await analyzeAll(json_url, ratelink, jamTitle, gameTitle, optionsData)
    const out = {color, ..._out}
    // console.log("DONE")

    return NextResponse.json(out, { status:200 })
}
