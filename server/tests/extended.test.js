/**
 * Extended tests — Phase 5E additions:
 *
 *  1. Role middleware  — doctor JWT rejected on /admin/ routes (403)
 *  2. Triage strategy — API path (mocked fetch) returns parsed result
 *  3. Triage strategy — API failure triggers rule-based fallback (strategy:'rule')
 *  4. Discriminator regression — verifyDoctorById persists verified:true
 *  5. Discriminator regression — updateDoctorById persists availability array
 *
 * These complement the 12 auth tests in auth.test.js.
 */

process.env.NODE_ENV    = 'test';
process.env.MONGO_URI   = process.env.MONGO_URI
  ? process.env.MONGO_URI.replace(/\/[^/]+$/, '/medeire_test2')
  : 'mongodb://localhost:27017/medeire_test2';
process.env.JWT_SECRET     = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_EXPIRES_IN = '1h';

const request        = require('supertest');
const mongoose       = require('mongoose');
const app            = require('../server');
const { connectDB }  = require('../src/config/db');
const { seedDemoUsers } = require('../src/utils/seedAdmin');

// Loaded lazily so tests can control process.env before first require
let userRepository;
let triageService;
let apiStrategy;

beforeAll(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  await seedDemoUsers();

  // Import after DB is live so Mongoose models are registered
  userRepository = require('../src/repositories/userRepository');
  triageService  = require('../src/services/triageService');
  apiStrategy    = require('../src/strategies/triage/apiStrategy');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(() => {
  // Restore any global.fetch mock and env vars between tests
  if (global.fetch && global.fetch.mockRestore) global.fetch.mockRestore();
  delete process.env.ANTHROPIC_API_KEY;
});

// ── 1. Role middleware: doctor on admin route ─────────────────────────────────
describe('Role middleware — doctor cannot reach /admin/', () => {
  let doctorToken;

  beforeAll(async () => {
    // Register a doctor so we have a doctor JWT to test with
    const reg = await request(app).post('/api/auth/register').send({
      email:         'rbac-doctor@test.ie',
      password:      'Test1234!',
      name:          'RBAC Doctor',
      role:          'doctor',
      licenseNumber: 'IMC-RBAC',
      specialty:     'General Practice',
    });
    // Doctor cannot log in until verified, so get the token from the register response
    doctorToken = reg.body.token;
  });

  test('doctor JWT on /api/admin/ping returns 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/admin/ping')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('doctor JWT on /api/admin/doctors/pending returns 403 FORBIDDEN', async () => {
    const res = await request(app)
      .get('/api/admin/doctors/pending')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

// ── 2. Triage Strategy: API success path ─────────────────────────────────────
describe('Triage strategy — API path (mocked fetch)', () => {
  test('apiStrategy.classify() parses Anthropic JSON and returns severity', async () => {
    // Simulate a valid Anthropic Messages API response
    const mockApiResponse = {
      content: [{
        text: JSON.stringify({
          severity:  'medium',
          reasoning: 'Persistent fever warrants a GP visit within 48 hours.',
          redFlags:  [],
        }),
      }],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok:   true,
      json: jest.fn().mockResolvedValue(mockApiResponse),
      text: jest.fn().mockResolvedValue(''),
    });
    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    const result = await apiStrategy.classify(['fever', 'headache']);

    expect(result.severity).toBe('medium');
    expect(result.reasoning).toContain('fever');
    expect(Array.isArray(result.redFlags)).toBe(true);

    // Confirm it actually called the Anthropic endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('apiStrategy.classify() throws when fetch returns non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok:     false,
      status: 429,
      text:   jest.fn().mockResolvedValue('rate limited'),
    });
    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    await expect(apiStrategy.classify(['cough'])).rejects.toThrow('429');
  });
});

// ── 3. Triage Strategy: API failure → rule fallback ───────────────────────────
describe('Triage strategy — fallback to rule-based on API failure', () => {
  test('triageService falls back when fetch throws a network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    process.env.ANTHROPIC_API_KEY = 'test-api-key';

    const result = await triageService.classify(['chest pain']);

    // triageService must choose the rule strategy
    expect(result.strategy).toBe('rule');
    // Rule strategy identifies 'chest pain' as high risk
    expect(result.severity).toBe('high');
    expect(result.redFlags).toContain('chest pain');
  });

  test('triageService falls back when ANTHROPIC_API_KEY is missing', async () => {
    // No API key set — apiStrategy throws immediately without calling fetch
    delete process.env.ANTHROPIC_API_KEY;
    global.fetch = jest.fn(); // Should never be called

    const result = await triageService.classify(['runny nose']);

    expect(result.strategy).toBe('rule');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ── 4 & 5. Discriminator regression tests ────────────────────────────────────
describe('Discriminator update regression (verifyDoctorById / updateDoctorById)', () => {
  let doctorId;

  beforeAll(async () => {
    // Create an unverified doctor directly via registration endpoint
    const res = await request(app).post('/api/auth/register').send({
      email:         'disc-doctor@test.ie',
      password:      'Test1234!',
      name:          'Discriminator Doctor',
      role:          'doctor',
      licenseNumber: 'IMC-DISC',
      specialty:     'Cardiology',
    });
    doctorId = res.body.user._id;
    expect(doctorId).toBeTruthy();
  });

  test('verifyDoctorById sets verified:true on the Doctor discriminator', async () => {
    const before = await userRepository.findById(doctorId);
    expect(before.verified).toBe(false);

    await userRepository.verifyDoctorById(doctorId);

    const after = await userRepository.findById(doctorId);
    expect(after.verified).toBe(true);
  });

  test('updateDoctorById persists availability array on the Doctor discriminator', async () => {
    const availability = [
      { day: 'Mon', slots: ['09:00', '09:30'] },
      { day: 'Fri', slots: ['14:00'] },
    ];

    await userRepository.updateDoctorById(doctorId, { availability });

    const updated = await userRepository.findById(doctorId);
    expect(updated.availability).toHaveLength(2);
    expect(updated.availability[0].day).toBe('Mon');
    expect(updated.availability[0].slots).toContain('09:30');
  });

  test('verifyDoctorById is idempotent — calling twice leaves verified:true', async () => {
    // Regression guard: calling verify on an already-verified doctor must not error
    await userRepository.verifyDoctorById(doctorId);
    const doc = await userRepository.findById(doctorId);
    expect(doc.verified).toBe(true);
  });
});
