import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ----------------------------------------------------------------------
// 🌍 API CONFIGURATION
// ----------------------------------------------------------------------
// ⚠️ IF USING PHYSICAL DEVICE: Replace this with your PC's Local IP (e.g. http://192.168.1.5:5000/api)
// 🤖 IF USING ANDROID EMULATOR: Use http://10.0.2.2:5000/api
import Constants from 'expo-constants';

// Get the IP address of the machine running the packager (likely your PC)
const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || '';
const localhost = debuggerHost.split(':')[0];

const BASE_URL = 'https://attendance-back-sepia.vercel.app/api';
// const LOCAL_IP = '192.168.1.20';
// const BASE_URL = `http://${LOCAL_IP}:3000/api`;

export const getBoxUrl = () => BASE_URL;

// ----------------------------------------------------------------------
// 🔑 AUTH TOKEN MANAGEMENT
// ----------------------------------------------------------------------
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const saveAuthData = async (token: string, user: any) => {
    try {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('Error saving auth data:', error);
    }
};

export const getAuthData = async () => {
    try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const user = await SecureStore.getItemAsync(USER_KEY);
        return { token, user: user ? JSON.parse(user) : null };
    } catch (error) {
        return { token: null, user: null };
    }
};

export const clearAuthData = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
};

// ----------------------------------------------------------------------
// 📡 API CALLS
// ----------------------------------------------------------------------
export const api = {
    getBoxUrl: () => BASE_URL,

    // HELPER: Get Headers with Token
    getHeaders: async (isMultipart = false) => {
        const { token } = await getAuthData();
        const headers: any = {
            'Authorization': `Bearer ${token}`,
        };
        if (!isMultipart) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    },

    // HELPER: Handle response robustly
    handleResponse: async (res: Response) => {
        const contentType = res.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            data = { message: await res.text() };
        }

        if (!res.ok) {
            throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
        }
        return data;
    },

    // AUTH
    register: async (userData: any) => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return api.handleResponse(res);
    },

    login: async (mobile: string, password: string) => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, password }),
        });
        return api.handleResponse(res);
    },

    // SITES
    createSite: async (siteData: any) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/sites`, {
            method: 'POST',
            headers,
            body: JSON.stringify(siteData),
        });
        return api.handleResponse(res);
    },

    getSites: async () => {
        const { token } = await getAuthData();
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}/sites`, { headers });
        return api.handleResponse(res);
    },

    deleteSite: async (id: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/sites/${id}`, {
            method: 'DELETE',
            headers,
        });
        return api.handleResponse(res);
    },

    updateSite: async (id: string, siteData: any) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/sites/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(siteData),
        });
        return api.handleResponse(res);
    },

    // REPORTS
    getDashboardStats: async () => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/reports/dashboard`, { headers });
        return api.handleResponse(res);
    },

    getSummaryReport: async (period: string, siteId: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/reports/summary?period=${period}&siteId=${siteId}`, { headers });
        return api.handleResponse(res);
    },

    // ATTENDANCE
    markAttendance: async (formData: FormData) => {
        const headers = await api.getHeaders(true); // Multipart = true
        const res = await fetch(`${BASE_URL}/attendance/mark`, {
            method: 'POST',
            headers,
            body: formData,
        });
        return api.handleResponse(res);
    },

    getAttendanceStatus: async (userId: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/attendance/status/${userId}`, { headers });
        if (res.status === 404) return null;
        return api.handleResponse(res);
    },

    getAttendanceHistory: async (userId: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/attendance/history/${userId}`, { headers });
        return api.handleResponse(res);
    },

    getAttendanceLogs: async () => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/attendance/logs`, { headers });
        return api.handleResponse(res);
    },

    // WORKERS
    getWorkers: async () => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/users/workers`, { headers });
        return api.handleResponse(res);
    },

    updateWorker: async (id: string, data: any) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        return api.handleResponse(res);
    },

    toggleWorkerStatus: async (id: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/users/${id}/status`, {
            method: 'PATCH',
            headers,
        });
        return api.handleResponse(res);
    }
};
