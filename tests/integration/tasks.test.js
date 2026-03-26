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

describe('POST /api/tasks', () => {
  it('should create a task with required fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      title: 'Test task',
      priority: 'Medium',
      status: 'Backlog',
      workstream: 'None',
    });
    expect(res.body.date_created).toBeDefined();
  });

  it('should create a task with all optional fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({
        title: 'Full task',
        description: 'A complete task',
        date_due: '2026-04-01T00:00:00.000Z',
        priority: 'High',
        status: 'Next Up',
        associated_project: 'Project Alpha',
        associated_customer: 'Acme Corp',
        delegated_to: 'John Doe',
        workstream: 'Mark Eichten',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Full task',
      description: 'A complete task',
      priority: 'High',
      status: 'Next Up',
      associated_project: 'Project Alpha',
      associated_customer: 'Acme Corp',
      delegated_to: 'John Doe',
      workstream: 'Mark Eichten',
    });
  });

  it('should return 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ description: 'No title' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: true,
      code: 'VALIDATION_ERROR',
    });
  });

  it('should return 400 for invalid priority value', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Bad priority', priority: 'Urgent' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: true,
      code: 'VALIDATION_ERROR',
    });
  });

  it('should return 400 for invalid status value', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Bad status', status: 'Canceled' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: true,
      code: 'VALIDATION_ERROR',
    });
  });

  it('should return 400 for invalid workstream value', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Bad workstream', workstream: 'Unknown Person' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: true,
      code: 'VALIDATION_ERROR',
    });
  });
});

describe('GET /api/tasks', () => {
  it('should return an array of tasks', async () => {
    const res = await request(app).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should include all expected fields on each task', async () => {
    const res = await request(app).get('/api/tasks');
    const task = res.body[0];

    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('title');
    expect(task).toHaveProperty('priority');
    expect(task).toHaveProperty('status');
    expect(task).toHaveProperty('workstream');
    expect(task).toHaveProperty('date_created');
    expect(task).toHaveProperty('order_index');
  });
});

describe('PUT /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task to update' });
    taskId = res.body.id;
  });

  it('should update a task title', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated title');
  });

  it('should update task status (Kanban drag-and-drop)', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('In Progress');
  });

  it('should update multiple fields at once', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({
        priority: 'Critical',
        delegated_to: 'Jane Doe',
        workstream: 'Garrett Stuart',
      });

    expect(res.status).toBe(200);
    expect(res.body.priority).toBe('Critical');
    expect(res.body.delegated_to).toBe('Jane Doe');
    expect(res.body.workstream).toBe('Garrett Stuart');
  });

  it('should return 404 for non-existent task', async () => {
    const res = await request(app)
      .put('/api/tasks/99999')
      .send({ title: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: true, code: 'TASK_NOT_FOUND' });
  });

  it('should return 400 for invalid priority on update', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ priority: 'SuperHigh' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: true, code: 'VALIDATION_ERROR' });
  });

  it('should return 400 for invalid id format', async () => {
    const res = await request(app)
      .put('/api/tasks/abc')
      .send({ title: 'Bad id' });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: true, code: 'VALIDATION_ERROR' });
  });
});

describe('PUT /api/tasks/reorder', () => {
  let taskIds;

  beforeAll(async () => {
    const a = await request(app).post('/api/tasks').send({ title: 'Reorder A' });
    const b = await request(app).post('/api/tasks').send({ title: 'Reorder B' });
    taskIds = [a.body.id, b.body.id];
  });

  it('should bulk-update order_index for tasks', async () => {
    const res = await request(app)
      .put('/api/tasks/reorder')
      .send([
        { id: taskIds[0], order_index: 1 },
        { id: taskIds[1], order_index: 0 },
      ]);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, count: 2 });
  });

  it('should return 400 for non-array body', async () => {
    const res = await request(app)
      .put('/api/tasks/reorder')
      .send({ id: 1, order_index: 0 });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: true, code: 'VALIDATION_ERROR' });
  });

  it('should return 400 for invalid item schema', async () => {
    const res = await request(app)
      .put('/api/tasks/reorder')
      .send([{ id: 'abc', order_index: 0 }]);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: true, code: 'VALIDATION_ERROR' });
  });
});

describe('DELETE /api/tasks/:id', () => {
  let taskId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Task to delete' });
    taskId = res.body.id;
  });

  it('should delete a task and return 204', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(204);
  });

  it('should confirm deleted task no longer exists', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Ghost' });

    expect(res.status).toBe(404);
  });

  it('should return 404 when deleting non-existent task', async () => {
    const res = await request(app).delete('/api/tasks/99999');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: true, code: 'TASK_NOT_FOUND' });
  });

  it('should return 400 for invalid id format', async () => {
    const res = await request(app).delete('/api/tasks/abc');
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: true, code: 'VALIDATION_ERROR' });
  });
});
