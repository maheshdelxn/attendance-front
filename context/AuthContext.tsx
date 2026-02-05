import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveAuthData, getAuthData, clearAuthData } from '../app/services/api';

interface AuthContextType {
    user: any | null;
    isLoading: boolean;
    login: (userData: any, token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        const { user } = await getAuthData();
        if (user) {
            setUser(user);
        }
        setIsLoading(false);
    };

    const login = async (userData: any, token: string) => {
        setUser(userData);
        await saveAuthData(token, userData);
    };

    const logout = async () => {
        setUser(null);
        await clearAuthData();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
