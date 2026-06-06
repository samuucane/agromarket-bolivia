import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor — attach access token ───────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('agromarket-auth');
      if (authData) {
        const { state } = JSON.parse(authData);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor — handle 401 / refresh token ───────────────────────
let isRefreshing = false;
let failedQueue: { resolve: Function; reject: Function }[] = [];

const processQueue = (error: Error | null, token?: string) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return apiClient(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const authData = localStorage.getItem('agromarket-auth');
        if (!authData) throw new Error('No auth data');
        const { state } = JSON.parse(authData);
        const { refreshToken } = state;

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        const { accessToken: newAccess, refreshToken: newRefresh } = data;

        // Update stored tokens
        const parsed = JSON.parse(authData);
        parsed.state.accessToken = newAccess;
        parsed.state.refreshToken = newRefresh;
        localStorage.setItem('agromarket-auth', JSON.stringify(parsed));

        original.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        // Clear auth state on refresh failure
        localStorage.removeItem('agromarket-auth');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
