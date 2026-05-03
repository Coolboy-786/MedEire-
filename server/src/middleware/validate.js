/*
 * DESIGN PATTERN: Middleware Chain (Pattern #3)
 *
 * validate(schema) is a middleware factory. Pass a Joi schema and it returns
 * an Express middleware that validates req.body, strips unknown fields, and
 * forwards a 400 error if validation fails.
 *
 * This ensures no controller ever sees unvalidated input.
 */

const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // Return all errors at once, not just the first
    stripUnknown: true,  // Remove fields not in the schema (prevents mass-assignment)
  });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(Object.assign(new Error(message), { status: 400, code: 'VALIDATION_ERROR' }));
  }

  req.body = value; // Replace with sanitized version
  next();
};

// ── Auth validation schemas ───────────────────────────────────────────────────

const registerSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
  name: Joi.string().min(2).max(100).trim().required(),
  // Admin registration not allowed via the public endpoint — seeded at startup
  role: Joi.string().valid('patient', 'doctor').required(),
  language: Joi.string().valid('en', 'ga').default('en'),

  // Patient-only fields
  dob: Joi.date().max('now').optional(),
  gender: Joi.string()
    .valid('male', 'female', 'other', 'prefer_not_to_say')
    .optional(),
  county: Joi.string().optional(),
  phone: Joi.string()
    .pattern(/^[\d\s\-()+]{7,20}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Phone number format is invalid' }),

  // Doctor-only fields (required when role === 'doctor')
  licenseNumber: Joi.when('role', {
    is: 'doctor',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().optional(),
  }),
  specialty: Joi.when('role', {
    is: 'doctor',
    then: Joi.string().trim().required(),
    otherwise: Joi.string().optional(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ── Phase 3 validation schemas ────────────────────────────────────────────────

const triageSchema = Joi.object({
  symptoms: Joi.array().items(Joi.string().trim().min(2).max(200)).min(1).max(15).required(),
  county:   Joi.string().optional(),
  ageGroup: Joi.string().valid('0-17', '18-34', '35-54', '55-74', '75+').optional(),
});

const bookAppointmentSchema = Joi.object({
  doctorId:    Joi.string().required(),
  day:         Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun').required(),
  timeSlot:    Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  appointmentType: Joi.string().valid('clinic', 'video').default('clinic'),
  symptoms:    Joi.array().items(Joi.string()).optional(),
  triageLevel: Joi.string().valid('low', 'medium', 'high').optional(),
});

const consultationSchema = Joi.object({
  doctorNotes:  Joi.string().min(5).max(5000).required(),
  prescription: Joi.string().max(2000).allow('').optional(),
});

const availabilitySchema = Joi.object({
  availability: Joi.array().items(
    Joi.object({
      day:   Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun').required(),
      slots: Joi.array().items(Joi.string().pattern(/^\d{2}:\d{2}$/)).required(),
    })
  ).required(),
});

module.exports = validate;
module.exports.registerSchema      = registerSchema;
module.exports.loginSchema         = loginSchema;
module.exports.triageSchema        = triageSchema;
module.exports.bookAppointmentSchema = bookAppointmentSchema;
module.exports.consultationSchema  = consultationSchema;
module.exports.availabilitySchema  = availabilitySchema;
