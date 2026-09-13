const DEFAULT_BASE_URL = "http://localhost:5000/api/auth";

export class AuthServiceClient {
  constructor({ baseUrl = process.env?.AUTH_SERVICE_URL || DEFAULT_BASE_URL, token = null } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  setToken(token) {
    this.token = token;

    if (typeof localStorage !== "undefined") {
      if (token) {
        localStorage.setItem("authToken", token);
      } else {
        localStorage.removeItem("authToken");
      }
    }
  }

  getStoredToken() {
    if (this.token) return this.token;

    if (typeof localStorage !== "undefined") {
      this.token = localStorage.getItem("authToken") || null;
    }

    return this.token;
  }

  getHeaders(includeJson = true) {
    const headers = {};
    const token = this.getStoredToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    if (includeJson) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  async request(path, options = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...this.getHeaders(!options.body || typeof options.body !== "string" || !options.body.includes("FormData")),
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async signup(email, password, name) {
    const result = await this.request("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });

    this.setToken(result.token || null);
    return result;
  }

  async login(email, password) {
    const result = await this.request("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    this.setToken(result.token || null);
    return result;
  }

  async logout() {
    const result = await this.request("/logout", {
      method: "POST",
    });

    this.setToken(null);
    return result;
  }

  async checkAuth() {
    return this.request("/check-auth", {
      method: "GET",
    });
  }

  async forgotPassword(email) {
    return this.request("/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, password) {
    return this.request(`/reset-password/${token}`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }
}

export default AuthServiceClient;
