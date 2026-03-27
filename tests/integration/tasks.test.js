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
  it('should create a task with defaults (status=Active)', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Test task' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(Number), title: 'Test task', status: 'Active', priority: 'Medium' });
    expect(res.body.status_id).toBeUndefined();
  });

  it('should create a task with explicit status', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Delegated', status: 'Delegated/Waiting' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('Delegated/Waiting');
  });

  it('should reject invalid status', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Bad', status: 'Invalid' });
    expect(res.status).toBe(400);
  });

  it('should return 400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'No title' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: true, code: 'VALIDATION_ERROR' });
  });
});

describe('GET /api/tasks', () => {
  it('should return tasks with TEXT status (no status_id)', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const task = res.body[0];
    expect(task).toHaveProperty('status');
    expect(task.status_id).toBeUndefined();
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

  it('should update a task title', async () => {
    const res = await request(app).put(`/api/tasks/${taskId}`).send({ title: 'Updated title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated title');
  });

  it('should update task status to Done', async () => {
    const res = await request(app).put(`/api/tasks/${taskId}`).send({ status: 'Done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Done');
  });

  it('should reject invalid status on update', async () => {
    const res = await request(app).put(`/api/tasks/${taskId}`).send({ status: 'Bogus' });
    expect(res.status).toBe(400);
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app).put('/api/tasks/99999').send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid id format', async () => {
    const res = await request(app).put('/api/tasks/abc').send({ title: 'Bad id' });
    expect(res.status).toBe(400);
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
    expect(res.body).toMatchObject({ success: true, count: 2 });
  });

  it('should return 400 for non-array body', async () => {
    const res = await request(app).put('/api/tasks/reorder').send({ id: 1, order_index: 0 });
    expect(res.status).toBe(400);
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

  it('should return 404 when deleting non-existent task', async () => {
    const res = await request(app).delete('/api/tasks/99999');
    expect(res.status).toBe(404);
  });
});

describe('Config CRUD — /api/customers', () => {
  it('should create a customer', async () => {
    const res = await request(app).post('/api/customers').send({ name: 'Acme Corp' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Acme Corp');
  });

  it('should return 409 for duplicate name', async () => {
    const res = await request(app).post('/api/customers').send({ name: 'Acme Corp' });
    expect(res.status).toBe(409);
  });
});

describe('Config — /api/statuses should NOT exist', () => {
  it('should return 404 for statuses endpoint', async () => {
    const res = await request(app).get('/api/statuses');
    expect(res.status).toBe(404);
  });
});
