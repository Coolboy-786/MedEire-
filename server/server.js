/*
 * DESIGN PATTERN: MVC — Entry Point (Pattern #1)
 *
 * server.js is the composition root. It wires together:
 *   Express → routes → controllers → services → repositories → models
 *
 * No business logic lives here. This file only configures cross-cutting
 * concerns (CORS, security headers, logging, passport) and delegates
 * everything else to dedicated modules.
 */

require('dotenv').config();

const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const rateLimit     = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { validateEnv } = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { passport, configurePassport } = require('./src/config/passport');
const { seedDemoUsers } = require('./src/utils/seedAdmin');
const logger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');
const routes = require('./src/routes');

validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── NoSQL injection prevention ────────────────────────────────────────────────
// Strips '$' and '.' from request body, query string, and params so operators
// like { "$gt": "" } cannot be smuggled through user-supplied JSON.
app.use(mongoSanitize());

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
  })
);

// ── Passport (stateless JWT — no sessions) ────────────────────────────────────
configurePassport();
app.use(passport.initialize());

// ── Request logging ───────────────────────────────────────────────────────────
app.use(logger.httpLogger);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Centralized error handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  await seedDemoUsers(); // Creates demo role accounts in non-production if missing
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`MedEire server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
};

// Only bind the port when run directly (node server.js / Docker CMD).
// When required by Jest, supertest manages its own ephemeral server — calling
// app.listen() here would collide with the already-running container process.
if (require.main === module) {
  start();
}

module.exports = app;
module.exports.start = start; // exported so tests can call connectDB + seed explicitly
