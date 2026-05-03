/*
 * Passport strategies are registered once at startup (configurePassport) and
 * stay alive for the lifetime of the process. Keeping them here — separate from
 * server.js — follows the Single Responsibility principle and makes it trivial
 * to add new strategies (e.g. Apple, GitHub) without touching the app bootstrap.
 */

const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const userRepository = require('../repositories/userRepository');
const { authService } = require('../services/authService');
const logger = require('../middleware/logger');

const configurePassport = () => {
  // ── JWT Strategy ────────────────────────────────────────────────────────────
  // Extracts the Bearer token from the Authorization header, verifies the
  // signature, and attaches the full DB user to req.user for downstream middleware.
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await userRepository.findById(payload.userId);
          if (!user || !user.active) return done(null, false);
          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  // ── Google OAuth 2.0 Strategy ────────────────────────────────────────────────
  // Only registered when real credentials are present. The login page shows a
  // "not configured" message when GOOGLE_CLIENT_ID is the placeholder string.
  const googleConfigured =
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'placeholder';

  if (googleConfigured) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const googleId = profile.id;
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName;

            if (!email) return done(new Error('No email returned from Google'), false);

            const { user, token } = await authService.handleGoogleUser({ googleId, email, name });
            // Attach token to the user object so the callback controller can read it.
            return done(null, { ...user, _oauthToken: token });
          } catch (err) {
            return done(err, false);
          }
        }
      )
    );
    logger.info('Google OAuth strategy registered');
  } else {
    logger.warn('Google OAuth: GOOGLE_CLIENT_ID not set — Google login disabled');
  }
};

module.exports = { passport, configurePassport };
