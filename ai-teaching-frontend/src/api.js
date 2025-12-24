// API Service for Django Backend Integration
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

class APIService {
  constructor() {
    this.baseURL = API_BASE;
  }

  // Helper method for making requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Get token from localStorage
    const token = localStorage.getItem('access_token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Handle token expiration
      if (response.status === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry request with new token
          const newToken = localStorage.getItem('access_token');
          config.headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, config);

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          return await retryResponse.json();
        } else {
          // Redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Token refresh method
  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Materials API
  async getMaterials() {
    return this.request('/api/materials/');
  }

  async getMaterial(id) {
    return this.request(`/api/materials/${id}/`);
  }

  async createMaterial(data) {
    return this.request('/api/materials/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMaterial(id, data) {
    return this.request(`/api/materials/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMaterial(id) {
    return this.request(`/api/materials/${id}/`, {
      method: 'DELETE',
    });
  }

  // Chat/AI Tutor API (you'll need to create these endpoints in Django)
  async sendMessage(message, subject, context = {}) {
    return this.request('/api/chat/', {
      method: 'POST',
      body: JSON.stringify({
        message,
        subject,
        context,
      }),
    });
  }

  // Quiz API
  async generateQuiz(config) {
    return this.request('/api/quiz/generate/', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async submitQuiz(quizId, answers) {
    return this.request('/api/quiz/submit/', {
      method: 'POST',
      body: JSON.stringify({
        quiz_id: quizId,
        answers,
      }),
    });
  }

  async getQuizHistory() {
    return this.request('/api/quiz/history/');
  }

  // Upload & Explain API
  async uploadFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.subject) {
      formData.append('subject', options.subject);
    }
    if (options.topic) {
      formData.append('topic', options.topic);
    }

    return this.request('/api/upload/explain/', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async explainContent(content, options = {}) {
    return this.request('/api/explain/', {
      method: 'POST',
      body: JSON.stringify({
        content,
        subject: options.subject,
        topic: options.topic,
      }),
    });
  }

  // Sessions API (for logged-in users)
  async getSessions() {
    return this.request('/api/sessions/');
  }

  async getSession(id) {
    return this.request(`/api/sessions/${id}/`);
  }

  async createSession(data) {
    return this.request('/api/sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteSession(id) {
    return this.request(`/api/sessions/${id}/`, {
      method: 'DELETE',
    });
  }

  // Auth API
  async login(credentials) {
    return this.request('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(refreshToken) {
    return this.request('/api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  }

  async register(userData) {
    return this.request('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/api/auth/user/');
  }
}

// Export singleton instance
export const api = new APIService();
export default api;
