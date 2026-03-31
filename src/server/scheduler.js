const { getDatabase } = require('./models/database');
const logger = require('./logger');
const { parseISO, format, addDays, getDay, addMonths } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');
const { createTask } = require('./services/tasks.service');

function getLocalToday() {
  const tz = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const zonedDate = toZonedTime(now, tz);
  return format(zonedDate, 'yyyy-MM-dd');
}

function calculateNextRunDate(baseDateStr, frequency, daysOfWeekStr) {
  let date = parseISO(baseDateStr);
  let daysOfWeek = [];
  if (daysOfWeekStr) {
    try {
      daysOfWeek = JSON.parse(daysOfWeekStr);
    } catch(e) {}
  }

  if (frequency === 'daily') {
    do {
      date = addDays(date, 1);
      if (daysOfWeek && daysOfWeek.length > 0) {
        if (!daysOfWeek.includes(getDay(date))) {
          continue;
        }
      }
      break;
    } while(true);
  } else if (frequency === 'weekly') {
    date = addDays(date, 7);
  } else if (frequency === 'monthly') {
    date = addMonths(date, 1);
  } else {
    date = addDays(date, 1); // fallback
  }

  return format(date, 'yyyy-MM-dd');
}

function evaluateRecurringTasks() {
  const db = getDatabase();
  const today = getLocalToday();
  
  const dueRules = db.prepare(`SELECT * FROM tasks WHERE is_template = 1 AND is_active_template = 1 AND next_run_date <= ?`).all(today);
  
  if (dueRules.length === 0) { return; }
  logger.info({ count: dueRules.length, today }, 'Found due recurring task blueprints');

  for (const rule of dueRules) {
    try {
      if (rule.prevent_duplicates === 1) {
        const activeCount = db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE source_recurring_task_id = ? AND status_name != 'done' AND is_template = 0`).get(rule.id).c;
        if (activeCount > 0) {
          logger.info({ ruleId: rule.id }, 'Skipping recurring task creation; active duplicate found');
          const nextRun = calculateNextRunDate(today, rule.frequency, rule.days_of_week);
          db.prepare('UPDATE tasks SET next_run_date = ? WHERE id = ?').run(nextRun, rule.id);
          continue;
        }
      }

      const taskPayload = {
        title: rule.title,
        description: rule.description,
        customer_id: rule.customer_id,
        project_id: rule.project_id,
        delegated_to: rule.delegated_to,
        status_name: 'inbox',
        is_template: 0,
        source_recurring_task_id: rule.id,
      };

      if (rule.due_date_offset_days !== null && rule.due_date_offset_days !== undefined) {
        const generatedDate = parseISO(today);
        const dueDate = addDays(generatedDate, rule.due_date_offset_days);
        taskPayload.date_due = format(dueDate, 'yyyy-MM-dd');
      }

      createTask(taskPayload);
      logger.info({ ruleId: rule.id }, 'Recurring task natively spawned into Kanban board');

      const nextRun = calculateNextRunDate(today, rule.frequency, rule.days_of_week);
      db.prepare('UPDATE tasks SET next_run_date = ? WHERE id = ?').run(nextRun, rule.id);

    } catch (err) {
      logger.error({ err, ruleId: rule.id }, 'Error evaluating recurring blueprint');
    }
  }
}

module.exports = { evaluateRecurringTasks };
