/**
 * Presentation Tier: REST API Client
 * Encapsulates all asynchronous HTTP operations communicating with the Express Application Tier.
 */
class TaskApiClient {
  constructor(baseUrl = '/api/tasks') {
    this.baseUrl = baseUrl;
  }

  async _request(endpoint = '', options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP Error: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (err) {
      console.error(`[API Client Error] ${options.method || 'GET'} ${url}:`, err);
      throw err;
    }
  }

  /**
   * Get all tasks with query filter options.
   * @param {Object} query - { status, priority, category, search, sort }
   */
  async fetchTasks(query = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });

    const queryString = searchParams.toString();
    const endpoint = queryString ? `?${queryString}` : '';
    const res = await this._request(endpoint, { method: 'GET' });
    return res.data;
  }

  /**
   * Fetch aggregate statistics for dashboard.
   */
  async fetchStats() {
    const res = await this._request('/stats', { method: 'GET' });
    return res.data;
  }

  /**
   * Fetch a single task by ID.
   */
  async fetchTaskById(id) {
    const res = await this._request(`/${id}`, { method: 'GET' });
    return res.data;
  }

  /**
   * Create a new task.
   */
  async createTask(taskData) {
    const res = await this._request('', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    return res.data;
  }

  /**
   * Update an existing task.
   */
  async updateTask(id, updateData) {
    const res = await this._request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return res.data;
  }

  /**
   * Toggle completion status.
   */
  async toggleTask(id) {
    const res = await this._request(`/${id}/toggle`, {
      method: 'PATCH'
    });
    return res.data;
  }

  /**
   * Delete a task by ID.
   */
  async deleteTask(id) {
    return await this._request(`/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Clear all completed tasks.
   */
  async clearCompleted() {
    return await this._request('/completed', {
      method: 'DELETE'
    });
  }
}

// Export singleton instance
window.apiClient = new TaskApiClient();
