import { NextResponse } from 'next/server';

import { scrapeJamJSONLink, analyzeAll } from '@/lib/data';
import { addUrl } from '@/lib/db';

type GetJamPageFormData = {
    ratelink:string,
    entriesLink:string
}

export async function GET(request:Request) {
    const { searchParams } = new URL(request.url);
    const ratelink = searchParams.get('ratelink') || null;
    const entrieslink = searchParams.get("entrieslink") || null;
    const jamname = searchParams.get("jamname") || null;

    let parsedJamName = jamname?.slice(0, jamname.length - 1)

    if (!ratelink || !entrieslink) {
        return NextResponse.json({error:"Invalid link"}, {status:400})
    }
    // console.log(entrieslink, ratelink)
    const {json_url, jamTitle, gameTitle, color, optionsData} = await scrapeJamJSONLink(entrieslink, ratelink);
    // console.log(json_url, jamTitle)
    const _out = await analyzeAll(json_url, ratelink, jamTitle, gameTitle, optionsData)
    const out = {color, ..._out}

    // reconstructing url in api
    // sounds like a good idea
    const url = `/jam/${parsedJamName}?ratelink=${ratelink}&entrieslink=${entrieslink}?jamname=${parsedJamName}`
    addUrl(url)
    return NextResponse.json(out, { status:200 })
}
