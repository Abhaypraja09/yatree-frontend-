import React, { useState, useEffect } from 'react';
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
    FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';
import { todayIST, formatDateIST, nowIST } from '../utils/istUtils';

const Maintenance = () => {
    const { selectedCompany } = useCompany();
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [selectedYear, setSelectedYear] = useState(nowIST().getUTCFullYear());
    const [filterGarage, setFilterGarage] = useState('All');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'service'
    const [filterMode, setFilterMode] = useState('month'); // 'month' or 'range'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedBillPhoto, setSelectedBillPhoto] = useState(null);

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
        'Car Service',
        'Engine & Mechanical',
        'Tyres & Wheels',
        'Brake System',
        'Electrical & Battery',
        'AC & Cooling',
        'Body & Interior',
        'Other'
    ];

    const subCategories = {
        'Regular Service': ['Engine oil change', 'Oil filter', 'Air filter', 'Fuel filter', 'General servicing'],
        'Car Service': ['Car Wash', 'Puncture repair', 'Wheel Alignment', 'Interior Cleaning'],
        'Engine & Mechanical': ['Clutch plate', 'Gearbox repair', 'Engine overhaul', 'Timing belt', 'Mountings'],
        'Tyres & Wheels': ['New tyre purchase', 'Tyre rotation', 'Alignment & Balancing', 'Puncture repair'],
        'Brake System': ['Brake pads', 'Brake shoe', 'Disc/Drum', 'Brake oil'],
        'Electrical & Battery': ['Battery replacement', 'Alternator', 'Starter motor', 'Wiring', 'Lights'],
        'AC & Cooling': ['AC gas refill', 'Compressor repair', 'Radiator service', 'Coolant top-up'],
        'Body & Interior': ['Denting painting', 'Seat covers', 'Dashboard repair', 'Mirror/Glass', 'Wipers']
    };

    useEffect(() => {
        if (selectedCompany) {
            fetchRecords();
            fetchVehicles();
            fetchDrivers();
        }
    }, [selectedCompany, selectedMonth, selectedYear, startDate, endDate, filterMode]);

    const fetchRecords = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            let url = `/api/admin/maintenance/${selectedCompany._id}?`;
            if (filterMode === 'range' && startDate && endDate) {
                url += `startDate=${startDate}&endDate=${endDate}`;
            } else {
                url += `month=${selectedMonth}&year=${selectedYear}`;
            }

            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setRecords(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
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

    const handleEdit = (record) => {
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
        if (record.nextServiceKm) setShowNextService(true);
        setShowModal(true);
    };

    const handleApprove = async (attendanceId, expenseId) => {
        if (!window.confirm('Are you sure you want to approve this expense? It will be officially added to your records.')) return;
        try {
            await axios.patch(`/api/admin/attendance/${attendanceId}/expense/${expenseId}`, { status: 'approved' });
            fetchRecords();
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

        // Service Hub specific logic: Show anything related to wash or puncture
        let matchesTab = true;
        if (activeTab === 'service') {
            const isWash = r.category?.toLowerCase()?.includes('wash') ||
                r.description?.toLowerCase()?.includes('wash') ||
                r.maintenanceType?.toLowerCase()?.includes('wash') ||
                r.maintenanceType?.toLowerCase()?.includes('car service');
            const isPuncture = r.category?.toLowerCase()?.includes('puncture') ||
                r.category?.toLowerCase()?.includes('puncher') ||
                r.description?.toLowerCase()?.includes('puncture') ||
                r.description?.toLowerCase()?.includes('puncher') ||
                r.maintenanceType?.toLowerCase()?.includes('puncture') ||
                r.maintenanceType?.toLowerCase()?.includes('puncher');

            matchesTab = isWash || isPuncture;
        }

        return matchesSearch && matchesType && matchesGarage && matchesVehicle && matchesTab;
    });

    const totalMaintenanceCost = filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // Base records for counting based on currently selected tab
    const filteredForCounts = filteredRecords;

    const totalPunctures = filteredForCounts.filter(r =>
        r.maintenanceType?.toLowerCase()?.includes('puncture') ||
        r.maintenanceType?.toLowerCase()?.includes('puncher') ||
        r.category?.toLowerCase()?.includes('puncture') ||
        r.category?.toLowerCase()?.includes('puncher') ||
        r.description?.toLowerCase()?.includes('puncture') ||
        r.description?.toLowerCase()?.includes('puncher')
    ).length;

    const totalWash = filteredForCounts.filter(r =>
        (r.maintenanceType?.toLowerCase()?.includes('car service') ||
            r.category?.toLowerCase()?.includes('wash') ||
            r.maintenanceType?.toLowerCase()?.includes('wash') ||
            r.description?.toLowerCase()?.includes('wash')) &&
        !r.category?.toLowerCase()?.includes('puncture') &&
        !r.category?.toLowerCase()?.includes('puncher') &&
        !r.description?.toLowerCase()?.includes('puncture') &&
        !r.description?.toLowerCase()?.includes('puncher')
    ).length;

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
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        flexShrink: 0
                    }}>
                        <Wrench size={26} color="#fbbf24" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                            <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Fleet Health</span>
                        </div>
                        <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', margin: 0, letterSpacing: '-1.5px' }}>
                            Vehicle <span className="text-gradient-yellow">Maintenance</span>
                        </h1>
                    </div>
                </div>

                <div className="mobile-stack" style={{ display: 'flex', gap: '12px', flex: '1', justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
                    {/* Filter Mode Toggle */}
                    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <button
                            onClick={() => setFilterMode('month')}
                            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', border: 'none', cursor: 'pointer', background: filterMode === 'month' ? '#fbbf24' : 'transparent', color: filterMode === 'month' ? 'black' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
                        >MONTH</button>
                        <button
                            onClick={() => setFilterMode('range')}
                            style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', border: 'none', cursor: 'pointer', background: filterMode === 'range' ? '#fbbf24' : 'transparent', color: filterMode === 'range' ? 'black' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s' }}
                        >RANGE</button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '100%' }}>
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                            className="input-field"
                            style={{ height: '48px', flex: 1.5, borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '0 12px', fontSize: '12px', fontWeight: '700' }}
                        >
                            <option value="all">Full History</option>
                            <option value="service">Service Hub</option>
                        </select>

                        {filterMode === 'month' ? (
                            <>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="input-field"
                                    style={{ height: '48px', flex: 1, borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 12px', fontSize: '13px' }}
                                >
                                    <option value="All" style={{ background: '#0f172a' }}>All Months</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1} style={{ background: '#0f172a' }}>
                                            {formatDateIST(new Date(2000, i, 1), { month: 'short' })}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="input-field"
                                    style={{ height: '48px', width: '90px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 12px', fontSize: '13px' }}
                                >
                                    <option value="All" style={{ background: '#0f172a' }}>Any Year</option>
                                    {Array.from({ length: 5 }, (_, i) => {
                                        const year = nowIST().getUTCFullYear() - 2 + i;
                                        return <option key={year} value={year} style={{ background: '#0f172a' }}>{year}</option>;
                                    })}
                                </select>
                            </>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px', flex: 2 }}>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ height: '48px', flex: 1, borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 12px', fontSize: '12px', colorScheme: 'dark' }}
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ height: '48px', flex: 1, borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 12px', fontSize: '12px', colorScheme: 'dark' }}
                                />
                            </div>
                        )}
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
                                style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', border: 'none', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 15px rgba(251, 191, 36, 0.2)' }}
                                title="Add Record"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ea5e9' }}>
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Total Spend (Filtered)</p>
                        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>₹{totalMaintenanceCost.toLocaleString()}</h2>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(251, 113, 133, 0.1)', border: '1px solid rgba(251, 113, 133, 0.2)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(251, 113, 133, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f43f5e' }}>
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Punctures Found</p>
                        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>
                            {totalPunctures} <span style={{ fontSize: '12px', color: '#f43f5e' }}>History</span>
                        </h2>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <History size={18} color="#fbbf24" />
                        <h4 style={{ color: 'white', margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Yearly Spending</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.entries(
                            filteredRecords.reduce((acc, r) => {
                                const year = r.billDate ? nowIST(r.billDate).getUTCFullYear() : 'N/A';
                                acc[year] = (acc[year] || 0) + (Number(r.amount) || 0);
                                return acc;
                            }, {})
                        ).sort(([a], [b]) => b - a).map(([year, total]) => (
                            <div key={year} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: '13px' }}>{year}</span>
                                <span style={{ color: '#10b981', fontWeight: '900', fontSize: '15px' }}>₹{total.toLocaleString()}</span>
                            </div>
                        ))}
                        {filteredRecords.length === 0 && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '12px', padding: '10px' }}>No records in this range</div>}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ea5e9' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Car Washes Found</p>
                        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>
                            {totalWash} <span style={{ fontSize: '12px', color: '#0ea5e9' }}>History</span>
                        </h2>
                    </div>
                </motion.div>

                {activeTab !== 'service' && (
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
                )}

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fbbf24' }}>
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

            {/* Desktop Table Content */}
            {(activeTab === 'all' || activeTab === 'service') && (
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
                                                        color: '#f59e0b',
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
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                {(record.category?.toLowerCase()?.includes('puncture') || record.description?.toLowerCase()?.includes('puncture') || record.category?.toLowerCase()?.includes('puncher') || record.description?.toLowerCase()?.includes('puncher') || record.maintenanceType?.toLowerCase()?.includes('puncture') || record.maintenanceType?.toLowerCase()?.includes('puncher')) && (
                                                    <span style={{ fontSize: '10px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>PUNCTURE</span>
                                                )}
                                                {(record.category?.toLowerCase()?.includes('wash') || record.description?.toLowerCase()?.includes('wash') || record.maintenanceType?.toLowerCase()?.includes('wash') || record.maintenanceType?.toLowerCase()?.includes('car service')) && !(record.category?.toLowerCase()?.includes('puncture') || record.description?.toLowerCase()?.includes('puncture') || record.category?.toLowerCase()?.includes('puncher') || record.description?.toLowerCase()?.includes('puncher')) && (
                                                    <span style={{ fontSize: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>CAR WASH</span>
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
                                                ) : (
                                                    <>
                                                        {record.billPhoto && (
                                                            <button
                                                                onClick={() => setSelectedBillPhoto(record.billPhoto)}
                                                                className="glass-card-hover-effect"
                                                                style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
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
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}


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
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
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
                                                                    color: isSelected ? '#fbbf24' : 'rgba(255,255,255,0.4)',
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
                                        <div style={{ padding: '20px', background: showNextService ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '16px', border: showNextService ? '1px solid rgba(16, 185, 129, 0.1)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s ease' }}>
                                            <div
                                                onClick={() => setShowNextService(!showNextService)}
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showNextService ? '15px' : '0' }}
                                            >
                                                <p style={{ color: showNextService ? '#10b981' : 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Next Service Reminder</p>
                                                <div style={{ width: '40px', height: '20px', background: showNextService ? '#10b981' : 'rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative', transition: 'all 0.3s ease' }}>
                                                    <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: showNextService ? '22px' : '2px', transition: 'all 0.3s ease' }}></div>
                                                </div>
                                            </div>

                                            {showNextService && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                                                    <input type="number" className="input-field" style={{ borderRadius: '10px' }} placeholder="Next Service KM" value={formData.nextServiceKm} onChange={(e) => setFormData({ ...formData, nextServiceKm: e.target.value })} />
                                                </motion.div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="btn-primary"
                                                style={{ height: '54px', borderRadius: '12px', fontSize: '15px', fontWeight: '900', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: 'black', border: 'none' }}
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
