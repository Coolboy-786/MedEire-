/*
 * DESIGN PATTERN: Factory (Pattern #5)
 *
 * userFactory.createUser(role, data) returns the correct Mongoose discriminator
 * instance without callers needing to import three separate model constructors
 * or branch on role themselves.
 *
 * Why: adding a new role means one new case here — no changes to services,
 * controllers, or any other layer. Callers stay decoupled from the concrete
 * discriminator models.
 *
 * How it helps: authService.register() calls createUser(role, data) and gets
 * back the right Mongoose document ready to be saved — regardless of role.
 */

const { Patient, Doctor, Admin } = require('../models/User');

const userFactory = {
  createUser(role, data) {
    switch (role) {
      case 'patient':
        return new Patient(data);
      case 'doctor':
        return new Doctor(data);
      case 'admin':
        return new Admin(data);
      default:
        throw Object.assign(new Error(`Unknown role: "${role}"`), {
          status: 400,
          code: 'INVALID_ROLE',
        });
    }
  },
};

module.exports = userFactory;
