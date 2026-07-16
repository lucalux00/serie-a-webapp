const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../src/data/trofeiCronologia.json');
let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Dati completi per la rosa (array di stringhe) per i vari scudetti dal 2000 in poi.
const storici = {
  // Napoli 22/23
  "nap_scudetto_23": ["P. Gollini", "M. Olivera", "Juan Jesus", "L. Østigård", "B. Bereszyński", "E. Elmas", "T. Ndombélé", "G. Gaetano", "D. Demme", "H. Lozano", "G. Raspadori", "G. Simeone", "A. Zerbin"],
  
  // Inter 23/24
  "inter_campionato_serie_a_2023_2024_0": ["E. Audero", "Y. Bisseck", "S. De Vrij", "Carlos Augusto", "T. Buchanan", "D. Frattesi", "K. Asllani", "D. Klaassen", "S. Sensi", "M. Arnautovic", "A. Sanchez"],
  
  // Milan 21/22
  "milan_campionato_serie_a_18": ["C. Tătărușanu", "A. Romagnoli", "S. Kjaer", "M. Gabbia", "A. Florenzi", "F. Ballo-Touré", "I. Bennacer", "R. Krunić", "T. Bakayoko", "J. Messias", "Z. Ibrahimović", "A. Rebić"],

  // Inter 20/21
  "inter_campionato_serie_a_2020_2021_1": ["I. Radu", "A. Young", "M. Darmian", "D. D'Ambrosio", "A. Ranocchia", "A. Kolarov", "A. Vidal", "R. Gagliardini", "M. Vecino", "S. Sensi", "A. Sanchez", "A. Pinamonti"],

  // Juve 19/20
  "juventus_campionato_serie_a_35": ["G. Buffon", "C. Pinsoglio", "G. Chiellini", "D. Rugani", "M. Demiral", "Danilo", "M. De Sciglio", "A. Rabiot", "A. Ramsey", "S. Khedira", "G. Higuain", "D. Costa", "F. Bernardeschi"],

  // Juve 18/19
  "juventus_campionato_serie_a_34": ["M. Perin", "D. Rugani", "A. Barzagli", "M. De Sciglio", "R. Bentancur", "S. Khedira", "D. Costa", "F. Bernardeschi", "M. Kean", "M. Caceres", "L. Spinazzola"],

  // Juve 17/18
  "juventus_campionato_serie_a_33": ["W. Szczesny", "C. Pinsoglio", "A. Barzagli", "D. Rugani", "M. De Sciglio", "K. Asamoah", "C. Marchisio", "R. Bentancur", "S. Sturaro", "D. Costa", "F. Bernardeschi", "J. Cuadrado"],

  // Juve 16/17
  "juventus_campionato_serie_a_32": ["Neto", "S. Lichtsteiner", "Dani Alves", "D. Rugani", "C. Marchisio", "S. Sturaro", "K. Asamoah", "T. Rincón", "J. Cuadrado", "M. Pjaca", "M. Lemina"],

  // Juve 15/16
  "juventus_campionato_serie_a_31": ["Neto", "Alex Sandro", "D. Rugani", "M. Caceres", "S. Sturaro", "Hernanes", "K. Asamoah", "R. Pereyra", "A. Morata", "S. Zaza", "J. Cuadrado"],

  // Juve 14/15
  "juventus_campionato_serie_a_30": ["M. Storari", "A. Ogbonna", "M. Caceres", "A. Barzagli", "S. Padoin", "S. Sturaro", "R. Pereyra", "Romulo", "A. Matri", "F. Llorente", "S. Pepe", "K. Coman"],

  // Juve 13/14
  "juventus_campionato_serie_a_29": ["M. Storari", "M. Caceres", "A. Ogbonna", "F. Peluso", "M. Isla", "S. Padoin", "S. Pepe", "F. Quagliarella", "S. Giovinco", "M. Vucinic", "P. Osvaldo"],

  // Juve 12/13
  "juventus_campionato_serie_a_28": ["M. Storari", "M. Caceres", "L. Marrone", "F. Peluso", "S. Padoin", "M. Isla", "E. Giaccherini", "P. Pogba", "F. Quagliarella", "A. Matri", "N. Anelka", "N. Bendtner"],

  // Juve 11/12
  "juventus_campionato_serie_a_27": ["M. Storari", "M. Caceres", "E. Giaccherini", "S. Padoin", "M. Estigarribia", "E. Elia", "M. Krasic", "M. Borriello", "F. Quagliarella", "A. Del Piero"],

  // Milan 10/11
  "milan_campionato_serie_a_17": ["M. Amelia", "M. Yepes", "S. Papastathopoulos", "N. Legrottaglie", "M. Jankulovski", "L. Antonini", "M. Flamini", "U. Emanuelson", "A. Merkel", "R. Strasser", "F. Inzaghi", "A. Cassano"],

  // Inter 09/10
  "inter_campionato_serie_a_2009_2010_2": ["F. Toldo", "I. Cordoba", "M. Materazzi", "D. Santon", "P. Vieira", "M. Mariga", "S. Muntari", "R. Quaresma", "M. Balotelli", "M. Arnautovic"]
};

// RIPRISTINO DEL VECCHIO FORMATO: La UI renderizza la formazione tipo (che ricreiamo se mancante) e la "Rosa Completa"
data = data.map(trophy => {
  if (storici[trophy.id]) {
    // Se c'è un roster a oggetti, lo convertiamo in formation (i titolari)
    if (trophy.roster && trophy.roster.length > 0 && typeof trophy.roster[0] === 'object') {
      const starters = trophy.roster.filter(p => p.isStarter).map(p => p.name);
      trophy.formation = starters;
    }
    // Impostiamo il roster come le riserve (array di stringhe)
    trophy.roster = storici[trophy.id];
  }
  return trophy;
});

fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
console.log("Ripristinato vecchio formato per 15 scudetti.");
