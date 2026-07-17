async function doMigrate() {
  const res = await fetch('https://webapp-two-nu-71.vercel.app/api/migrate');
  const text = await res.text();
  console.log(text);
}
doMigrate();
