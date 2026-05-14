import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'airports');
const TMP = process.env.TEMP || process.env.TMP || 'C:\\Users\\Keywan\\AppData\\Local\\Temp';
const OA_AIRPORTS = join(TMP, 'ourairports-airports.csv');
const OA_RUNWAYS = join(TMP, 'ourairports-runways.csv');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') {
        row.push(cell);
        cell = '';
      } else if (c === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else if (c === '\r') {
      } else {
        cell += c;
      }
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const stdTl = { metro: [
  { minQnh: 1013, maxQnh: 1050, flightLevel: 60 },
  { minQnh: 977,  maxQnh: 1012, flightLevel: 70 }
]};

function tlForTa(taFt) {
  const base = Math.ceil((taFt + 1000) / 1000) * 10;
  return [
    { minQnh: 1013, maxQnh: 1050, flightLevel: base },
    { minQnh: 977,  maxQnh: 1012, flightLevel: base + 10 }
  ];
}

const taMap = new Map([
  ['LFLB', 6500],
  ['TFFF', 9000], ['TFFR', 9000], ['TFFG', 9000],
  ['TFFJ', 1500],
  ['FMEE', 12000], ['FMEP', 12000],
  ['FMCZ', 4000],
  ['SOCA', 3000], ['SOCH', 3000]
]);

const regionMap = new Map();
['TFFF','TFFR','TFFG','TFFJ','TFFA','TFFB','TFFC','TFFM','TFFS','SOCA','SOCH','FMEE','FMEP','FMCZ','LFVP','LFVM','NTAA','NTTB','NTTH','NTTM','NTTR','NWWW','NWWM','NWWE','NWWL','NWWR','NWWV','NLWW','NLWF']
  .forEach((c) => regionMap.set(c, 'dom-tom'));

const NAMES = {
  LFAC: 'Calais Marck', LFAQ: 'Albert Bray', LFAT: 'Le Touquet Elizabeth II', LFAV: 'Valenciennes Denain',
  LFBA: 'Agen La Garenne', LFBD: 'Bordeaux Mérignac', LFBE: 'Bergerac Dordogne Périgord',
  LFBF: 'Toulouse Francazal', LFBH: 'La Rochelle Île de Ré', LFBI: 'Poitiers Biard',
  LFBK: 'Montluçon Guéret', LFBL: 'Limoges Bellegarde', LFBN: 'Niort Marais Poitevin',
  LFBO: 'Toulouse Blagnac', LFBP: 'Pau Pyrénées', LFBR: 'Muret Lherm',
  LFBS: 'Biscarrosse Parentis', LFBT: 'Tarbes Lourdes Pyrénées', LFBU: 'Angoulême Brie Champniers',
  LFBX: 'Périgueux Bassillac', LFBZ: 'Biarritz Pays Basque',
  LFCC: 'Cahors Lalbenque', LFCH: 'Arcachon La Teste de Buch', LFCI: 'Albi Le Sequestre',
  LFCK: 'Castres Mazamet', LFCL: 'Toulouse Lasbordes', LFCR: 'Rodez Aveyron', LFCY: 'Royan Médis',
  LFDH: 'Auch Gers', LFDJ: 'Pamiers les Pujols', LFDN: 'Rochefort Charente-Maritime',
  LFEA: 'Belle Île', LFEC: 'Ouessant', LFEQ: 'Quiberon', LFEY: 'Île d\'Yeu',
  LFGA: 'Colmar Houssen', LFGJ: 'Dole Tavaux',
  LFJL: 'Metz-Nancy Lorraine', LFJR: 'Angers Marcé',
  LFKB: 'Bastia Poretta', LFKC: 'Calvi Sainte-Catherine', LFKF: 'Figari Sud Corse',
  LFKJ: 'Ajaccio Napoléon Bonaparte',
  LFLB: 'Chambéry Aix-les-Bains', LFLC: 'Clermont-Ferrand Auvergne', LFLD: 'Bourges',
  LFLG: 'Grenoble Le Versoud', LFLH: 'Chalon Champforgeuil', LFLL: 'Lyon Saint-Exupéry',
  LFLN: 'Saint-Yan', LFLP: 'Annecy Meythet', LFLS: 'Grenoble Alpes Isère',
  LFLW: 'Aurillac', LFLX: 'Châteauroux Déols', LFLY: 'Lyon Bron',
  LFMA: 'Aix-les-Milles', LFMC: 'Le Luc Le Cannet', LFMD: 'Cannes Mandelieu',
  LFMH: 'Saint-Étienne Loire', LFMK: 'Carcassonne Salvaza', LFML: 'Marseille Provence',
  LFMN: 'Nice Côte d\'Azur', LFMP: 'Perpignan Rivesaltes', LFMQ: 'Le Castellet',
  LFMT: 'Montpellier Méditerranée', LFMU: 'Béziers Vias', LFMV: 'Avignon Caumont',
  LFOB: 'Beauvais Tillé', LFOH: 'Le Havre Octeville', LFOK: 'Châlons Vatry',
  LFOP: 'Rouen Vallée de Seine', LFOT: 'Tours Val de Loire', LFOU: 'Cholet Le Pontreau',
  LFOV: 'Laval Entrammes',
  LFPB: 'Paris Le Bourget', LFPG: 'Paris Charles de Gaulle', LFPM: 'Melun Villaroche',
  LFPN: 'Paris Toussus-le-Noble', LFPO: 'Paris Orly', LFPT: 'Pontoise Cormeilles',
  LFPV: 'Villacoublay Vélizy',
  LFQG: 'Nevers Fourchambault', LFQM: 'Besançon La Vèze', LFQQ: 'Lille Lesquin',
  LFQT: 'Merville Calonne',
  LFRB: 'Brest Bretagne', LFRC: 'Cherbourg Manche', LFRD: 'Dinard Pleurtuit Saint-Malo',
  LFRE: 'La Baule Escoublac', LFRG: 'Deauville Normandie', LFRI: 'La Roche-sur-Yon',
  LFRK: 'Caen Carpiquet', LFRM: 'Le Mans Arnage', LFRN: 'Rennes Saint-Jacques',
  LFRO: 'Lannion', LFRQ: 'Quimper Pluguffan', LFRS: 'Nantes Atlantique',
  LFRT: 'Saint-Brieuc Armor', LFRU: 'Morlaix Ploujean', LFRV: 'Vannes Meucon',
  LFRZ: 'Saint-Nazaire Montoir',
  LFSB: 'Bâle-Mulhouse EuroAirport', LFSD: 'Dijon Longvic', LFSG: 'Épinal Mirecourt',
  LFSL: 'Brive Souillac', LFSM: 'Montbéliard Courcelles', LFSN: 'Nancy Essey',
  LFST: 'Strasbourg Entzheim',
  LFTF: 'Cuers Pierrefeu', LFTH: 'Hyères Le Palyvestre', LFTW: 'Nîmes Garons', LFTZ: 'La Môle',
  LFVM: 'Miquelon', LFVP: 'Saint-Pierre (St-Pierre-et-Miquelon)',
  TFFF: 'Martinique Aimé Césaire', TFFR: 'Guadeloupe Maryse Condé',
  TFFG: 'Saint-Martin Grand\'Case', TFFJ: 'Saint-Barthélémy Rémy de Haenen',
  TFFA: 'La Désirade', TFFB: 'Marie-Galante', TFFC: 'Saint-François', TFFM: 'Les Saintes Terre-de-Haut', TFFS: 'Vauclin',
  SOCA: 'Cayenne Félix Éboué', SOCH: 'Cayenne CH Andrée Rosemon (héliport)',
  FMEE: 'La Réunion Roland Garros', FMEP: 'Saint-Pierre Pierrefonds',
  FMCZ: 'Mayotte Marcel Henry',
  NTAA: 'Tahiti Faa\'a', NTTB: 'Bora Bora Motu Mute', NTTH: 'Huahine Fare',
  NTTM: 'Moorea Temae', NTTR: 'Raiatea Uturoa',
  NWWW: 'Nouméa La Tontouta', NWWM: 'Nouméa Magenta', NWWE: 'Île de Pins Moué',
  NWWL: 'Lifou Ouanaham', NWWR: 'Maré La Roche', NWWV: 'Ouvéa Ouloup',
  NLWW: 'Wallis Hihifo', NLWF: 'Futuna Pointe Vélé'
};

const FULL_LIST = Object.keys(NAMES);

const RESEARCH = loadResearchData();

function loadResearchData() {
  return {
    LFPG: {
      runways: [
        { id: '08L', heading: 82, lengthFt: 13780, surface: 'asphalt', ils: true },
        { id: '26R', heading: 262, lengthFt: 13780, surface: 'asphalt', ils: true },
        { id: '08R', heading: 82, lengthFt: 8858, surface: 'asphalt', ils: true },
        { id: '26L', heading: 262, lengthFt: 8858, surface: 'asphalt', ils: true },
        { id: '09L', heading: 92, lengthFt: 8858, surface: 'asphalt', ils: true },
        { id: '27R', heading: 272, lengthFt: 8858, surface: 'asphalt', ils: true },
        { id: '09R', heading: 92, lengthFt: 13829, surface: 'asphalt', ils: true },
        { id: '27L', heading: 272, lengthFt: 13829, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'Face ouest - doublets indépendants (jour)', arrRunways: ['26L', '27R'], depRunways: ['26R', '27L'],
          windFrom: 170, windTo: 350, priority: 1, conditions: [],
          notes: 'Configuration standard de jour, doublets indépendants. 26R/27L décollages, 26L/27R atterrissages.' },
        { name: 'Face est - doublets indépendants (jour)', arrRunways: ['08R', '09L'], depRunways: ['08L', '09R'],
          windFrom: 350, windTo: 170, priority: 1, conditions: [],
          notes: 'Configuration standard de jour face est. 08L/09R décollages, 08R/09L atterrissages.' },
        { name: 'Face ouest - PEB nuit (mono)', arrRunways: ['27R'], depRunways: ['27L'],
          windFrom: 170, windTo: 350, priority: 2, timeWindow: '22:30-06:15', timeWindowTz: 'Europe/Paris', conditions: [],
          notes: 'Arrêté du 06/11/2003. Pistes nord préférentielles, monopiste de nuit.' },
        { name: 'Face est - PEB nuit (mono)', arrRunways: ['09L'], depRunways: ['09R'],
          windFrom: 350, windTo: 170, priority: 2, timeWindow: '22:30-06:15', timeWindowTz: 'Europe/Paris', conditions: [],
          notes: 'Arrêté du 06/11/2003 face est.' }
      ],
      specialNotes: [
        'Doublets indépendants : pistes nord (08L/26R, 09R/27L) prioritairement décollages, pistes sud atterrissages.',
        'Restrictions PEB nuit 22:30-06:15 LT.',
        'Opérations LVP CAT III disponibles sur les 4 pistes.'
      ]
    },
    LFPO: {
      runways: [
        { id: '06', heading: 65, lengthFt: 7874, surface: 'asphalt', ils: true },
        { id: '24', heading: 245, lengthFt: 7874, surface: 'asphalt', ils: true },
        { id: '07', heading: 65, lengthFt: 11975, surface: 'asphalt', ils: true },
        { id: '25', heading: 245, lengthFt: 11975, surface: 'asphalt', ils: true },
        { id: '08', heading: 80, lengthFt: 10892, surface: 'asphalt', ils: true },
        { id: '26', heading: 260, lengthFt: 10892, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'Face ouest standard', arrRunways: ['26'], depRunways: ['24'], windFrom: 170, windTo: 350, priority: 1, conditions: [], notes: 'ARR 26, DEP 24. Piste 25 utilisable pour ARR en pointe.' },
        { name: 'Face ouest - variante 25 ARR', arrRunways: ['25'], depRunways: ['24'], windFrom: 170, windTo: 350, priority: 2, conditions: [] },
        { name: 'Face est standard', arrRunways: ['06'], depRunways: ['08'], windFrom: 350, windTo: 170, priority: 1, conditions: [] },
        { name: 'Face est - variante 07 ARR', arrRunways: ['07'], depRunways: ['08'], windFrom: 350, windTo: 170, priority: 2, conditions: [] },
        { name: 'Couvre-feu nuit', arrRunways: [], depRunways: [], windFrom: 0, windTo: 360, priority: 3, timeWindow: '23:30-06:00', timeWindowTz: 'Europe/Paris', conditions: ['curfew'], notes: 'Couvre-feu Orly : interdiction décollages 23:30-06:00 LT et atterrissages 23:15-06:00 LT.' }
      ],
      specialNotes: [
        'Couvre-feu nocturne strict (arrêté du 4 avril 1968 modifié).',
        'Plafond annuel 250 000 créneaux.',
        'Opérations LVP CAT III disponibles.'
      ]
    },
    LFPB: {
      runways: [
        { id: '03', heading: 26, lengthFt: 9843, surface: 'asphalt', ils: true },
        { id: '21', heading: 206, lengthFt: 9843, surface: 'asphalt', ils: true },
        { id: '07', heading: 67, lengthFt: 8743, surface: 'asphalt', ils: false },
        { id: '25', heading: 247, lengthFt: 8743, surface: 'asphalt', ils: true },
        { id: '09', heading: 86, lengthFt: 6004, surface: 'asphalt', ils: false },
        { id: '27', heading: 266, lengthFt: 6004, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'Face ouest standard (mono)', arrRunways: ['25'], depRunways: ['27'], windFrom: 170, windTo: 350, priority: 1, conditions: [] },
        { name: 'Face ouest - doublet 25/21', arrRunways: ['25'], depRunways: ['21'], windFrom: 170, windTo: 350, priority: 2, conditions: [], notes: 'Trafic élevé (salon du Bourget).' },
        { name: 'Face est standard (mono)', arrRunways: ['07'], depRunways: ['09'], windFrom: 350, windTo: 170, priority: 1, conditions: [] },
        { name: 'Face est - doublet 07/03', arrRunways: ['07'], depRunways: ['03'], windFrom: 350, windTo: 170, priority: 2, conditions: [] }
      ],
      specialNotes: [
        'Aérodrome dédié aviation d\'affaires.',
        'Restrictions nocturnes (arrêté 06/10/1994 modifié).',
        'Salon International de l\'Aéronautique tous les 2 ans.'
      ]
    },
    LFML: {
      runways: [
        { id: '13L', heading: 132, lengthFt: 11483, surface: 'asphalt', ils: true },
        { id: '31R', heading: 312, lengthFt: 11483, surface: 'asphalt', ils: true },
        { id: '13R', heading: 132, lengthFt: 7874, surface: 'asphalt', ils: false },
        { id: '31L', heading: 312, lengthFt: 7874, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'Face nord-ouest (mistral) - doublet', arrRunways: ['31R'], depRunways: ['31L'], windFrom: 220, windTo: 40, priority: 1, conditions: [], notes: 'Préférentielle par mistral. 31R CAT III pour ARR, 31L pour DEP.' },
        { name: 'Face sud-est - doublet', arrRunways: ['13L'], depRunways: ['13R'], windFrom: 40, windTo: 220, priority: 2, conditions: [], notes: 'Face SE par vent du sud-est.' }
      ],
      specialNotes: [
        'Pistes parallèles séparées ~270 m - approches dépendantes.',
        'Préférence opérationnelle 31 (mistral résiduel et bruit).'
      ]
    },
    LFMN: {
      runways: [
        { id: '04L', heading: 43, lengthFt: 9711, surface: 'asphalt', ils: false },
        { id: '22R', heading: 223, lengthFt: 9711, surface: 'asphalt', ils: true },
        { id: '04R', heading: 43, lengthFt: 8038, surface: 'asphalt', ils: false },
        { id: '22L', heading: 223, lengthFt: 8038, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'Face terre 22 (préférentielle)', arrRunways: ['22L'], depRunways: ['22R'], windFrom: 130, windTo: 310, priority: 1, conditions: [], notes: 'ILS CAT III sur 22R. Approche par la mer.' },
        { name: 'Face mer 04 (brise nocturne)', arrRunways: ['04L'], depRunways: ['04R'], windFrom: 310, windTo: 130, minSpeed: 5, priority: 2, conditions: [], notes: 'Pas d\'ILS face 04 (relief). Configuration minoritaire.' }
      ],
      specialNotes: [
        'Relief contraignant au nord (Alpes-Maritimes).',
        'LVP CAT III uniquement 22R.',
        'Restrictions bruit nocturnes - 22 favorisé.'
      ]
    },
    LFLL: {
      runways: [
        { id: '17L', heading: 175, lengthFt: 13123, surface: 'asphalt', ils: true },
        { id: '35R', heading: 355, lengthFt: 13123, surface: 'asphalt', ils: true },
        { id: '17R', heading: 175, lengthFt: 8858, surface: 'asphalt', ils: true },
        { id: '35L', heading: 355, lengthFt: 8858, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'Face nord 35 (préférentielle)', arrRunways: ['35R'], depRunways: ['35L'], windFrom: 260, windTo: 80, priority: 1, conditions: [], notes: '35R CAT III pour ARR, 35L pour DEP. Approches indépendantes (espacement ~600 m).' },
        { name: 'Face sud 17', arrRunways: ['17L'], depRunways: ['17R'], windFrom: 80, windTo: 260, priority: 2, conditions: [], notes: '17L CAT III pour ARR, 17R pour DEP.' }
      ],
      specialNotes: [
        'Pistes parallèles indépendantes (espacement ~600 m).',
        'Préférence QFU 35 (bruit communes nord).',
        'Hub cargo nuit - usage 35L/17R privilégié.'
      ]
    },
    LFKJ: {
      runways: [
        { id: '02', heading: 21, lengthFt: 7913, surface: 'asphalt', ils: true },
        { id: '20', heading: 201, lengthFt: 7913, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'QFU 02 (préférentielle ILS)', arrRunways: ['02'], depRunways: ['02'], windFrom: 290, windTo: 110, priority: 1, conditions: [], notes: 'ILS CAT I. Approche depuis le golfe.' },
        { name: 'QFU 20', arrRunways: ['20'], depRunways: ['20'], windFrom: 110, windTo: 290, priority: 2, conditions: [], notes: 'Sans ILS (VOR/RNP). Décollage face mer.' }
      ],
      specialNotes: [
        'Piste unique, relief montagneux à l\'est.',
        'Effets venturi du golfe - cisaillements signalés.'
      ]
    },
    LFKB: {
      runways: [
        { id: '16', heading: 164, lengthFt: 8366, surface: 'asphalt', ils: false },
        { id: '34', heading: 344, lengthFt: 8366, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'QFU 34 (préférentielle ILS)', arrRunways: ['34'], depRunways: ['34'], windFrom: 250, windTo: 70, priority: 1, conditions: [], notes: 'ILS disponible. Approche par la plaine orientale.' },
        { name: 'QFU 16', arrRunways: ['16'], depRunways: ['16'], windFrom: 70, windTo: 250, priority: 2, conditions: [], notes: 'Sans ILS. Imposée par vent du sud.' }
      ],
      specialNotes: [
        'Relief montagneux à l\'ouest - approches par l\'est.',
        'Vent traversier d\'ouest fréquent en altitude.'
      ]
    },
    LFBO: {
      runways: [
        { id: '14L', heading: 143, lengthFt: 9843, surface: 'asphalt', ils: true },
        { id: '32R', heading: 323, lengthFt: 9843, surface: 'asphalt', ils: true },
        { id: '14R', heading: 143, lengthFt: 11483, surface: 'asphalt', ils: true },
        { id: '32L', heading: 323, lengthFt: 11483, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'Face nord-ouest (Autan)', arrRunways: ['32L'], depRunways: ['32R'], windFrom: 230, windTo: 50, priority: 1, conditions: [], notes: 'Vent d\'Autan. 32L ARR, 32R DEP.' },
        { name: 'Face sud-est', arrRunways: ['14R'], depRunways: ['14L'], windFrom: 50, windTo: 230, priority: 2, conditions: [] }
      ],
      specialNotes: [
        'Doublet parallèle spécialisé (Airbus / commercial).',
        'Vols d\'essai Airbus fréquents (14L/32R).'
      ]
    },
    LFBD: {
      runways: [
        { id: '05', heading: 53, lengthFt: 10171, surface: 'asphalt', ils: true },
        { id: '23', heading: 233, lengthFt: 10171, surface: 'asphalt', ils: true },
        { id: '11', heading: 113, lengthFt: 7710, surface: 'asphalt', ils: false },
        { id: '29', heading: 293, lengthFt: 7710, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'Face sud-ouest (préférentielle)', arrRunways: ['23'], depRunways: ['23'], windFrom: 140, windTo: 320, priority: 1, conditions: [] },
        { name: 'Face nord-est', arrRunways: ['05'], depRunways: ['05'], windFrom: 320, windTo: 140, priority: 2, conditions: [] },
        { name: 'Face ouest (vents traversiers)', arrRunways: ['29'], depRunways: ['29'], windFrom: 200, windTo: 20, minSpeed: 15, priority: 3, conditions: ['crossWind'], notes: 'Piste 11/29 si traversier fort sur principale.' }
      ],
      specialNotes: [
        'Mixte civil/militaire (BA 106).',
        'Pas d\'opérations simultanées 05/23 + 11/29 (pistes sécantes).'
      ]
    },
    LFRS: {
      runways: [
        { id: '03', heading: 26, lengthFt: 9514, surface: 'asphalt', ils: true },
        { id: '21', heading: 206, lengthFt: 9514, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'Face sud-ouest (préférentielle)', arrRunways: ['21'], depRunways: ['21'], windFrom: 110, windTo: 290, priority: 1, conditions: [], notes: 'Moindre bruit (approche océan).' },
        { name: 'Face nord-est', arrRunways: ['03'], depRunways: ['03'], windFrom: 290, windTo: 110, minSpeed: 5, priority: 2, conditions: [] }
      ],
      specialNotes: [
        'Piste 21 préférentielle (survol agglomération).',
        'Restrictions nocturnes (arrêté 2021).'
      ]
    },
    LFSB: {
      runways: [
        { id: '15', heading: 154, lengthFt: 12795, surface: 'asphalt', ils: true },
        { id: '33', heading: 334, lengthFt: 12795, surface: 'asphalt', ils: true },
        { id: '08', heading: 76, lengthFt: 5413, surface: 'asphalt', ils: false },
        { id: '26', heading: 256, lengthFt: 5413, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'Face nord-ouest (préférentielle)', arrRunways: ['33'], depRunways: ['33'], windFrom: 60, windTo: 240, priority: 1, conditions: [] },
        { name: 'Face sud-est', arrRunways: ['15'], depRunways: ['15'], windFrom: 240, windTo: 60, minSpeed: 5, priority: 2, conditions: [] },
        { name: 'Piste 08/26 (secondaire vents forts)', arrRunways: ['26'], depRunways: ['26'], windFrom: 200, windTo: 20, minSpeed: 20, priority: 3, conditions: ['crossWind'], notes: 'Aviation générale principalement.' }
      ],
      specialNotes: [
        'Aéroport binational FR/CH.',
        'Pistes 08/26 fermées la nuit.',
        'ILS CAT III sur 15.'
      ]
    },
    LFST: {
      runways: [
        { id: '05', heading: 49, lengthFt: 7874, surface: 'asphalt', ils: true },
        { id: '23', heading: 229, lengthFt: 7874, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'Face sud-ouest (préférentielle)', arrRunways: ['23'], depRunways: ['23'], windFrom: 130, windTo: 310, priority: 1, conditions: [], notes: 'ILS CAT III sur 23.' },
        { name: 'Face nord-est', arrRunways: ['05'], depRunways: ['05'], windFrom: 310, windTo: 130, minSpeed: 5, priority: 2, conditions: [] }
      ],
      specialNotes: ['ILS CAT III sur 23.']
    },
    LFLB: {
      runways: [
        { id: '18', heading: 182, lengthFt: 6824, surface: 'asphalt', ils: false },
        { id: '36', heading: 2, lengthFt: 6824, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'QFU 18 (atterrissages préférentiels)', arrRunways: ['18'], depRunways: ['36'], windFrom: 90, windTo: 270, priority: 1, conditions: [], notes: 'Procédure montagne : ATT 18 sud, DEC 36 nord vers le lac.' },
        { name: 'QFU 36 (vent fort du nord)', arrRunways: ['36'], depRunways: ['18'], windFrom: 270, windTo: 90, minSpeed: 10, priority: 2, conditions: [], notes: 'Inversion seulement si vent du nord > 10 kt.' }
      ],
      specialNotes: [
        'Aéroport de montagne - approches RNP AR.',
        'TA non standard (6500 ft).',
        'Pas d\'ILS - LOC/DME, VOR/DME, RNP.',
        'Charter ski hivernal intense.'
      ]
    },
    TFFF: {
      runways: [
        { id: '10', heading: 100, lengthFt: 10827, surface: 'asphalt', ils: true },
        { id: '28', heading: 280, lengthFt: 10827, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'Face est (alizés)', arrRunways: ['10'], depRunways: ['10'], windFrom: 10, windTo: 190, priority: 1, conditions: [], notes: 'Alizés ENE dominants. ILS CAT I sur 10.' },
        { name: 'Face ouest', arrRunways: ['28'], depRunways: ['28'], windFrom: 190, windTo: 10, minSpeed: 5, priority: 2, conditions: [], notes: 'Rare (perturbations tropicales).' }
      ],
      specialNotes: ['Saison cyclonique juin-novembre.']
    },
    TFFR: {
      runways: [
        { id: '12', heading: 117, lengthFt: 11499, surface: 'asphalt', ils: true },
        { id: '30', heading: 297, lengthFt: 11499, surface: 'asphalt', ils: true }
      ],
      configurations: [
        { name: 'Face 12 (alizés)', arrRunways: ['12'], depRunways: ['12'], windFrom: 30, windTo: 210, priority: 1, conditions: [] },
        { name: 'Face 30', arrRunways: ['30'], depRunways: ['30'], windFrom: 210, windTo: 30, minSpeed: 5, priority: 2, conditions: [] }
      ],
      specialNotes: ['ILS CAT I sur les deux QFU.']
    },
    TFFJ: {
      runways: [
        { id: '10', heading: 99, lengthFt: 2133, surface: 'asphalt', ils: false },
        { id: '28', heading: 279, lengthFt: 2133, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'ATT 10 / DEP 28 (procédure standard)', arrRunways: ['10'], depRunways: ['28'], windFrom: 0, windTo: 360, priority: 1, conditions: ['visualOnly', 'pilotRated'], notes: 'Procédure quasi systématique imposée par le relief (col La Tourmente). Approche visuelle obligatoire.' },
        { name: 'ATT 28 / DEP 10 (exceptionnel)', arrRunways: ['28'], depRunways: ['10'], windFrom: 250, windTo: 310, minSpeed: 10, priority: 2, conditions: ['strongWestWind', 'pilotRated'] }
      ],
      specialNotes: [
        'TA anomalie 1500 ft (géographie / relief).',
        'Piste très courte (~650 m), pilote agréé TFFJ requis.',
        'VFR jour uniquement, PPR.'
      ]
    },
    FMEE: {
      runways: [
        { id: '12', heading: 124, lengthFt: 10499, surface: 'asphalt', ils: true },
        { id: '30', heading: 304, lengthFt: 10499, surface: 'asphalt', ils: false },
        { id: '14', heading: 144, lengthFt: 5577, surface: 'asphalt', ils: false },
        { id: '32', heading: 324, lengthFt: 5577, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'Face 12/14 (alizés SE)', arrRunways: ['12'], depRunways: ['12', '14'], windFrom: 30, windTo: 220, priority: 1, conditions: [], notes: '14 (secondaire) aviation légère / entraînement.' },
        { name: 'Face 30/32', arrRunways: ['30'], depRunways: ['30', '32'], windFrom: 220, windTo: 30, minSpeed: 5, priority: 2, conditions: [], notes: 'Rare hors cyclone. Pas d\'ILS face 30.' }
      ],
      specialNotes: [
        'Doublet parallèle décalé.',
        'Cisaillements possibles (relief Piton de la Fournaise).',
        'ILS CAT I uniquement RWY 12.'
      ]
    },
    FMCZ: {
      runways: [
        { id: '16', heading: 162, lengthFt: 6234, surface: 'asphalt', ils: false },
        { id: '34', heading: 342, lengthFt: 6234, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'Face 34 (mousson sèche)', arrRunways: ['34'], depRunways: ['34'], windFrom: 270, windTo: 90, priority: 1, conditions: [], notes: 'Mai-octobre, alizés SE déviés.' },
        { name: 'Face 16 (mousson humide)', arrRunways: ['16'], depRunways: ['16'], windFrom: 90, windTo: 270, priority: 2, conditions: [], notes: 'Novembre-avril, kashkazi NW.' }
      ],
      specialNotes: [
        'Piste sur Petite-Terre, environnement insulaire restreint.',
        'Pas d\'ILS - RNP/VOR/NDB.'
      ]
    },
    SOCA: {
      runways: [
        { id: '08', heading: 81, lengthFt: 10499, surface: 'asphalt', ils: true },
        { id: '26', heading: 261, lengthFt: 10499, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'Face 08 (alizés)', arrRunways: ['08'], depRunways: ['08'], windFrom: 350, windTo: 170, priority: 1, conditions: [], notes: 'Alizés NE dominants. ILS CAT I.' },
        { name: 'Face 26', arrRunways: ['26'], depRunways: ['26'], windFrom: 170, windTo: 350, minSpeed: 5, priority: 2, conditions: [], notes: 'Rare (lignes de grains). Approche non-précision.' }
      ],
      specialNotes: ['Activité orageuse intense saison humide (ZCIT).']
    },
    NWWW: {
      ta: 5000,
      tl: [
        { minQnh: 1032, maxQnh: 1050, flightLevel: 110 },
        { minQnh: 1014, maxQnh: 1031, flightLevel: 120 },
        { minQnh: 996,  maxQnh: 1013, flightLevel: 130 },
        { minQnh: 978,  maxQnh: 995,  flightLevel: 140 }
      ],
      runways: [
        { id: '11', heading: 113, lengthFt: 10892, surface: 'asphalt', ils: true },
        { id: '29', heading: 293, lengthFt: 10892, surface: 'asphalt', ils: false }
      ],
      configurations: [
        { name: 'Face 11 (alizés SE)', arrRunways: ['11'], depRunways: ['11'], windFrom: 30, windTo: 210, priority: 1, conditions: [], notes: 'ILS CAT I sur 11.' },
        { name: 'Face 29', arrRunways: ['29'], depRunways: ['29'], windFrom: 210, windTo: 30, minSpeed: 5, priority: 2, conditions: [], notes: 'Approche RNP/VOR.' }
      ],
      specialNotes: [
        'AIP gérée par SNA-NC (Nouvelle-Calédonie).',
        'Système TL FIXE par tranche QNH - bornes à valider AIP NWWW AD 2.16.'
      ]
    }
  };
}

function readOurAirports() {
  const airports = parseCsv(readFileSync(OA_AIRPORTS, 'utf-8'));
  const runways = parseCsv(readFileSync(OA_RUNWAYS, 'utf-8'));
  const aHead = airports.shift();
  const rHead = runways.shift();
  const aIdx = Object.fromEntries(aHead.map((h, i) => [h, i]));
  const rIdx = Object.fromEntries(rHead.map((h, i) => [h, i]));

  const airportById = new Map();
  const airportByIcao = new Map();
  for (const a of airports) {
    if (!a[aIdx.ident]) continue;
    const elev = parseInt(a[aIdx.elevation_ft], 10);
    const lat = parseFloat(a[aIdx.latitude_deg]);
    const lon = parseFloat(a[aIdx.longitude_deg]);
    const info = {
      ident: a[aIdx.ident],
      name: a[aIdx.name],
      country: a[aIdx.iso_country],
      elevationFt: Number.isFinite(elev) ? elev : null,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lon) ? lon : null
    };
    airportById.set(a[aIdx.id], info);
    airportByIcao.set(info.ident.toUpperCase(), info);
  }
  const runwaysByIcao = new Map();
  for (const r of runways) {
    const airport = airportById.get(r[rIdx.airport_ref]);
    if (!airport) continue;
    if (r[rIdx.closed] === '1') continue;
    const icao = airport.ident.toUpperCase();
    if (!runwaysByIcao.has(icao)) runwaysByIcao.set(icao, []);
    const lengthFt = parseInt(r[rIdx.length_ft], 10) || undefined;
    const surface = (r[rIdx.surface] || '').toLowerCase();
    const surfaceNorm = surface.includes('asph') ? 'asphalt'
      : surface.includes('conc') ? 'concrete'
      : surface.includes('grass') || surface.includes('turf') ? 'grass'
      : 'other';
    const leHeading = parseFloat(r[rIdx.le_heading_degT]);
    const heHeading = parseFloat(r[rIdx.he_heading_degT]);
    if (r[rIdx.le_ident]) {
      runwaysByIcao.get(icao).push({
        id: r[rIdx.le_ident].trim(),
        heading: Number.isFinite(leHeading) ? Math.round(leHeading) : null,
        lengthFt,
        surface: surfaceNorm,
        ils: false
      });
    }
    if (r[rIdx.he_ident]) {
      runwaysByIcao.get(icao).push({
        id: r[rIdx.he_ident].trim(),
        heading: Number.isFinite(heHeading) ? Math.round(heHeading) : null,
        lengthFt,
        surface: surfaceNorm,
        ils: false
      });
    }
  }
  return { runwaysByIcao, airportByIcao };
}

