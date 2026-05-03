const userRepository = require('../repositories/userRepository');
const logger = require('../middleware/logger');

const adminController = {
  // Smoke-test endpoint — verifies the admin role middleware works end-to-end.
  ping(req, res) {
    res.json({ message: `Authenticated as admin: ${req.user.name}` });
  },

  async getPendingDoctors(req, res, next) {
    try {
      const doctors = await userRepository.findAllDoctors({ verified: false });
      res.json({ doctors: doctors.map((d) => d.toSafeObject()) });
    } catch (err) {
      next(err);
    }
  },

  async getUsers(req, res, next) {
    try {
      const allowedRoles = ['patient', 'doctor'];
      const requestedRole = req.query.role;
      const roles = requestedRole && allowedRoles.includes(requestedRole)
        ? [requestedRole]
        : allowedRoles;

      const users = await userRepository.findAllByRoles(roles);
      res.json({ users: users.map((u) => u.toSafeObject()) });
    } catch (err) {
      next(err);
    }
  },

  async verifyDoctor(req, res, next) {
    try {
      const doctor = await userRepository.verifyDoctorById(req.params.id);
      if (!doctor) {
        return next(Object.assign(new Error('Doctor not found'), { status: 404, code: 'NOT_FOUND' }));
      }
      logger.info(`Admin ${req.user.email} verified doctor ${doctor.email}`);
      res.json({ message: 'Doctor verified', doctor: doctor.toSafeObject() });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
