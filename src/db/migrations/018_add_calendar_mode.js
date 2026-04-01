/**
 * @description Migration 018: Add calendar mode toggle to app_settings.
 * Defaults to disabled (0) for feature-flag gating.
 */
module.exports = {
  up: `ALTER TABLE app_settings ADD COLUMN enable_calendar BOOLEAN DEFAULT 0;`,
};
