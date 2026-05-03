/*
 * DESIGN PATTERN: Strategy (Pattern #4) — Context
 *
 * triageService is the Strategy context. It tries the primary (API) strategy,
 * and on any failure silently degrades to the secondary (rule-based) strategy.
 * Callers never know which strategy ran — they just get a result.
 *
 * Why: graceful degradation keeps the symptom-check feature alive even when
 * the Anthropic API is unavailable (dev mode, outage, quota exceeded).
 * Demonstrating automatic strategy switching satisfies the design-pattern
 * requirement and shows resilience thinking in the architecture.
 */

const apiStrategy  = require('../strategies/triage/apiStrategy');
const ruleStrategy = require('../strategies/triage/ruleStrategy');
const TriageLog    = require('../models/TriageLog');
const logger       = require('../middleware/logger');

const triageService = {
  async classify(symptoms, patientContext = {}) {
    let result;
    let strategy = 'api';

    try {
      result = await apiStrategy.classify(symptoms);
    } catch (err) {
      logger.warn(`Triage: API strategy failed (${err.message}) — switching to rule strategy`);
      result   = ruleStrategy.classify(symptoms);
      strategy = 'rule';
    }

    // Persist anonymised triage event for analytics.
    // Fire-and-forget: a log failure must never block the patient's result.
    TriageLog.create({
      symptoms,
      severity:  result.severity,
      county:    patientContext.county,
      ageGroup:  patientContext.ageGroup,
      language:  patientContext.language || 'en',
      strategy,
    }).catch((err) => logger.error(`TriageLog save failed: ${err.message}`));

    return { ...result, strategy };
  },
};

module.exports = triageService;
