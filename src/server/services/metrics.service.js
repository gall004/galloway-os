const { getDatabase } = require('../models/database');
const logger = require('../logger');

/**
 * @description Compute aggregate metrics for the analytics dashboard.
 * @returns {Object} Metrics payload with chart data.
 */
function getMetrics(timeframe = '7d', boardId = null) {
  const db = getDatabase();

  let days = 7;
  if (timeframe === '30d') {
    days = 30;
  }
  
  const dateFilter = timeframe === 'all_time' 
    ? '' 
    : `AND tasks.date_completed >= datetime('now', '-${days} days')`;

  const boardFilter = boardId ? `AND p.board_id = ${parseInt(boardId, 10)}` : '';

  const tasksByCustomer = db.prepare(`
    SELECT COALESCE(c.name, 'Internal') AS customer, COUNT(*) AS count
    FROM tasks
    LEFT JOIN customers c ON tasks.customer_id = c.id
    LEFT JOIN projects p ON tasks.project_id = p.id
    WHERE tasks.status_name != 'done' AND tasks.is_template = 0 ${boardFilter}
    GROUP BY customer
    ORDER BY count DESC
  `).all();

  const completionVelocity = db.prepare(`
    SELECT
      strftime('%Y-W%W', tasks.date_completed) AS week,
      COUNT(*) AS count
    FROM tasks
    LEFT JOIN projects p ON tasks.project_id = p.id
    WHERE tasks.status_name = 'done' AND tasks.is_template = 0
      AND tasks.date_completed IS NOT NULL
      ${dateFilter}
      ${boardFilter}
    GROUP BY week
    ORDER BY week ASC
  `).all();

  const statusCounts = db.prepare(`
    SELECT tasks.status_name, COUNT(*) AS count
    FROM tasks
    LEFT JOIN projects p ON tasks.project_id = p.id
    WHERE tasks.status_name != 'done' AND tasks.is_template = 0 ${boardFilter}
    GROUP BY tasks.status_name
  `).all();

  const cycleTimeRow = db.prepare(`
    SELECT AVG(julianday(tasks.date_completed) - julianday(tasks.date_created)) AS avg_days
    FROM tasks
    LEFT JOIN projects p ON tasks.project_id = p.id
    WHERE tasks.status_name = 'done' AND tasks.is_template = 0
      AND tasks.date_completed IS NOT NULL
      AND tasks.date_created IS NOT NULL
      ${dateFilter}
      ${boardFilter}
  `).get();

  const delegationTimeRow = db.prepare(`
    SELECT AVG(julianday(tasks.date_completed) - julianday(tasks.date_delegated)) AS avg_days
    FROM tasks
    LEFT JOIN projects p ON tasks.project_id = p.id
    WHERE tasks.status_name = 'done' AND tasks.is_template = 0
      AND tasks.date_completed IS NOT NULL
      AND tasks.date_delegated IS NOT NULL
      ${dateFilter}
      ${boardFilter}
  `).get();

  const recentImpacts = db.prepare(`
    SELECT tasks.title, tasks.impact_statement, tasks.date_completed
    FROM tasks
    LEFT JOIN projects p ON tasks.project_id = p.id
    WHERE tasks.status_name = 'done' AND tasks.is_template = 0
      AND tasks.impact_statement IS NOT NULL
      AND tasks.impact_statement != ''
      ${dateFilter}
      ${boardFilter}
    ORDER BY tasks.date_completed DESC
    LIMIT 5
  `).all();

  const totalCompleted = db.prepare(`
    SELECT COUNT(*) AS count FROM tasks 
    LEFT JOIN projects p ON tasks.project_id = p.id
    WHERE tasks.status_name = 'done' AND tasks.is_template = 0 ${dateFilter} ${boardFilter}
  `).get()?.count || 0;

  logger.info({ boardId }, 'Metrics computed');

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
