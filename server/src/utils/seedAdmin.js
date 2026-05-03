const bcrypt = require('bcrypt');
const userFactory = require('../factories/userFactory');
const userRepository = require('../repositories/userRepository');
const logger = require('../middleware/logger');

const SALT_ROUNDS = 12;

const DEMO_USERS = [
  {
    role: 'admin',
    email: 'admin@medeire.ie',
    password: 'Admin1234!',
    name: 'MedEire Admin',
    department: 'Platform',
  },
  {
    role: 'doctor',
    email: 'doctor@medeire.ie',
    password: 'Doctor123!',
    name: 'Aoife Byrne',
    licenseNumber: 'IMC-DEMO-001',
    specialty: 'General Practice',
    verified: true,
    availability: [
      { day: 'Mon', slots: ['09:00', '09:30', '10:00'] },
      { day: 'Wed', slots: ['14:00', '14:30', '15:00'] },
      { day: 'Fri', slots: ['11:00', '11:30'] },
    ],
  },
  {
    role: 'patient',
    email: 'patient@medeire.ie',
    password: 'Patient123!',
    name: 'Eoin Murphy',
    county: 'Kildare',
    gender: 'prefer_not_to_say',
    language: 'en',
  },
];

const createDemoUserIfMissing = async (seed) => {
  const existing = await userRepository.findByEmail(seed.email);
  if (existing) return false;

  const { role, password, ...userData } = seed;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = userFactory.createUser(role, { ...userData, passwordHash });
  await userRepository.save(user);
  return true;
};

// Creates demo accounts on first startup so every role can be shown immediately.
// This is disabled in production and should never be copied into a live system.
const seedDemoUsers = async () => {
  if (process.env.NODE_ENV === 'production') return;

  const created = [];
  for (const seed of DEMO_USERS) {
    if (await createDemoUserIfMissing(seed)) {
      created.push(seed);
    }
  }

  if (created.length === 0) return;

  logger.info(
    `Seed: created demo users: ${created.map((user) => `${user.role}=${user.email}`).join(', ')}`
  );
};

module.exports = { seedDemoUsers, seedAdmin: seedDemoUsers };
