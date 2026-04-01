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
export const fetchTasks = (boardId = null, query = '') => {
  const params = new URLSearchParams(query.replace('?', ''));
  if (boardId) {
    params.append('board_id', boardId);
  }
  const qStr = params.toString();
  return apiFetch(`/api/tasks${qStr ? `?${qStr}` : ''}`);
};
export const createTask = (data) => apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
export const updateTask = (id, data) => apiFetch(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTask = (id) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
export const reorderTasks = (items) => apiFetch('/api/tasks/reorder', { method: 'PUT', body: JSON.stringify(items) });
export const reassignStatusTasks = (fromStatus, toStatus) => apiFetch('/api/tasks/reassign', { method: 'PUT', body: JSON.stringify({ from_status: fromStatus, to_status: toStatus }) });

// --- Metrics ---
export const fetchMetrics = (timeframe, boardId = null) => apiFetch(`/api/metrics?${timeframe ? `timeframe=${timeframe}` : ''}${boardId ? `&board_id=${boardId}` : ''}`);

// --- Config (generic) ---
export const fetchConfig = (entity, boardId = null) => apiFetch(`/api/${entity}${boardId ? `?board_id=${boardId}` : ''}`);
export const createConfig = (entity, data, boardId = null) => apiFetch(`/api/${entity}${boardId ? `?board_id=${boardId}` : ''}`, { method: 'POST', body: JSON.stringify(data) });
export const updateConfig = (entity, id, data) => apiFetch(`/api/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteConfig = (entity, id) => apiFetch(`/api/${entity}/${id}`, { method: 'DELETE' });

// --- Reports ---
export const fetchWeeklyReport = (days = 7) => apiFetch(`/api/reports/weekly?days=${days}`);

// --- Settings (Singleton) ---
export const fetchSettings = (boardId = null) => apiFetch(`/api/settings${boardId ? `?board_id=${boardId}` : ''}`);
export const updateSettings = (data, boardId = null) => apiFetch(`/api/settings${boardId ? `?board_id=${boardId}` : ''}`, { method: 'PUT', body: JSON.stringify(data) });

// --- Statuses ---
export const createStatus = (data) => apiFetch('/api/statuses', { method: 'POST', body: JSON.stringify(data) });
export const updateStatus = (name, data) => apiFetch(`/api/statuses/${name}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteStatus = (name, fallbackStatusName) => apiFetch(`/api/statuses/${name}`, { method: 'DELETE', body: JSON.stringify({ fallback_status_name: fallbackStatusName }) });
export const reorderStatuses = (items) => apiFetch('/api/statuses/reorder', { method: 'PUT', body: JSON.stringify(items) });

// --- Time Blocks ---
export const fetchTimeBlocks = (start, end, boardId = null) => apiFetch(`/api/time-blocks?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}${boardId ? `&board_id=${boardId}` : ''}`);
export const createTimeBlock = (data) => apiFetch('/api/time-blocks', { method: 'POST', body: JSON.stringify(data) });
export const updateTimeBlock = (id, data) => apiFetch(`/api/time-blocks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTimeBlock = (id) => apiFetch(`/api/time-blocks/${id}`, { method: 'DELETE' });
