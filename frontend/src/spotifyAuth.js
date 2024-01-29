const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

export const initiateAuth = async () => {
    try {
        const codeVerifier = generateRandomString(64);
        const hashed = await sha256(codeVerifier);
        const codeChallenge = base64encode(hashed);
        
        const clientId = '16bb9bd16b4b44e1acebbf21d88dadf1';
        const redirectUri = 'http://localhost:3000';
        const scope = 'user-top-read';
        
        const authUrl = new URL("https://accounts.spotify.com/authorize");
        const params = {
            response_type: 'code',
            client_id: clientId,
            scope,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: redirectUri,
        };
        
        authUrl.search = new URLSearchParams(params).toString();
    
        window.localStorage.setItem('code_verifier', codeVerifier);
    
        window.location.href = authUrl.toString();
    } catch (error) {
        console.error('Error during authentication:', error);
    }
};

export const handleAuthRedirect = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        await getToken(code);
    } else {
        console.error("Couldn't get token");
    }
};

const getToken = async code => {
    const codeVerifier = localStorage.getItem('code_verifier');
    const clientId = '16bb9bd16b4b44e1acebbf21d88dadf1'; 
    const redirectUri = 'http://localhost:3000'; 

    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }),
    };
  
    const response = await fetch(tokenUrl, payload);
    if (!response.ok) {
        throw new Error(`Error fetching access token: ${response.statusText}`);
    }
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
};
