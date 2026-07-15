const fs = require('fs');
const path = './src/data/trofeiCronologia.json';

let data = [];
if (fs.existsSync(path)) {
  data = JSON.parse(fs.readFileSync(path, 'utf8'));
}

// Rimuovo tutti i trofei dell'inter attuali per ricrearli tutti corretti
data = data.filter(t => t.team !== 'inter');

const interTrophies = [
  // --- SCUDETTI (20) ---
  { year: "2023/2024", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "2020/2021", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "2009/2010", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "2008/2009", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "2007/2008", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "2006/2007", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "2005/2006", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1988/1989", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1979/1980", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1970/1971", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1965/1966", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1964/1965", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1962/1963", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1953/1954", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1952/1953", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1939/1940", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1937/1938", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1929/1930", name: "Campionato Serie A", icon: "🇮🇹" },
  { year: "1919/1920", name: "Campionato Prima Categoria", icon: "🇮🇹" },
  { year: "1909/1910", name: "Campionato Prima Categoria", icon: "🇮🇹" },

  // --- COPPA ITALIA (9) ---
  { year: "2022/2023", name: "Coppa Italia", icon: "🏆" },
  { year: "2021/2022", name: "Coppa Italia", icon: "🏆" },
  { year: "2010/2011", name: "Coppa Italia", icon: "🏆" },
  { year: "2009/2010", name: "Coppa Italia", icon: "🏆" },
  { year: "2005/2006", name: "Coppa Italia", icon: "🏆" },
  { year: "2004/2005", name: "Coppa Italia", icon: "🏆" },
  { year: "1981/1982", name: "Coppa Italia", icon: "🏆" },
  { year: "1977/1978", name: "Coppa Italia", icon: "🏆" },
  { year: "1938/1939", name: "Coppa Italia", icon: "🏆" },

  // --- SUPERCOPPA ITALIANA (8) ---
  { year: "2023", name: "Supercoppa Italiana", icon: "🥇" },
  { year: "2022", name: "Supercoppa Italiana", icon: "🥇" },
  { year: "2021", name: "Supercoppa Italiana", icon: "🥇" },
  { year: "2010", name: "Supercoppa Italiana", icon: "🥇" },
  { year: "2008", name: "Supercoppa Italiana", icon: "🥇" },
  { year: "2006", name: "Supercoppa Italiana", icon: "🥇" },
  { year: "2005", name: "Supercoppa Italiana", icon: "🥇" },
  { year: "1989", name: "Supercoppa Italiana", icon: "🥇" },

  // --- CHAMPIONS LEAGUE (3) ---
  { year: "2009/2010", name: "Champions League", icon: "🇪🇺" },
  { year: "1964/1965", name: "Coppa dei Campioni", icon: "🇪🇺" },
  { year: "1963/1964", name: "Coppa dei Campioni", icon: "🇪🇺" },

  // --- COPPA UEFA (3) ---
  { year: "1997/1998", name: "Coppa UEFA", icon: "🇪🇺" },
  { year: "1993/1994", name: "Coppa UEFA", icon: "🇪🇺" },
  { year: "1990/1991", name: "Coppa UEFA", icon: "🇪🇺" },

  // --- COPPE INTERCONTINENTALI / MONDIALE PER CLUB (3) ---
  { year: "2010", name: "Mondiale per Club", icon: "🌍" },
  { year: "1965", name: "Coppa Intercontinentale", icon: "🌍" },
  { year: "1964", name: "Coppa Intercontinentale", icon: "🌍" }
];

const newInterEntries = interTrophies.map((t, i) => {
  return {
    id: `inter_${t.name.toLowerCase().replace(/ /g, '_')}_${t.year.replace(/\//g, '_')}_${i}`,
    team: "inter",
    name: t.name,
    year: t.year,
    icon: t.icon,
    coach: "Dato Storico",
    points: "Vittoria Storica",
    formation: [
      "Formazione Storica"
    ]
  };
});

// Aggiungi all'inizio
const finalData = [...newInterEntries, ...data];

fs.writeFileSync(path, JSON.stringify(finalData, null, 2));
console.log("Aggiunti " + newInterEntries.length + " trofei all'Inter.");
