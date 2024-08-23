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
    const json_url = await scrapeJamJSONLink(entrieslink);
    const out = await analyzeAll(json_url, ratelink)
    
    return NextResponse.json(out, { status:200 })
}
