import { number } from "zod";

export let minute = 60
export let hour = minute * 60
export let day = hour * 24
export let week = day * 7;
export let month = day * 30;
export let year = day * 365;

if (process.env.NEXT_PUBLIC_IS_DEV) {
    const v = 1;
    minute = v;
    hour = v;
    day = v;
    week = v;
    month = v;
    year = v;
    console.log("RESET CACHE TIMERS TO 1 SECOND BECAUSE DEVELOPER MODE.")
}


// jam games with some useless data.
export type RawJamGame = {
    coolness: number,
    // Stores how people have responded to the jam submit questions
    // eg: how many hours you used: 48/96
    field_responses?: string[]
    created_at: string,
    rating_count: number,
    url: string,
    id?: number,  // will be deleted //
    game: {
        title: string,
        id?: number,  // will be deleted //
        cover?: string,  // will be deleted //
        url? : string,  // will be deleted //
        user?: {  // will be deleted // 
            url?: string,  // will be deleted //
            id?: number,  // will be deleted //
            name?: string  // will be deleted // 
        },
        // itch may or may not have it
        short_text?: string,
        gif_cover?:string,
        cover_color?: string,
        platforms?: string[]
    },
    contributors?: {  // will be deleted //
        name:string,
        url:string
    }[]
}

export type ParsedJamGame = {
    coolness: number,
    // Stores how people have responded to the jam submit questions
    // eg: how many hours you used: 48/96
    field_responses?: string[]
    created_at: string,
    rating_count: number,
    url: string,
    game: {
        title: string,
        short_text?: string,
        gif_cover?:string,
        cover_color?: string,
        platforms?: string[]
    },
    team_size: number
}
export type MinifiedJamGame = {
    a: number, // coolness
    b?: string[]  // field_responses
    c: string,  // created_at
    d: number,  // rating_count
    e: string,  // url
    f: { // game
        g: string,  // title
        l?: string,  // short_text
        m?:string,  // gif_cover
        n?: string,  // cover_color
        o?: string[]  // platforms
    },
    p: number  // team_size
}

export type GraphBarPoint = {
    percentile: number,  // 5, 10, 50, 95 etc.
    rating: number,
    coolness: number,
    name: string,
}

export type JamGraphData = {
    smallestRating: number,
    biggestRating: number,
    smallestKarma: number,
    highestKarma:number,
    medianRating: number,
    meanRating: number,
    meanKarma:number,
    medianKarma:number,
    variance: number,
    standardDeviation:number,
    kurtosis:number,
    skewness:number,
    points: GraphBarPoint[],
    numGames: number,
    ratedGame: ParsedJamGame,
    ratedGamePercentile:number,
    jamTitle: string,
    color?:string,
    PlatformPieData:PlatformPieChartData[]
}

export type JsonEntryData = {
    minifiedGames:MinifiedJamGame[],
    sortedRatings:number[],
    KarmaByRating:number[],
    numGames:number,
    medianRating:number,
    meanRating:number,
    medianKarma:number,
    meanKarma:number,
    variance:number,
    standardDeviation:number,
    kurtosis:number,
    skewness:number,
    points:GraphBarPoint[],
    PlatformPieData:PlatformPieChartData[]
}

export type PlatformPieChartData = {
    platform: string;
    count: any;
    fill: string;
}

