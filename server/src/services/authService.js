const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const userFactory = require('../factories/userFactory');
const logger = require('../middleware/logger');

const SALT_ROUNDS = 12;

// Generates a signed JWT for a user document or plain user object.
const generateToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const authService = {
  async register(data) {
    const { email, password, name, role, ...rest } = data;

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw Object.assign(new Error('An account with this email already exists'), {
        status: 409,
        code: 'EMAIL_IN_USE',
      });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userDoc = userFactory.createUser(role, { email, passwordHash, name, ...rest });
    const saved = await userRepository.save(userDoc);

    logger.info(`Registered new ${role}: ${email}`);
    return { user: saved.toSafeObject(), token: generateToken(saved) };
  },

  async login(email, password) {
    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      // Intentionally vague — don't hint whether the email exists
      throw Object.assign(new Error('Invalid email or password'), {
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (!user.passwordHash) {
      throw Object.assign(
        new Error('This account was created via Google sign-in. Please log in with Google.'),
        { status: 401, code: 'OAUTH_ACCOUNT' }
      );
    }

    // Doctors must be admin-verified before they can access the platform.
    if (user.role === 'doctor' && !user.verified) {
      throw Object.assign(
        new Error('Your account is pending admin verification. You will be notified when approved.'),
        { status: 403, code: 'DOCTOR_UNVERIFIED' }
      );
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      throw Object.assign(new Error('Invalid email or password'), {
        status: 401,
        code: 'INVALID_CREDENTIALS',
      });
    }

    logger.info(`Login: ${email} (${user.role})`);
    return { user: user.toSafeObject(), token: generateToken(user) };
  },

  // Called by the Passport Google strategy after Google confirms the user's identity.
  // Creates a new patient account on first OAuth login; links existing accounts by email.
  async handleGoogleUser({ googleId, email, name }) {
    let user = await userRepository.findByGoogleId(googleId);
    if (user) {
      return { user: user.toSafeObject(), token: generateToken(user) };
    }

    user = await userRepository.findByEmail(email);
    if (user) {
      // Link the Google ID to an existing email/password account
      user = await userRepository.updateById(user._id, { googleId });
      return { user: user.toSafeObject(), token: generateToken(user) };
    }

    // First-time Google login → create a patient account automatically
    const doc = userFactory.createUser('patient', { email, name, googleId });
    const saved = await userRepository.save(doc);
    logger.info(`New patient via Google OAuth: ${email}`);
    return { user: saved.toSafeObject(), token: generateToken(saved) };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 404, code: 'NOT_FOUND' });
    }
    return user.toSafeObject();
  },
};

module.exports = { authService, generateToken };
