const appointmentService = require('../services/appointmentService');
const userRepository     = require('../repositories/userRepository');

const doctorController = {
  async getAvailability(req, res, next) {
    try {
      const doctor = await userRepository.findById(req.user._id);
      res.json({ availability: doctor.availability || [] });
    } catch (err) {
      next(err);
    }
  },

  async updateAvailability(req, res, next) {
    try {
      const doctor = await appointmentService.updateAvailability(
        req.user._id,
        req.body.availability
      );
      res.json({ availability: doctor.availability });
    } catch (err) {
      next(err);
    }
  },

  async getAppointments(req, res, next) {
    try {
      const appts = await appointmentService.getDoctorAppointments(req.user._id);
      res.json({ appointments: appts });
    } catch (err) {
      next(err);
    }
  },

  async completeConsultation(req, res, next) {
    try {
      const { doctorNotes, prescription } = req.body;
      const appt = await appointmentService.completeConsultation(
        req.params.id,
        req.user._id,
        { doctorNotes, prescription }
      );
      res.json({ appointment: appt });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = doctorController;
