import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [loading, setLoading] = useState(true);

    // Global Date State
    const getTodayDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    const [selectedDate, setSelectedDate] = useState(getTodayDate());

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo) return;

            const { data } = await axios.get('/api/auth/companies', {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setCompanies(data);

            if (data.length > 0) {
                setSelectedCompany(data[0]);
            }
        } catch (err) {
            console.error('Error fetching companies', err);
        } finally {
            setLoading(false);
        }
    };

    const changeCompany = (company) => {
        // No-op or just set it
        setSelectedCompany(company);
    };

    return (
        <CompanyContext.Provider value={{
            companies,
            selectedCompany,
            setSelectedCompany: changeCompany,
            selectedDate,
            setSelectedDate,
            loading
        }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompany = () => useContext(CompanyContext);
