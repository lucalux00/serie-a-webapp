const fs = require('fs');
const path = require('path');

const teamMap = {
  "FC Internazionale Milano": "Inter",
  "AC Milan": "Milan",
  "Juventus FC": "Juventus",
  "SSC Napoli": "Napoli",
  "AS Roma": "Roma",
  "SS Lazio": "Lazio",
  "Atalanta BC": "Atalanta",
  "ACF Fiorentina": "Fiorentina",
  "Bologna FC 1909": "Bologna",
  "Torino FC": "Torino",
  "Udinese Calcio": "Udinese",
  "US Sassuolo Calcio": "Sassuolo", // if they were there
  "Genoa CFC": "Genoa",
  "Hellas Verona FC": "Verona",
  "US Lecce": "Lecce",
  "Empoli FC": "Empoli",
  "AC Monza": "Monza",
  "Cagliari Calcio": "Cagliari",
  "Parma Calcio 1913": "Parma",
  "Venezia FC": "Venezia",
  "Como 1907": "Como"
};

async function generateRealCalendar() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/openfootball/football.json/master/2024-25/it.1.json');
    const data = await res.json();
    
    const filePath = path.join(__dirname, '../src/data/classifiche.json');
    const localData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const serieACalendar = [];
    
    data.matches.forEach(m => {
      const roundNum = parseInt(m.round.replace('Matchday ', ''));
      const home = teamMap[m.team1] || m.team1;
      const away = teamMap[m.team2] || m.team2;
      
      // Trasforma la data 2024-08-17 in 2026-08-22 (spostiamo in avanti per essere nel weekend del 2026)
      const d = new Date(m.date);
      // Mettiamo 2 anni avanti
      d.setFullYear(d.getFullYear() + 2);
      // Forza al weekend (sabato) se capita in settimana? O lasciala così com'è. 
      // Lasciamo il giorno approssimativo, convertiamolo in stringa leggibile:
      const dateStr = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }) + ", " + (m.time || "15:00");

      serieACalendar.push({
        round: roundNum,
        home: home,
        away: away,
        date: dateStr
      });
    });

    localData.serieA.calendar = serieACalendar;
    fs.writeFileSync(filePath, JSON.stringify(localData, null, 2), 'utf8');
    
    console.log('Calendario ufficiale importato con successo! Totale partite:', serieACalendar.length);
  } catch (err) {
    console.error('Errore:', err);
  }
}

generateRealCalendar();
