import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const instance = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to add the token to headers
instance.interceptors.request.use(
    (config) => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const parsed = JSON.parse(userInfo);
                if (parsed && parsed.token) {
                    config.headers.Authorization = `Bearer ${parsed.token}`;
                }
            } catch (e) {
                console.error('Error parsing userInfo from localStorage', e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance;
