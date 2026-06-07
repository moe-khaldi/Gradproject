const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

class APIService {
  constructor() {
    this.baseURL = API_BASE;
  }

  async _readResponseBody(response) {
    const contentType = response.headers.get('content-type') || '';
    const rawBody = await response.text();

    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(rawBody);
      } catch {
        return rawBody;
      }
    }

    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('access_token');

    const headers = {
      ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const config = { headers, ...options };

    try {
      let response = await fetch(url, config);

      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem('access_token');
          let retryBody = config.body;
          if (options._buildFormData) retryBody = options._buildFormData();
          const retryHeaders = {
            ...(!(retryBody instanceof FormData) && { 'Content-Type': 'application/json' }),
            Authorization: `Bearer ${newToken}`,
            ...options.headers,
          };
          response = await fetch(url, { ...config, body: retryBody, headers: retryHeaders });
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        let errMsg = `HTTP ${response.status}`;
        try {
          const errData = await this._readResponseBody(response);
          if (errData && typeof errData === 'object') {
            errMsg = errData.error || errData.detail || errData.message || errMsg;
          } else if (typeof errData === 'string' && errData.trim()) {
            errMsg = errData;
          }
        } catch {
          // Keep default HTTP status message when the body is not readable.
        }
        throw new Error(errMsg);
      }

      if (response.status === 204) return null;
      return await this._readResponseBody(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

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
        const data = await this._readResponseBody(response);
        localStorage.setItem('access_token', data.access);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Materials
  getMaterials()         { return this.request('/api/materials/'); }
  getMaterial(id)        { return this.request(`/api/materials/${id}/`); }
  createMaterial(data)   { return this.request('/api/materials/', { method: 'POST', body: JSON.stringify(data) }); }
  deleteMaterial(id)     { return this.request(`/api/materials/${id}/`, { method: 'DELETE' }); }

  // Chat
  sendMessage(message, subject, context = {}, sessionId = null) {
    return this.request('/api/chat/', {
      method: 'POST',
      body: JSON.stringify({ message, subject, context, session_id: sessionId }),
    });
  }

  // Quiz
  generateQuiz(config) {
    return this.request('/api/quiz/generate/', { method: 'POST', body: JSON.stringify(config) });
  }
  submitQuiz(quizId, answers) {
    return this.request('/api/quiz/submit/', { method: 'POST', body: JSON.stringify({ quiz_id: quizId, answers }) });
  }

  // Explain
  uploadFile(file, options = {}) {
    const buildFormData = () => {
      const fd = new FormData();
      fd.append('file', file);
      if (options.subject) fd.append('subject', options.subject);
      if (options.topic)   fd.append('topic',   options.topic);
      return fd;
    };
    return this.request('/api/upload/explain/', {
      method: 'POST',
      headers: {},
      body: buildFormData(),
      _buildFormData: buildFormData,
    });
  }
  explainContent(content, options = {}) {
    return this.request('/api/explain/', {
      method: 'POST',
      body: JSON.stringify({ content, subject: options.subject, topic: options.topic }),
    });
  }

  // Quiz history
  getQuizHistory() { return this.request('/api/quiz/history/'); }

  // Flashcards
  generateFlashcards(config) {
    return this.request('/api/flashcards/', { method: 'POST', body: JSON.stringify(config) });
  }

  // Study Planner
  generatePlan(config) {
    return this.request('/api/planner/', { method: 'POST', body: JSON.stringify(config) });
  }

  // Sessions
  getSessions()    { return this.request('/api/sessions/'); }
  getSession(id)   { return this.request(`/api/sessions/${id}/`); }
  deleteSession(id){ return this.request(`/api/sessions/${id}/`, { method: 'DELETE' }); }

  // Dashboard
  getDashboardStats() { return this.request('/api/dashboard/stats/'); }

  // Code Debugger
  debugCode(code, language = 'python') {
    return this.request('/api/debug/code/', {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  // GPA Advisor
  getGPAAdvice(gpa, courses) {
    return this.request('/api/gpa/advice/', {
      method: 'POST',
      body: JSON.stringify({ gpa, courses }),
    });
  }

  // Auth
  login(credentials)  { return this.request('/api/auth/login/', { method: 'POST', body: JSON.stringify(credentials) }); }
  logout(refresh)     { return this.request('/api/auth/logout/', { method: 'POST', body: JSON.stringify({ refresh }) }); }
  register(userData)  { return this.request('/api/auth/register/', { method: 'POST', body: JSON.stringify(userData) }); }
  getCurrentUser()    { return this.request('/api/auth/user/'); }
}

const api = new APIService();
export default api;
