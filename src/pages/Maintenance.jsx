import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';
import * as XLSX from 'xlsx';
import {
    Wrench,
    Plus,
    Search,
    Trash2,
    Calendar,
    FileText,
    MapPin,
    Clock,
    CreditCard,
    AlertCircle,
    CheckCircle2,
    History,
    Car,
    Filter,
    ChevronDown,
    Upload,
    FileSpreadsheet,
    Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';
import { todayIST, formatDateIST, nowIST, formatDateTimeIST } from '../utils/istUtils';

const Maintenance = () => {
    const { theme } = useTheme();
    const { selectedCompany } = useCompany();
    const location = useLocation();
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [selectedYear, setSelectedYear] = useState(nowIST().getUTCFullYear());
    const [pendingExpenses, setPendingExpenses] = useState([]);
    const [filterGarage, setFilterGarage] = useState('All');
    const [selectedBillPhoto, setSelectedBillPhoto] = useState(null);
    const [activeCategory, setActiveCategory] = useState('All');

    // ── AI AGENT SEARCH INTEGRATION ──
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchParam = params.get('search') || params.get('name') || params.get('driver') || params.get('vehicle');
        const monthParam = params.get('month');
        const yearParam = params.get('year');
        const typeParam = params.get('type') || params.get('category');

        if (searchParam) setSearchTerm(searchParam);
        if (monthParam) setSelectedMonth(monthParam === 'All' ? 'All' : Number(monthParam));
        if (yearParam) setSelectedYear(Number(yearParam));
        if (typeParam) setFilterType(typeParam);
    }, [location.search]);

    // Form State
    const [formData, setFormData] = useState({
        vehicleId: '',
        driverId: '',
        maintenanceType: 'Regular Service',
        category: '',
        partsChanged: [],
        description: '',
        garageName: '',
        billNumber: '',
        billDate: todayIST(),
        amount: '',
        paymentMode: 'Cash',
        currentKm: '',
        nextServiceKm: '',
        status: 'Completed'
    });
    const [billPhoto, setBillPhoto] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showNextService, setShowNextService] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const maintenanceTypes = [
        'Regular Service',
        'Engine & Mechanical',
        'Suspension System',
        'Steering System',
        'Fuel System',
        'Exhaust System',
        'Clutch & Transmission',
        'Brake System',
        'Tyres & Wheels',
        'Electrical & Battery',
        'Sensors & Electronics',
        'AC & Cooling',
        'Body & Interior',
        'Emergency Repairs',
        'Other'
    ];

    const subCategories = {
        'Regular Service': ['Engine oil change', 'Oil filter', 'Air filter', 'Fuel filter', 'General servicing'],
        'Engine & Mechanical': ['Engine overhaul', 'Timing belt', 'Mountings', 'Valve adjustment', 'Gasket replacement'],
        'Suspension System': ['Shock absorbers', 'Bushings', 'Struts', 'Springs', 'Link rods', 'Control arms'],
        'Steering System': ['Power steering pump', 'Steering rack', 'Tie rod ends', 'Steering oil', 'Steering belt'],
        'Fuel System': ['Fuel pump', 'Fuel lines', 'Fuel tank cleaning', 'Injectors'],
        'Exhaust System': ['Silencer repair', 'Catalytic converter', 'Exhaust manifold', 'Muffler'],
        'Clutch & Transmission': ['Clutch plate', 'Pressure plate', 'Release bearing', 'Gear oil', 'Gearbox repair', 'CV joints'],
        'Tyres & Wheels': ['New tyre purchase', 'Tyre rotation', 'Alignment & Balancing', 'Wheel bearings'],
        'Brake System': ['Brake pads', 'Brake shoe', 'Disc/Drum', 'Brake oil', 'Brake lines'],
        'Electrical & Battery': ['Battery replacement', 'Alternator', 'Starter motor', 'Wiring', 'Lights', 'Fuses'],
        'Sensors & Electronics': ['ECU repair', 'Oxygen sensor', 'ABS sensor', 'Parking sensors', 'Wiring harness'],
        'AC & Cooling': ['AC gas refill', 'Compressor repair', 'Radiator service', 'Coolant top-up', 'Thermostat'],
        'Body & Interior': ['Denting painting', 'Seat covers', 'Dashboard repair', 'Mirror/Glass', 'Wipers', 'Door locks'],
        'Emergency Repairs': ['Breakdown towing', 'On-road repair', 'Jump start', 'Accident repair']
    };

    useEffect(() => {
        if (selectedCompany) {
            fetchRecords();
            fetchPending();
            fetchVehicles();
            fetchDrivers();
        }
    }, [selectedCompany, selectedMonth, selectedYear]);

    const fetchRecords = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            let url = `/api/admin/maintenance/${selectedCompany._id}?month=${selectedMonth}&year=${selectedYear}`;

            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setRecords(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchPending = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/maintenance/pending/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPendingExpenses(data || []);
        } catch (err) { console.error(err); }
    };

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
    };

    const fetchDrivers = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setDrivers(data.drivers || []);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'partsChanged') {
                    fd.append(key, JSON.stringify(formData[key]));
                } else if (key === 'nextServiceKm' && (!showNextService || !formData[key])) {
                    // Skip if hidden or empty
                } else {
                    fd.append(key, formData[key]);
                }
            });
            fd.append('companyId', selectedCompany._id);
            if (billPhoto) fd.append('billPhoto', billPhoto);

            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            if (editingId) {
                await axios.put(`/api/admin/maintenance/${editingId}`, fd, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${userInfo.token}`
                    }
                });
                alert('Maintenance record updated successfully');
            } else {
                await axios.post('/api/admin/maintenance', fd, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${userInfo.token}`
                    }
                });
                alert('Maintenance record added successfully');
            }

            setShowModal(false);
            setShowNextService(false);
            resetForm();
            fetchRecords();
            fetchPending();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving record');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.delete(`/api/admin/maintenance/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchRecords();
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setFormData({
            vehicleId: '',
            driverId: '',
            maintenanceType: '',
            category: '',
            partsChanged: [],
            description: '',
            garageName: '',
            billNumber: '',
            billDate: todayIST(),
            amount: '',
            paymentMode: 'Cash',
            currentKm: '',
            nextServiceKm: '',
            status: 'Completed'
        });
        setBillPhoto(null);
        setShowNextService(false);
        setEditingId(null);
    };

    const NEXT_SERVICE_TYPES = [
        'Regular Service', 
        'Suspension System', 
        'Steering System', 
        'Clutch & Transmission', 
        'Brake System', 
        'Tyres & Wheels', 
        'Engine & Mechanical', 
        'Fuel System', 
        'Exhaust System'
    ];

    const handleEdit = (record) => {
        const types = (record.maintenanceType || '').split(', ').filter(Boolean);
        const isEligibleForReminder = types.some(t => NEXT_SERVICE_TYPES.includes(t));
        setFormData({
            vehicleId: record.vehicle?._id || record.vehicle || '',
            driverId: record.driver?._id || record.driver || '',
            maintenanceType: record.maintenanceType || '',
            category: record.category || '',
            partsChanged: record.partsChanged || [],
            description: record.description || '',
            garageName: record.garageName || '',
            billNumber: record.billNumber || '',
            billDate: record.billDate ? nowIST(record.billDate).toISOString().split('T')[0] : '',
            amount: record.amount,
            paymentMode: record.paymentMode || 'Cash',
            currentKm: record.currentKm || '',
            nextServiceKm: record.nextServiceKm || '',
            status: record.status || 'Completed'
        });
        setEditingId(record._id);
        // Auto-show reminder if record has value OR if it's an eligible type
        setShowNextService(isEligibleForReminder && !!record.nextServiceKm);
        setShowModal(true);
    };

    const handleApprove = async (attendanceId, expenseId) => {
        if (!window.confirm('Are you sure you want to approve this expense? It will be officially added to your records.')) return;
        try {
            await axios.patch(`/api/admin/attendance/${attendanceId}/expense/${expenseId}`, { status: 'approved' });
            fetchRecords();
            fetchPending();
        } catch (err) {
            console.error('Approval failed:', err);
            alert(err.response?.data?.message || 'Failed to approve expense');
        }
    };

    const handleReject = async (attendanceId, expenseId) => {
        if (!window.confirm('Reject this expense? It will be marked as rejected.')) return;
        try {
            await axios.patch(`/api/admin/attendance/${attendanceId}/expense/${expenseId}`, { status: 'rejected' });
            fetchRecords();
            fetchPending();
        } catch (err) {
            console.error('Rejection failed:', err);
            alert(err.response?.data?.message || 'Failed to reject expense');
        }
    };

    const downloadExcel = () => {
        const dataToExport = filteredRecords.map(r => ({
            'Bill Date': r.billDate ? formatDateIST(r.billDate) : 'N/A',
            'Vehicle': r.vehicle?.carNumber || 'N/A',
            'Maintenance Type': r.maintenanceType,
            'Sub-Category': r.category || 'N/A',
            'Garage Name': r.garageName || r.vendorName || 'N/A',
            'Bill Number': r.billNumber || 'N/A',
            'Amount (₹)': r.amount || 0,
            'KM Reading': r.currentKm || 'N/A',
            'Payment Mode': r.paymentMode,
            'Description': r.description || 'N/A',
            'Next Service KM': r.nextServiceKm || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Maintenance Logs');
        XLSX.writeFile(wb, `Maintenance_Report_${selectedCompany?.name}_${todayIST()}.xlsx`);
    };

    const [filterVehicle, setFilterVehicle] = useState('All');

    const uniqueGarages = [...new Set(records.map(r => r.garageName || r.vendorName).filter(Boolean))].sort();
    const uniqueVehicles = [...new Set(vehicles.map(v => v.carNumber).filter(Boolean))].sort();

    const filteredRecords = (records || []).filter(r => {
        const matchesSearch = (r.vehicle?.carNumber?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            r.maintenanceType?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            r.garageName?.toLowerCase()?.includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'All' || (r.maintenanceType && r.maintenanceType.split(', ').includes(filterType));
        const matchesGarage = filterGarage === 'All' || (r.garageName || r.vendorName) === filterGarage;
        const matchesVehicle = filterVehicle === 'All' || r.vehicle?.carNumber === filterVehicle;

        // Exclude Wash, Puncture, Tissues, Water, Cleaning, Masks, Sanitizers as they are in Driver Services
        const serviceRegex = /wash|puncture|puncher|tissue|water|cleaning|mask|sanitizer/i;
        const isService = serviceRegex.test(r.category || '') ||
            serviceRegex.test(r.description || '') ||
            serviceRegex.test(r.maintenanceType || '');

        const matchesCategory = activeCategory === 'All' || r.maintenanceType === activeCategory;

        return matchesSearch && matchesType && matchesGarage && matchesVehicle && matchesCategory && !isService;
    });

    const categoryStats = maintenanceTypes.reduce((acc, type) => {
        acc[type] = (records || []).filter(r => r.maintenanceType === type).length;
        return acc;
    }, {});

    const frequencyInSelectedPeriod = filteredRecords.length;

    const totalMaintenanceCost = filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);


    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Vehicle Maintenance" description="Track and manage your fleet's maintenance schedules and repair histories." />

            {/* Header Section */}
            <header className="mobile-stack" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '30px 0',
                gap: '20px',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: 'clamp(46px, 10vw, 56px)',
                        height: 'clamp(46px, 10vw, 56px)',
                        background: 'linear-gradient(135deg, white, #f8fafc)',
                        borderRadius: '16px',
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: `0 10px 25px ${theme.primary}30`,
                        flexShrink: 0
                    }}>
                        <Wrench size={26} color={theme.primary} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }}></div>
                            <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Fleet Health</span>
                        </div>
                        <h1 style={{ color: 'white', fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: '950', margin: 0, letterSpacing: '-1.5px', lineHeight: 1 }}>
                            Car <span className="theme-gradient-text">Maintenance</span>
                        </h1>
                    </div>
                </div>

                <div className="mobile-stack" style={{ display: 'flex', gap: '12px', flex: '1', justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="input-field"
                            style={{ height: '48px', width: '120px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                        >
                            <option value="All" style={{ background: '#0f172a' }}>All Months</option>
                            {[
                                { n: 1, m: 'January' }, { n: 2, m: 'February' }, { n: 3, m: 'March' },
                                { n: 4, m: 'April' }, { n: 5, m: 'May' }, { n: 6, m: 'June' },
                                { n: 7, m: 'July' }, { n: 8, m: 'August' }, { n: 9, m: 'September' },
                                { n: 10, m: 'October' }, { n: 11, m: 'November' }, { n: 12, m: 'December' }
                            ].map(item => (
                                <option key={item.n} value={item.n} style={{ background: '#0f172a' }}>{item.m}</option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="input-field"
                            style={{ height: '48px', width: '100px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px' }}
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y} style={{ background: '#0f172a' }}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <div className="glass-card" style={{ padding: '0', display: 'flex', alignItems: 'center', flex: 1, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                            <Search size={16} style={{ margin: '0 12px', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    background: 'transparent', border: 'none', color: 'white', height: '48px', width: '100%', outline: 'none', fontSize: '13px'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={downloadExcel}
                                style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                title="Export Excel"
                            >
                                <FileSpreadsheet size={18} />
                            </button>
                            <button
                                onClick={() => { setEditingId(null); resetForm(); setShowModal(true); }}
                                style={{ width: '48px', height: '48px', borderRadius: '12px', background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary || theme.primary} 100%)`, border: 'none', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 8px 15px ${theme.primary}40` }}
                                title="Add Record"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Pending Approvals Section */}
            {pendingExpenses.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '800', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px #f43f5e' }}></div>
                        Driver Approvals (Awaiting)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {pendingExpenses.map((entry) => (
                            <motion.div
                                key={entry._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card"
                                style={{ padding: '20px', borderLeft: '4px solid var(--primary)', background: 'rgba(251, 191, 36, 0.05)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {entry.slipPhoto ? (
                                            <img
                                                src={`/${entry.slipPhoto}`}
                                                onClick={() => setSelectedBillPhoto(entry.slipPhoto)}
                                                style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                            />
                                        ) : (
                                            <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <FileText size={20} color="rgba(255,255,255,0.2)" />
                                            </div>
                                        )}
                                        <div>
                                            <p style={{ color: 'white', fontWeight: '800', fontSize: '16px', margin: 0 }}>₹{entry.amount}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '4px 0 0' }}>{entry.driver || 'Driver'} • {entry.carNumber}</p>
                                        </div>
                                    </div>
                                    <span style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--primary)', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase' }}>{entry.fuelType || 'Service'}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '15px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                    <span>{entry.km} KM</span>
                                    <span>{formatDateTimeIST(entry.date)}</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button
                                        onClick={() => handleApprove(entry.attendanceId, entry._id)}
                                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(entry.attendanceId, entry._id)}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Total Spend (Filtered)</p>
                        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>₹{totalMaintenanceCost.toLocaleString()}</h2>
                    </div>
                </motion.div>


                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#8b5cf6' }}>
                        <MapPin size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Garage Filter</p>
                        <select
                            value={filterGarage}
                            onChange={(e) => setFilterGarage(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: '700', fontSize: '14px', width: '100%', outline: 'none', cursor: 'pointer', textOverflow: 'ellipsis' }}
                        >
                            <option value="All" style={{ background: '#1e293b', color: 'white' }}>All Garages</option>
                            {uniqueGarages.map(g => <option key={g} value={g} style={{ background: '#1e293b', color: 'white' }}>{g}</option>)}
                        </select>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${theme.primary}20`, display: 'flex', justifyContent: 'center', alignItems: 'center', color: theme.primary }}>
                        <Car size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Car Filter</p>
                        <select
                            value={filterVehicle}
                            onChange={(e) => setFilterVehicle(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: '700', fontSize: '14px', width: '100%', outline: 'none', cursor: 'pointer', textOverflow: 'ellipsis' }}
                        >
                            <option value="All" style={{ background: '#1e293b', color: 'white' }}>All Cars</option>
                            {uniqueVehicles.map(v => <option key={v} value={v} style={{ background: '#1e293b', color: 'white' }}>{v}</option>)}
                        </select>
                    </div>
                </motion.div>
            </div>

            {/* Simplified & Compact Category Filter Bar */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingLeft: '4px' }}>
                    <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={16} color="var(--primary)" /> Maintenance Categories
                    </h3>
                    {activeCategory !== 'All' && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--primary)', padding: '2px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', border: '1px solid rgba(251, 191, 36, 0.2)' }}
                        >
                            {frequencyInSelectedPeriod} {frequencyInSelectedPeriod === 1 ? 'Service' : 'Services'} this {selectedMonth === 'All' ? 'Year' : 'Month'}
                        </motion.span>
                    )}
                </div>

                <div className="premium-scroll" style={{
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    padding: '6px',
                    background: 'rgba(15, 23, 42, 0.3)',
                    borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    scrollbarWidth: 'none'
                }}>
                    <button
                        onClick={() => setActiveCategory('All')}
                        style={{
                            padding: '10px 20px',
                            background: activeCategory === 'All' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            color: activeCategory === 'All' ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                            fontSize: '11px',
                            fontWeight: '800',
                            transition: '0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        All Types
                    </button>

                    {maintenanceTypes.map((type) => (
                        <motion.button
                            key={type}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setActiveCategory(type)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                background: activeCategory === type ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: '0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                color: activeCategory === type ? '#38bdf8' : 'rgba(255,255,255,0.5)',
                                letterSpacing: '0.3px'
                            }}>
                                {type}
                            </span>

                            {/* Simple dynamic count bubble */}
                            {records.filter(r => r.maintenanceType === type).length > 0 && (
                                <span style={{
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    background: activeCategory === type ? '#38bdf8' : 'rgba(255,255,255,0.06)',
                                    color: activeCategory === type ? 'black' : 'rgba(255,255,255,0.3)',
                                    fontSize: '9px',
                                    fontWeight: '950'
                                }}>
                                    {records.filter(r => r.maintenanceType === type).length}
                                </span>
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Desktop Table Content */}
            <div className="glass-card hide-mobile" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
                {loading ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Loading history...</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Date & Vehicle</th>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Service Details</th>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Garage / Vendor</th>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Cost & Pay</th>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '100px', textAlign: 'center' }}>
                                        <Wrench size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />
                                        <h3 style={{ color: 'white' }}>No history found</h3>
                                    </td>
                                </tr>
                            ) : filteredRecords.map((record, idx) => (
                                <motion.tr
                                    key={record._id || idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                >
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>
                                            {record.billDate ? formatDateIST(record.billDate) : 'N/A'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <Car size={12} style={{ color: 'var(--primary)' }} />
                                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>{record.vehicle?.carNumber || 'N/A'}</span>
                                        </div>
                                        {record.driver && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>Driver: {record.driver.name}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: '#818cf8',
                                                fontWeight: '800',
                                                textTransform: 'uppercase'
                                            }}>{record.maintenanceType}</span>
                                            {record.status === 'pending' && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(245, 158, 11, 0.1)',
                                                    color: 'var(--primary)',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase'
                                                }}>PENDING APPROVAL</span>
                                            )}
                                            {record.source === 'Driver App' && (
                                                <span style={{
                                                    fontSize: '10px',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase'
                                                }}>DRIVER APP</span>
                                            )}
                                        </div>
                                        <div style={{ color: 'white', fontSize: '13px', marginTop: '4px', fontWeight: '500' }}>
                                            {record.category || 'General Service'}
                                        </div>
                                        {record.currentKm && (
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                                At {Number(record.currentKm).toLocaleString()} KM
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{record.garageName || record.vendorName || 'Self/Local'}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                            Bill: {record.billNumber || 'N/A' || record.description}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ color: '#10b981', fontWeight: '800', fontSize: '16px' }}>₹{Number(record.amount || 0).toLocaleString()}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                            via {record.paymentMode}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {record.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleApprove(record.attendanceId, record._id)}
                                                        className="glass-card-hover-effect"
                                                        style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}
                                                    >
                                                        APPROVE
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(record.attendanceId, record._id)}
                                                        className="glass-card-hover-effect"
                                                        style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}
                                                    >
                                                        REJECT
                                                    </button>
                                                </div>
                                            ) : null}
                                            <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                                                {record.billPhoto && (
                                                    <button
                                                        onClick={() => setSelectedBillPhoto(record.billPhoto)}
                                                        className="glass-card-hover-effect"
                                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                        title="View Bill"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(record)}
                                                    className="glass-card-hover-effect"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                    title="Edit Entry"
                                                >
                                                    <Wrench size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(record._id)}
                                                    className="glass-card-hover-effect"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>



            {/* Mobile Card View */}
            <div className="show-mobile">
                <AnimatePresence>
                    {loading ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ color: 'var(--text-muted)', marginTop: '15px' }}>Loading...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                            <Wrench size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '15px' }} />
                            <h3 style={{ color: 'white', fontSize: '16px' }}>No records found</h3>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {filteredRecords.map((record, idx) => (
                                <motion.div
                                    key={record._id || idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card"
                                    style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '14px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>
                                                {record.billDate ? formatDateIST(record.billDate) : 'N/A'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <Car size={12} style={{ color: 'var(--primary)' }} />
                                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>{record.vehicle?.carNumber || 'N/A'}</span>
                                            </div>
                                            {record.driver && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>Driver: {record.driver.name}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#10b981', fontWeight: '800', fontSize: '16px' }}>₹{Number(record.amount || 0).toLocaleString()}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{record.paymentMode}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: '#818cf8',
                                                fontWeight: '800',
                                                textTransform: 'uppercase'
                                            }}>{record.maintenanceType}</span>
                                            {record.currentKm && (
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {Number(record.currentKm).toLocaleString()} KM
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{record.category || 'General Repair'}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                            Garage: <span style={{ color: 'white' }}>{record.garageName || record.vendorName || 'Self'}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {record.billPhoto && (
                                            <button
                                                onClick={() => setSelectedBillPhoto(record.billPhoto)}
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', border: '1px solid rgba(14, 165, 233, 0.2)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                            >
                                                <FileText size={14} /> View Bill
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(record)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Wrench size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record._id)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Record Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{
                                padding: '0',
                                width: '100%',
                                maxWidth: '800px',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                background: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: 0 }}>{editingId ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>Log repairs, services, and part replacements.</p>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', border: 'none' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>

                            <form onSubmit={handleCreate} style={{ padding: 'clamp(20px, 5vw, 30px)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    {/* Maintenance Type Selection */}
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Maintenance Type (Multiple) *</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            {maintenanceTypes.map(t => {
                                                const isSelected = formData.maintenanceType.split(', ').includes(t);
                                                return (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => {
                                                            let current = formData.maintenanceType ? formData.maintenanceType.split(', ').filter(Boolean) : [];
                                                            if (current.includes(t)) {
                                                                current = current.filter(x => x !== t);
                                                            } else {
                                                                current.push(t);
                                                            }
                                                            setFormData({ ...formData, maintenanceType: current.join(', ') });
                                                        }}
                                                        style={{
                                                            padding: '8px 16px',
                                                            borderRadius: '100px',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                                                            background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)',
                                                            color: isSelected ? '#818cf8' : 'rgba(255,255,255,0.5)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                    >
                                                        {t}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Vehicle and Basic Info */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Vehicle *</label>
                                            <select
                                                className="input-field"
                                                value={formData.vehicleId}
                                                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                                required
                                                style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', padding: '0 15px' }}
                                            >
                                                <option value="" style={{ background: '#0f172a' }}>Select Car</option>
                                                {(vehicles || []).map(v => <option key={v._id} value={v._id} style={{ background: '#0f172a' }}>{v.carNumber} ({v.model})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Driver (Optional)</label>
                                            <select
                                                className="input-field"
                                                value={formData.driverId}
                                                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                                style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', padding: '0 15px' }}
                                            >
                                                <option value="" style={{ background: '#0f172a' }}>Select Driver</option>
                                                {(drivers || []).map(d => <option key={d._id} value={d._id} style={{ background: '#0f172a' }}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Current KM Reading *</label>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="e.g. 45000"
                                                value={formData.currentKm}
                                                onChange={(e) => setFormData({ ...formData, currentKm: e.target.value })}
                                                required
                                                style={{ width: '100%', height: '50px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', padding: '0 15px' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Sub-Categories */}
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
                                            Select Sub-Categories (Multiple)
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {(() => {
                                                    const selectedTypes = formData.maintenanceType.split(', ').filter(Boolean);
                                                    const availableSubCats = [...new Set(selectedTypes.flatMap(t => subCategories[t] || []))];
                                                    return availableSubCats.map(cat => {
                                                        const isSelected = formData.category.split(', ').includes(cat);
                                                        return (
                                                            <button
                                                                key={cat}
                                                                type="button"
                                                                onClick={() => {
                                                                    let current = formData.category ? formData.category.split(', ').filter(Boolean) : [];
                                                                    if (current.includes(cat)) {
                                                                        current = current.filter(c => c !== cat);
                                                                    } else {
                                                                        current.push(cat);
                                                                    }
                                                                    setFormData({ ...formData, category: current.join(', ') });
                                                                }}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    borderRadius: '100px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '700',
                                                                    border: isSelected ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid transparent',
                                                                    background: isSelected ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.05)',
                                                                    color: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                                                                    boxShadow: isSelected ? '0 0 15px rgba(251, 191, 36, 0.2)' : 'none',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                {cat}
                                                            </button>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                            <input
                                                type="text"
                                                className="input-field"
                                                style={{ height: '40px', fontSize: '13px', background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.1)', borderRadius: 0, paddingLeft: 0 }}
                                                placeholder="Add custom or other items (comma separated)..."
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Maintenance Description</label>
                                        <textarea
                                            className="input-field"
                                            style={{ height: '80px', paddingTop: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                                            placeholder="Detailed notes about the work done..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {/* Workshop & Billing */}
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Workshop & Billing</p>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px' }}>
                                            <div>
                                                <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Garage Name *</label>
                                                <input required className="input-field" style={{ borderRadius: '10px' }} placeholder="e.g. Bosch Service" value={formData.garageName} onChange={(e) => setFormData({ ...formData, garageName: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Bill Number</label>
                                                <input className="input-field" style={{ borderRadius: '10px' }} placeholder="INV-001" value={formData.billNumber} onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Bill Date *</label>
                                                <input required type="date" className="input-field" style={{ borderRadius: '10px' }} value={formData.billDate} onChange={(e) => setFormData({ ...formData, billDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Amount (₹) *</label>
                                                <input required type="number" className="input-field" style={{ borderRadius: '10px' }} placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Payment Mode</label>
                                                <select className="input-field" style={{ borderRadius: '10px' }} value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}>
                                                    <option value="Cash" style={{ background: '#1e293b' }}>Cash</option>
                                                    <option value="UPI" style={{ background: '#1e293b' }}>UPI / GPay</option>
                                                    <option value="Bank Transfer" style={{ background: '#1e293b' }}>Bank Transfer</option>
                                                    <option value="Credit Card" style={{ background: '#1e293b' }}>Credit Card</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Bill Photo</label>
                                                <input type="file" onChange={(e) => setBillPhoto(e.target.files[0])} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', width: '100%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reminders & Actions */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
                                        {/* Next Service Reminder — only for Regular Service & Tyres & Wheels */}
                                        {(() => {
                                            const selectedTypes = formData.maintenanceType.split(', ').filter(Boolean);
                                            const showReminderSection = selectedTypes.some(t => NEXT_SERVICE_TYPES.includes(t));
                                            if (!showReminderSection) return null;
                                            return (
                                                <div style={{ padding: '20px', background: showNextService ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '16px', border: showNextService ? '1px solid rgba(16, 185, 129, 0.1)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s ease' }}>
                                                    <div
                                                        onClick={() => setShowNextService(!showNextService)}
                                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showNextService ? '15px' : '0' }}
                                                    >
                                                        <p style={{ color: showNextService ? '#10b981' : 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Next Service Reminder (KM)</p>
                                                        <div style={{ width: '40px', height: '20px', background: showNextService ? '#10b981' : 'rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative', transition: 'all 0.3s ease' }}>
                                                            <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: showNextService ? '22px' : '2px', transition: 'all 0.3s ease' }}></div>
                                                        </div>
                                                    </div>
                                                    {showNextService && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                                                            <input type="number" className="input-field" style={{ borderRadius: '10px' }} placeholder="Next Service at KM (e.g. 50000)" value={formData.nextServiceKm} onChange={(e) => setFormData({ ...formData, nextServiceKm: e.target.value })} />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="btn-primary"
                                                style={{ height: '54px', borderRadius: '12px', fontSize: '15px', fontWeight: '900', background: 'linear-gradient(135deg, var(--primary) 0%, #d97706 100%)', color: 'black', border: 'none' }}
                                            >
                                                {submitting ? 'Saving...' : (editingId ? 'Update Record' : 'Save Record')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowModal(false)}
                                                style={{ height: '44px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Bill Preview Modal */}
            <AnimatePresence>
                {selectedBillPhoto && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100, padding: '20px' }} onClick={() => setSelectedBillPhoto(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ position: 'relative', maxWidth: '900px', width: '100%', maxHeight: '90vh', display: 'flex', justifyContent: 'center' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img src={selectedBillPhoto} alt="Bill Receipt" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <button onClick={() => setSelectedBillPhoto(null)} style={{ position: 'absolute', top: '15px', right: '15px', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }}>
                                <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Maintenance;
