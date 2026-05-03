/*
 * Analytics Service — reads exclusively from the TriageLog collection.
 *
 * TriageLog is anonymised by design: no patientId, no name, no contact details.
 * All five aggregation pipelines operate only on this collection, which means
 * the analytics layer can never expose individual patient data.
 *
 * Field note: TriageLog uses `timestamp` (an explicit Date field) rather than
 * mongoose's auto-generated `createdAt`. All date filters must use `timestamp`.
 */

const TriageLog = require('../models/TriageLog');

const analyticsService = {
  /*
   * Pipeline 1 — Total triage assessments in the date range.
   *
   * $match  → filters documents to the requested window
   * $count  → collapses the whole result set into a single { total: N } doc
   *
   * Returns a plain number (0 if no documents matched).
   */
  async getTotalConsultations(from, to) {
    const result = await TriageLog.aggregate([
      { $match: { timestamp: { $gte: from, $lte: to } } },
      { $count: 'total' },
    ]);
    return result[0]?.total ?? 0;
  },

  /*
   * Pipeline 2 — Top 10 reported symptoms, ranked by frequency.
   *
   * $match  → date window
   * $unwind → explodes the symptoms array: one document per symptom string,
   *           so a log with ["cough", "fever"] becomes two pipeline documents
   * $group  → counts how many times each symptom string appears
   * $sort   → most frequent first
   * $limit  → keep only the top 10
   * $project→ reshape: { symptom, count } (drop internal _id)
   */
  async getTopSymptoms(from, to) {
    return TriageLog.aggregate([
      { $match: { timestamp: { $gte: from, $lte: to } } },
      { $unwind: '$symptoms' },
      { $group: { _id: '$symptoms', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, symptom: '$_id', count: 1 } },
    ]);
  },

  /*
   * Pipeline 3 — Regional distribution: triage count per Irish county.
   *
   * $match  → date window + excludes logs where county is missing/null/empty
   *           (patients who skipped county selection remain fully anonymous)
   * $group  → count per county string
   * $sort   → highest-volume counties first
   * $project→ reshape: { county, count }
   */
  async getRegionalDistribution(from, to) {
    return TriageLog.aggregate([
      {
        $match: {
          timestamp: { $gte: from, $lte: to },
          county: { $exists: true, $ne: null, $gt: '' },
        },
      },
      { $group: { _id: '$county', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $project: { _id: 0, county: '$_id', count: 1 } },
    ]);
  },

  /*
   * Pipeline 4 — Triage severity distribution (low / medium / high).
   *
   * $match  → date window
   * $group  → count per severity level (enum: 'low', 'medium', 'high')
   * $sort   → alphabetical so the chart order is consistent across renders
   * $project→ reshape: { severity, count }
   */
  async getSeverityDistribution(from, to) {
    return TriageLog.aggregate([
      { $match: { timestamp: { $gte: from, $lte: to } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort:  { _id: 1 } },
      { $project: { _id: 0, severity: '$_id', count: 1 } },
    ]);
  },

  /*
   * Pipeline 5 — Daily triage volume over time (line chart buckets).
   *
   * $match         → date window
   * $group         → $dateToString collapses each timestamp to its calendar day
   *                  (YYYY-MM-DD), then $sum counts triages per day bucket
   * $sort          → ascending date so the line chart reads left-to-right
   * $project       → reshape: { date, count }
   */
  async getTrends(from, to) {
    return TriageLog.aggregate([
      { $match: { timestamp: { $gte: from, $lte: to } } },
      {
        $group: {
          _id:   { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort:    { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ]);
  },
};

module.exports = analyticsService;
