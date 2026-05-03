const mongoose = require('mongoose');

const { Schema } = mongoose;

// Intentionally stores NO patient identity — no patientId, no name, no email.
// Used exclusively by the analytics dashboard (Phase 4) to compute symptom
// trends and severity distributions across Irish counties.
const triageLogSchema = new Schema({
  symptoms:  [{ type: String }],
  severity:  { type: String, enum: ['low', 'medium', 'high'], required: true },
  county:    { type: String },
  ageGroup:  { type: String, enum: ['0-17', '18-34', '35-54', '55-74', '75+'] },
  language:  { type: String, default: 'en' },
  strategy:  { type: String, enum: ['api', 'rule'], default: 'rule' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TriageLog', triageLogSchema);
