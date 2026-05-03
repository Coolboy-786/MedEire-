// Validates that required environment variables are present at startup.
// Fail-fast is intentional: a missing secret at boot is safer than a runtime crash mid-request.
const REQUIRED = ['MONGO_URI', 'JWT_SECRET'];

const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

module.exports = { validateEnv };
