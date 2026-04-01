const { getDatabase } = require('../models/database');
const logger = require('../logger');

/**
 * @description Compute aggregate metrics for the analytics dashboard.
 * @returns {Object} Metrics payload with chart data.
 */
function getMetrics(timeframe = '7d') {
  const db = getDatabase();

  let days = 7;
  if (timeframe === '30d') {
    days = 30;
  }
  
  const dateFilter = timeframe === 'all_time' 
    ? '' 
    : `AND date_completed >= datetime('now', '-${days} days')`;

  const tasksByCustomer = db.prepare(`
    SELECT COALESCE(c.name, 'Unassigned') AS customer, COUNT(*) AS count
    FROM tasks
    LEFT JOIN customers c ON tasks.customer_id = c.id
    WHERE tasks.status_name != 'done' AND tasks.is_template = 0
    GROUP BY customer
    ORDER BY count DESC
  `).all();

  const completionVelocity = db.prepare(`
    SELECT
      strftime('%Y-W%W', date_completed) AS week,
      COUNT(*) AS count
    FROM tasks
    WHERE status_name = 'done' AND is_template = 0
      AND date_completed IS NOT NULL
      ${dateFilter}
    GROUP BY week
    ORDER BY week ASC
  `).all();

  const statusCounts = db.prepare(`
    SELECT status_name, COUNT(*) AS count
    FROM tasks
    WHERE status_name != 'done' AND is_template = 0
    GROUP BY status_name
  `).all();

  const cycleTimeRow = db.prepare(`
    SELECT AVG(julianday(date_completed) - julianday(date_created)) AS avg_days
    FROM tasks
    WHERE status_name = 'done' AND is_template = 0
      AND date_completed IS NOT NULL
      AND date_created IS NOT NULL
      ${dateFilter}
  `).get();

  const delegationTimeRow = db.prepare(`
    SELECT AVG(julianday(date_completed) - julianday(date_delegated)) AS avg_days
    FROM tasks
    WHERE status_name = 'done' AND is_template = 0
      AND date_completed IS NOT NULL
      AND date_delegated IS NOT NULL
      ${dateFilter}
  `).get();

  const recentImpacts = db.prepare(`
    SELECT title, impact_statement, date_completed
    FROM tasks
    WHERE status_name = 'done' AND is_template = 0
      AND impact_statement IS NOT NULL
      AND impact_statement != ''
      ${dateFilter}
    ORDER BY date_completed DESC
    LIMIT 5
  `).all();

  const totalCompleted = db.prepare(`
    SELECT COUNT(*) AS count FROM tasks WHERE status_name = 'done' AND is_template = 0 ${dateFilter}
  `).get()?.count || 0;

  logger.info('Metrics computed');

  return {
    tasksByCustomer,
    completionVelocity,
    statusCounts,
    avgCycleTimeDays: cycleTimeRow?.avg_days ? Math.round(cycleTimeRow.avg_days * 10) / 10 : null,
    avgDelegationTimeDays: delegationTimeRow?.avg_days ? Math.round(delegationTimeRow.avg_days * 10) / 10 : null,
    recentImpacts,
    totalCompleted,
  };
}

module.exports = { getMetrics };
