import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatestProfile = async (token) => {
            try {
                const { data } = await axios.get('/api/auth/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Merge token with latest user data
                const updatedInfo = { ...data, token };
                localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
                setUser(updatedInfo);
            } catch (err) {
                console.error('Failed to sync permissions');
            } finally {
                setLoading(false);
            }
        };

        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            if (parsed.token) {
                fetchLatestProfile(parsed.token);
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (mobile, password) => {
        const { data } = await axios.post('/api/auth/login', { mobile, password });
        localStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('selectedCompany');
        localStorage.removeItem('selectedDate');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
