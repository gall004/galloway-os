const request = require('supertest');
const { createApp } = require('../../src/server/app');
const { initializeDatabase, closeDatabase } = require('../../src/server/models/database');
const { runMigrations } = require('../../src/db/migrate');

describe('Reports API', () => {
  let app;
  let db;

  beforeAll(() => {
    process.env.DATABASE_PATH = ':memory:';
    db = initializeDatabase();
    runMigrations();
    app = createApp();

    // Setup some seed data
    db.exec(`
      INSERT INTO customers (name) VALUES ('Test Customer');
      INSERT INTO projects (name, customer_id) VALUES ('Test Project', 2);
    `);

    const stmt = db.prepare(`
      INSERT INTO tasks (title, status_name, customer_id, project_id, date_completed, date_delegated, order_index, impact_statement)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Done task
    stmt.run('Completed Task', 'done', 2, 2, new Date().toISOString(), null, 0, 'Big impact');
    // 2. Transformed task out of range (8 days ago)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8);
    stmt.run('Old Task', 'done', null, 1, oldDate.toISOString(), null, 0, null);
    // 3. Active task
    stmt.run('Active Task 1', 'active', null, 1, null, null, 1, null);
    stmt.run('Active Task 2', 'active', null, 1, null, null, 2, null);
    // 5. Delegated task
    const oldDelg = new Date();
    oldDelg.setDate(oldDelg.getDate() - 3);
    stmt.run('Delegated Task', 'delegated', null, 1, null, oldDelg.toISOString(), 0, null);
  });

  afterAll(() => {
    closeDatabase();
  });

  it('GET /api/reports/weekly returns standard MD report', async () => {
    const res = await request(app).get('/api/reports/weekly?days=7');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('report');
    
    const md = res.body.report;
    expect(md).toContain('Completed This Week');
    expect(md).toContain('- **Completed Task** (Test Customer | Test Project)');
    expect(md).toContain('*Impact: Big impact*');
    expect(md).not.toContain('Old Task');
    
    expect(md).toContain('Priorities / Next Up');
    expect(md).toContain('1. **Active Task 1**');
    expect(md).toContain('2. **Active Task 2**');

    expect(md).toContain('Waiting On');
    expect(md).toContain('**Delegated Task**');
    expect(md).toContain('3 days old');
  });

  it('GET /api/reports/weekly with invalid days returns 400', async () => {
    const res = await request(app).get('/api/reports/weekly?days=invalid');
    expect(res.status).toBe(400);
  });
});