function monopisteConfig(runways) {
  if (runways.length !== 2) return [];
  const [a, b] = runways;
  if (a.heading == null || b.heading == null) return [];
  const aFrom = (a.heading + 270) % 360;
  const aTo = (a.heading + 90) % 360;
  const bFrom = (b.heading + 270) % 360;
  const bTo = (b.heading + 90) % 360;
  return [
    {
      name: `QFU ${a.id}`,
      arrRunways: [a.id],
      depRunways: [a.id],
      windFrom: aFrom,
      windTo: aTo,
      priority: 1,
      conditions: []
    },
    {
      name: `QFU ${b.id}`,
      arrRunways: [b.id],
      depRunways: [b.id],
      windFrom: bFrom,
      windTo: bTo,
      priority: 1,
      conditions: []
    }
  ];
}

function buildProfile(icao, runwaysByIcao, airportByIcao) {
  const overlay = RESEARCH[icao];
  const name = NAMES[icao] || icao;
  const region = regionMap.get(icao) || 'metro';
  const ta = overlay?.ta ?? taMap.get(icao) ?? 5000;
  const tl = overlay?.tl ?? (taMap.has(icao) || icao === 'LFLB' ? tlForTa(ta) : stdTl.metro);
  const oa = airportByIcao.get(icao);

  let runways = overlay?.runways;
  if (!runways) {
    const list = runwaysByIcao.get(icao) || [];
    runways = list.filter((r) => r.heading != null);
  }
  let configurations = overlay?.configurations;
  if (!configurations) {
    configurations = monopisteConfig(runways);
  }
  const profile = {
    icao,
    name,
    region,
    transitionAltitude: ta,
    transitionLevels: tl,
    runways,
    configurations,
    specialNotes: overlay?.specialNotes ?? [],
    sources: overlay
      ? ['AIP France / OpenAIP / IVAO MANEX (validation utilisateur requise)']
      : ['OurAirports (CC0) - configuration générique cap±90°, validation utilisateur requise']
  };
  if (oa?.elevationFt != null) profile.elevationFt = oa.elevationFt;
  if (oa?.latitude != null) profile.latitude = oa.latitude;
  if (oa?.longitude != null) profile.longitude = oa.longitude;
  return profile;
}

function main() {
  console.log('Loading OurAirports data...');
  const { runwaysByIcao, airportByIcao } = readOurAirports();
  console.log(`OurAirports: ${airportByIcao.size} airports indexed`);

  for (const f of readdirSync(OUT)) {
    if (f.endsWith('.json')) unlinkSync(join(OUT, f));
  }

  let written = 0;
  let withConfigs = 0;
  let monopiste = 0;
  let withElev = 0;
  for (const icao of FULL_LIST) {
    const profile = buildProfile(icao, runwaysByIcao, airportByIcao);
    if (profile.runways.length === 0) {
      console.warn(`  ! ${icao}: no runway data, skipping`);
      continue;
    }
    if (RESEARCH[icao]) withConfigs++;
    else monopiste++;
    if (profile.elevationFt != null) withElev++;
    writeFileSync(join(OUT, `${icao}.json`), JSON.stringify(profile, null, 2) + '\n', 'utf-8');
    written++;
  }
  console.log(`Wrote ${written} airports (${withConfigs} researched, ${monopiste} generic, ${withElev} with elevation)`);
}

main();
