const fetch = globalThis.fetch;
require('dotenv').config({ path: '.env.local' });

async function test() {
    const res = await fetch('https://v3.football.api-sports.io/transfers?team=492', { // Napoli id in API is 492
        headers: {
            'x-rapidapi-host': 'v3.football.api-sports.io',
            'x-apisports-key': process.env.RAPIDAPI_KEY
        }
    });
    const data = await res.json();
    console.log(JSON.stringify(data.response?.slice(0, 5), null, 2));
}

test();
