import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import * as XLSX from 'xlsx';
import {
    Fuel, Plus, Search, Trash2, Calendar, MapPin, Gauge, Droplets, CreditCard, History, Car, Filter, ChevronDown, User, ArrowUpRight, TrendingUp, Edit, Shield, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const FuelPage = () => {
    const { selectedCompany } = useCompany();
    const [entries, setEntries] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [pendingEntries, setPendingEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedPending, setSelectedPending] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVehicle, setFilterVehicle] = useState('All');
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    // Form State
    const [formData, setFormData] = useState({
        vehicleId: '',
        fuelType: 'Diesel',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        quantity: '',
        rate: '',
        odometer: '',
        stationName: '',
        paymentMode: 'Cash',
        driver: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

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

            const { data } = await axios.get(`/api/admin/fuel/pending/${selectedCompany._id}`, {
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

            const { data } = await axios.get(`/api/admin/fuel/${selectedCompany._id}?from=${dateRange.from}&to=${dateRange.to}`, {
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

            if (editingId) {
                await axios.put(`/api/admin/fuel/${editingId}`, {
                    ...formData,
                    companyId: selectedCompany._id
                }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                alert('Fuel entry updated successfully');
            } else {
                await axios.post('/api/admin/fuel', {
                    ...formData,
                    companyId: selectedCompany._id
                }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                alert('Fuel entry added successfully');
            }

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

    const handleEdit = (entry) => {
        setEditingId(entry._id);
        setFormData({
            vehicleId: entry.vehicle?._id || '',
            fuelType: entry.fuelType,
            date: new Date(entry.date).toISOString().split('T')[0],
            amount: entry.amount,
            quantity: entry.quantity,
            rate: entry.rate,
            odometer: entry.odometer,
            stationName: entry.stationName || '',
            paymentMode: entry.paymentMode || 'Cash',
            driver: entry.driver || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.delete(`/api/admin/fuel/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchEntries();
        } catch (err) { console.error(err); }
    };

    const openApprovalModal = (entry) => {
        setSelectedPending(entry);
        setFormData({
            ...formData,
            amount: entry.amount,
            odometer: entry.km,
            date: new Date(entry.date).toISOString().split('T')[0],
            driver: entry.driver || '',
            fuelType: entry.fuelType || 'Diesel',
            quantity: entry.quantity ? entry.quantity : '', // Pre-fill if driver submitted
            rate: (entry.quantity && entry.amount) ? (entry.amount / entry.quantity).toFixed(2) : ''
        });
        setShowApprovalModal(true);
    };

    const handleApproveReject = async (attendanceId, expenseId, status, extraData = {}) => {
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.patch(`/api/admin/attendance/${attendanceId}/expense/${expenseId}`,
                { status, ...extraData },
                { headers: { Authorization: `Bearer ${userInfo.token}` } }
            );
            fetchPendingEntries();
            fetchEntries();
            setShowApprovalModal(false);
            resetForm();
        } catch (err) {
            console.error(err);
            alert('Error processing request');
        }
    };



    const resetForm = () => {
        setEditingId(null);
        setFormData({
            vehicleId: '',
            fuelType: 'Diesel',
            date: new Date().toISOString().split('T')[0],
            amount: '',
            quantity: '',
            rate: '',
            odometer: '',
            stationName: '',
            paymentMode: 'Cash',
            driver: ''
        });
    };

    const downloadExcel = () => {
        const dataToExport = filteredEntries.map(e => ({
            'Date': new Date(e.date).toLocaleDateString('en-IN'),
            'Vehicle': e.vehicle?.carNumber || 'N/A',
            'Fuel Type': e.fuelType,
            'Quantity (L)': e.quantity,
            'Rate (₹/L)': e.rate,
            'Amount (₹)': e.amount,
            'Odometer (KM)': e.odometer,
            'Distance (KM)': e.distance || 0,
            'Mileage (KM/L)': e.mileage || 0,
            'Payment Mode': e.paymentMode,
            'Station': e.stationName || 'N/A',
            'Driver': e.driver || 'N/A',
            'Source': e.source || 'Admin'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Fuel Logs');
        XLSX.writeFile(wb, `Fuel_Report_${selectedCompany?.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Auto-calculate rate if amount or quantity changes
    useEffect(() => {
        if (formData.amount && formData.quantity) {
            const calculatedRate = (Number(formData.amount) / Number(formData.quantity)).toFixed(2);
            if (formData.rate !== calculatedRate) {
                setFormData(prev => ({ ...prev, rate: calculatedRate }));
            }
        }
    }, [formData.amount, formData.quantity]);

    const filteredEntries = entries.filter(e => {
        const matchesSearch = (e.vehicle?.carNumber?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            e.stationName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            e.driver?.toLowerCase()?.includes(searchTerm.toLowerCase()));
        const matchesVehicle = filterVehicle === 'All' || e.vehicle?._id === filterVehicle;
        return matchesSearch && matchesVehicle;
    });

    // Summary Statistics
    const totalAmount = filteredEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalLiters = filteredEntries.reduce((sum, e) => sum + (Number(e.quantity) || 0), 0);
    const avgMileage = filteredEntries.filter(e => e.mileage > 0).length > 0
        ? (filteredEntries.filter(e => e.mileage > 0).reduce((sum, e) => sum + e.mileage, 0) / filteredEntries.filter(e => e.mileage > 0).length).toFixed(2)
        : 0;

    const petrolAmount = filteredEntries.filter(e => e.fuelType === 'Petrol').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const dieselAmount = filteredEntries.filter(e => e.fuelType === 'Diesel').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Fuel Management" description="Track fuel entries, mileage, and costs for your entire fleet." />

            {/* Header Section */}
            <header className="flex-resp" style={{
                justifyContent: 'space-between',
                padding: '40px 0',
                gap: '24px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }}></div>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Expense Tracking</span>
                    </div>
                    <h1 className="resp-title" style={{ color: 'white', margin: 0, letterSpacing: '-1px' }}>
                        Fuel <span className="text-gradient-orange">Management</span>
                    </h1>
                </div>

                <div className="flex-resp" style={{ gap: '15px', flex: '1', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
                        <input
                            type="date"
                            className="input-field"
                            style={{ height: '52px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: 'auto', minWidth: '130px', flex: '1 1 130px' }}
                            value={dateRange.from}
                            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        />
                        <input
                            type="date"
                            className="input-field"
                            style={{ height: '52px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: 'auto', minWidth: '130px', flex: '1 1 130px' }}
                            value={dateRange.to}
                            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        />
                    </div>
                    <div className="glass-card" style={{ padding: '0', display: 'flex', alignItems: 'center', maxWidth: '300px', width: '100%', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', flex: '1 1 200px' }}>
                        <Search size={18} style={{ margin: '0 15px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search fuel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', height: '50px', width: '100%', outline: 'none', fontSize: '14px', minWidth: 0 }}
                        />
                    </div>
                    <button
                        className="btn-primary"
                        onClick={downloadExcel}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '52px', padding: '0 20px', borderRadius: '14px', fontWeight: '800', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        <FileSpreadsheet size={18} /> <span className="hide-mobile">Export Excel</span><span className="show-mobile">Excel</span>
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => { resetForm(); setShowModal(true); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '52px', padding: '0 25px', borderRadius: '14px', fontWeight: '800', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        <Plus size={20} /> <span className="hide-mobile">Add Entry</span><span className="show-mobile">Add</span>
                    </button>
                </div>
            </header>



            {/* Pending Approvals Section */}
            {
                pendingEntries.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '800', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px #f43f5e' }}></div>
                            Driver Approvals (Awaiting)
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                            {pendingEntries.map((entry) => (
                                <motion.div
                                    key={entry._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card"
                                    style={{ padding: '20px', borderLeft: '4px solid #f43f5e', background: 'rgba(244, 63, 94, 0.05)' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            {entry.slipPhoto ? (
                                                <img
                                                    src={entry.slipPhoto}
                                                    onClick={() => window.open(entry.slipPhoto, '_blank')}
                                                    style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                                />
                                            ) : (
                                                <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Fuel size={20} color="var(--text-muted)" />
                                                </div>
                                            )}
                                            <div>
                                                <p style={{ color: 'white', fontWeight: '800', fontSize: '16px', margin: 0 }}>₹{entry.amount}</p>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0' }}>{entry.driver} • {entry.carNumber}</p>
                                            </div>
                                        </div>
                                        <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', textTransform: 'uppercase' }}>Pending</span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '15px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                        <span>{entry.km} KM Reading</span>
                                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <button
                                            onClick={() => handleApproveReject(entry.attendanceId, entry._id, 'approved')}
                                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleApproveReject(entry.attendanceId, entry._id, 'rejected')}
                                            style={{ background: 'rgba(255,255,255,0.05)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f59e0b' }}>
                        <Fuel size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Total Fuel Cost</p>
                        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>₹{totalAmount.toLocaleString()}</h2>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>P: ₹{petrolAmount.toLocaleString()} | D: ₹{dieselAmount.toLocaleString()}</span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid #0ea5e9' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ea5e9' }}>
                        <Droplets size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Total Liters</p>
                        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>{totalLiters.toFixed(2)} L</h2>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Combined usage</span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#10b981' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Avg. Mileage</p>
                        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>{avgMileage} KM/L</h2>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Overall efficiency</span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'rgba(255,255,255,0.6)' }}>
                        <Filter size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Vehicle Filter</p>
                        <select
                            className="input-field"
                            style={{ background: 'transparent', border: 'none', color: 'white', padding: 0, height: 'auto', fontWeight: '700' }}
                            value={filterVehicle}
                            onChange={(e) => setFilterVehicle(e.target.value)}
                        >
                            <option value="All" style={{ background: '#1e293b' }}>All Vehicles</option>
                            {vehicles.map(v => <option key={v._id} value={v._id} style={{ background: '#1e293b' }}>{v.carNumber}</option>)}
                        </select>
                    </div>
                </motion.div>
            </div>

            {/* Entries List */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                {loading ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Loading fuel logs...</p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                        <Fuel size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />
                        <h3 style={{ color: 'white' }}>No fuel records found</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Create your first fuel entry to start tracking.</p>
                    </div>
                ) : (
                    <div className="hide-mobile" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Date & Vehicle</th>
                                    <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Fuel Details</th>
                                    <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Odometer & Trip</th>
                                    <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Efficiency</th>
                                    <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Total Amount</th>
                                    <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map((e, idx) => (
                                    <motion.tr
                                        key={e._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                    >
                                        <td style={{ padding: '20px 25px' }}>
                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>
                                                {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <Car size={12} style={{ color: '#f59e0b' }} />
                                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>{e.vehicle?.carNumber}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: e.fuelType === 'Diesel' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(14, 165, 233, 0.1)', color: e.fuelType === 'Diesel' ? '#f59e0b' : '#0ea5e9', fontWeight: '800', textTransform: 'uppercase' }}>{e.fuelType}</span>
                                                <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>{e.quantity} L</span>
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '4px' }}>
                                                @ ₹{e.rate}/L • {e.stationName || 'Local Station'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{e.odometer.toLocaleString()} KM</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: '600' }}>
                                                <ArrowUpRight size={12} />
                                                {e.distance || 0} KM Driven
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <div style={{ color: e.mileage > 12 ? '#10b981' : '#f59e0b', fontWeight: '800', fontSize: '16px' }}>{e.mileage || 0} <span style={{ fontSize: '10px' }}>KM/L</span></div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                                ₹{e.costPerKm || 0}/KM cost
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>₹{e.amount.toLocaleString()}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                                {e.source === 'Driver' ? <User size={10} color="#0ea5e9" /> : <Shield size={10} color="#f59e0b" />}
                                                {e.source === 'Driver' ? 'Driver App' : 'Administrator'}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                                                By: {e.driver}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 25px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleEdit(e)}
                                                    className="glass-card-hover-effect"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(e._id)}
                                                    className="glass-card-hover-effect"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="show-mobile">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
                ) : filteredEntries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                        <Fuel size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                        <p>No fuel records found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {filteredEntries.map((e) => (
                            <motion.div
                                key={e._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card"
                                style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ color: 'white', fontWeight: '900', fontSize: '18px', letterSpacing: '0.5px' }}>{e.vehicle?.carNumber}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#f59e0b', fontWeight: '900', fontSize: '18px' }}>₹{e.amount.toLocaleString()}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{e.quantity} L @ ₹{e.rate}/L</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Odometer</div>
                                        <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{e.odometer.toLocaleString()} KM</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Efficiency</div>
                                        <div style={{ color: e.mileage > 12 ? '#10b981' : '#f59e0b', fontSize: '13px', fontWeight: '700' }}>{e.mileage || 0} KM/L</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: e.fuelType === 'Diesel' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(14, 165, 233, 0.1)', color: e.fuelType === 'Diesel' ? '#f59e0b' : '#0ea5e9', fontWeight: '800', textTransform: 'uppercase' }}>{e.fuelType}</span>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>• {e.stationName || 'Local Station'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={12} color="white" />
                                        </div>
                                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{e.driver}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEdit(e)} style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '8px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.2)' }}><Edit size={14} /></button>
                                        <button onClick={() => handleDelete(e._id)} style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '8px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Record Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{ padding: '0', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: 0 }}>{editingId ? 'Edit Fuel Entry' : 'Add Fuel Entry'}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>Log petrol/diesel refill and calculate mileage.</p>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', border: 'none' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>

                            <form onSubmit={handleCreate} style={{ padding: '30px' }}>
                                <div className="form-grid-2">
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Vehicle Number *</label>
                                        <select
                                            className="input-field" value={formData.vehicleId} required
                                            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                        >
                                            <option value="" style={{ background: '#1e293b' }}>-- Select Car --</option>
                                            {vehicles.map(v => <option key={v._id} value={v._id} style={{ background: '#1e293b' }}>{v.carNumber} ({v.model})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Fuel Type</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {['Diesel', 'Petrol', 'CNG'].map(t => (
                                                <button
                                                    key={t} type="button"
                                                    onClick={() => setFormData({ ...formData, fuelType: t })}
                                                    style={{ flex: 1, height: '45px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: formData.fuelType === t ? (t === 'Diesel' ? '#f59e0b' : '#0ea5e9') : 'rgba(255,255,255,0.05)', color: formData.fuelType === t ? 'black' : 'white', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid-3">
                                    <div>
                                        <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Date</label>
                                        <input type="date" className="input-field" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Amount (₹) *</label>
                                        <input type="number" className="input-field" placeholder="e.g. 5000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Quantity (L) *</label>
                                        <input type="number" step="0.01" className="input-field" placeholder="e.g. 50" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="form-grid-3">
                                    <div>
                                        <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Rate (₹/L)</label>
                                        <input type="number" step="0.01" className="input-field" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: e.target.value })} placeholder="Auto-calculated" />
                                    </div>
                                    <div>
                                        <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Odometer (KM) *</label>
                                        <input type="number" className="input-field" placeholder="Current Reading" value={formData.odometer} onChange={(e) => setFormData({ ...formData, odometer: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Payment Mode</label>
                                        <select className="input-field" value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}>
                                            <option value="Cash" style={{ background: '#1e293b' }}>Cash</option>
                                            <option value="UPI" style={{ background: '#1e293b' }}>UPI / GPay</option>
                                            <option value="FASTag" style={{ background: '#1e293b' }}>FASTag</option>
                                            <option value="Card" style={{ background: '#1e293b' }}>Card</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div>
                                        <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Fuel Station Name</label>
                                        <input className="input-field" placeholder="e.g. HP Petrol Pump" value={formData.stationName} onChange={(e) => setFormData({ ...formData, stationName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Driver Name / ID *</label>
                                        <input className="input-field" placeholder="Who fueled the car?" value={formData.driver} onChange={(e) => setFormData({ ...formData, driver: e.target.value })} required />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button
                                        type="submit" disabled={submitting} className="btn-primary"
                                        style={{ flex: 2, height: '60px', borderRadius: '16px', fontSize: '16px', fontWeight: '900', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none' }}
                                    >
                                        {submitting ? 'Saving...' : (editingId ? 'Update Entry' : 'Save Fuel Entry')}
                                    </button>
                                    <button
                                        type="button" onClick={() => setShowModal(false)}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default FuelPage;
