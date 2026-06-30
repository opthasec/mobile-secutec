import * as SecureStore from 'expo-secure-store';

interface LoginResult {
  success: boolean;
  role: string;
  username: string;
  user_id: number;
}

class AuthService {
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private userIdKey = 'user_id';

  // 🔑 TOKENS
  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.tokenKey);
  }

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.refreshTokenKey);
  }

  async getUserId(): Promise<number | null> {
    const userId = await SecureStore.getItemAsync(this.userIdKey);
    return userId ? parseInt(userId, 10) : null;
  }

  async setTokens(accessToken: string, refreshToken: string, role?: string, username?: string, userId?: number): Promise<void> {
    await SecureStore.setItemAsync(this.tokenKey, accessToken);
    await SecureStore.setItemAsync(this.refreshTokenKey, refreshToken);
    if (role) await SecureStore.setItemAsync('role', role);
    if (username) await SecureStore.setItemAsync('username', username);
    if (userId) await SecureStore.setItemAsync(this.userIdKey, String(userId));
  }

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(this.tokenKey);
    await SecureStore.deleteItemAsync(this.refreshTokenKey);
    await SecureStore.deleteItemAsync(this.userIdKey);
    await SecureStore.deleteItemAsync('role');
    await SecureStore.deleteItemAsync('username');
  }

  // 🔐 AUTH STATUS
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  // 🔐 LOGIN — solo supervisores
  async login(username: string, password: string): Promise<LoginResult> {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

    const response = await fetch(`${API_BASE_URL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error en el login');
    }

    const data = await response.json();

    await this.setTokens(data.access, data.refresh, data.role, data.username, data.user_id);

    return {
      success: true,
      role: data.role,
      username: data.username,
      user_id: data.user_id,
    };
  }

  // 🔄 REFRESH
  async refreshToken(): Promise<string> {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch(`${API_BASE_URL}/api/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      await this.clearTokens();
      throw new Error('Sesión expirada');
    }

    const data = await response.json();
    // Al refrescar, el payload del nuevo token tiene el user_id. Lo extraemos y guardamos.
    const payload = JSON.parse(atob(data.access.split('.')[1]));
    const userId = payload.user_id;

    await this.setTokens(data.access, refreshToken, undefined, undefined, userId);
    return data.access;
  }

  // 🚪 LOGOUT
  async logout(): Promise<void> {
    await this.clearTokens();
  }

  // 🔐 REQUEST AUTENTICADO
  async authenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    let token = await this.getToken();

    if (!await this.isAuthenticated()) {
      token = await this.refreshToken();
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      try {
        token = await this.refreshToken();
        return await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {
        await this.clearTokens();
        throw new Error('Sesión expirada');
      }
    }

    return response;
  }

  // 👤 USER
  async getUser() {
    return {
      role: await SecureStore.getItemAsync('role'),
      username: await SecureStore.getItemAsync('username'),
      userId: await this.getUserId(),
    };
  }


  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
    const response = await this.authenticatedRequest(`${API_BASE_URL}/api/change-password/`, {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Error al cambiar contraseña');
  }
}

const authService = new AuthService();
export default authService;