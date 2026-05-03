/**
 * Phase 2 auth tests — covers:
 *  - Register patient, doctor, (admin via seed)
 *  - Login success + failure cases
 *  - JWT-protected profile endpoint
 *  - Role-based access: patient token rejected on admin-only route (403)
 *  - Doctor blocked before admin verification (403)
 */

process.env.NODE_ENV = 'test';
// Inside Docker MONGO_URI=mongodb://mongo:27017/medeire — swap DB name to keep tests isolated.
// Outside Docker (host npm test) falls back to localhost.
process.env.MONGO_URI = process.env.MONGO_URI
  ? process.env.MONGO_URI.replace(/\/[^/]+$/, '/medeire_test')
  : 'mongodb://localhost:27017/medeire_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_EXPIRES_IN = '1h';

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../server');
const { connectDB }  = require('../src/config/db');
const { seedDemoUsers } = require('../src/utils/seedAdmin');

beforeAll(async () => {
  // server.js no longer auto-starts when required — we bootstrap the DB here
  // so supertest has a live connection without binding an HTTP port.
  await connectDB();
  await mongoose.connection.dropDatabase();
  await seedDemoUsers(); // seed demo accounts so RBAC tests can log in as admin
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// ── Register ──────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  test('creates a patient and returns token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'patient@test.ie',
      password: 'Test1234!',
      name: 'Test Patient',
      role: 'patient',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.role).toBe('patient');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  test('creates a doctor (unverified)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'doctor@test.ie',
      password: 'Test1234!',
      name: 'Test Doctor',
      role: 'doctor',
      licenseNumber: 'IMC12345',
      specialty: 'General Practice',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('doctor');
    expect(res.body.user.verified).toBe(false);
  });

  test('duplicate email returns 409', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'patient@test.ie',
      password: 'Test1234!',
      name: 'Duplicate',
      role: 'patient',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_IN_USE');
  });

  test('missing required field returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'x@test.ie',
      role: 'patient',
      // password and name missing
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  test('valid credentials return token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'patient@test.ie',
      password: 'Test1234!',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('wrong password returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'patient@test.ie',
      password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
  });

  test('unknown email returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@test.ie',
      password: 'Test1234!',
    });
    expect(res.status).toBe(401);
  });

  test('unverified doctor returns 403', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'doctor@test.ie',
      password: 'Test1234!',
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('DOCTOR_UNVERIFIED');
  });
});

// ── Protected profile ─────────────────────────────────────────────────────────
describe('GET /api/auth/profile', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'patient@test.ie',
      password: 'Test1234!',
    });
    token = res.body.token;
  });

  test('valid token returns user profile', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('patient@test.ie');
  });

  test('no token returns 401', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });
});

// ── Role-based access control ─────────────────────────────────────────────────
describe('Admin-only route RBAC', () => {
  let patientToken;
  let adminToken;

  beforeAll(async () => {
    const patientRes = await request(app).post('/api/auth/login').send({
      email: 'patient@test.ie',
      password: 'Test1234!',
    });
    patientToken = patientRes.body.token;

    // Admin was seeded by seedAdmin() on server startup
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@medeire.ie',
      password: 'Admin1234!',
    });
    adminToken = adminRes.body.token;
  });

  test('admin token can reach /api/admin/ping', async () => {
    const res = await request(app)
      .get('/api/admin/ping')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  test('patient token on admin route returns 403', async () => {
    const res = await request(app)
      .get('/api/admin/ping')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
