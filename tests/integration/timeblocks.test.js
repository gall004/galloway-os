const request = require('supertest');
const { createApp } = require('../../src/server/app');
const { initializeDatabase, closeDatabase } = require('../../src/server/models/database');
const { runMigrations } = require('../../src/db/migrate');

describe('Time Blocks API', () => {
  let app;
  let db;
  let taskId;

  beforeAll(() => {
    process.env.DATABASE_PATH = ':memory:';
    db = initializeDatabase();
    runMigrations();
    app = createApp();

    // Seed a task for FK references
    const result = db.prepare(`
      INSERT INTO tasks (title, status_name, order_index)
      VALUES ('Test Task', 'active', 0)
    `).run();
    taskId = result.lastInsertRowid;
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('POST /api/time-blocks', () => {
    it('creates a time block with valid data', async () => {
      const res = await request(app)
        .post('/api/time-blocks')
        .send({
          task_id: taskId,
          start_time: '2026-04-01T09:00:00Z',
          end_time: '2026-04-01T09:30:00Z',
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.task_id).toBe(taskId);
    });

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/api/time-blocks')
        .send({ task_id: taskId });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects end_time before start_time', async () => {
      const res = await request(app)
        .post('/api/time-blocks')
        .send({
          task_id: taskId,
          start_time: '2026-04-01T10:00:00Z',
          end_time: '2026-04-01T09:00:00Z',
        });
      expect(res.status).toBe(400);
    });

    it('rejects non-existent task_id', async () => {
      const res = await request(app)
        .post('/api/time-blocks')
        .send({
          task_id: 99999,
          start_time: '2026-04-01T09:00:00Z',
          end_time: '2026-04-01T09:30:00Z',
        });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/time-blocks', () => {
    it('returns blocks within range', async () => {
      const res = await request(app)
        .get('/api/time-blocks')
        .query({ start: '2026-04-01T00:00:00Z', end: '2026-04-02T00:00:00Z' });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('task_title');
    });

    it('rejects missing query params', async () => {
      const res = await request(app).get('/api/time-blocks');
      expect(res.status).toBe(400);
    });

    it('returns empty array for out-of-range query', async () => {
      const res = await request(app)
        .get('/api/time-blocks')
        .query({ start: '2099-01-01T00:00:00Z', end: '2099-01-02T00:00:00Z' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('PUT /api/time-blocks/:id', () => {
    it('updates a time block', async () => {
      const created = await request(app)
        .post('/api/time-blocks')
        .send({
          task_id: taskId,
          start_time: '2026-04-02T14:00:00Z',
          end_time: '2026-04-02T14:30:00Z',
        });
      const res = await request(app)
        .put(`/api/time-blocks/${created.body.id}`)
        .send({ start_time: '2026-04-02T15:00:00Z', end_time: '2026-04-02T15:30:00Z' });
      expect(res.status).toBe(200);
      expect(res.body.start_time).toBe('2026-04-02T15:00:00Z');
    });

    it('rejects non-existent id', async () => {
      const res = await request(app)
        .put('/api/time-blocks/99999')
        .send({ start_time: '2026-04-02T15:00:00Z', end_time: '2026-04-02T15:30:00Z' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/time-blocks/:id', () => {
    it('deletes a time block', async () => {
      const created = await request(app)
        .post('/api/time-blocks')
        .send({
          task_id: taskId,
          start_time: '2026-04-03T10:00:00Z',
          end_time: '2026-04-03T10:30:00Z',
        });
      const res = await request(app).delete(`/api/time-blocks/${created.body.id}`);
      expect(res.status).toBe(204);
    });

    it('rejects non-existent id', async () => {
      const res = await request(app).delete('/api/time-blocks/99999');
      expect(res.status).toBe(404);
    });
  });

  describe('Cascade delete', () => {
    it('deletes time blocks when parent task is deleted', async () => {
      const taskResult = db.prepare(`
        INSERT INTO tasks (title, status_name, order_index)
        VALUES ('Cascade Test', 'active', 0)
      `).run();
      const cascadeTaskId = taskResult.lastInsertRowid;

      await request(app)
        .post('/api/time-blocks')
        .send({ task_id: cascadeTaskId, start_time: '2026-04-04T09:00:00Z', end_time: '2026-04-04T09:30:00Z' });

      // Delete the parent task
      await request(app).delete(`/api/tasks/${cascadeTaskId}`);

      // Verify blocks are gone
      const blocks = db.prepare('SELECT * FROM time_blocks WHERE task_id = ?').all(cascadeTaskId);
      expect(blocks).toEqual([]);
    });
  });
});
