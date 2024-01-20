import React, { useEffect, useState } from 'react';
import { initiateAuth, handleAuthRedirect } from './spotifyAuth';

function App() {
    const [data, setData] = useState([]);

    const firstBackendQueryWithSpotifyAuth = async () => {
        if (!window.localStorage.access_token) return null;

        const token = window.localStorage.access_token;
        const URL = 'https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=5&offset=0'
        const response = await fetch(URL, {
            headers: {
                Authorization: 'Bearer ' + token
            }
        });
        console.log(response);
    
        const spotifyData = await response.json();
        console.log(spotifyData);
        for (let i = 0; i < spotifyData.items.length; i++) {
            const artistName = spotifyData.items[i].name; 
            const albumRatingsResponse = await fetch("http://127.0.0.1:5000/artists/" + artistName);
            const albumRatingsData = await albumRatingsResponse.json();
            console.log(albumRatingsData, data);
            setData(prevData => [...prevData, albumRatingsData]);
        }
    }

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            handleAuthRedirect()
                .then(() => {

                })
                .catch(error => {
                    console.error('Error during authentication:', error);
                });
        } else {
            console.log("error")
        }
    }, []);

    const handleLogin = () => {
        initiateAuth();
    };

    return (
        <>
            <button onClick={handleLogin}>Login with Spotify Auth</button>
            <button onClick={firstBackendQueryWithSpotifyAuth}> How cool is your top artist? </button>
            <p>Hello World!</p>
            {data && (<pre>{JSON.stringify(data, null, 2)}</pre>)}
        </>
    );
}

export default App;
