const appointmentService = require('../services/appointmentService');

const appointmentController = {
  async getAvailableDoctors(req, res, next) {
    try {
      const doctors = await appointmentService.getAvailableDoctors();
      res.json({ doctors });
    } catch (err) {
      next(err);
    }
  },

  async book(req, res, next) {
    try {
      const { doctorId, day, timeSlot, symptoms, triageLevel, appointmentType } = req.body;
      const appt = await appointmentService.book({
        patientId: req.user._id,
        doctorId, day, timeSlot, symptoms, triageLevel, appointmentType,
      });
      res.status(201).json({ appointment: appt });
    } catch (err) {
      next(err);
    }
  },

  async getMyAppointments(req, res, next) {
    try {
      const appts = await appointmentService.getPatientAppointments(req.user._id);
      res.json({ appointments: appts });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const appt = await appointmentService.cancelAppointment(req.params.id, req.user._id);
      res.json({ appointment: appt });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = appointmentController;
