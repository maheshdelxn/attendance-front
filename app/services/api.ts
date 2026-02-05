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

// const LOCAL_IP = '192.168.1.20';
const BASE_URL = 'https://attendance-back-sigma.vercel.app/api';

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

    // AUTH
    register: async (userData: any) => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Registration failed');
        return data;
    },

    login: async (mobile: string, password: string) => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Login failed');
        return data; // { token, user: { id, name, role... } }
    },

    // SITES
    createSite: async (siteData: any) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/sites`, {
            method: 'POST',
            headers,
            body: JSON.stringify(siteData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Failed to create site');
        return data;
    },

    getSites: async () => {
        const { token } = await getAuthData();
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}/sites`, { headers });
        return res.json();
    },

    deleteSite: async (id: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/sites/${id}`, {
            method: 'DELETE',
            headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete site');
        return data;
    },

    updateSite: async (id: string, siteData: any) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/sites/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(siteData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'Failed to update site');
        return data;
    },

    // REPORTS
    getDashboardStats: async () => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/reports/dashboard`, { headers });
        return res.json();
    },

    getSummaryReport: async (period: string, siteId: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/reports/summary?period=${period}&siteId=${siteId}`, { headers });
        return res.json();
    },

    // ATTENDANCE
    markAttendance: async (formData: FormData) => {
        const headers = await api.getHeaders(true); // Multipart = true
        const res = await fetch(`${BASE_URL}/attendance/mark`, {
            method: 'POST',
            headers,
            body: formData,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || result.error || 'Attendance failed');
        return result;
    },

    getAttendanceStatus: async (userId: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/attendance/status/${userId}`, { headers });
        if (res.status === 404) return null;
        return res.json();
    },

    getAttendanceHistory: async (userId: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/attendance/history/${userId}`, { headers });
        return res.json();
    },

    getAttendanceLogs: async () => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/attendance/logs`, { headers });
        return res.json();
    },

    // WORKERS
    getWorkers: async () => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/users/workers`, { headers });
        return res.json();
    },

    updateWorker: async (id: string, data: any) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || result.error || 'Failed to update worker');
        return result;
    },

    toggleWorkerStatus: async (id: string) => {
        const headers = await api.getHeaders();
        const res = await fetch(`${BASE_URL}/users/${id}/status`, {
            method: 'PATCH',
            headers,
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || result.error || 'Failed to toggle status');
        return result;
    }
};
