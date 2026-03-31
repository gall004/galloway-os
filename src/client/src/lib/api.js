const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * @description Generic fetch helper with error handling.
 * @param {string} url
 * @param {Object} [options]
 * @returns {Promise<any>}
 */
async function apiFetch(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) {
    return;
  }
  return res.json();
}

// --- Tasks ---
export const fetchTasks = (query = '') => apiFetch(`/api/tasks${query ? `?${query}` : ''}`);
export const createTask = (data) => apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (id, data) => apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTask = (id) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
export const reorderTasks = (items) => apiFetch('/api/tasks/reorder', { method: 'PUT', body: JSON.stringify(items) });

// --- Metrics ---
export const fetchMetrics = () => apiFetch('/api/metrics');

// --- Config (generic) ---
export const fetchConfig = (entity) => apiFetch(`/api/${entity}`);
export const createConfig = (entity, data) => apiFetch(`/api/${entity}`, { method: 'POST', body: JSON.stringify(data) });
export const updateConfig = (entity, id, data) => apiFetch(`/api/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteConfig = (entity, id) => apiFetch(`/api/${entity}/${id}`, { method: 'DELETE' });

// --- Reports ---
export const fetchWeeklyReport = (days = 7) => apiFetch(`/api/reports/weekly?days=${days}`);

// --- Settings (Singleton) ---
export const fetchSettings = () => apiFetch('/api/settings');
export const updateSettings = (data) => apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) });

// --- Statuses ---
export const createStatus = (data) => apiFetch('/api/statuses', { method: 'POST', body: JSON.stringify(data) });
export const updateStatus = (name, data) => apiFetch(`/api/statuses/${name}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStatus = (name, fallbackStatusName) => apiFetch(`/api/statuses/${name}`, { method: 'DELETE', body: JSON.stringify({ fallback_status_name: fallbackStatusName }) });
export const reorderStatuses = (items) => apiFetch('/api/statuses/reorder', { method: 'PUT', body: JSON.stringify(items) });
