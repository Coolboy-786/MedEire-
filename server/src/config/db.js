const mongoose = require('mongoose');
const logger = require('../middleware/logger');

const MAX_RETRIES = 6;
const RETRY_DELAY_MS = 5000;

// Retries the connection to allow the mongo container time to fully initialise.
// docker-compose `depends_on: condition: service_healthy` handles most of this,
// but the retry loop is a safety net for race conditions.
const connectDB = async (retriesLeft = MAX_RETRIES) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    if (retriesLeft === 0) {
      logger.error('MongoDB: all retries exhausted. Shutting down.');
      process.exit(1);
    }
    logger.warn(
      `MongoDB not ready — retrying in ${RETRY_DELAY_MS / 1000}s (${retriesLeft} attempts left)`
    );
    await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
    return connectDB(retriesLeft - 1);
  }
};

module.exports = { connectDB };
