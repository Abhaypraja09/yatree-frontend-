import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
    const { user } = useAuth();
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
    }, [user]);

    const fetchCompanies = async () => {
        try {
            const userInfoRaw = localStorage.getItem('userInfo');
            if (!userInfoRaw) {
                setLoading(false);
                return;
            }
            const userInfo = JSON.parse(userInfoRaw);

            const { data } = await axios.get('/api/auth/companies');
            setCompanies(data);

            // 🛠️ MULTI-TENANCY SYNC: Always prioritize the logged-in user's company
            if (userInfo && userInfo.company) {
                const userCompanyId = (typeof userInfo.company === 'string' ? userInfo.company : (userInfo.company._id || userInfo.company));
                
                // Find full company object from the fetched list to get the name/details
                const fullCompany = data.find(c => c._id === userCompanyId);
                if (fullCompany) {
                    setSelectedCompany(fullCompany);
                } else {
                    // Critical Fix: If user's company not in fetched list (maybe tenant changed), 
                    // use the first available company from the list if any
                    if (data.length > 0) {
                        setSelectedCompany(data[0]);
                    } else {
                        setSelectedCompany(typeof userInfo.company === 'string' ? { _id: userInfo.company, name: 'Loading...' } : userInfo.company);
                    }
                }
            } else if (data.length > 0) {
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
