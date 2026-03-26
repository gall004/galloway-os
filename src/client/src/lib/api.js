const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7432';

/**
 * @description Fetch all tasks from the backend API.
 * @returns {Promise<Array>} Array of task objects.
 */
export async function fetchTasks() {
  const res = await fetch(`${API_BASE}/api/tasks`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.status}`);
  }
  return res.json();
}

/**
 * @description Create a new task via the backend API.
 * @param {Object} taskData - Task fields.
 * @returns {Promise<Object>} The created task.
 */
export async function createTask(taskData) {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create task');
  }
  return res.json();
}

/**
 * @description Update an existing task via the backend API.
 * @param {number} id - Task ID.
 * @param {Object} updates - Fields to update.
 * @returns {Promise<Object>} The updated task.
 */
export async function updateTask(id, updates) {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update task');
  }
  return res.json();
}

/**
 * @description Delete a task via the backend API.
 * @param {number} id - Task ID.
 * @returns {Promise<void>}
 */
export async function deleteTask(id) {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to delete task');
  }
}
