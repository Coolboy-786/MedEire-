process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI
  ? process.env.MONGO_URI.replace(/\/[^/]+$/, '/medeire_test_admin_users')
  : 'mongodb://localhost:27017/medeire_test_admin_users';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { connectDB } = require('../src/config/db');
const { seedDemoUsers } = require('../src/utils/seedAdmin');

beforeAll(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  await seedDemoUsers();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('GET /api/admin/users', () => {
  test('admin can list registered patients and doctors without password hashes', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'admin@medeire.ie',
      password: 'Admin1234!',
    });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    expect(res.body.users.some((u) => u.email === 'patient@medeire.ie')).toBe(true);
    expect(res.body.users.some((u) => u.email === 'doctor@medeire.ie')).toBe(true);
    expect(res.body.users.every((u) => !Object.prototype.hasOwnProperty.call(u, 'passwordHash'))).toBe(true);
  });

  test('patient token cannot list users', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'patient@medeire.ie',
      password: 'Patient123!',
    });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
