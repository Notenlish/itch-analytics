
export type JamGame = {
    rating_count: number,
    created_at: string,
    id: number,
    url: string,
    coolness: number,
    game: {
        title: string,
        url: string,
        user: {
            url: string,
            id: number,
            name: string
        },
        id: number,
        cover: string,
        short_text: string,
        cover_color: string,
        platforms: string[]
    },
    // what is this?
    field_responses: string[]
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
}
