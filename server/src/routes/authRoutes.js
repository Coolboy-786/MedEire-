const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { passport } = require('../config/passport');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../middleware/validate');

const router = Router();

// Tighter rate limit for auth endpoints — prevents brute-force and credential stuffing.
// 10 requests per minute per IP (spec requirement).
// Disabled in test mode so Jest suites don't trip the limit across multiple describe blocks.
const authLimiter = process.env.NODE_ENV === 'test'
  ? (req, res, next) => next()
  : rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many auth attempts. Try again in 1 minute.' } },
    });

// ── Email / Password ──────────────────────────────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login',    authLimiter, validate(loginSchema),    authController.login);

// ── Profile (JWT-protected) ───────────────────────────────────────────────────
router.get('/profile', authenticate, authController.getProfile);

// ── Google OAuth 2.0 ─────────────────────────────────────────────────────────
const googleConfigured =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'placeholder';

if (googleConfigured) {
  // Step 1: redirect user to Google consent screen
  router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  // Step 2: Google redirects back here after user approves
  router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user) => {
      if (err || !user) {
        const clientURL = process.env.CLIENT_URL || 'http://localhost:3000';
        return res.redirect(`${clientURL}/login?error=oauth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  }, authController.googleCallback);
} else {
  // Placeholder routes so the client gets a clear error instead of a 404
  router.get('/google', (req, res) => {
    res.status(503).json({
      error: { code: 'OAUTH_NOT_CONFIGURED', message: 'Google OAuth is not configured on this server.' },
    });
  });
  router.get('/google/callback', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_not_configured`);
  });
}

module.exports = router;
