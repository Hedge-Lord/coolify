const ss = require('simple-statistics')

const generateRatings = async () => {
    if (!window.localStorage.access_token) return null;
    const token = window.localStorage.access_token;
    const params = {
        headers: {
            Authorization: 'Bearer ' + token
        }
    }

    try {
        const topArtists = await getTopArtists(params);
        const topTracksAndFeatures = await getTopTracksAndFeatures(params);

        if (!topArtists) {
            window.localStorage.removeItem('access_token');
            window.location.reload();
        }

        const artistsRYM = await getRYMData(topArtists.items);

        // console.log(topArtists);
        // console.log(topTracksAndFeatures);

        const uniqueRating = await calculateUniqueness(topArtists.items, topTracksAndFeatures);
        const basedRating = await calculateBasedOnCriticRatings(artistsRYM);
        const expansiveRating = await calculateExpansiveness(artistsRYM, topArtists.items, topTracksAndFeatures);
        
        return { uniqueRating, basedRating, expansiveRating,
                finalRating: ss.mean([parseFloat(uniqueRating.finalScore), 
                                    parseFloat(basedRating.finalScore), 
                                    parseFloat(expansiveRating.finalScore)])
                                    .toFixed(1)
            };
    }
    catch(err) {
        return { uniqueRating: "???", basedRating: "???", expansiveRating: "???",
            finalRating: "???"
       };
    }
}

const getTopArtists = async (fetchParams) => {
    const URL = 'https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=5&offset=0'
    const res = await fetch(URL, fetchParams);
    if (!res.ok) return null;
    const artists = await res.json();
    return artists;
}   

const getTopTracks = async (fetchParams) => {
    const URL = 'https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5&offset=0'
    const res = await fetch(URL, fetchParams);
    if (!res.ok) return null;
    const tracks = await res.json();
    return tracks.items;
}

const getTopTracksAndFeatures = async (fetchParams) => {
    try {
        const tracks = await getTopTracks(fetchParams);
        if (!tracks || tracks.length === 0) return null;

        const ids = tracks.map(track => track.id).join(',');
        const featuresURL = `https://api.spotify.com/v1/audio-features?ids=${ids}`;
        const featuresRes = await fetch(featuresURL, fetchParams);

        if (!featuresRes.ok) throw new Error('Failed to fetch audio features');
        const featuresData = await featuresRes.json();

        const combinedData = tracks.map(track => {
            return {
                ...track,
                audio_features: featuresData.audio_features.find(feature => feature.id === track.id),
            };
        });

        return combinedData;
    } catch (error) {
        console.error('Error fetching tracks and features:', error);
        return null;
    }
}

const getRYMData = async (artists) => {
    const result = [];
    for (const artist of artists) {
        const res = await fetch("http://127.0.0.1:5000/artists/" + artist.name, {mode: "cors"})
        if (!res.ok) {
            console.log("Error fetching from scraper API");
            return null;
        }
        const artistData = await res.json();
        if (artistData && typeof(artistData) !== 'object') continue;

        artistData.albums = artistData.albums.map(album => {
            return {
                title: album[0],
                rating: album[1] ? parseFloat(album[1]) : null,
                numRatings: album[2] ? parseInt(album[2].replace(/,/g, '')) : 0
            };
        });
        artistData.name = artist.name;
        result.push(artistData);
    }
    console.log(result);
    return result;
}

const calculateUniqueness = async (artists, tracks) => {
    if (!artists || !tracks) {
        console.log("Error in calculating uniqueness: Artists or tracks are null");
        return null;
    }
    const popularityScoresArtists = artists.map(artist => artist.popularity);
    const popularityScoresTracks = tracks.map(track => track.popularity);
    const popularityScores = [...popularityScoresArtists, ...popularityScoresTracks];

    // get most popular and least popular
    const mostPopular = artists.reduce((curMax, cur) => {
        return (curMax && curMax.popularity > cur.popularity) ? curMax : cur;
    })
    const mostObscure = artists.reduce((curMin, cur) => {
        return (curMin && curMin.popularity < cur.popularity) ? curMin : cur;
    })
    const range = mostPopular.popularity - mostObscure.popularity;

    console.log(popularityScores);

    const artistRange = {
        obscure: {
            popularity: mostObscure.popularity,
            name: mostObscure.name
        }, 
        popular: {
            popularity: mostPopular.popularity,
            name: mostPopular.name
        }};

    const filledBuckets = [false, false, false];
    popularityScores.forEach(score => {
        if (score < 40) filledBuckets[0] = true;
        else if (score < 72) filledBuckets[1] = true;
        else filledBuckets[2] = true;
    })
    const bucketCount = filledBuckets.filter(bucket => bucket).length;

    const stdev = ss.standardDeviation(popularityScores);

    // score calculation 
    let stdevScore = stdev / 20 * 100;
    let bucketScore = 60;
    if (bucketCount == 1) bucketScore = 60;
    else if (bucketCount == 2) bucketScore = 80;
    else bucketScore = 100;
    if (stdevScore > 100) stdevScore = 100;
    let rangeScore = range;
    if (rangeScore > 100) rangeScore = 100;
    const finalScore = ss.mean([stdevScore, bucketScore, rangeScore]).toFixed(1);

    // console.log([stdevScore, bucketScore, rangeScore]);

    return {finalScore, range, artistRange};
}

