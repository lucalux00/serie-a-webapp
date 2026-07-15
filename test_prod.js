const url = "https://webapp-two-nu-71.vercel.app/api/news/read?url=" + encodeURIComponent("https://news.google.com/rss/articles/CBMiswFBVV95cUxPWEJ3XzNtcExvZXhhU1IweUotbkxzWGZ0NmV0U3VwYUFpSzd3cExjWEcxRjBnNkVvS3N4U2x2N2NtbTRPZ1NFRU50bF9kckw1eTBPbnpDZW1xZlh0Q3FRYXU3bS15ZExxRHRTcHVSZllPZzNYTk90ZmR0ZUxQZkF2QWRsRWdGZnV6aXp2Sk10R2RfbXNtbDR3ck42cEZxZWMyOFc5a3dJQUl1aUp6SjZ3S1BR?oc=5") + "&title=" + encodeURIComponent("CALCIOMERCATO NAPOLI, DALL'ARGENTINA: IL BOCA ACCETTA L'OFFERTA PER ZEBALLOS");

async function test() {
  console.log("Fetching:", url);
  const res = await fetch(url);
  const text = await res.text();
  console.log("Response Status:", res.status);
  console.log("Response Body:", text);
}

test();
