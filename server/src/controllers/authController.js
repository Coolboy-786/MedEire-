const { authService } = require('../services/authService');

/*
 * DESIGN PATTERN: MVC — Controller Layer (Pattern #1)
 *
 * Controllers handle HTTP concerns only: read from req, call a service method,
 * write to res. No business logic or database queries live here.
 */

const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      const user = await authService.getProfile(req.user._id);
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  // Step 1 of Google OAuth: Passport redirects the browser to Google's consent screen.
  // This handler is never reached — passport.authenticate() intercepts first.
  googleInitiate(req, res) {
    res.status(200).json({ message: 'Redirecting to Google...' });
  },

  // Step 3 of Google OAuth: Google redirected back, Passport verified the code,
  // req.user now contains { ...userObject, _oauthToken } set by the strategy.
  googleCallback(req, res) {
    const token = req.user._oauthToken;
    const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
    res.redirect(`${clientURL}/auth/callback?token=${token}`);
  },
};

module.exports = authController;
