/*
 * DESIGN PATTERN: Repository (Pattern #2)
 *
 * All Appointment Mongoose queries live here.
 * Controllers and services never touch the ORM directly.
 */

const Appointment = require('../models/Appointment');

const appointmentRepository = {
  async create(data) {
    return Appointment.create(data);
  },

  // Patient view — populate doctor's name + specialty
  async findByPatient(patientId) {
    return Appointment.find({ patientId })
      .populate('doctorId', 'name specialty')
      .sort({ scheduledAt: -1 });
  },

  // Doctor view — populate patient's name + county
  async findByDoctor(doctorId) {
    return Appointment.find({ doctorId })
      .populate('patientId', 'name county')
      .sort({ scheduledAt: 1 });
  },

  async findById(id) {
    return Appointment.findById(id)
      .populate('patientId', 'name county language')
      .populate('doctorId', 'name specialty');
  },

  async updateById(id, updates) {
    return Appointment.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  },

  // Check if a doctor already has an active booking at a specific time
  async isSlotTaken(doctorId, scheduledAt) {
    const existing = await Appointment.findOne({
      doctorId,
      scheduledAt,
      status: { $in: ['pending', 'confirmed'] },
    });
    return !!existing;
  },
};

module.exports = appointmentRepository;
