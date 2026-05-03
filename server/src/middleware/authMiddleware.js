/*
 * DESIGN PATTERN: Middleware Chain (Pattern #3)
 *
 * authenticate wraps passport.authenticate in a callback so we can forward
 * errors to Express's centralized error handler (next(err)) instead of letting
 * Passport send its own plain-text 401 response.
 *
 * Usage: router.get('/protected', authenticate, handler)
 */

const { passport } = require('../config/passport');

const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) {
      return next(
        Object.assign(new Error('Authentication required'), {
          status: 401,
          code: 'UNAUTHORIZED',
        })
      );
    }
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = { authenticate };
