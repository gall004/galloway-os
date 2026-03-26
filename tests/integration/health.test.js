const request = require('supertest');
const { createApp } = require('../../src/server/app');
const { initializeDatabase, closeDatabase } = require('../../src/server/models/database');
const { runMigrations } = require('../../src/db/migrate');

let app;

beforeAll(() => {
  process.env.DATABASE_PATH = ':memory:';
  initializeDatabase();
  runMigrations();
  app = createApp();
});

afterAll(() => {
  closeDatabase();
});

describe('GET /healthz', () => {
  it('should return 200 OK with healthy database status', async () => {
    const res = await request(app).get('/healthz');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      database: 'connected',
    });
  });

  it('should return the correct content-type header', async () => {
    const res = await request(app).get('/healthz');

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

describe('GET /nonexistent', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/nonexistent');

    expect(res.status).toBe(404);
  });
});
