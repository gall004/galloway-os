const express = require('express');
const { getTimeBlocks, createTimeBlock, updateTimeBlock, deleteTimeBlock } = require('../services/timeblocks.service');
const logger = require('../logger');

const router = express.Router();

/**
 * @description Parse and validate a numeric ID parameter.
 * @param {string} rawId
 * @returns {number}
 * @throws {Error} If invalid.
 */
function parseId(rawId) {
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) {
    const err = new Error('Invalid ID. Must be a positive integer.');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  return id;
}

/**
 * @description GET /api/time-blocks — Retrieve time blocks for a date range.
 */
router.get('/api/time-blocks', (req, res) => {
  const { start, end, board_id } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: true, message: 'start and end query parameters are required.', code: 'VALIDATION_ERROR' });
  }
  try {
    const blocks = getTimeBlocks(start, end, board_id ? parseInt(board_id, 10) : null);
    res.json(blocks);
  } catch (err) {
    logger.error({ err: err.message }, 'Failed to retrieve time blocks');
    res.status(500).json({ error: true, message: 'Failed to retrieve time blocks.', code: 'INTERNAL_ERROR' });
  }
});

/**
 * @description POST /api/time-blocks — Create a new time block.
 */
router.post('/api/time-blocks', (req, res) => {
  try {
    const block = createTimeBlock(req.body);
    res.status(201).json(block);
  } catch (err) {
    logger.warn({ err: err.message }, 'Time block creation failed');
    const statusMap = { VALIDATION_ERROR: 400, TASK_NOT_FOUND: 404 };
    const status = statusMap[err.code] || 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

/**
 * @description PUT /api/time-blocks/:id — Update a time block.
 */
router.put('/api/time-blocks/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    const block = updateTimeBlock(id, req.body);
    res.json(block);
  } catch (err) {
    logger.warn({ err: err.message, id: req.params.id }, 'Time block update failed');
    const statusMap = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
    const status = statusMap[err.code] || 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

/**
 * @description DELETE /api/time-blocks/:id — Delete a time block.
 */
router.delete('/api/time-blocks/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    deleteTimeBlock(id);
    res.status(204).send();
  } catch (err) {
    logger.warn({ err: err.message, id: req.params.id }, 'Time block deletion failed');
    const statusMap = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
    const status = statusMap[err.code] || 500;
    res.status(status).json({ error: true, message: err.message, code: err.code || 'INTERNAL_ERROR' });
  }
});

module.exports = router;
