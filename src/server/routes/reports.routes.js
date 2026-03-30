const express = require('express');
const router = express.Router();
const reportsService = require('../services/reports.service');
const logger = require('../logger');

/**
 * @description GET /api/reports/weekly
 * Generates a markdown weekly status report.
 * Accepts optional query param ?days=7
 */
router.get('/api/reports/weekly', (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days, 10) : 7;
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({ error: true, message: 'Invalid days parameter', code: 'INVALID_INPUT' });
    }
    const report = reportsService.generateWeeklyReport(days);
    res.json(report);
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate weekly report');
    res.status(500).json({ error: true, message: 'Failed to generate report', code: 'SERVER_ERROR' });
  }
});

module.exports = router;
