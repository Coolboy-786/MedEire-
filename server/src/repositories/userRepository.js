/*
 * DESIGN PATTERN: Repository (Pattern #2)
 *
 * All Mongoose queries live here. Services and controllers never touch the ORM
 * directly — they call repository methods instead.
 *
 * Why: if we swap MongoDB for another DB, only this file changes.
 * Services remain testable by mocking just this module.
 *
 * How it helps: authService.login() calls findByEmailWithPassword() and has no
 * idea it's talking to Mongoose — the query details are hidden here.
 */

const { User, Doctor } = require('../models/User');

const userRepository = {
  // Explicitly include passwordHash, which is hidden by default (select: false).
  // Only used during login — never expose this to HTTP responses.
  async findByEmailWithPassword(email) {
    return User.findOne({ email }).select('+passwordHash');
  },

  async findByEmail(email) {
    return User.findOne({ email });
  },

  async findById(id) {
    return User.findById(id);
  },

  async findByGoogleId(googleId) {
    return User.findOne({ googleId });
  },

  async save(doc) {
    return doc.save();
  },

  async findAllDoctors(filter = {}) {
    // Using Doctor discriminator so the role filter is applied automatically.
    return Doctor.find(filter);
  },

  async findAllByRoles(roles = ['patient', 'doctor']) {
    return User.find({ role: { $in: roles } }).sort({ role: 1, createdAt: -1 });
  },

  async updateById(id, updates) {
    return User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
  },

  // Must use the Doctor discriminator model so Mongoose knows about Doctor-specific fields
  // (verified, availability). The base User model ignores discriminator fields in updates.
  async verifyDoctorById(id) {
    return Doctor.findByIdAndUpdate(id, { $set: { verified: true } }, { new: true });
  },

  async updateDoctorById(id, updates) {
    return Doctor.findByIdAndUpdate(id, { $set: updates }, { new: true });
  },

  async countAll() {
    return User.countDocuments();
  },
};

module.exports = userRepository;
