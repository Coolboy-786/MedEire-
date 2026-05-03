/*
 * DESIGN PATTERN: Middleware Chain (Pattern #3)
 *
 * authorise(roles) is a middleware factory that returns a middleware function
 * checking req.user.role against the allowed list.
 *
 * Must be placed AFTER authenticate in the middleware chain — authenticate
 * populates req.user; authorise reads it.
 *
 * Usage: router.get('/admin/only', authenticate, authorise(['admin']), handler)
 */

const authorise = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(
      Object.assign(new Error('Authentication required'), {
        status: 401,
        code: 'UNAUTHORIZED',
      })
    );
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(
      Object.assign(
        new Error('You do not have permission to access this resource'),
        { status: 403, code: 'FORBIDDEN' }
      )
    );
  }

  next();
};

module.exports = { authorise };
