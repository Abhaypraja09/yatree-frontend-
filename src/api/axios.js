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
            const { token } = JSON.parse(userInfo);
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance;
