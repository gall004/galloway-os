const { getDatabase } = require('../models/database');
const logger = require('../logger');

const TASKS_REPORT_SELECT = `
  SELECT tasks.*,
    s.label AS status_label,
    c.name AS customer, pr.name AS project
  FROM tasks
  LEFT JOIN statuses s ON tasks.status_name = s.name
  LEFT JOIN customers c ON tasks.customer_id = c.id
  LEFT JOIN projects pr ON tasks.project_id = pr.id
`;

/**
 * @description Format a date to a readable string or standard format.
 * @param {string} isoString - ISO date string.
 * @returns {string} Formatted date.
 */
function formatDate(isoString) {
  if (!isoString) {
    return '';
  }
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * @description Compute days since a date string
 * @param {string} dateString - ISO date strong
 * @returns {number} Days elapsed
 */
function getDaysSince(dateString) {
  if (!dateString) {
    return 0;
  }
  const ms = Date.now() - new Date(dateString).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * @description Generate a Markdown-formatted weekly status report.
 * @param {number} days - Number of days to look back for completed tasks.
 * @returns {Object} Object containing the markdown report string.
 */
function generateWeeklyReport(days = 7) {
  const db = getDatabase();
  logger.info({ days }, 'Generating weekly report');

  const now = new Date();
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - days);
  const cutoffIso = pastDate.toISOString();

  // 1. Completed in last X days
  const completedStats = db.prepare(`
    ${TASKS_REPORT_SELECT}
    WHERE tasks.status_name = 'done'
      AND tasks.date_completed >= ?
    ORDER BY tasks.date_completed DESC
  `).all(cutoffIso);

  // 2. Top 5 active tasks
  const topActive = db.prepare(`
    ${TASKS_REPORT_SELECT}
    WHERE tasks.status_name = 'active'
    ORDER BY tasks.order_index ASC
    LIMIT 5
  `).all();

  // 3. Delegation summary
  const delegated = db.prepare(`
    ${TASKS_REPORT_SELECT}
    WHERE tasks.status_name = 'delegated'
    ORDER BY tasks.date_delegated ASC
  `).all();

  const reportDate = formatDate(now.toISOString());
  
  let md = `# Weekly Status Report - ${reportDate}\n\n`;

  // Section 1: Completed
  md += `## ✅ Completed This Week\n`;
  if (completedStats.length === 0) {
    md += `*No tasks completed in the last ${days} days.*\n`;
  } else {
    completedStats.forEach(t => {
      const custProj = [t.customer !== 'N/A' ? t.customer : null, t.project !== 'N/A' ? t.project : null].filter(Boolean).join(' | ');
      const meta = custProj ? ` (${custProj})` : '';
      md += `- **${t.title}**${meta}\n`;
      if (t.impact_statement) {
        md += `  *Impact: ${t.impact_statement.trim().replace(/\n/g, ' ')}*\n`;
      }
    });
  }
  md += `\n`;

  // Section 2: Priorities Output
  md += `## 🚀 Priorities / Next Up\n`;
  if (topActive.length === 0) {
    md += `*No active tasks currently prioritized.*\n`;
  } else {
    topActive.forEach((t, i) => {
      const custProj = [t.customer !== 'N/A' ? t.customer : null, t.project !== 'N/A' ? t.project : null].filter(Boolean).join(' | ');
      const meta = custProj ? ` (${custProj})` : '';
      md += `${i + 1}. **${t.title}**${meta}\n`;
    });
  }
  md += `\n`;

  // Section 3: Delegated
  md += `## 🤝 Waiting On\n`;
  if (delegated.length === 0) {
    md += `*No delegated tasks currently pending.*\n`;
  } else {
    delegated.forEach(t => {
      const assignee = t.delegated_to ? `Delegated to: ${t.delegated_to}` : 'Delegated';
      const age = getDaysSince(t.date_delegated);
      const ageStr = age > 0 ? ` - ${age} ${age === 1 ? 'day' : 'days'} old` : '';
      md += `- **${t.title}** (${assignee})${ageStr}\n`;
    });
  }
  
  return { report: md.trim() };
}

module.exports = {
  generateWeeklyReport,
};
