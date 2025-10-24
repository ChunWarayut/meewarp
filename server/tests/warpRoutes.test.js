const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Store = require('../models/Store');
const WarpProfile = require('../models/WarpProfile');

let mongoServer;
let app;
let store;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: {
      ip: '127.0.0.1',
      port: 0,
    },
  });
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.PORT = '0';
  process.env.ADMIN_EMAIL = 'admin@warp.dev';
  process.env.ADMIN_PASSWORD = 'supersecret';
  process.env.ADMIN_JWT_SECRET = 'test-secret';
  process.env.ADMIN_JWT_EXPIRES_IN = '1h';

  ({ app } = require('../index'));

  await mongoose.connect(process.env.MONGODB_URI);
  await WarpProfile.init();
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((collection) => collection.deleteMany({})));
  }
  store = null;
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

const createPayload = () => ({
  code: 'DJ001',
  name: 'Test DJ',
  socialLink: 'https://instagram.com/testdj',
});

const loginPayload = {
  email: 'admin@warp.dev',
  password: 'supersecret',
};

const getAuthHeader = async () => {
  const response = await request(app).post('/api/v1/admin/login').send(loginPayload);
  return `Bearer ${response.body.token}`;
};

describe('Warp routes', () => {
  beforeEach(async () => {
    store = await Store.create({
      name: 'Test Store',
      slug: 'test-store',
      isActive: true,
    });
  });

  test('rejects admin actions without auth token', async () => {
    const response = await request(app).post('/api/v1/admin/warp').send(createPayload());

    expect(response.status).toBe(401);
  });

  test('allows admin login with valid credentials', async () => {
    const response = await request(app).post('/api/v1/admin/login').send(loginPayload);

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test('creates a warp profile', async () => {
    const authHeader = await getAuthHeader();
    const response = await request(app)
      .post('/api/v1/admin/warp')
      .set('Authorization', authHeader)
      .set('x-store-id', store._id.toString())
      .send(createPayload());

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      code: 'DJ001',
      name: 'Test DJ',
      socialLink: 'https://instagram.com/testdj',
      isActive: true,
    });
  });

  test('prevents duplicate warp codes', async () => {
    const authHeader = await getAuthHeader();
    await request(app)
      .post('/api/v1/admin/warp')
      .set('Authorization', authHeader)
      .set('x-store-id', store._id.toString())
      .send(createPayload());
    const response = await request(app)
      .post('/api/v1/admin/warp')
      .set('Authorization', authHeader)
      .set('x-store-id', store._id.toString())
      .send(createPayload());

    expect(response.status).toBe(409);
  });

  test('retrieves warp profile by code', async () => {
    const authHeader = await getAuthHeader();
    await request(app)
      .post('/api/v1/admin/warp')
      .set('Authorization', authHeader)
      .set('x-store-id', store._id.toString())
      .send(createPayload());

    const response = await request(app).get('/api/v1/warp/DJ001').set('x-store-slug', store.slug);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ socialLink: 'https://instagram.com/testdj' });
  });

  test('returns 404 for missing warp profile', async () => {
    const response = await request(app).get('/api/v1/warp/UNKNOWN').set('x-store-slug', store.slug);

    expect(response.status).toBe(404);
  });
});

describe('Warp transactions & leaderboard', () => {
  const createTransactionPayload = (overrides = {}) => ({
    code: 'DJ001',
    customerName: 'Supporter One',
    customerAvatar: 'https://example.com/avatar.png',
    socialLink: 'https://instagram.com/testdj',
    displaySeconds: 45,
    amount: 1200,
    status: 'paid',
    ...overrides,
  });

  beforeEach(async () => {
    store = await Store.create({
      name: 'Test Store',
      slug: 'test-store',
      isActive: true,
    });

    const authHeader = await getAuthHeader();
    await request(app)
      .post('/api/v1/admin/warp')
      .set('Authorization', authHeader)
      .set('x-store-id', store._id.toString())
      .send(createPayload());
  });

  test('requires admin auth to create transaction', async () => {
    const response = await request(app)
      .post('/api/v1/transactions')
      .send(createTransactionPayload());

    expect(response.status).toBe(401);
  });

  test('creates transaction and returns in leaderboard', async () => {
    const authHeader = await getAuthHeader();

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', authHeader)
      .set('x-store-id', store._id.toString())
      .send(createTransactionPayload());

    const leaderboardResponse = await request(app)
      .get('/api/v1/leaderboard/top-supporters')
      .set('x-store-slug', store.slug);

    expect(leaderboardResponse.status).toBe(200);
    expect(Array.isArray(leaderboardResponse.body.supporters)).toBe(true);
    expect(leaderboardResponse.body.supporters[0]).toMatchObject({
      customerName: 'Supporter One',
      totalAmount: 1200,
    });
  });

  test('activity log endpoint returns entries', async () => {
    const authHeader = await getAuthHeader();

    await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', authHeader)
      .set('x-store-id', store._id.toString())
      .send(createTransactionPayload({ customerName: 'Log Tester' }));

    const response = await request(app)
      .get('/api/v1/transactions/activity-log')
      .set('Authorization', authHeader)
      .set('x-store-id', store._id.toString());

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.entries)).toBe(true);
    expect(response.body.entries[0].activityLog.length).toBeGreaterThan(0);
  });
});
