// Triggera un nuovo deploy su Vercel tramite API REST
const https = require('https');

// Token OIDC da .env.local (token di servizio Vercel)
const TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im1yay00MzAyZWMxYjY3MGY0OGE5OGFkNjFkYWRlNGEyM2JlNyJ9.eyJpc3MiOiJodHRwczovL29pZGMudmVyY2VsLmNvbS9sdWNhcGluZWxsaTAwMDAtMjIzM3MtcHJvamVjdHMiLCJzdWIiOiJvd25lcjpsdWNhcGluZWxsaTAwMDAtMjIzM3MtcHJvamVjdHM6cHJvamVjdDp3ZWJhcHA6ZW52aXJvbm1lbnQ6ZGV2ZWxvcG1lbnQiLCJzY29wZSI6Im93bmVyOmx1Y2FwaW5lbGxpMDAwMC0yMjMzcy1wcm9qZWN0czpwcm9qZWN0OndlYmFwcDplbnZpcm9ubWVudDpkZXZlbG9wbWVudCIsImF1ZCI6Imh0dHBzOi8vdmVyY2VsLmNvbS9sdWNhcGluZWxsaTAwMDAtMjIzM3MtcHJvamVjdHMiLCJvd25lciI6Imx1Y2FwaW5lbGxpMDAwMC0yMjMzcy1wcm9qZWN0cyIsIm93bmVyX2lkIjoidGVhbV9HdVF0V1UyWGN6d3oxYXJOaFpuVXNvWlciLCJwcm9qZWN0Ijoid2ViYXBwIiwicHJvamVjdF9pZCI6InByal9GcEo0UVBOR0lmMDlDV285V2V6dXIyTjFQY1pTIiwiZW52aXJvbm1lbnQiOiJkZXZlbG9wbWVudCIsInBsYW4iOiJob2JieSIsInVzZXJfaWQiOiJkVXg3T080eVhaaVFNb2UxekQ4RzNnU24iLCJjbGllbnRfaWQiOiJjbF9IWXlPUEJOdEZNZkhoYVVuOUw0UVBmVFp6NlRQNDdicCIsIm5iZiI6MTc4NDQ1NzM4MCwiaWF0IjoxNzg0NDU3MzgwLCJleHAiOjE3ODQ1MDA1ODB9.UgAwEK7g5yoJRq7hneMzS4K-8HeN857sgGvUx9FmM14_ACgvxsawmYGo3kjQ6McOGPNv_LvrOyQgBP2K0uraO7Q8nECBycEQxNETze_Wt477lVA0qE49RnMMqToA6sExVfBzHBUDJk3jR9uTvB7YrqvxytU6jO33iLPxIZ3J7T9XgggA0GiebEoJW2DAvhzHM6xYt-PxZpUIB9qyfo6j5lY4_Hgd1GJ4mJoIbkmLgBuLZcX5lFlu06i6jZJyp39vCvxLTsRmT28omLZZ1hTbgdD43jDHbJ20YD-uDATtbqeodyLAt5YhE23_Tv0E8XC9ZuVwgFVv5HCxZpXCqsc_9w';

function apiRequest(method, path, body) {
  return new Promise(function(resolve, reject) {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.vercel.com',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
      }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, function(res) {
      let responseData = '';
      res.on('data', function(chunk) { responseData += chunk; });
      res.on('end', function() {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseData) });
        } catch(e) {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // 1. Lista ultimi deploy
  console.log('Controllo ultimi deploy...');
  const deploys = await apiRequest('GET', '/v6/deployments?projectId=prj_FpJ4QPNGIf09CWo9WezurN1PcZS&limit=3&teamId=team_GuQtWU2Xczwz1arNhZnUsoZW', null);
  
  if (deploys.status === 200) {
    const list = deploys.body.deployments || [];
    list.forEach(function(d) {
      console.log('[' + d.state + '] ' + d.url + ' - ' + d.meta?.githubCommitMessage?.slice(0, 60) + ' (' + new Date(d.createdAt).toLocaleTimeString('it-IT') + ')');
    });
  } else {
    console.log('Status:', deploys.status, JSON.stringify(deploys.body).slice(0, 200));
  }
}

main().catch(function(e) { console.error('Errore:', e.message); });
