import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import * as XLSX from 'xlsx';
import {
    MapPin, Plus, Search, Trash2, Calendar, History, Car, User, Shield, FileSpreadsheet, Edit, IndianRupee, Eye, X, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const ParkingPage = () => {
    const { selectedCompany } = useCompany();
    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseUrl = import.meta.env.VITE_API_URL || '';
        return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    };
    const [entries, setEntries] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [pendingEntries, setPendingEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('All');
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    // Form State
    const [formData, setFormData] = useState({
        driver: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        receiptPhoto: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    useEffect(() => {
        if (selectedCompany) {
            fetchEntries();
            fetchPendingEntries();
            fetchVehicles();
        }
    }, [selectedCompany, dateRange]);

    const fetchPendingEntries = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/parking/pending/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPendingEntries(data || []);
        } catch (err) { console.error(err); }
    };

    const fetchEntries = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/parking/${selectedCompany._id}?from=${dateRange.from}&to=${dateRange.to}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setEntries(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=fleet`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.post('/api/admin/parking', {
                ...formData,
                companyId: selectedCompany._id
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });

            alert('Parking entry added successfully');
            setShowModal(false);
            resetForm();
            fetchEntries();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving entry');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.delete(`/api/admin/parking/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchEntries();
        } catch (err) { console.error(err); }
    };

    const handleApproveReject = async (attendanceId, expenseId, status) => {
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.patch(`/api/admin/attendance/${attendanceId}/expense/${expenseId}`,
                { status },
                { headers: { Authorization: `Bearer ${userInfo.token}` } }
            );
            fetchPendingEntries();
            fetchEntries();
        } catch (err) {
            console.error(err);
            alert('Error processing request');
        }
    };

    const handleEdit = (entry) => {
        setFormData({
            vehicleId: entry.vehicle?._id || '',
            driver: entry.driver || '',
            amount: entry.amount || '',
            date: new Date(entry.date).toISOString().split('T')[0],
            receiptPhoto: entry.receiptPhoto || ''
        });
        setShowModal(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', 'yatreedestination');

        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

            const res = await axios.post('/api/admin/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo?.token}` }
            });
            setFormData({ ...formData, receiptPhoto: res.data.url });
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Image upload failed. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({
            vehicleId: '',
            driver: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            receiptPhoto: ''
        });
    };

    const downloadExcel = () => {
        const dataToExport = filteredEntries.map(e => ({
            'Date': new Date(e.date).toLocaleDateString('en-IN'),
            'Vehicle': e.vehicle?.carNumber || 'N/A',
            'Driver': e.driver || 'N/A',
            'Amount (₹)': e.amount,
            'Source': e.source || 'Admin'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Parking Logs');
        XLSX.writeFile(wb, `Parking_Report_${selectedCompany?.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const filteredEntries = entries.filter(e => {
        const matchesSearch = (e.vehicle?.carNumber?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            e.driver?.toLowerCase()?.includes(searchTerm.toLowerCase()));
        const matchesVehicle = filterVehicle === 'All' || e.vehicle?._id === filterVehicle;
        return matchesSearch && matchesVehicle;
    });

    const totalAmount = filteredEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const driverAmount = filteredEntries.filter(e => e.source === 'Driver').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const officeAmount = filteredEntries.filter(e => e.source === 'Admin').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Parking Management" description="Track parking expenses, driver payments, and office costs." />

            <header style={{ padding: 'clamp(20px, 4vw, 40px) 0' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 12px rgba(129, 140, 248, 0.5)' }}></div>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Financial Records</span>
                        </div>
                        <h1 style={{ color: 'white', margin: 0, letterSpacing: '-1px', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '900', lineHeight: 1 }}>
                            Parking <span style={{
                                background: 'linear-gradient(to right, #818cf8, #c084fc)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>Logs</span>
                        </h1>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        width: 'auto',
                        justifyContent: 'flex-start'
                    }}>
                        <button
                            onClick={downloadExcel}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                height: '48px',
                                padding: '0 20px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                background: 'rgba(255,255,255,0.03)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                flex: '1 1 auto'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                            <FileSpreadsheet size={18} /> <span className="hide-mobile">Export Report</span>
                            <span className="show-mobile">Export</span>
                        </button>
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                height: '48px',
                                padding: '0 24px',
                                borderRadius: '12px',
                                fontWeight: '800',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: 'white',
                                border: 'none',
                                boxShadow: '0 8px 20px -6px rgba(99, 102, 241, 0.5)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                flex: '1 1 auto',
                                justifyContent: 'center'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Plus size={20} /> <span>New Entry</span>
                        </button>
                    </div>
                </div>

                <div className="glass-card" style={{
                    padding: '12px',
                    borderRadius: '16px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        width: '100%'
                    }}>
                        <div style={{ position: 'relative', flex: '1 1 300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '15px', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="text"
                                placeholder="Search vehicle, driver or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    height: '48px',
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px',
                                    padding: '0 15px 0 45px',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            flex: '1 1 300px',
                            minWidth: '0'
                        }} className="mobile-stack">
                            <div style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
                                <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '17px', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{
                                        height: '48px',
                                        padding: '0 12px 0 35px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        width: '100%',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        colorScheme: 'dark'
                                    }}
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                />
                            </div>
                            <div style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
                                <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '17px', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{
                                        height: '48px',
                                        padding: '0 12px 0 35px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        width: '100%',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        colorScheme: 'dark'
                                    }}
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Pending Approvals */}
            {pendingEntries.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0 }}>Review Requests</h3>
                            <p style={{ color: 'rgba(244, 63, 94, 0.6)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', margin: 0 }}>{pendingEntries.length} Pending Approvals</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {pendingEntries.map((entry) => (
                            <motion.div
                                key={entry._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card"
                                style={{
                                    padding: '24px',
                                    border: '1px solid rgba(244, 63, 94, 0.2)',
                                    background: 'linear-gradient(145deg, rgba(244, 63, 94, 0.05), rgba(15, 23, 42, 0.4))',
                                    borderRadius: '20px'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                    {entry.slipPhoto ? (
                                        <div style={{ position: 'relative' }}>
                                            <img
                                                src={getImageUrl(entry.slipPhoto)}
                                                onClick={() => { setSelectedImage(entry.slipPhoto); setShowImageModal(true); }}
                                                style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                            />
                                            <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: '#f43f5e', color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>SLIP</div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => { setSelectedImage(''); setShowImageModal(true); }}
                                            style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                        >
                                            <Eye size={24} color="rgba(255,255,255,0.2)" />
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h4 style={{ color: 'white', fontWeight: '900', fontSize: '22px', margin: 0 }}>₹{entry.amount}</h4>
                                            <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', fontSize: '9px', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase', border: '1px solid rgba(244, 63, 94, 0.2)' }}>Action Required</span>
                                        </div>
                                        <p style={{ color: 'white', fontSize: '13px', fontWeight: '700', margin: '4px 0 0' }}>{entry.driver}</p>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0' }}>{entry.carNumber}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleApproveReject(entry.attendanceId, entry._id, 'approved')}
                                        style={{ flex: 1.5, background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApproveReject(entry.attendanceId, entry._id, 'rejected')}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                gap: '20px',
                marginBottom: '40px'
            }}>
                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card"
                    style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(30, 41, 59, 0.4) 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}
                >
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                        <IndianRupee size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Total Expense</p>
                        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>₹{totalAmount.toLocaleString()}</h2>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card"
                    style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 0.4) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}
                >
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <History size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>From Driver Apps</p>
                        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>₹{driverAmount.toLocaleString()}</h2>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card"
                    style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(30, 41, 59, 0.4) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}
                >
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <Shield size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Office Manual</p>
                        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>₹{officeAmount.toLocaleString()}</h2>
                    </div>
                </motion.div>
            </div>

            {/* Main List */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                {loading ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
                ) : filteredEntries.length === 0 ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                        <MapPin size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />
                        <h3 style={{ color: 'white', opacity: 0.6 }}>No parking records found</h3>
                    </div>
                ) : (
                    <>
                        <div className="hide-mobile" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Date & Vehicle</th>
                                        <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Driver</th>
                                        <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</th>
                                        <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Source</th>
                                        <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right', letterSpacing: '1px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEntries.map((e) => (
                                        <tr key={e._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s ease' }} className="hover-row">
                                            <td style={{ padding: '18px 25px' }}>
                                                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Car size={10} /> {e.vehicle?.carNumber}
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 25px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                                        <User size={16} />
                                                    </div>
                                                    <span style={{ color: 'white', fontWeight: '600' }}>{e.driver}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 25px' }}>
                                                <div style={{ color: '#34d399', fontWeight: '800', fontSize: '16px' }}>₹{e.amount}</div>
                                            </td>
                                            <td style={{ padding: '18px 25px' }}>
                                                <span style={{
                                                    fontSize: '9px',
                                                    padding: '4px 10px',
                                                    borderRadius: '20px',
                                                    background: e.source === 'Admin' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                                                    color: e.source === 'Admin' ? '#fbbf24' : '#818cf8',
                                                    fontWeight: '800',
                                                    border: `1px solid ${e.source === 'Admin' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {e.source}
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => { setSelectedImage(e.receiptPhoto || ''); setShowImageModal(true); }}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            background: e.receiptPhoto ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.05)',
                                                            color: e.receiptPhoto ? '#10b981' : '#f43f5e',
                                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease',
                                                            opacity: e.receiptPhoto ? 1 : 0.6
                                                        }}
                                                        title={e.receiptPhoto ? "View Receipt" : "Receipt Missing"}
                                                    >
                                                        <Eye size={16} style={{ opacity: e.receiptPhoto ? 1 : 0.5 }} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(e)}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(99, 102, 241, 0.1)',
                                                            color: '#818cf8',
                                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        title="Edit Entry"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(e._id)}
                                                        style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(244,63,94,0.1)',
                                                            color: '#f43f5e',
                                                            border: '1px solid rgba(244,63,94,0.2)',
                                                            cursor: 'pointer',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = 'white'; }}
                                                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="show-mobile" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {filteredEntries.map((e) => (
                                <motion.div
                                    key={e._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '20px',
                                        padding: '20px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '4px',
                                        height: '100%',
                                        background: e.source === 'Admin' ? '#fbbf24' : '#818cf8',
                                        opacity: 0.6
                                    }}></div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                                <Car size={20} />
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: '800', fontSize: '16px', letterSpacing: '0.5px' }}>{e.vehicle?.carNumber}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: '700' }}>
                                                    {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#34d399', fontWeight: '900', fontSize: '20px' }}>₹{e.amount}</div>
                                            <span style={{
                                                fontSize: '8px',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: 'rgba(255,255,255,0.5)',
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>{e.source}</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr',
                                        gap: '12px',
                                        marginBottom: '16px',
                                        padding: '12px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.03)'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '2px' }}>Driver</div>
                                            <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{e.driver}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{
                                            color: 'rgba(255,255,255,0.4)',
                                            fontSize: '11px',
                                            fontStyle: 'italic',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <History size={12} /> {e.remark || 'No additional remarks'}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {e.receiptPhoto && (
                                                <button
                                                    onClick={() => { setSelectedImage(e.receiptPhoto); setShowImageModal(true); }}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '8px',
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        color: '#10b981',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(e._id)}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(244,63,94,0.1)',
                                                    color: '#f43f5e',
                                                    border: '1px solid rgba(244,63,94,0.2)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-card"
                            style={{
                                padding: 'clamp(24px, 5vw, 40px)',
                                width: '100%',
                                maxWidth: '500px',
                                background: 'linear-gradient(145deg, #0f172a, #1e293b)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                overflowY: 'auto',
                                maxHeight: '90vh',
                                borderRadius: '24px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Manual Entry</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', margin: '4px 0 0', letterSpacing: '1px' }}>Add parking record</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Select Vehicle</label>
                                    <select
                                        className="input-field"
                                        style={{ height: '52px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px', outline: 'none' }}
                                        value={formData.vehicleId}
                                        onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                        required
                                    >
                                        <option value="" style={{ background: '#1e293b' }}>Select Vehicle</option>
                                        {vehicles.map(v => <option key={v._id} value={v._id} style={{ background: '#1e293b' }}>{v.carNumber}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Driver Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={16} style={{ position: 'absolute', left: '15px', top: '18px', color: 'rgba(255,255,255,0.3)' }} />
                                        <input
                                            placeholder="Enter driver name"
                                            className="input-field"
                                            style={{ height: '52px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px 0 45px', width: '100%', outline: 'none' }}
                                            value={formData.driver}
                                            onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '15px'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount (₹)</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '15px', top: '16px', color: '#34d399', fontWeight: '900' }}>₹</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="input-field"
                                                style={{ height: '52px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px 0 32px', width: '100%', outline: 'none' }}
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            style={{ height: '52px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px', width: '100%', outline: 'none', colorScheme: 'dark' }}
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Receipt Photo</label>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        {formData.receiptPhoto ? (
                                            <div style={{ position: 'relative' }}>
                                                <img src={getImageUrl(formData.receiptPhoto)} alt="Receipt" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => setFormData({ ...formData, receiptPhoto: '' })} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f43f5e', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <label style={{
                                                width: '80px', height: '80px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease'
                                            }}
                                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                            >
                                                <Plus size={20} color="var(--text-muted)" />
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '800' }}>Upload</span>
                                                <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                            </label>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>Upload a clear photo of the parking receipt.</p>
                                        </div>
                                    </div>
                                </div>


                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        height: '56px',
                                        marginTop: '10px',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                        borderRadius: '16px',
                                        fontWeight: '800',
                                        fontSize: '16px',
                                        color: 'white',
                                        border: 'none',
                                        boxShadow: '0 12px 24px -8px rgba(99, 102, 241, 0.5)',
                                        cursor: submitting ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => !submitting && (e.currentTarget.style.transform = 'translateY(-2px)')}
                                    onMouseOut={(e) => !submitting && (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                    {submitting ? 'Saving...' : 'Save Record'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
                {showImageModal && (
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}
                        onClick={() => setShowImageModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ position: 'relative', maxWidth: 'min(700px, 90vw)', width: '100%', display: 'flex', justifyContent: 'center' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {selectedImage ? (
                                <img
                                    src={getImageUrl(selectedImage)}
                                    alt="Parking Receipt"
                                    style={{ width: '100%', height: 'auto', maxHeight: '85vh', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                                />
                            ) : (
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '50px', borderRadius: '20px', textAlign: 'center', width: '100%' }}>
                                    <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
                                    <p style={{ color: 'white', fontWeight: '700' }}>No receipt image available.</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '10px' }}>To fix this: Click the Edit (Pen) icon on the entry and upload the receipt manually.</p>
                                </div>
                            )}
                            <button
                                onClick={() => setShowImageModal(false)}
                                style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#f43f5e', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(244, 63, 94, 0.4)', zIndex: 100 }}
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ParkingPage;
