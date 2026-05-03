/*
 * DESIGN PATTERN: Strategy (Pattern #4) — Rule-Based Triage
 *
 * This is the fallback strategy. It classifies symptoms using a keyword
 * dictionary and requires no external API or network call.
 *
 * Why: the AI API can be unavailable (dev mode, outage, missing key).
 * A rule-based fallback guarantees the triage feature always returns
 * something useful rather than crashing with a 503.
 *
 * How it helps: triageService.classify() calls this automatically when
 * apiStrategy throws — the caller never needs to handle the switch.
 */

const HIGH_RISK_KEYWORDS = [
  'chest pain', 'chest tightness', 'difficulty breathing', 'shortness of breath',
  "can't breathe", 'cannot breathe', 'heart attack', 'stroke', 'unconscious',
  'unresponsive', 'seizure', 'severe bleeding', 'coughing blood', 'vomiting blood',
  'sudden paralysis', 'sudden confusion', 'severe allergic', 'anaphylaxis',
];

const MEDIUM_RISK_KEYWORDS = [
  'fever', 'high temperature', 'persistent cough', 'severe headache', 'migraine',
  'abdominal pain', 'stomach pain', 'vomiting', 'nausea', 'dizziness', 'fainting',
  'rash', 'swollen', 'infection', 'wound', 'sprain', 'fracture', 'broken',
  'painful urination', 'urinary', 'ear pain', 'earache', 'eye pain',
  'back pain', 'joint pain', 'difficulty swallowing',
];

const classify = (symptoms) => {
  const text = symptoms.join(' ').toLowerCase();

  const triggeredHigh = HIGH_RISK_KEYWORDS.filter((kw) => text.includes(kw));
  if (triggeredHigh.length > 0) {
    return {
      severity: 'high',
      reasoning:
        'One or more reported symptoms may indicate a serious condition. Please seek urgent medical attention or call 112.',
      redFlags: triggeredHigh,
    };
  }

  const triggeredMedium = MEDIUM_RISK_KEYWORDS.filter((kw) => text.includes(kw));
  if (triggeredMedium.length > 0) {
    return {
      severity: 'medium',
      reasoning:
        'Your symptoms suggest a condition that should be evaluated by a doctor within 24–48 hours.',
      redFlags: [],
    };
  }

  return {
    severity: 'low',
    reasoning:
      'Symptoms appear mild. Rest, stay hydrated, and monitor your condition. Consult a GP if symptoms worsen or persist beyond a few days.',
    redFlags: [],
  };
};

module.exports = { classify };
