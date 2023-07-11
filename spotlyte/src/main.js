const clientId = "da486b65ccc64abdbe2bca52ec9392b6";
const redirectUri = "http://localhost:5713/callback";
const scope = "user-read-private user-read-email";

const params = new URLSearchParams(window.location.search);
const code = params.get('code');

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    populateUI(profile);

    const topTracks = await getTopTracks(accessToken);
    console.log(
        topTracks.map(({ name, artists }) =>
            `${name} by ${artists.map(artist => artist.name).join(', ')}`
        )
    );
}

async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", redirectUri);
    params.append("scope", scope);
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const base64Url = base64UrlEncode(new Uint8Array(digest));
    return base64Url;
}

function base64UrlEncode(arrayBuffer) {
    let base64 = btoa(String.fromCharCode(...arrayBuffer));
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return base64;
}

async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", verifier);

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
    });

    const { access_token } = await response.json();
    return access_token;
}

async function fetchProfile(accessToken) {
    const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });

    const profile = await response.json();
    return profile;
}

async function getTopTracks(accessToken) {
    const response = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5", {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });

    const data = await response.json();
    return data.items;
}

function populateUI(profile) {
    // Update UI with user profile data
    console.log(profile);
}
