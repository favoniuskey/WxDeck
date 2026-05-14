import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'airports');

const metroStd = [
  { icao: 'LFOB', name: 'Beauvais Tillé' },
  { icao: 'LFQQ', name: 'Lille Lesquin' },
  { icao: 'LFBO', name: 'Toulouse Blagnac' },
  { icao: 'LFBD', name: 'Bordeaux Mérignac' },
  { icao: 'LFBH', name: 'La Rochelle Île de Ré' },
  { icao: 'LFBI', name: 'Poitiers Biard' },
  { icao: 'LFBL', name: 'Limoges Bellegarde' },
  { icao: 'LFBP', name: 'Pau Pyrénées' },
  { icao: 'LFBZ', name: 'Biarritz Pays Basque' },
  { icao: 'LFML', name: 'Marseille Provence' },
  { icao: 'LFMN', name: 'Nice Côte d\'Azur' },
  { icao: 'LFMT', name: 'Montpellier Méditerranée' },
  { icao: 'LFLL', name: 'Lyon Saint-Exupéry' },
  { icao: 'LFLC', name: 'Clermont-Ferrand Auvergne' },
  { icao: 'LFKB', name: 'Bastia Poretta' },
  { icao: 'LFKJ', name: 'Ajaccio Napoléon Bonaparte' },
  { icao: 'LFRB', name: 'Brest Bretagne' },
  { icao: 'LFRN', name: 'Rennes Saint-Jacques' },
  { icao: 'LFRS', name: 'Nantes Atlantique' },
  { icao: 'LFJL', name: 'Metz-Nancy Lorraine' },
  { icao: 'LFSB', name: 'Bâle-Mulhouse' },
  { icao: 'LFST', name: 'Strasbourg Entzheim' }
];

const metroSpecial = [
  {
    icao: 'LFLB',
    name: 'Chambéry Aix-les-Bains',
    transitionAltitude: 6500,
    transitionLevels: [
      { minQnh: 1013, maxQnh: 1050, flightLevel: 80 },
      { minQnh: 977, maxQnh: 1012, flightLevel: 90 }
    ]
  }
];

const domTom = [
  {
    icao: 'TFFF',
    name: 'Martinique Aimé Césaire',
    region: 'dom-tom',
    transitionAltitude: 9000,
    transitionLevels: [
      { minQnh: 1013, maxQnh: 1048, flightLevel: 100 },
      { minQnh: 977, maxQnh: 1012, flightLevel: 110 }
    ]
  },
  {
    icao: 'TFFR',
    name: 'Guadeloupe Maryse Condé',
    region: 'dom-tom',
    transitionAltitude: 9000,
    transitionLevels: [
      { minQnh: 1013, maxQnh: 1048, flightLevel: 100 },
      { minQnh: 977, maxQnh: 1012, flightLevel: 110 }
    ]
  },
  {
    icao: 'SOCA',
    name: 'Cayenne Félix Éboué',
    region: 'dom-tom',
    transitionAltitude: 3000,
    transitionLevels: [
      { minQnh: 1013, maxQnh: 1048, flightLevel: 40 },
      { minQnh: 977, maxQnh: 1012, flightLevel: 50 }
    ]
  },
  {
    icao: 'FMEE',
    name: 'La Réunion Roland Garros',
    region: 'dom-tom',
    transitionAltitude: 12000,
    transitionLevels: [
      { minQnh: 1013, maxQnh: 1048, flightLevel: 130 },
      { minQnh: 977, maxQnh: 1012, flightLevel: 140 }
    ]
  },
  {
    icao: 'FMCZ',
    name: 'Mayotte Marcel Henry',
    region: 'dom-tom',
    transitionAltitude: 4000,
    transitionLevels: [
      { minQnh: 1013, maxQnh: 1048, flightLevel: 50 },
      { minQnh: 977, maxQnh: 1012, flightLevel: 60 }
    ]
  }
];

const stdMetroProfile = (icao, name) => ({
  icao,
  name,
  region: 'metro',
  transitionAltitude: 5000,
  transitionLevels: [
    { minQnh: 1013, maxQnh: 1050, flightLevel: 60 },
    { minQnh: 977, maxQnh: 1012, flightLevel: 70 }
  ],
  runways: [],
  preferredRunwaySets: []
});

const all = [
  ...metroStd.map((a) => stdMetroProfile(a.icao, a.name)),
  ...metroSpecial.map((a) => ({
    icao: a.icao,
    name: a.name,
    region: 'metro',
    transitionAltitude: a.transitionAltitude,
    transitionLevels: a.transitionLevels,
    runways: [],
    preferredRunwaySets: []
  })),
  ...domTom.map((a) => ({
    icao: a.icao,
    name: a.name,
    region: a.region,
    transitionAltitude: a.transitionAltitude,
    transitionLevels: a.transitionLevels,
    runways: [],
    preferredRunwaySets: []
  }))
];

let written = 0;
let skipped = 0;
for (const profile of all) {
  const file = join(OUT, `${profile.icao}.json`);
  if (existsSync(file)) {
    skipped++;
    continue;
  }
  writeFileSync(file, JSON.stringify(profile, null, 2) + '\n', 'utf-8');
  written++;
}
console.log(`gen-airports: wrote ${written}, skipped ${skipped} (already existed)`);