const calculateBasedOnCriticRatings = async (artists) => {
    if (!artists) {
        console.log("Error in calculating critic ratings: Artists is null");
        return null;
    }

    const consideredArtists = [];

    for (const artistData of artists) {
        const consideredRatings = []
        for (const album of artistData.albums) 
            if (album.numRatings > 100) consideredRatings.push(album); 
        
        if (!consideredRatings.length) continue;
        const maxRatedAlbum = consideredRatings.reduce((maxAlbum, currentAlbum) => {
            return (maxAlbum && maxAlbum.rating > currentAlbum.rating) ? maxAlbum : currentAlbum;
        });
        
        if (maxRatedAlbum) consideredArtists.push({
            name: artistData.name,
            maxRating: maxRatedAlbum.rating
        });
    }

    if (!consideredArtists.length) {
        return {
            finalScore: "110",
            bestArtist: {
                name: "???",
                maxRating: "???"
            }
        }
    }
    const avgMaxRating = consideredArtists.reduce((acc, current) => acc + current.maxRating, 0) / consideredArtists.length;
    const bestArtist = consideredArtists.reduce((best, cur) => best && best.maxRating > cur.maxRating ? best : cur);

    let finalScore = avgMaxRating / 4.3 * 100;
    if (finalScore > 100) finalScore = 100;
    finalScore = finalScore.toFixed(1);

    return {
        finalScore,
        bestArtist
    };
}

const calculateExpansiveness = async (artistsRYM, artistsSpotify, tracks) => {
    let countries = [...(new Set(artistsRYM.map(artist => artist.country)))];
    const genres = {};
    let genreTokenCount = 0;
    for (const artist of artistsRYM) {
        for (const g of artist.genres) {
            for (const token of g.split(/\s+/).map(s => s.toLowerCase())) {
                if (token.length < 3) continue;
                if (genres[token] === undefined) genres[token] = 1;
                else genres[token] += 1;
                genreTokenCount += 1;
            }
        }
    }
    for (const artist of artistsSpotify) {
        for (const g of artist.genres) {
            for (const token of g.split(/\s+/)) {
                if (token.length < 3) continue;
                if (genres[token] === undefined) genres[token] = 1;
                else genres[token] += 1;
                genreTokenCount += 1;
            }
        }
    }

    const years = tracks.map(track => parseInt(track.album.release_date.split("-")[0]));
    const buckets = [false, false, false, false];
    for (const year of years) {
        if (year < 1970) buckets[0] = true;
        else if (year < 1990) buckets[1] = true;
        else if (year < 2007) buckets[2] = true;
        else buckets[3] = true;
    }
    const bucketCount = buckets.filter(bucket => bucket).length;

    const yearsInfo = {
        avg: ss.mean(years),
        stdev: ss.standardDeviation(years),
        range: Math.max(...years) - Math.min(...years),
        bucketCount
    }

    let countryScore = countries.length / artistsSpotify.length * 100;
    if (countryScore > 100) countryScore = 100;

    let stdevScore = yearsInfo.stdev / 16 * 100;
    let bucketScore = 60;
    if (bucketCount == 1) bucketScore = 50;
    else if (bucketCount == 2) bucketScore = 70;
    else if (bucketCount == 3) bucketScore = 90;
    else bucketScore = 100;
    if (stdevScore > 100) stdevScore = 100;
    let rangeScore = yearsInfo.range + 40;
    if (rangeScore > 100) rangeScore = 100;

    let yearsScore = ss.mean([stdevScore, bucketScore, rangeScore]);

    console.log(Object.keys(genres).length, genreTokenCount)
    let genreScore = Object.keys(genres).length / genreTokenCount * 100;
    if (genreScore > 100) genreScore = 100;

    // console.log(countryScore, yearsScore, genreScore);

    const finalScore = ss.mean([countryScore, yearsScore, genreScore]).toFixed(1);

    return {yearsInfo, countries, yearsScore, countryScore, genreScore, finalScore};
}

export default generateRatings;
