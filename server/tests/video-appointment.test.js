process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI
  ? process.env.MONGO_URI.replace(/\/[^/]+$/, '/medeire_test_video')
  : 'mongodb://localhost:27017/medeire_test_video';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { connectDB } = require('../src/config/db');
const { seedDemoUsers } = require('../src/utils/seedAdmin');

let userRepository;

beforeAll(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  await seedDemoUsers();
  userRepository = require('../src/repositories/userRepository');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Video appointment booking', () => {
  test('patient can book a video appointment and receives a room id', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'patient@medeire.ie',
      password: 'Patient123!',
    });

    const doctor = await userRepository.findByEmail('doctor@medeire.ie');

    const res = await request(app)
      .post('/api/patients/appointments')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        doctorId: doctor._id.toString(),
        day: 'Mon',
        timeSlot: '09:00',
        appointmentType: 'video',
        symptoms: ['cough'],
        triageLevel: 'medium',
      });

    expect(res.status).toBe(201);
    expect(res.body.appointment.appointmentType).toBe('video');
    expect(res.body.appointment.videoRoomId).toMatch(/^medeire-/);
  });
});
