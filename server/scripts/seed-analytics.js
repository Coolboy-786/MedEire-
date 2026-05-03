/*
 * Seed script — inserts ~200 anonymised TriageLog entries spread across
 * the last 30 days, covering a representative mix of:
 *   - Irish counties (all 32)
 *   - Triage severities (low 45%, medium 35%, high 20%)
 *   - Common symptoms (15 realistic choices)
 *   - Age groups and languages
 *   - Both triage strategies (api / rule)
 *
 * Run inside the server container:
 *   docker exec medeire_server node scripts/seed-analytics.js
 *
 * Safe to run repeatedly — clears existing TriageLog documents first.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const TriageLog = require('../src/models/TriageLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medeire';

const COUNTIES = [
  'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford',
  'Wicklow', 'Kildare', 'Meath', 'Louth', 'Kerry',
  'Clare', 'Tipperary', 'Wexford', 'Kilkenny', 'Carlow',
  'Laois', 'Offaly', 'Westmeath', 'Longford', 'Roscommon',
  'Mayo', 'Sligo', 'Leitrim', 'Cavan', 'Monaghan',
  'Donegal', 'Antrim', 'Armagh', 'Down', 'Fermanagh',
  'Londonderry', 'Tyrone',
];

// Weighted so Dublin/Cork/Galway appear more frequently — reflects population
const COUNTY_WEIGHTS = COUNTIES.map((c) => {
  if (['Dublin', 'Cork', 'Galway'].includes(c))  return 8;
  if (['Limerick', 'Waterford', 'Kerry'].includes(c)) return 4;
  return 1;
});

const SYMPTOMS_POOL = [
  'headache', 'fever', 'cough', 'fatigue', 'sore throat',
  'shortness of breath', 'chest pain', 'nausea', 'dizziness', 'back pain',
  'rash', 'joint pain', 'abdominal pain', 'runny nose', 'earache',
];

// Severity bucket probabilities
const SEVERITY_DIST = [
  { value: 'low',    weight: 45 },
  { value: 'medium', weight: 35 },
  { value: 'high',   weight: 20 },
];

const AGE_GROUPS  = ['0-17', '18-34', '35-54', '55-74', '75+'];
const LANGUAGES   = ['en', 'en', 'en', 'en', 'ga']; // 80% English, 20% Irish
const STRATEGIES  = ['rule', 'rule', 'rule', 'api']; // 75% rule, 25% api

// ── Helpers ───────────────────────────────────────────────────────────────────

function weightedRandom(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTimestamp(daysBack) {
  const now   = Date.now();
  const start = now - daysBack * 24 * 60 * 60 * 1000;
  return new Date(start + Math.random() * (now - start));
}

// Returns 1–4 random symptoms, biased toward the severity level
function pickSymptoms(severity) {
  const count = Math.floor(Math.random() * 3) + 1; // 1–3
  const shuffled = [...SYMPTOMS_POOL].sort(() => Math.random() - 0.5);

  if (severity === 'high') {
    // High-severity entries are more likely to include chest pain / SOB
    const serious = ['chest pain', 'shortness of breath'];
    const rest    = shuffled.filter((s) => !serious.includes(s));
    return [...serious.slice(0, 1), ...rest].slice(0, count + 1);
  }

  return shuffled.slice(0, count);
}

// ── Build entries ─────────────────────────────────────────────────────────────

function buildEntries(n) {
  return Array.from({ length: n }, () => {
    const severity = weightedRandom(
      SEVERITY_DIST.map((s) => s.value),
      SEVERITY_DIST.map((s) => s.weight)
    );

    return {
      symptoms:  pickSymptoms(severity),
      severity,
      county:    weightedRandom(COUNTIES, COUNTY_WEIGHTS),
      ageGroup:  pick(AGE_GROUPS),
      language:  pick(LANGUAGES),
      strategy:  pick(STRATEGIES),
      timestamp: randomTimestamp(30),
    };
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB:', MONGO_URI.replace(/\/\/.*@/, '//***@'));

  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  const before = await TriageLog.countDocuments();
  await TriageLog.deleteMany({});
  console.log(`Cleared ${before} existing TriageLog documents.`);

  const entries = buildEntries(200);
  await TriageLog.insertMany(entries);

  const counts = await TriageLog.aggregate([
    { $group: { _id: '$severity', n: { $sum: 1 } } },
    { $sort:  { _id: 1 } },
  ]);

  console.log('\nInserted 200 TriageLog entries:');
  counts.forEach(({ _id, n }) => console.log(`  ${_id.padEnd(8)} ${n}`));

  const countyCount = await TriageLog.distinct('county');
  console.log(`  counties covered: ${countyCount.length}`);

  await mongoose.disconnect();
  console.log('\nDone. Analytics seed complete.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
