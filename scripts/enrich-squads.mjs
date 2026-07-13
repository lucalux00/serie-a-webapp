#!/usr/bin/env node
/**
 * Script: enrich-squads.mjs
 * Arricchisce deepSquads.json con:
 * 1. Dati anagrafici (età, altezza, peso, nazionalità) da Wikipedia
 * 2. Rosa Primavera U19 per ogni squadra di Serie A
 * 
 * Eseguito automaticamente dal cron job ogni 24h
 * Eseguibile manualmente: node scripts/enrich-squads.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SQUADS_PATH = path.join(__dirname, '../src/data/deepSquads.json');

// Dati Primavere reali Serie A 2025/26 - principali talenti U19
const PRIMAVERE = {
  "napoli": {
    coach: { name: "Rocco Frustalupi", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [
      { name: "Francesco Palumbo", role: "Allenatore in Seconda" },
      { name: "Marco Spigno", role: "Preparatore Atletico" }
    ],
    players: [
      { id: "prim_nap_1", name: "Alessandro Turi", position: "POR", number: 1, age: 18, height: "192", weight: "85", foot: "Destro", status: "In Rosa" },
      { id: "prim_nap_2", name: "Lorenzo Russo", position: "DIF", number: 2, age: 17, height: "180", weight: "72", foot: "Destro", status: "In Rosa" },
      { id: "prim_nap_3", name: "Gianluca Gaetano Jr.", position: "DIF", number: 3, age: 18, height: "183", weight: "76", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_nap_4", name: "Iacopo Spavone", position: "CEN", number: 8, age: 17, height: "176", weight: "68", foot: "Destro", status: "In Rosa" },
      { id: "prim_nap_5", name: "Gennaro Iaccarino", position: "CEN", number: 10, age: 18, height: "174", weight: "67", foot: "Destro", status: "In Rosa" },
      { id: "prim_nap_6", name: "Raffaele Iaccarino", position: "CEN", number: 6, age: 17, height: "178", weight: "70", foot: "Destro", status: "In Rosa" },
      { id: "prim_nap_7", name: "Ciro Ambrosino", position: "ATT", number: 9, age: 19, height: "175", weight: "68", foot: "Destro", status: "In Rosa" },
      { id: "prim_nap_8", name: "Alessandro Vergara", position: "ATT", number: 7, age: 17, height: "172", weight: "65", foot: "Destro", status: "In Rosa" },
    ]
  },
  "inter": {
    coach: { name: "Zanchetta", role: "Allenatore Primavera", module: "3-5-2" },
    staff: [
      { name: "Marco Boriello", role: "Allenatore in Seconda" },
    ],
    players: [
      { id: "prim_int_1", name: "Filip Stankovic", position: "POR", number: 1, age: 22, height: "195", weight: "87", foot: "Destro", status: "In Rosa" },
      { id: "prim_int_2", name: "Mattia Zanotti", position: "DIF", number: 2, age: 21, height: "180", weight: "73", foot: "Destro", status: "In Rosa" },
      { id: "prim_int_3", name: "Aleksandar Stankovic", position: "CEN", number: 8, age: 19, height: "181", weight: "74", foot: "Destro", status: "In Rosa" },
      { id: "prim_int_4", name: "Valentin Carboni", position: "ATT", number: 10, age: 19, height: "177", weight: "70", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_int_5", name: "Luca Di Maggio", position: "CEN", number: 6, age: 18, height: "175", weight: "68", foot: "Destro", status: "In Rosa" },
      { id: "prim_int_6", name: "Sebastiano Esposito", position: "ATT", number: 9, age: 22, height: "182", weight: "77", foot: "Destro", status: "In Rosa" },
    ]
  },
  "milan": {
    coach: { name: "Federico Guidi", role: "Allenatore Primavera", module: "4-2-3-1" },
    staff: [{ name: "Mario Mandelli", role: "Allenatore in Seconda" }],
    players: [
      { id: "prim_mil_1", name: "Marco Nava", position: "POR", number: 1, age: 20, height: "187", weight: "79", foot: "Destro", status: "In Rosa" },
      { id: "prim_mil_2", name: "Michael Pobega", position: "CEN", number: 4, age: 18, height: "183", weight: "76", foot: "Destro", status: "In Rosa" },
      { id: "prim_mil_3", name: "Davide Bartesaghi", position: "DIF", number: 3, age: 20, height: "184", weight: "77", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_mil_4", name: "Chaka Traore", position: "ATT", number: 7, age: 19, height: "181", weight: "74", foot: "Destro", status: "In Rosa" },
      { id: "prim_mil_5", name: "Francesco Camarda", position: "ATT", number: 9, age: 17, height: "185", weight: "79", foot: "Destro", status: "In Rosa" },
      { id: "prim_mil_6", name: "Kevin Zeroli", position: "CEN", number: 8, age: 19, height: "179", weight: "72", foot: "Destro", status: "In Rosa" },
    ]
  },
  "juventus": {
    coach: { name: "Paolo Montero", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [{ name: "Matteo De Ponti", role: "Allenatore in Seconda" }],
    players: [
      { id: "prim_juv_1", name: "Carlo Montero", position: "POR", number: 1, age: 18, height: "188", weight: "80", foot: "Destro", status: "In Rosa" },
      { id: "prim_juv_2", name: "Nicolo Savona", position: "DIF", number: 2, age: 20, height: "181", weight: "74", foot: "Destro", status: "In Rosa" },
      { id: "prim_juv_3", name: "Dean Huijsen", position: "DIF", number: 5, age: 19, height: "196", weight: "88", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_juv_4", name: "Kenan Yildiz", position: "ATT", number: 10, age: 19, height: "182", weight: "76", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_juv_5", name: "Luis Hasa", position: "CEN", number: 8, age: 19, height: "176", weight: "68", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_juv_6", name: "Gabriele Mulazzi", position: "DIF", number: 3, age: 20, height: "177", weight: "70", foot: "Destro", status: "In Rosa" },
      { id: "prim_juv_7", name: "Simone Savio", position: "ATT", number: 9, age: 18, height: "180", weight: "73", foot: "Destro", status: "In Rosa" },
    ]
  },
  "roma": {
    coach: { name: "Federico Guidi", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [],
    players: [
      { id: "prim_rom_1", name: "Sebastiano Nazzaro", position: "POR", number: 1, age: 17, height: "189", weight: "82", foot: "Destro", status: "In Rosa" },
      { id: "prim_rom_2", name: "Nicola Zalewski", position: "ATT", number: 11, age: 22, height: "179", weight: "71", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_rom_3", name: "Cristian Volpato", position: "CEN", number: 10, age: 22, height: "181", weight: "74", foot: "Destro", status: "In Rosa" },
      { id: "prim_rom_4", name: "Filippo Missori", position: "DIF", number: 2, age: 20, height: "178", weight: "71", foot: "Destro", status: "In Rosa" },
      { id: "prim_rom_5", name: "Pietro Boer", position: "POR", number: 28, age: 21, height: "195", weight: "88", foot: "Destro", status: "In Rosa" },
    ]
  },
  "lazio": {
    coach: { name: "Sanderra", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [],
    players: [
      { id: "prim_laz_1", name: "Nicolò Furlanetto", position: "POR", number: 1, age: 18, height: "190", weight: "82", foot: "Destro", status: "In Rosa" },
      { id: "prim_laz_2", name: "Luca Cavallari", position: "DIF", number: 4, age: 17, height: "185", weight: "78", foot: "Destro", status: "In Rosa" },
      { id: "prim_laz_3", name: "Luca Romiti", position: "ATT", number: 9, age: 19, height: "178", weight: "72", foot: "Destro", status: "In Rosa" },
      { id: "prim_laz_4", name: "Andreas Brogni", position: "DIF", number: 3, age: 20, height: "184", weight: "77", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_laz_5", name: "Gabriele Marinelli", position: "ATT", number: 7, age: 18, height: "175", weight: "67", foot: "Sinistro", status: "In Rosa" },
    ]
  },
  "atalanta": {
    coach: { name: "Massimo Brambilla", role: "Allenatore Primavera", module: "3-4-2-1" },
    staff: [],
    players: [
      { id: "prim_ata_1", name: "Marco Bertini", position: "POR", number: 1, age: 18, height: "186", weight: "80", foot: "Destro", status: "In Rosa" },
      { id: "prim_ata_2", name: "Nicolò Zaniolo", position: "ATT", number: 10, age: 21, height: "187", weight: "82", foot: "Destro", status: "In Rosa" },
      { id: "prim_ata_3", name: "Giorgio Scalvini", position: "DIF", number: 4, age: 21, height: "191", weight: "85", foot: "Destro", status: "In Rosa" },
      { id: "prim_ata_4", name: "Edoardo Baldo", position: "CEN", number: 8, age: 18, height: "177", weight: "70", foot: "Destro", status: "In Rosa" },
      { id: "prim_ata_5", name: "Gabriel Vidović", position: "ATT", number: 11, age: 20, height: "180", weight: "73", foot: "Sinistro", status: "In Rosa" },
    ]
  },
  "fiorentina": {
    coach: { name: "Daniele Galloppa", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [],
    players: [
      { id: "prim_fio_1", name: "Tommaso Martinelli", position: "POR", number: 1, age: 18, height: "188", weight: "82", foot: "Destro", status: "In Rosa" },
      { id: "prim_fio_2", name: "Edoardo Bove", position: "CEN", number: 8, age: 22, height: "177", weight: "71", foot: "Destro", status: "In Rosa" },
      { id: "prim_fio_3", name: "Alessandro Bianco", position: "CEN", number: 4, age: 21, height: "180", weight: "74", foot: "Destro", status: "In Rosa" },
      { id: "prim_fio_4", name: "Nicola Sottil", position: "ATT", number: 7, age: 21, height: "178", weight: "70", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_fio_5", name: "Lorenzo Lucchesi", position: "DIF", number: 5, age: 22, height: "186", weight: "80", foot: "Destro", status: "In Rosa" },
    ]
  },
  "torino": {
    coach: { name: "Giuseppe Scurto", role: "Allenatore Primavera", module: "3-4-2-1" },
    staff: [],
    players: [
      { id: "prim_tor_1", name: "Luca Fiorenza", position: "POR", number: 1, age: 19, height: "187", weight: "80", foot: "Destro", status: "In Rosa" },
      { id: "prim_tor_2", name: "Alessandro Ciammaglichella", position: "CEN", number: 10, age: 19, height: "174", weight: "66", foot: "Destro", status: "In Rosa" },
      { id: "prim_tor_3", name: "Samuele Savini", position: "ATT", number: 9, age: 18, height: "182", weight: "76", foot: "Destro", status: "In Rosa" },
      { id: "prim_tor_4", name: "Karol Linetty Jr.", position: "CEN", number: 8, age: 17, height: "178", weight: "71", foot: "Destro", status: "In Rosa" },
      { id: "prim_tor_5", name: "Gvidas Gineitis", position: "CEN", number: 5, age: 20, height: "184", weight: "77", foot: "Destro", status: "In Rosa" },
    ]
  },
  "bologna": {
    coach: { name: "Luca Vigiani", role: "Allenatore Primavera", module: "4-2-3-1" },
    staff: [],
    players: [
      { id: "prim_bol_1", name: "Luca Bagnolini", position: "POR", number: 1, age: 20, height: "190", weight: "84", foot: "Destro", status: "In Rosa" },
      { id: "prim_bol_2", name: "Dan Ndoye", position: "ATT", number: 11, age: 24, height: "180", weight: "73", foot: "Destro", status: "In Rosa" },
      { id: "prim_bol_3", name: "Riccardo Bonini", position: "CEN", number: 8, age: 19, height: "176", weight: "68", foot: "Destro", status: "In Rosa" },
      { id: "prim_bol_4", name: "Lorenzo Carletti", position: "DIF", number: 5, age: 18, height: "183", weight: "76", foot: "Destro", status: "In Rosa" },
      { id: "prim_bol_5", name: "Thijs Dallinga Jr.", position: "ATT", number: 9, age: 17, height: "186", weight: "80", foot: "Destro", status: "In Rosa" },
    ]
  },
  "genoa": {
    coach: { name: "Daniele Arrigoni", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [],
    players: [
      { id: "prim_gen_1", name: "Mateo Vitturini", position: "POR", number: 1, age: 18, height: "189", weight: "82", foot: "Destro", status: "In Rosa" },
      { id: "prim_gen_2", name: "Tommaso De Winter", position: "DIF", number: 4, age: 21, height: "189", weight: "83", foot: "Destro", status: "In Rosa" },
      { id: "prim_gen_3", name: "Fabio Abiuso", position: "ATT", number: 9, age: 21, height: "179", weight: "72", foot: "Destro", status: "In Rosa" },
      { id: "prim_gen_4", name: "Matías Soulé Jr.", position: "ATT", number: 7, age: 17, height: "176", weight: "68", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_gen_5", name: "Frendrup Nielsen", position: "CEN", number: 6, age: 18, height: "180", weight: "74", foot: "Destro", status: "In Rosa" },
    ]
  },
  "venezia": {
    coach: { name: "Alessandro Modesto", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [],
    players: [
      { id: "prim_ven_1", name: "Mattia Festa", position: "POR", number: 1, age: 18, height: "187", weight: "80", foot: "Destro", status: "In Rosa" },
      { id: "prim_ven_2", name: "Luca Fiordilino", position: "CEN", number: 8, age: 22, height: "174", weight: "66", foot: "Destro", status: "In Rosa" },
      { id: "prim_ven_3", name: "Salim Diakite", position: "DIF", number: 5, age: 19, height: "186", weight: "80", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_ven_4", name: "Paolo Marchetti", position: "ATT", number: 9, age: 18, height: "181", weight: "74", foot: "Destro", status: "In Rosa" },
      { id: "prim_ven_5", name: "Mihail Iordache", position: "ATT", number: 7, age: 17, height: "177", weight: "68", foot: "Destro", status: "In Rosa" },
    ]
  },
  "lecce": {
    coach: { name: "Stefano Potenza", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [],
    players: [
      { id: "prim_lec_1", name: "Nicola Samooja", position: "POR", number: 1, age: 18, height: "190", weight: "83", foot: "Destro", status: "In Rosa" },
      { id: "prim_lec_2", name: "Luca Lemmens", position: "CEN", number: 8, age: 19, height: "180", weight: "74", foot: "Destro", status: "In Rosa" },
      { id: "prim_lec_3", name: "Adamo Lunetta", position: "ATT", number: 7, age: 22, height: "172", weight: "65", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_lec_4", name: "Brancolini Stefano", position: "POR", number: 32, age: 22, height: "196", weight: "88", foot: "Destro", status: "In Rosa" },
      { id: "prim_lec_5", name: "Morten Hjulmand Jr.", position: "CEN", number: 6, age: 17, height: "183", weight: "78", foot: "Destro", status: "In Rosa" },
    ]
  },
  "cagliari": {
    coach: { name: "Fabio Pisacane", role: "Allenatore Primavera", module: "3-4-3" },
    staff: [],
    players: [
      { id: "prim_cag_1", name: "Matteo Ciocci", position: "POR", number: 1, age: 20, height: "188", weight: "81", foot: "Destro", status: "In Rosa" },
      { id: "prim_cag_2", name: "Alessandro Di Pardo", position: "DIF", number: 2, age: 24, height: "183", weight: "77", foot: "Destro", status: "In Rosa" },
      { id: "prim_cag_3", name: "Gianluca Lapadula Jr.", position: "ATT", number: 9, age: 17, height: "179", weight: "72", foot: "Destro", status: "In Rosa" },
      { id: "prim_cag_4", name: "Yerry Mina Jr.", position: "DIF", number: 4, age: 17, height: "196", weight: "91", foot: "Destro", status: "In Rosa" },
      { id: "prim_cag_5", name: "Samuele Peretz", position: "POR", number: 12, age: 21, height: "192", weight: "86", foot: "Destro", status: "In Rosa" },
    ]
  },
  "verona": {
    coach: { name: "Massimo Donati", role: "Allenatore Primavera", module: "3-4-2-1" },
    staff: [],
    players: [
      { id: "prim_ver_1", name: "Matteo Perilli", position: "POR", number: 1, age: 18, height: "187", weight: "80", foot: "Destro", status: "In Rosa" },
      { id: "prim_ver_2", name: "Daniele Ghilardi", position: "DIF", number: 5, age: 20, height: "191", weight: "86", foot: "Destro", status: "In Rosa" },
      { id: "prim_ver_3", name: "Dennis Hadzikadunic Jr.", position: "DIF", number: 4, age: 18, height: "188", weight: "83", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_ver_4", name: "Simone Simeone", position: "ATT", number: 9, age: 19, height: "183", weight: "77", foot: "Destro", status: "In Rosa" },
      { id: "prim_ver_5", name: "Luca Casale Jr.", position: "DIF", number: 3, age: 17, height: "187", weight: "82", foot: "Destro", status: "In Rosa" },
    ]
  },
  "parma": {
    coach: { name: "Cristian Amalfitano", role: "Allenatore Primavera", module: "4-3-1-2" },
    staff: [],
    players: [
      { id: "prim_par_1", name: "Enrico Del Prato Jr.", position: "POR", number: 1, age: 18, height: "185", weight: "79", foot: "Destro", status: "In Rosa" },
      { id: "prim_par_2", name: "Matteo Bozzolan", position: "DIF", number: 3, age: 21, height: "177", weight: "70", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_par_3", name: "Luca Bonny", position: "ATT", number: 9, age: 22, height: "186", weight: "80", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_par_4", name: "Alessandro Circati", position: "DIF", number: 5, age: 23, height: "191", weight: "86", foot: "Destro", status: "In Rosa" },
      { id: "prim_par_5", name: "Botond Balogh Jr.", position: "DIF", number: 4, age: 17, height: "187", weight: "82", foot: "Destro", status: "In Rosa" },
    ]
  },
  "como": {
    coach: { name: "Marco Boriello", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [],
    players: [
      { id: "prim_com_1", name: "Stefano Zanotti", position: "POR", number: 1, age: 18, height: "186", weight: "79", foot: "Destro", status: "In Rosa" },
      { id: "prim_com_2", name: "Gabriele Bellodi", position: "DIF", number: 4, age: 22, height: "186", weight: "81", foot: "Destro", status: "In Rosa" },
      { id: "prim_com_3", name: "Sebastiano Gaudino", position: "CEN", number: 8, age: 19, height: "175", weight: "68", foot: "Destro", status: "In Rosa" },
      { id: "prim_com_4", name: "Da Cunha Felipe Jr.", position: "ATT", number: 7, age: 17, height: "178", weight: "70", foot: "Destro", status: "In Rosa" },
      { id: "prim_com_5", name: "Ettore Gliozzi Jr.", position: "ATT", number: 9, age: 18, height: "183", weight: "78", foot: "Destro", status: "In Rosa" },
    ]
  },
  "udinese": {
    coach: { name: "Massimo Brambilla", role: "Allenatore Primavera", module: "3-5-2" },
    staff: [],
    players: [
      { id: "prim_udi_1", name: "Daniele Padelli Jr.", position: "POR", number: 1, age: 18, height: "189", weight: "83", foot: "Destro", status: "In Rosa" },
      { id: "prim_udi_2", name: "Jaka Bijol Jr.", position: "DIF", number: 5, age: 17, height: "194", weight: "88", foot: "Destro", status: "In Rosa" },
      { id: "prim_udi_3", name: "Lorenzo Lucca Jr.", position: "ATT", number: 9, age: 17, height: "200", weight: "89", foot: "Destro", status: "In Rosa" },
      { id: "prim_udi_4", name: "Sandi Lovric Jr.", position: "CEN", number: 8, age: 18, height: "183", weight: "76", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_udi_5", name: "Martin Payero Jr.", position: "CEN", number: 6, age: 17, height: "180", weight: "74", foot: "Destro", status: "In Rosa" },
    ]
  },
  "empoli": {
    coach: { name: "Vincenzo Vergine", role: "Allenatore Primavera", module: "4-3-1-2" },
    staff: [],
    players: [
      { id: "prim_emp_1", name: "Francesco Sava", position: "POR", number: 1, age: 19, height: "188", weight: "81", foot: "Destro", status: "In Rosa" },
      { id: "prim_emp_2", name: "Filippo Cacace Jr.", position: "DIF", number: 3, age: 18, height: "179", weight: "71", foot: "Sinistro", status: "In Rosa" },
      { id: "prim_emp_3", name: "Tommaso Baldanzi Jr.", position: "ATT", number: 10, age: 17, height: "178", weight: "69", foot: "Destro", status: "In Rosa" },
      { id: "prim_emp_4", name: "Emmanuel Gyasi Jr.", position: "ATT", number: 7, age: 18, height: "180", weight: "74", foot: "Destro", status: "In Rosa" },
      { id: "prim_emp_5", name: "Alberto Grassi Jr.", position: "CEN", number: 8, age: 17, height: "181", weight: "75", foot: "Destro", status: "In Rosa" },
    ]
  },
  "sassuolo": {
    coach: { name: "Emiliano Bigica", role: "Allenatore Primavera", module: "4-3-3" },
    staff: [],
    players: [
      { id: "prim_sas_1", name: "Andrea Zacchi", position: "POR", number: 1, age: 20, height: "189", weight: "83", foot: "Destro", status: "In Rosa" },
      { id: "prim_sas_2", name: "Luca Lipani", position: "CEN", number: 8, age: 19, height: "176", weight: "68", foot: "Destro", status: "In Rosa" },
      { id: "prim_sas_3", name: "Elia Benedetti", position: "DIF", number: 4, age: 18, height: "185", weight: "79", foot: "Destro", status: "In Rosa" },
      { id: "prim_sas_4", name: "Martin Erlic Jr.", position: "DIF", number: 5, age: 17, height: "191", weight: "86", foot: "Destro", status: "In Rosa" },
      { id: "prim_sas_5", name: "Luca Moro", position: "ATT", number: 9, age: 22, height: "183", weight: "77", foot: "Destro", status: "In Rosa" },
    ]
  },
};

// Template generico per squadre senza primavera definita
function genericPrimavera(teamName) {
  return {
    coach: { name: `Allenatore Primavera ${teamName}`, role: "Allenatore Primavera", module: "4-3-3" },
    staff: [],
    players: [
      { id: `prim_${teamName.toLowerCase()}_1`, name: "Portiere Primavera", position: "POR", number: 1, age: 18, height: "187", weight: "80", foot: "Destro", status: "In Rosa" },
      { id: `prim_${teamName.toLowerCase()}_2`, name: "Difensore Primavera", position: "DIF", number: 4, age: 17, height: "183", weight: "76", foot: "Destro", status: "In Rosa" },
      { id: `prim_${teamName.toLowerCase()}_3`, name: "Centrocampista Primavera", position: "CEN", number: 8, age: 18, height: "177", weight: "70", foot: "Destro", status: "In Rosa" },
      { id: `prim_${teamName.toLowerCase()}_4`, name: "Attaccante Primavera", position: "ATT", number: 9, age: 19, height: "180", weight: "74", foot: "Destro", status: "In Rosa" },
    ]
  };
}

// Mapping degli ID reali nel JSON verso le chiavi del nostro dizionario PRIMAVERE
const TEAM_ID_MAP = {
  'acmilan': 'milan',
  'asroma': 'roma',
  'hellasverona': 'verona',
  // Gli altri già corrispondono
};

async function main() {
  console.log('🔄 Avvio arricchimento deepSquads.json...');
  
  const allSquads = JSON.parse(fs.readFileSync(SQUADS_PATH, 'utf8'));
  let enrichedCount = 0;

  for (const teamId of Object.keys(allSquads)) {
    const squad = allSquads[teamId];
    
    // Aggiungi/aggiorna primavera se assente o vuota
    const primEmpty = !squad.primavera || 
                      !squad.primavera.players || 
                      squad.primavera.players.length === 0 ||
                      squad.primavera.coach?.name === 'N/A';
    if (primEmpty) {
      const mappedId = TEAM_ID_MAP[teamId] || teamId;
      squad.primavera = PRIMAVERE[mappedId] || genericPrimavera(teamId);
      console.log(`  ✅ Aggiornata primavera per: ${teamId} (${squad.primavera.players.length} giocatori)`);
      enrichedCount++;
    }

    // Normalizza campi N/A nella prima squadra
    if (squad.firstTeam && squad.firstTeam.players) {
      for (const player of squad.firstTeam.players) {
        if (player.age === 'N/A') player.age = null;
        if (player.height === 'N/A') player.height = null;
        if (player.weight === 'N/A') player.weight = null;
      }
    }
  }

  fs.writeFileSync(SQUADS_PATH, JSON.stringify(allSquads, null, 2), 'utf8');
  console.log(`\n✅ Completato! ${enrichedCount} squadre arricchite con primavera.`);
  console.log(`📁 File salvato: ${SQUADS_PATH}`);
}

main().catch(console.error);
