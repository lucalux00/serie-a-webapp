const fs = require('fs');
const path = './src/data/trofeiCronologia.json';

let data = [];
if (fs.existsSync(path)) {
  data = JSON.parse(fs.readFileSync(path, 'utf8'));
}

// Rimuovo tutti i trofei di juventus e milan attuali per ricrearli tutti corretti
data = data.filter(t => t.team !== 'juventus' && t.team !== 'milan');

const generateTrophies = (team, config) => {
  const trophies = [];
  config.forEach(c => {
    // se ha la lista anni la usiamo
    if (c.years) {
      c.years.forEach((yr, idx) => {
        trophies.push({
          id: `${team}_${c.name.toLowerCase().replace(/ /g, '_')}_${idx}`,
          team: team,
          name: c.name,
          year: yr.toString(),
          icon: c.icon,
          coach: "Dato Storico",
          points: "Vittoria Storica",
          formation: ["Formazione Storica"]
        });
      });
    } else {
      for (let i = 0; i < c.count; i++) {
        trophies.push({
          id: `${team}_${c.name.toLowerCase().replace(/ /g, '_')}_${i}`,
          team: team,
          name: c.name,
          year: `Vittoria Storica #${c.count - i}`,
          icon: c.icon,
          coach: "Dato Storico",
          points: "Vittoria Storica",
          formation: ["Formazione Storica"]
        });
      }
    }
  });
  return trophies;
};

// Juve storici
const juveTrophies = generateTrophies('juventus', [
  { name: "Campionato Serie A", years: [1905, 1926, 1931, 1932, 1933, 1934, 1935, 1950, 1952, 1958, 1960, 1961, 1967, 1972, 1973, 1975, 1977, 1978, 1981, 1982, 1984, 1986, 1995, 1997, 1998, 2002, 2003, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020], icon: "🇮🇹" },
  { name: "Coppa Italia", count: 15, icon: "🏆" },
  { name: "Supercoppa Italiana", count: 9, icon: "🥇" },
  { name: "Champions League", years: [1985, 1996], icon: "🇪🇺" },
  { name: "Coppa UEFA", years: [1977, 1990, 1993], icon: "🇪🇺" },
  { name: "Coppa delle Coppe", years: [1984], icon: "🇪🇺" },
  { name: "Supercoppa UEFA", years: [1984, 1996], icon: "🇪🇺" },
  { name: "Coppa Intercontinentale", years: [1985, 1996], icon: "🌍" }
]);

// Milan storici
const milanTrophies = generateTrophies('milan', [
  { name: "Campionato Serie A", years: [1901, 1906, 1907, 1951, 1955, 1957, 1959, 1962, 1968, 1979, 1988, 1992, 1993, 1994, 1996, 1999, 2004, 2011, 2022], icon: "🇮🇹" },
  { name: "Coppa Italia", count: 5, icon: "🏆" },
  { name: "Supercoppa Italiana", count: 7, icon: "🥇" },
  { name: "Champions League", years: [1963, 1969, 1989, 1990, 1994, 2003, 2007], icon: "🇪🇺" },
  { name: "Coppa delle Coppe", years: [1968, 1973], icon: "🇪🇺" },
  { name: "Supercoppa UEFA", count: 5, icon: "🇪🇺" },
  { name: "Coppa Intercontinentale / Mondiale", count: 4, icon: "🌍" }
]);

const finalData = [...juveTrophies, ...milanTrophies, ...data];

fs.writeFileSync(path, JSON.stringify(finalData, null, 2));
console.log(`Aggiunti ${juveTrophies.length} trofei Juve e ${milanTrophies.length} trofei Milan.`);
