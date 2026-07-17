async function testApi() {
  const res = await fetch('https://webapp-two-nu-71.vercel.app/api/pronostici');
  const data = await res.json();
  console.log(JSON.stringify(data.singlePredictions.slice(0, 2), null, 2));
}
testApi();
