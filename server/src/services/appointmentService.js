const appointmentRepository = require('../repositories/appointmentRepository');
const userRepository        = require('../repositories/userRepository');
const logger                = require('../middleware/logger');
const crypto                = require('crypto');

// Calculates the next calendar date for a given weekday + time.
// If today is that day but the time has already passed, returns next week.
const getNextOccurrence = (day, time) => {
  const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const target = DAY_INDEX[day];
  const [hours, mins] = time.split(':').map(Number);

  const now = new Date();
  let daysUntil = (target - now.getDay() + 7) % 7;

  if (daysUntil === 0) {
    // Same weekday — check if the slot is still in the future today
    const candidate = new Date(now);
    candidate.setHours(hours, mins, 0, 0);
    if (candidate <= now) daysUntil = 7;
  }

  const date = new Date(now);
  date.setDate(date.getDate() + daysUntil);
  date.setHours(hours, mins, 0, 0);
  return date;
};

const generateVideoRoomId = () => `medeire-${crypto.randomBytes(12).toString('hex')}`;

const appointmentService = {
  // Returns all verified doctors with their availability — used by the booking page.
  async getAvailableDoctors() {
    const doctors = await userRepository.findAllDoctors({ verified: true });
    return doctors.map((d) => d.toSafeObject());
  },

  async book({ patientId, doctorId, day, timeSlot, symptoms, triageLevel, appointmentType = 'clinic' }) {
    const doctor = await userRepository.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.verified) {
      throw Object.assign(new Error('Doctor not found or not verified'), {
        status: 404, code: 'DOCTOR_NOT_FOUND',
      });
    }

    // Confirm the doctor actually offers this day + slot
    const dayAvail = doctor.availability?.find((a) => a.day === day);
    if (!dayAvail || !dayAvail.slots.includes(timeSlot)) {
      throw Object.assign(new Error(`Doctor is not available on ${day} at ${timeSlot}`), {
        status: 400, code: 'SLOT_UNAVAILABLE',
      });
    }

    const scheduledAt = getNextOccurrence(day, timeSlot);

    const taken = await appointmentRepository.isSlotTaken(doctorId, scheduledAt);
    if (taken) {
      throw Object.assign(new Error('This slot has just been booked. Please choose another time.'), {
        status: 409, code: 'SLOT_TAKEN',
      });
    }

    const appt = await appointmentRepository.create({
      patientId, doctorId, scheduledAt,
      appointmentType,
      videoRoomId: appointmentType === 'video' ? generateVideoRoomId() : undefined,
      symptoms:    symptoms || [],
      triageLevel: triageLevel || undefined,
    });

    logger.info(
      `Appointment booked: type=${appointmentType} patient=${patientId} doctor=${doctorId} at=${scheduledAt.toISOString()}`
    );
    return appt;
  },

  async getPatientAppointments(patientId) {
    return appointmentRepository.findByPatient(patientId);
  },

  async cancelAppointment(appointmentId, patientId) {
    const appt = await appointmentRepository.findById(appointmentId);
    if (!appt) throw Object.assign(new Error('Appointment not found'), { status: 404, code: 'NOT_FOUND' });

    if (appt.patientId._id.toString() !== patientId.toString()) {
      throw Object.assign(new Error('Not your appointment'), { status: 403, code: 'FORBIDDEN' });
    }
    if (!['pending', 'confirmed'].includes(appt.status)) {
      throw Object.assign(new Error('Cannot cancel a completed or already-cancelled appointment'), {
        status: 400, code: 'INVALID_STATUS',
      });
    }

    return appointmentRepository.updateById(appointmentId, { status: 'cancelled' });
  },

  async getDoctorAppointments(doctorId) {
    return appointmentRepository.findByDoctor(doctorId);
  },

  async completeConsultation(appointmentId, doctorId, { doctorNotes, prescription }) {
    const appt = await appointmentRepository.findById(appointmentId);
    if (!appt) throw Object.assign(new Error('Appointment not found'), { status: 404, code: 'NOT_FOUND' });

    if (appt.doctorId._id.toString() !== doctorId.toString()) {
      throw Object.assign(new Error('Not your appointment'), { status: 403, code: 'FORBIDDEN' });
    }
    if (appt.status === 'completed') {
      throw Object.assign(new Error('Consultation already completed'), { status: 400, code: 'ALREADY_DONE' });
    }

    const updated = await appointmentRepository.updateById(appointmentId, {
      doctorNotes,
      prescription: prescription || '',
      status: 'completed',
    });

    logger.info(`Consultation completed: appointment=${appointmentId} doctor=${doctorId}`);
    return updated;
  },

  async updateAvailability(doctorId, availability) {
    return userRepository.updateDoctorById(doctorId, { availability });
  },
};

module.exports = appointmentService;
