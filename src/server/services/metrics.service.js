const { getDatabase } = require('../models/database');
const logger = require('../logger');

/**
 * @description Compute aggregate metrics for the analytics dashboard.
 * @returns {Object} Metrics payload with chart data.
 */
function getMetrics() {
  const db = getDatabase();

  const tasksByCustomer = db.prepare(`
    SELECT c.name AS customer, COUNT(*) AS count
    FROM tasks
    LEFT JOIN customers c ON tasks.customer_id = c.id
    WHERE tasks.status_name NOT IN ('done', 'inbox')
    GROUP BY c.name
    ORDER BY count DESC
  `).all();

  const completionVelocity = db.prepare(`
    SELECT
      strftime('%Y-W%W', date_completed) AS week,
      COUNT(*) AS count
    FROM tasks
    WHERE status_name = 'done'
      AND date_completed IS NOT NULL
      AND date_completed >= date('now', '-56 days')
    GROUP BY week
    ORDER BY week ASC
  `).all();

  const statusCounts = db.prepare(`
    SELECT status_name, COUNT(*) AS count
    FROM tasks
    WHERE status_name NOT IN ('done', 'inbox')
    GROUP BY status_name
  `).all();

  const activeCount = statusCounts.find((s) => s.status_name === 'active')?.count || 0;
  const delegatedCount = statusCounts.find((s) => s.status_name === 'delegated')?.count || 0;

  const cycleTimeRow = db.prepare(`
    SELECT AVG(julianday(date_completed) - julianday(date_created)) AS avg_days
    FROM tasks
    WHERE status_name = 'done'
      AND date_completed IS NOT NULL
      AND date_created IS NOT NULL
  `).get();

  const delegationTimeRow = db.prepare(`
    SELECT AVG(julianday(date_completed) - julianday(date_delegated)) AS avg_days
    FROM tasks
    WHERE status_name = 'done'
      AND date_completed IS NOT NULL
      AND date_delegated IS NOT NULL
  `).get();

  const recentImpacts = db.prepare(`
    SELECT title, impact_statement, date_completed
    FROM tasks
    WHERE status_name = 'done'
      AND impact_statement IS NOT NULL
      AND impact_statement != ''
    ORDER BY date_completed DESC
    LIMIT 5
  `).all();

  const totalCompleted = db.prepare(`
    SELECT COUNT(*) AS count FROM tasks WHERE status_name = 'done'
  `).get()?.count || 0;

  logger.info('Metrics computed');

  return {
    tasksByCustomer,
    completionVelocity,
    activeVsDelegated: { active: activeCount, delegated: delegatedCount },
    avgCycleTimeDays: cycleTimeRow?.avg_days ? Math.round(cycleTimeRow.avg_days * 10) / 10 : null,
    avgDelegationTimeDays: delegationTimeRow?.avg_days ? Math.round(delegationTimeRow.avg_days * 10) / 10 : null,
    recentImpacts,
    totalCompleted,
  };
}

module.exports = { getMetrics };
