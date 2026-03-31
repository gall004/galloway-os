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
  it('should create a task with defaults (no priority)', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Test task' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: expect.any(Number), title: 'Test task', status_name: 'active', status_label: 'Active' });
    expect(res.body.priority_id).toBeUndefined();
    expect(res.body.priority).toBeUndefined();
  });

  it('should shift order_index when inserting at specific position', async () => {
    const a = await request(app).post('/api/tasks').send({ title: 'First', order_index: 0 });
    const b = await request(app).post('/api/tasks').send({ title: 'Second', order_index: 1 });
    expect(a.body.order_index).toBe(0);
    expect(b.body.order_index).toBe(1);

    const inserted = await request(app).post('/api/tasks').send({ title: 'Inserted', order_index: 1 });
    expect(inserted.status).toBe(201);
    expect(inserted.body.order_index).toBe(1);

    const all = await request(app).get('/api/tasks');
    const secondAfter = all.body.find((t) => t.id === b.body.id);
    expect(secondAfter.order_index).toBe(2);
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
  it('should return tasks with status_name and status_label (no priority)', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    const task = res.body[0];
    expect(task).toHaveProperty('status_name');
    expect(task).toHaveProperty('status_label');
    expect(task).toHaveProperty('customer');
    expect(task).toHaveProperty('project');
    expect(task.priority).toBeUndefined();
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
  });

  it('should reject invalid status_name', async () => {
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

describe('Focus Mode (Rule of Three)', () => {
  const taskIds = [];

  beforeAll(async () => {
    // Clear out any existing focused tasks from previous suites just in case
    // Create 3 focused tasks
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/api/tasks').send({ title: `Focus ${i}`, is_focused: true });
      taskIds.push(res.body.id);
    }
  });

  it('should allow up to 3 focused tasks', async () => {
    const res = await request(app).get('/api/tasks');
    const focusedTasks = res.body.filter(t => t.is_focused === 1);
    expect(focusedTasks.length).toBe(3);
  });

  it('should return 400 when trying to focus a 4th task', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Focus 4', is_focused: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.message).toMatch(/Maximum of 3 focus tasks allowed/i);
  });

  it('should auto-clear is_focused if moved out of active', async () => {
    const res = await request(app).put(`/api/tasks/${taskIds[0]}`).send({ status_name: 'delegated' });
    expect(res.status).toBe(200);
    expect(res.body.is_focused).toBe(0);
  });

  it('should ignore is_focused=true if creating non-active task', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Non-active focused', status_name: 'delegated', is_focused: true });
    expect(res.status).toBe(201);
    expect(res.body.is_focused).toBe(0);
  });
});

describe('Statuses API (governance)', () => {
  it('GET /api/statuses — should list 4 statuses', async () => {
    const res = await request(app).get('/api/statuses');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(4);
  });

  it('PUT /api/statuses/:name — should update label', async () => {
    const res = await request(app).put('/api/statuses/delegated').send({ label: 'Waiting on Others' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'delegated', label: 'Waiting on Others' });
  });

  it('POST /api/statuses — should create a custom status', async () => {
    const res = await request(app).post('/api/statuses').send({ name: 'new', label: 'New' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'new', label: 'New', is_system_locked: 0 });
  });

  it('DELETE /api/statuses/:name — 403 for system-locked', async () => {
    const res = await request(app).delete('/api/statuses/active');
    expect(res.status).toBe(403);
  });

  it('DELETE /api/statuses/:name — 204 for custom status', async () => {
    const res = await request(app).delete('/api/statuses/new');
    expect(res.status).toBe(204);
  });

  it('PUT /api/statuses/done — 403 not renamable', async () => {
    const res = await request(app).put('/api/statuses/done').send({ label: 'Finished' });
    expect(res.status).toBe(403);
  });
});

describe('Config — /api/priorities should NOT exist', () => {
  it('should return 404 for priorities endpoint', async () => {
    const res = await request(app).get('/api/priorities');
    expect(res.status).toBe(404);
  });
});

describe('Config CRUD — /api/customers', () => {
  it('should create a customer', async () => {
    const res = await request(app).post('/api/customers').send({ name: 'Acme Corp' });
    expect(res.status).toBe(201);
  });
});
