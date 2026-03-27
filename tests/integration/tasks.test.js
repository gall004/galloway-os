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

afterAll(() => { closeDatabase(); });

describe('POST /api/tasks', () => {
  it('should create a task with defaults (status_name=active)', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Test task' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(Number), title: 'Test task', status_name: 'active', status_label: 'Active', priority: 'Medium' });
  });

  it('should create a task with explicit status_name', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Delegated', status_name: 'delegated' });
    expect(res.status).toBe(201);
    expect(res.body.status_name).toBe('delegated');
    expect(res.body.status_label).toBe('Delegated / Waiting');
  });

  it('should reject invalid status_name', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Bad', status_name: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('should return 400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'No title' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: true, code: 'VALIDATION_ERROR' });
  });
});

describe('GET /api/tasks', () => {
  it('should return tasks with status_name and status_label', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    const task = res.body[0];
    expect(task).toHaveProperty('status_name');
    expect(task).toHaveProperty('status_label');
    expect(task).toHaveProperty('priority');
    expect(task).toHaveProperty('customer');
    expect(task).toHaveProperty('project');
  });
});

describe('PUT /api/tasks/:id', () => {
  let taskId;
  beforeAll(async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Task to update' });
    taskId = res.body.id;
  });

  it('should update task status_name to done', async () => {
    const res = await request(app).put(`/api/tasks/${taskId}`).send({ status_name: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status_name).toBe('done');
    expect(res.body.status_label).toBe('Done');
  });

  it('should reject invalid status_name on update', async () => {
    const res = await request(app).put(`/api/tasks/${taskId}`).send({ status_name: 'bogus' });
    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app).put('/api/tasks/99999').send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tasks/reorder', () => {
  let taskIds;
  beforeAll(async () => {
    const a = await request(app).post('/api/tasks').send({ title: 'Reorder A' });
    const b = await request(app).post('/api/tasks').send({ title: 'Reorder B' });
    taskIds = [a.body.id, b.body.id];
  });

  it('should bulk-update order_index', async () => {
    const res = await request(app).put('/api/tasks/reorder').send([
      { id: taskIds[0], order_index: 1 }, { id: taskIds[1], order_index: 0 },
    ]);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/tasks/:id', () => {
  let taskId;
  beforeAll(async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Task to delete' });
    taskId = res.body.id;
  });

  it('should delete a task and return 204', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(204);
  });

  it('should return 404 when deleting non-existent', async () => {
    const res = await request(app).delete('/api/tasks/99999');
    expect(res.status).toBe(404);
  });
});

describe('Statuses API (restricted)', () => {
  it('GET /api/statuses — should list 3 seeded statuses', async () => {
    const res = await request(app).get('/api/statuses');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0]).toMatchObject({ name: 'active', label: 'Active' });
    expect(res.body[1]).toMatchObject({ name: 'delegated', label: expect.any(String) });
    expect(res.body[2]).toMatchObject({ name: 'done', label: 'Done' });
  });

  it('GET /api/statuses/:name — should return a single status', async () => {
    const res = await request(app).get('/api/statuses/active');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'active', label: 'Active' });
  });

  it('GET /api/statuses/:name — 404 for unknown', async () => {
    const res = await request(app).get('/api/statuses/unknown');
    expect(res.status).toBe(404);
  });

  it('PUT /api/statuses/:name — should update label only', async () => {
    const res = await request(app).put('/api/statuses/delegated').send({ label: 'Waiting on Others' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'delegated', label: 'Waiting on Others' });
  });

  it('PUT /api/statuses/:name — 400 for missing label', async () => {
    const res = await request(app).put('/api/statuses/active').send({});
    expect(res.status).toBe(400);
  });

  it('POST /api/statuses — 405 Method Not Allowed', async () => {
    const res = await request(app).post('/api/statuses').send({ name: 'new', label: 'New' });
    expect(res.status).toBe(405);
  });

  it('DELETE /api/statuses/:name — 405 Method Not Allowed', async () => {
    const res = await request(app).delete('/api/statuses/active');
    expect(res.status).toBe(405);
  });
});

describe('Config CRUD — /api/customers', () => {
  it('should create a customer', async () => {
    const res = await request(app).post('/api/customers').send({ name: 'Acme Corp' });
    expect(res.status).toBe(201);
  });
});
