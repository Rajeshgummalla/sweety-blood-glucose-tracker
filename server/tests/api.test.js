const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { getTodayString } = require('../src/utils/dateHelpers');

let tokenUserA = '';
let userIdA = null;
let tokenUserB = '';
let userIdB = null;

const testEmailA = `test-patient-a-${Date.now()}@example.com`;
const testEmailB = `test-patient-b-${Date.now()}@example.com`;
const today = getTodayString();

beforeAll(async () => {
  // Ensure tables exist
  await pool.query('SELECT 1');
});

afterAll(async () => {
  // Cleanup test users
  if (userIdA) await pool.query('DELETE FROM users WHERE id = $1', [userIdA]);
  if (userIdB) await pool.query('DELETE FROM users WHERE id = $1', [userIdB]);
  await pool.end();
});

describe('1. Authentication Endpoints', () => {
  test('POST /api/auth/register should create a new user and return token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Patient Alpha',
        email: testEmailA,
        password: 'password123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(testEmailA);
    tokenUserA = res.body.token;
    userIdA = res.body.user.id;
  });

  test('POST /api/auth/register should prevent duplicate emails', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Patient Alpha Clone',
        email: testEmailA,
        password: 'password123',
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('POST /api/auth/login with valid credentials should succeed', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmailA,
        password: 'password123',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/login with wrong password should return 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmailA,
        password: 'wrongpassword',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid email or password.');
  });

  test('GET /api/auth/me should return current profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe(userIdA);
  });
});

describe('2. Readings Validation Rules', () => {
  test('Rule: Date cannot be in the future', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: '2099-01-01',
        slot: 'Morning (fasting)',
        value: 100,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Date cannot be in the future.');
  });

  test('Rule: Value is required -> "Please enter a glucose value."', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'Morning (fasting)',
        value: '',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Please enter a glucose value.');
  });

  test('Rule: Value must be a whole number between 40 and 600', async () => {
    // Under 40
    let res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'Morning (fasting)',
        value: 39,
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');

    // Over 600
    res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'Morning (fasting)',
        value: 601,
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');

    // Non-integer decimal
    res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'Morning (fasting)',
        value: 105.5,
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
  });

  test('Successfully add first valid reading', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'Morning (fasting)',
        value: 95,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.reading.value).toBe(95);
    expect(res.body.reading.slot).toBe('Morning (fasting)');
  });

  test('Rule: Only one reading per slot per day', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'Morning (fasting)',
        value: 110,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('You already have a Morning (fasting) reading for this date.');
  });

  test('Rule: Only one reading per slot per day for "After lunch"', async () => {
    // Add After lunch
    const res1 = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'After lunch',
        value: 140,
      });
    expect(res1.statusCode).toBe(201);

    // Try adding After lunch again
    const res2 = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'After lunch',
        value: 145,
      });
    expect(res2.statusCode).toBe(400);
    expect(res2.body.error).toBe('You already have an After lunch reading for this date.');
  });

  test('Rule: Maximum 4 readings per day', async () => {
    // Add 3rd slot: After breakfast
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'After breakfast',
        value: 130,
      });

    // Add 4th slot: After dinner
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'After dinner',
        value: 125,
      });

    // Attempting to add a 5th reading on same date
    const res5 = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        date: today,
        slot: 'Morning (fasting)',
        value: 100,
      });

    expect(res5.statusCode).toBe(400);
    expect(res5.body.error).toBe('You can add only 4 readings per day.');
  });
});

describe('3. Multi-tenant Isolation and CRUD', () => {
  let createdReadingId = null;

  beforeAll(async () => {
    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Patient Beta',
        email: testEmailB,
        password: 'password123',
      });
    tokenUserB = resB.body.token;
    userIdB = resB.body.user.id;
  });

  test('User B only sees their own readings (empty at start)', async () => {
    const res = await request(app)
      .get('/api/readings')
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.readings).toHaveLength(0);
  });

  test('User B adds their own reading', async () => {
    const res = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({
        date: today,
        slot: 'Morning (fasting)',
        value: 105,
      });

    expect(res.statusCode).toBe(201);
    createdReadingId = res.body.reading.id;
  });

  test('User A cannot update or delete User B reading', async () => {
    const updateRes = await request(app)
      .put(`/api/readings/${createdReadingId}`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        value: 200,
      });
    expect(updateRes.statusCode).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/readings/${createdReadingId}`)
      .set('Authorization', `Bearer ${tokenUserA}`);
    expect(deleteRes.statusCode).toBe(404);
  });

  test('User B can update and delete their reading', async () => {
    const updateRes = await request(app)
      .put(`/api/readings/${createdReadingId}`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({
        value: 115,
      });
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.reading.value).toBe(115);

    const deleteRes = await request(app)
      .delete(`/api/readings/${createdReadingId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);
    expect(deleteRes.statusCode).toBe(200);
  });
});

describe('4. Reports & Statistics', () => {
  test('Daily report calculates highest, lowest, average rounded to 1 decimal, and count', async () => {
    const res = await request(app)
      .get(`/api/reports/daily?date=${today}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.statusCode).toBe(200);
    const { report } = res.body;
    expect(report.count).toBe(4);
    // User A values added: 95, 140, 130, 125
    expect(report.highest).toBe(140);
    expect(report.lowest).toBe(95);
    // Average: (95+140+130+125)/4 = 490/4 = 122.5
    expect(report.average).toBe(122.5);
    expect(report.readings).toHaveLength(4);
  });

  test('Empty state for date without readings', async () => {
    const res = await request(app)
      .get('/api/reports/daily?date=2020-01-01')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.statusCode).toBe(200);
    const { report } = res.body;
    expect(report.count).toBe(0);
    expect(report.highest).toBeNull();
    expect(report.lowest).toBeNull();
    expect(report.average).toBeNull();
    expect(report.readings).toHaveLength(0);
  });

  test('GET /api/reports returns daily, monthToDate, and monthly together', async () => {
    const res = await request(app)
      .get(`/api/reports?date=${today}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('daily');
    expect(res.body).toHaveProperty('monthToDate');
    expect(res.body).toHaveProperty('monthly');
  });

  test('Pagination bonus: GET /api/readings?page=1&limit=2', async () => {
    const res = await request(app)
      .get('/api/readings?page=1&limit=2')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.readings).toHaveLength(2);
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.totalPages).toBe(2);
    expect(res.body.pagination.hasNextPage).toBe(true);
    expect(res.body.pagination.hasPrevPage).toBe(false);
  });

  test('Pagination bonus: GET /api/readings?page=2&limit=2 fetches second page', async () => {
    const res = await request(app)
      .get('/api/readings?page=2&limit=2')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.readings).toHaveLength(2);
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.totalPages).toBe(2);
    expect(res.body.pagination.hasNextPage).toBe(false);
    expect(res.body.pagination.hasPrevPage).toBe(true);
  });

  test('Pagination on GET /readings (?page=1&limit=20)', async () => {
    const res = await request(app)
      .get('/readings?page=1&limit=20')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.readings).toHaveLength(4);
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
    expect(res.body.pagination.totalPages).toBe(1);
  });

  test('Pagination on GET /readings defaults to page=1 and limit=20 when omitted', async () => {
    const res = await request(app)
      .get('/readings')
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.readings).toHaveLength(4);
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(20);
    expect(res.body.pagination.totalPages).toBe(1);
  });
});
