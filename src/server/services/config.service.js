const { getDatabase } = require('../models/database');
const logger = require('../logger');

/**
 * @description Factory that creates a CRUD service for a simple lookup table.
 * @param {string} tableName - The database table name.
 * @param {boolean} [hasCustomerFK=false] - Whether the table has a customer_id FK.
 * @returns {Object} Service with getAll, getById, create, update, remove.
 */
function createConfigService(tableName, hasCustomerFK = false) {
  return {
    /**
     * @description Get all records from the table.
     * @returns {Array<Object>}
     */
    getAll() {
      const db = getDatabase();
      if (hasCustomerFK) {
        return db.prepare(`SELECT ${tableName}.*, customers.name AS customer_name FROM ${tableName} LEFT JOIN customers ON ${tableName}.customer_id = customers.id ORDER BY ${tableName}.id`).all();
      }
      return db.prepare(`SELECT * FROM ${tableName} ORDER BY id`).all();
    },

    /**
     * @description Get a single record by ID.
     * @param {number} id
     * @returns {Object|null}
     */
    getById(id) {
      const db = getDatabase();
      return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id) || null;
    },

    /**
     * @description Create a new record.
     * @param {Object} data - Must include { name } and optionally { customer_id }.
     * @returns {Object} The created record.
     */
    create(data) {
      const db = getDatabase();
      if (hasCustomerFK) {
        const stmt = db.prepare(`INSERT INTO ${tableName} (name, customer_id) VALUES (?, ?)`);
        const result = stmt.run(data.name, data.customer_id || 1);
        logger.info({ table: tableName, id: result.lastInsertRowid }, 'Config record created');
        return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(result.lastInsertRowid);
      }
      const stmt = db.prepare(`INSERT INTO ${tableName} (name) VALUES (?)`);
      const result = stmt.run(data.name);
      logger.info({ table: tableName, id: result.lastInsertRowid }, 'Config record created');
      return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(result.lastInsertRowid);
    },

    /**
     * @description Update a record by ID.
     * @param {number} id
     * @param {Object} data - Fields to update.
     * @returns {Object} The updated record.
     * @throws {Error} If not found.
     */
    update(id, data) {
      const db = getDatabase();
      const existing = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
      if (!existing) {
        const err = new Error(`${tableName} record with id ${id} not found`);
        err.code = 'NOT_FOUND';
        throw err;
      }
      if (hasCustomerFK && data.customer_id !== undefined) {
        db.prepare(`UPDATE ${tableName} SET name = ?, customer_id = ? WHERE id = ?`).run(data.name || existing.name, data.customer_id, id);
      } else {
        db.prepare(`UPDATE ${tableName} SET name = ? WHERE id = ?`).run(data.name || existing.name, id);
      }
      logger.info({ table: tableName, id }, 'Config record updated');
      return db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
    },

    /**
     * @description Delete a record by ID.
     * @param {number} id
     * @throws {Error} If not found or FK constraint violation.
     */
    remove(id) {
      const db = getDatabase();
      try {
        const result = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
        if (result.changes === 0) {
          const err = new Error(`${tableName} record with id ${id} not found`);
          err.code = 'NOT_FOUND';
          throw err;
        }
        logger.info({ table: tableName, id }, 'Config record deleted');
      } catch (err) {
        if (err.message?.includes('FOREIGN KEY constraint')) {
          const fkErr = new Error(`Cannot delete: record is referenced by other data.`);
          fkErr.code = 'FK_CONSTRAINT';
          throw fkErr;
        }
        throw err;
      }
    },
  };
}

module.exports = { createConfigService };
