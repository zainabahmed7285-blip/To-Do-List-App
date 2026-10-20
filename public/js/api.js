class TaskApiClient {
  constructor(baseUrl = 'http://16.171.55.141:3000/api/tasks') {
    this.baseUrl = baseUrl;
  }
  async _request(endpoint = '', options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP Error: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async getAllTasks() {
    const result = await this._request();
    return result.data;
  }
  async createTask(taskData) {
    const result = await this._request('', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    return result.data;
  }
  async updateTask(id, taskData) {
    const result = await this._request(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
    return result.data;
  }
  async deleteTask(id) {
    const result = await this._request(`/${id}`, {
      method: 'DELETE'
    });
    return result.data;
  }
}
const apiClient = new TaskApiClient();