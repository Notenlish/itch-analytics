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


export type JamGame = {
    rating_count: number,
    coolness: number,
    url: string,
    created_at?: string,
    id?: number,
    game?: {
        title?: string,
        url?: string,
        user?: {
            url?: string,
            id?: number,
            name?: string
        },
        id?: number,
        cover?: string,
        short_text?: string,
        cover_color?: string,
        platforms?: string[]
    },
    // what is this?
    field_responses?: string[]
}

export type GraphBarPoint = {
    percentile: number,  // 5, 10, 50, 95 etc.
    rating: number,
    karma: number,
    name: string,
}

export type JamGraphData = {
    smallestRating: number,
    biggestRating: number,
    medianRating: number,
    meanRating: number,
    variance: number,
    standardDeviation:number,
    kurtosis:number,
    skewness:number,
    points: GraphBarPoint[],
    smolRatings: number[],
    numGames: number,
    ratedGame: JamGame,
    ratedGamePercentile:number,
    jamTitle: string,
}
