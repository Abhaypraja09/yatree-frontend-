import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Search, Trash2, User as UserIcon, X, CheckCircle, AlertCircle, LogIn, LogOut, Car, Filter, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const Freelancers = () => {
    const { selectedCompany } = useCompany();
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPunchInModal, setShowPunchInModal] = useState(false);
    const [showPunchOutModal, setShowPunchOutModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [editingDriver, setEditingDriver] = useState(null);
    const [driverFilter, setDriverFilter] = useState('All');
    const [attendance, setAttendance] = useState([]);

    // Form States
    const [formData, setFormData] = useState({ name: '', mobile: '', licenseNumber: '', dailyWage: 500 });
    const [editForm, setEditForm] = useState({ name: '', mobile: '', licenseNumber: '', dailyWage: 500 });
    const [punchInData, setPunchInData] = useState({
        vehicleId: '',
        km: '',
        date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10),
        time: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16),
        pickUpLocation: ''
    });
    const [punchOutData, setPunchOutData] = useState({ km: '', time: new Date().toISOString().slice(0, 16), fuelAmount: '0', parkingAmount: '0', review: '', dailyWage: 500, dropLocation: '' });

    const getOneEightyDaysAgo = () => {
        const d = new Date();
        d.setDate(d.getDate() - 180);
        return d.toISOString().split('T')[0];
    };

    const getToday = () => new Date().toISOString().split('T')[0];

    const [fromDate, setFromDate] = useState(getOneEightyDaysAgo());
    const [toDate, setToDate] = useState(getToday());

    const [submitting, setSubmitting] = useState(false);
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (selectedCompany) {
            fetchFreelancers();
            fetchVehicles();
            fetchAttendance();
        }
    }, [selectedCompany, fromDate, toDate]);

    const fetchAttendance = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            // Fetch with date range
            const { data } = await axios.get(`/api/admin/reports/${selectedCompany._id}?from=${fromDate}&to=${toDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            // Only keep freelancer attendance
            setAttendance((data.attendance || []).filter(a => a.driver?.isFreelancer));
        } catch (err) { console.error(err); }
    };

    const fetchFreelancers = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            // Fetch with isFreelancer=true and disabled pagination for a clean list
            const { data } = await axios.get(`/api/admin/drivers/${selectedCompany._id}?isFreelancer=true&usePagination=false`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setDrivers(data.drivers || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/drivers', { ...formData, companyId: selectedCompany._id, isFreelancer: true }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setMessage({ type: 'success', text: 'Freelancer added successfully!' });
            setTimeout(() => {
                setShowAddModal(false);
                setFormData({ name: '', mobile: '', licenseNumber: '', dailyWage: 500 });
                setMessage({ type: '', text: '' });
                fetchFreelancers();
            }, 1000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
        } finally { setSubmitting(false); }
    };

    const handlePunchIn = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            // Use provided time and date for flexible scheduling
            await axios.post('/api/admin/freelancers/punch-in', {
                ...punchInData,
                driverId: selectedDriver._id
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowPunchInModal(false);
            const localNow = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString();
            setPunchInData({
                vehicleId: '',
                km: '',
                date: localNow.slice(0, 10),
                time: localNow.slice(0, 16),
                pickUpLocation: ''
            });
            fetchFreelancers();
            fetchVehicles();
            fetchAttendance();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    const handlePunchOut = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/freelancers/punch-out', { ...punchOutData, driverId: selectedDriver._id }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowPunchOutModal(false);
            const now = new Date().toISOString().slice(0, 16);
            setPunchOutData({ km: '', time: now, fuelAmount: '0', parkingAmount: '0', review: '', dailyWage: 500, dropLocation: '' });
            fetchFreelancers();
            fetchVehicles();
            fetchAttendance();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.put(`/api/admin/drivers/${editingDriver._id}`, editForm, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setMessage({ type: 'success', text: 'Freelancer updated successfully!' });
            setTimeout(() => {
                setShowEditModal(false);
                setEditingDriver(null);
                setMessage({ type: '', text: '' });
                fetchFreelancers();
            }, 1000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally { setSubmitting(false); }
    };

    const openEditModal = (driver) => {
        setEditingDriver(driver);
        setEditForm({
            name: driver.name,
            mobile: driver.mobile,
            licenseNumber: driver.licenseNumber || '',
            dailyWage: driver.dailyWage || 500
        });
        setShowEditModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this freelancer?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/drivers/${id}`, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            fetchFreelancers();
        } catch (err) { alert('Error deleting'); }
    };

    const baseDrivers = drivers.filter(d => driverFilter === 'All' || d._id === driverFilter);
    const onDutyDrivers = baseDrivers.filter(d => d.tripStatus === 'active');
    const availableDrivers = baseDrivers.filter(d => d.tripStatus !== 'active').filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.mobile?.includes(searchTerm) ||
        d.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate total earnings/dues for the selected filter
    const filteredAttendance = attendance.filter(a =>
        driverFilter === 'All' || a.driver?._id === driverFilter || a.driver === driverFilter
    );

    const totalSettlement = filteredAttendance.reduce((sum, a) => sum + (Number(a.dailyWage) || 0), 0);
    const filterDriverName = driverFilter === 'All' ? 'All Freelancers' : drivers.find(d => d._id === driverFilter)?.name;

    // Extract unique locations for suggestions
    const uniquePickups = [...new Set(attendance.map(a => a.pickUpLocation).filter(Boolean))].sort();
    const uniqueDrops = [...new Set(attendance.map(a => a.dropLocation).filter(Boolean))].sort();

    const handleDownloadExcel = () => {
        if (filteredAttendance.length === 0) return alert('No data to download');

        const data = filteredAttendance.map(a => ({
            'Date': a.date,
            'Driver Name': a.driver?.name || 'N/A',
            'Car': a.vehicle?.carNumber ? a.vehicle.carNumber.slice(-4) : 'N/A',
            'In Time': a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
            'Out Time': a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
            'Total KM': (a.punchOut?.km - a.punchIn?.km) || 0,
            'Pick-up': a.pickUpLocation || '-',
            'Drop': a.dropLocation || '-',
            'Salary': a.dailyWage || 0,
            'Fuel': a.fuel?.amount || 0,
            'Parking/Toll': a.punchOut?.tollParkingAmount || 0,
            'Remarks': a.punchOut?.remarks || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Freelancer Duties");
        XLSX.writeFile(wb, `Freelancer_Report_${new Date().toLocaleDateString()}.xlsx`);
    };

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Freelancer Fleet Network" description="Onboard and manage freelance drivers for temporary duties and peak demand management." />
            <header style={{
                padding: '25px 0',
                marginBottom: '30px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: '200px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px #6366f1' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>External Asset Logistics</span>
                        </div>
                        <h1 className="resp-title" style={{ margin: 0, fontWeight: '900', letterSpacing: '-1.5px', fontSize: 'clamp(24px, 5vw, 32px)' }}>
                            Freelancer <span style={{ color: 'var(--secondary)' }}>Net</span>
                        </h1>
                        <p className="resp-subtitle" style={{ marginTop: '8px', fontSize: '13px' }}>
                            External personnel management
                        </p>
                    </div>

                    <div className="freelancer-header-controls">
                        <div style={{ position: 'relative', width: '100%', flex: 1 }}>
                            <select
                                value={driverFilter}
                                onChange={(e) => setDriverFilter(e.target.value)}
                                className="input-field"
                                style={{ height: '52px', fontSize: '13px', appearance: 'auto', marginBottom: 0, width: '100%' }}
                            >
                                <option value="All">All Drivers</option>
                                {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div style={{ position: 'relative', width: '100%', flex: 1 }}>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '40px', marginBottom: 0, height: '52px', fontSize: '14px', width: '100%' }}
                            />
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                </div>

                <div className="flex-resp" style={{ marginTop: '20px', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-field" style={{ height: '45px', marginBottom: 0, width: '100%', flex: 1, minWidth: '140px', padding: '0 15px', fontSize: '13px' }} />
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-field" style={{ height: '45px', marginBottom: 0, width: '100%', flex: 1, minWidth: '140px', padding: '0 15px', fontSize: '13px' }} />
                    <div style={{ display: 'flex', gap: '10px', width: '100%', flex: 1, minWidth: '280px' }}>
                        <button onClick={handleDownloadExcel} className="btn-primary" style={{ height: '45px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.1)', flex: 1, justifyContent: 'center' }} title="Export Excel">
                            <Download size={20} />
                            <span className="hide-mobile" style={{ fontSize: '12px', fontWeight: '900' }}>EXCEL</span>
                        </button>
                        <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ height: '45px', padding: '0 25px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                            <Plus size={20} /> <span className="hide-mobile">ADD NEW</span><span className="show-mobile">ADD</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Settlement Summary Card */}
            {(driverFilter !== 'All') && (
                <div className="glass-card" style={{ marginBottom: '30px', padding: '25px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(30, 41, 59, 0.7) 100%)', borderLeft: '5px solid var(--primary)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Full History: {filterDriverName}
                            </span>
                        </div>
                        <div style={{ color: 'white', fontSize: '15px', marginLeft: '16px', opacity: 0.8, maxWidth: '300px' }}>
                            Showing total lifetime earnings and duties for this driver
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '140px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-1px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                            <span style={{ fontSize: '20px', opacity: 0.8 }}>₹</span>
                            {totalSettlement.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>TOTAL PAYABLE WAGE</div>
                    </div>
                </div>
            )}


            {/* ON DUTY SECTION */}
            {onDutyDrivers.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px #f43f5e' }} />
                        <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Currently On Duty ({onDutyDrivers.length})</h2>
                    </div>

                    {/* Desktop Table */}
                    <div className="glass-card hide-mobile" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(244, 63, 94, 0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Driver</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Contact</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Assigned Vehicle</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Start Odo</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {onDutyDrivers.map(d => (
                                    <tr key={d._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '18px 25px', fontWeight: '700', fontSize: '15px' }}>{d.name}</td>
                                        <td style={{ padding: '18px 25px', fontSize: '14px' }}>{d.mobile}</td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '14px' }}>{d.assignedVehicle?.carNumber?.split('#')[0]}</div>
                                        </td>
                                        <td style={{ padding: '18px 25px', fontSize: '14px', color: 'var(--text-muted)' }}>{d.activeAttendance?.punchIn?.km || '-'} KM</td>
                                        <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => {
                                                    const localNow = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                                                    setSelectedDriver(d);
                                                    setPunchOutData(prev => ({ ...prev, time: localNow }));
                                                    setShowPunchOutModal(true);
                                                }}
                                                className="btn-primary"
                                                style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.1)', padding: '8px 16px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
                                            >
                                                Punch Out
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="show-mobile">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {onDutyDrivers.map(d => (
                                <motion.div
                                    key={d._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card"
                                    style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '14px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ fontWeight: '800', color: 'white', fontSize: '16px' }}>{d.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.mobile}</div>
                                    </div>
                                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Vehicle</div>
                                            <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '14px' }}>{d.assignedVehicle?.carNumber?.split('#')[0]}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', textAlign: 'right' }}>Start KM</div>
                                            <div style={{ color: 'white', fontWeight: '700', fontSize: '14px', textAlign: 'right' }}>{d.activeAttendance?.punchIn?.km || '-'}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const localNow = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                                            setSelectedDriver(d);
                                            setPunchOutData(prev => ({ ...prev, time: localNow }));
                                            setShowPunchOutModal(true);
                                        }}
                                        className="btn-primary"
                                        style={{ width: '100%', background: '#f43f5e', color: 'white', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '800' }}
                                    >
                                        Punch Out
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* AVAILABLE SECTION */}
            <div style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Freelancers ({availableDrivers.length})</h2>
                </div>

                {/* Desktop Table View */}
                <div className="glass-card hide-mobile" style={{ padding: '0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                                <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Name</th>
                                <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Mobile</th>
                                <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Rate (₹)</th>
                                <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>License</th>
                                <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                        <div className="spinner"></div>
                                        <span>Syncing available records...</span>
                                    </div>
                                </td></tr>
                            ) : availableDrivers.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px' }}>
                                        <Search size={22} style={{ opacity: 0.3 }} />
                                    </div>
                                    <p style={{ fontSize: '14px', margin: 0 }}>No available freelancers found.</p>
                                </td></tr>
                            ) : availableDrivers.map(d => (
                                <tr key={d._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '18px 25px', fontWeight: '700', fontSize: '15px' }}>{d.name}</td>
                                    <td style={{ padding: '18px 25px', fontSize: '14px' }}>{d.mobile}</td>
                                    <td style={{ padding: '18px 25px' }}>
                                        <div style={{ color: '#10b981', fontWeight: '800', fontSize: '14px' }}>₹{d.dailyWage || 500}</div>
                                    </td>
                                    <td style={{ padding: '18px 25px', fontSize: '13px', color: 'var(--text-muted)' }}>{d.licenseNumber || 'Not Provided'}</td>
                                    <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    const localNow = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000));
                                                    setSelectedDriver(d);
                                                    setPunchInData({
                                                        vehicleId: '',
                                                        km: '',
                                                        date: localNow.toISOString().slice(0, 10),
                                                        time: localNow.toISOString().slice(0, 16),
                                                        pickUpLocation: ''
                                                    });
                                                    setVehicleSearch('');
                                                    setShowPunchInModal(true);
                                                }}
                                                className="btn-primary"
                                                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '8px 16px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
                                            >
                                                Assign Duty
                                            </button>
                                            <button
                                                onClick={() => openEditModal(d)}
                                                className="btn-primary"
                                                style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', border: '1px solid rgba(14, 165, 233, 0.1)', padding: '8px 12px', fontSize: '12px', fontWeight: '800' }}
                                            >
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(d._id)} style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.05)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="show-mobile">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'var(--text-muted)' }}><div className="spinner"></div></div>
                    ) : availableDrivers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                            <Search size={22} style={{ opacity: 0.3, marginBottom: '10px' }} />
                            <p>No available freelancers.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {availableDrivers.map(d => (
                                <motion.div
                                    key={d._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card"
                                    style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '14px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', color: 'white', fontSize: '16px' }}>{d.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.mobile}</div>
                                        </div>
                                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '800' }}>
                                            ₹{d.dailyWage || 500}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
                                        License: <span style={{ color: 'white' }}>{d.licenseNumber || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => {
                                                const localNow = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000));
                                                setSelectedDriver(d);
                                                setPunchInData({
                                                    vehicleId: '',
                                                    km: '',
                                                    date: localNow.toISOString().slice(0, 10),
                                                    time: localNow.toISOString().slice(0, 16),
                                                    pickUpLocation: ''
                                                });
                                                setVehicleSearch('');
                                                setShowPunchInModal(true);
                                            }}
                                            className="btn-primary"
                                            style={{ flex: 2, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '10px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', borderRadius: '10px' }}
                                        >
                                            Assign Duty
                                        </button>
                                        <button
                                            onClick={() => openEditModal(d)}
                                            style={{ flex: 1, background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', border: '1px solid rgba(14, 165, 233, 0.1)', padding: '10px', fontSize: '12px', fontWeight: '800', borderRadius: '10px' }}
                                        >
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(d._id)} style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.05)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* COMPLETED DUTIES SECTION */}
            <div style={{ marginTop: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                    <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Completed Duties</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredAttendance.filter(a => a.status === 'completed').slice(0, 10).map(a => (
                        <motion.div
                            key={a._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.04)' }}
                            className="glass-card"
                            style={{ padding: '20px', borderLeft: '4px solid #10b981', background: 'rgba(255,255,255,0.02)', position: 'relative', cursor: 'default' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div>
                                    <div style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>{a.driver?.name || 'Unknown Driver'}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                        {a.punchIn?.time ? new Date(a.punchIn.time).toLocaleDateString() : 'N/A'} • {a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 14px', borderRadius: '30px', fontSize: '13px', fontWeight: '900', height: 'fit-content', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                    ₹{a.dailyWage || 0}
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', padding: '15px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                                    <div style={{ fontSize: '13px', color: 'white', fontWeight: '700' }}>{a.pickUpLocation || 'Airport T1'}</div>
                                </div>
                                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', marginLeft: '4.5px', marginBottom: '10px' }}></div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #f43f5e', boxShadow: '0 0 8px rgba(244, 63, 94, 0.4)' }}></div>
                                    <div style={{ fontSize: '13px', color: 'white', fontWeight: '700' }}>{a.dropLocation || 'City Center'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle</div>
                                        <div style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '14px' }}>{a.vehicle?.carNumber?.split('#')[0]}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total KM</div>
                                        <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>{a.totalKM || (a.punchOut?.km - a.punchIn?.km) || 0} KM</div>
                                    </div>
                                </div>
                                {a.punchOut?.review && (
                                    <div title={a.punchOut.review} style={{ color: '#10b981', fontSize: '11px', fontStyle: 'italic', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }}>
                                        "{a.punchOut.review}"
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                    {filteredAttendance.filter(a => a.status === 'completed').length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                            No completed duties logged yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Modals Implementation */}
            < AnimatePresence >

                {/* Add Freelancer Modal */}
                {
                    showAddModal && (
                        <Modal title="Add New Freelancer" onClose={() => setShowAddModal(false)}>
                            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '20px' }}>
                                <Field label="Full Name *" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
                                <div className="freelancer-modal-grid">
                                    <Field label="Mobile Number *" value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} required />
                                    <Field label="License Number" value={formData.licenseNumber} onChange={v => setFormData({ ...formData, licenseNumber: v })} />
                                </div>
                                <SubmitButton disabled={submitting} text="Register Freelancer" message={message} />
                            </form>
                        </Modal>
                    )
                }

                {/* Edit Freelancer Modal */}
                {
                    showEditModal && (
                        <Modal title={`Edit Freelancer: ${editingDriver?.name}`} onClose={() => setShowEditModal(false)}>
                            <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '20px' }}>
                                <Field label="Full Name *" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} required />
                                <div className="form-grid-2">
                                    <Field label="Mobile Number *" value={editForm.mobile} onChange={v => setEditForm({ ...editForm, mobile: v })} required />
                                    <Field label="License Number" value={editForm.licenseNumber} onChange={v => setEditForm({ ...editForm, licenseNumber: v })} />
                                </div>
                                <SubmitButton disabled={submitting} text="Update Freelancer" message={message} />
                            </form>
                        </Modal>
                    )
                }

                {/* Punch In Modal */}
                {
                    showPunchInModal && (
                        <Modal title={`Assign Duty: ${selectedDriver?.name}`} onClose={() => setShowPunchInModal(false)}>
                            <form onSubmit={handlePunchIn} style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Select Vehicle *</label>
                                    <input
                                        type="text"
                                        list="vehicle-list"
                                        className="input-field"
                                        placeholder="Type car number to find..."
                                        required
                                        autoComplete="off"
                                        value={vehicleSearch}
                                        onChange={e => {
                                            setVehicleSearch(e.target.value);
                                            const found = vehicles.find(v => v.carNumber?.split('#')[0]?.toUpperCase() === e.target.value.toUpperCase());
                                            if (found) setPunchInData({ ...punchInData, vehicleId: found._id });
                                            else setPunchInData({ ...punchInData, vehicleId: '' });
                                        }}
                                        style={{ height: '45px' }}
                                    />
                                    <datalist id="vehicle-list">
                                        {vehicles.filter(v => !v.currentDriver).map(v => (
                                            <option key={v._id} value={v.carNumber?.split('#')[0]}>
                                                {v.model}
                                            </option>
                                        ))}
                                    </datalist>
                                </div>
                                <div className="form-grid-2">
                                    <Field label="Duty Date *" type="date" value={punchInData.date} onChange={v => setPunchInData({ ...punchInData, date: v })} required />
                                    <Field label="Punch-In Time *" type="datetime-local" value={punchInData.time} onChange={v => setPunchInData({ ...punchInData, time: v })} required />
                                </div>
                                <div className="form-grid-2">
                                    <Field label="Starting KM *" type="number" value={punchInData.km} onChange={v => setPunchInData({ ...punchInData, km: v })} required autoComplete="off" />
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Pick-up Location</label>
                                        <input
                                            type="text"
                                            list="pickup-list"
                                            className="input-field"
                                            placeholder="Type or select..."
                                            autoComplete="off"
                                            value={punchInData.pickUpLocation}
                                            onChange={e => setPunchInData({ ...punchInData, pickUpLocation: e.target.value })}
                                        />
                                        <datalist id="pickup-list">
                                            {uniquePickups.map(loc => <option key={loc} value={loc} />)}
                                        </datalist>
                                    </div>
                                </div>
                                <SubmitButton disabled={submitting} text="Start Duty" />
                            </form>
                        </Modal>
                    )
                }

                {/* Punch Out Modal */}
                {
                    showPunchOutModal && (
                        <Modal title={`Duty Completion: ${selectedDriver?.name}`} onClose={() => setShowPunchOutModal(false)}>
                            <form onSubmit={handlePunchOut} style={{ display: 'grid', gap: '20px' }}>
                                <div className="form-grid-2">
                                    <Field label="Closing KM *" type="number" value={punchOutData.km} onChange={v => setPunchOutData({ ...punchOutData, km: v })} required />
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Drop Location</label>
                                        <input
                                            type="text"
                                            list="drop-list"
                                            className="input-field"
                                            placeholder="Type or select..."
                                            value={punchOutData.dropLocation}
                                            onChange={e => setPunchOutData({ ...punchOutData, dropLocation: e.target.value })}
                                        />
                                        <datalist id="drop-list">
                                            {uniqueDrops.map(loc => <option key={loc} value={loc} />)}
                                        </datalist>
                                    </div>
                                </div>
                                <div className="form-grid-2">
                                    <Field label="Punch-Out Time *" type="datetime-local" value={punchOutData.time} onChange={v => setPunchOutData({ ...punchOutData, time: v })} required />
                                    <div style={{ opacity: 0.5 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Duty Date Range</label>
                                        <p style={{ fontSize: '12px', color: 'white', margin: 0, paddingTop: '10px' }}>Started: {selectedDriver?.activeAttendance?.punchIn?.time ? new Date(selectedDriver.activeAttendance.punchIn.time).toLocaleString() : 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <Field label="Fuel Spent (₹)" type="number" value={punchOutData.fuelAmount} onChange={v => setPunchOutData({ ...punchOutData, fuelAmount: v })} />
                                    <Field label="Parking/Toll (₹)" type="number" value={punchOutData.parkingAmount} onChange={v => setPunchOutData({ ...punchOutData, parkingAmount: v })} />
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Duty Salary (Wage) *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '10px' }}>
                                        {[300, 400, 500].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setPunchOutData({ ...punchOutData, dailyWage: val })}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: '10px',
                                                    border: '1px solid ' + (punchOutData.dailyWage === val ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
                                                    background: punchOutData.dailyWage === val ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                                    color: 'white',
                                                    fontWeight: '800'
                                                }}
                                            >
                                                ₹{val}
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            placeholder="Other"
                                            className="input-field"
                                            style={{ marginBottom: 0, padding: '10px', height: 'auto', textAlign: 'center' }}
                                            value={![300, 400, 500].includes(punchOutData.dailyWage) ? punchOutData.dailyWage : ''}
                                            onChange={(e) => setPunchOutData({ ...punchOutData, dailyWage: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Review / Remarks</label>
                                    <textarea
                                        className="input-field"
                                        style={{ height: '80px', paddingTop: '12px' }}
                                        placeholder=""
                                        value={punchOutData.review}
                                        onChange={e => setPunchOutData({ ...punchOutData, review: e.target.value })}
                                    />
                                </div>
                                <SubmitButton disabled={submitting} text="Finish Duty & Release Vehicle" />
                            </form>
                        </Modal>
                    )
                }
            </AnimatePresence >
        </div >
    );
};

// Sub-components for cleaner code
const Modal = ({ title, onClose, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card modal-content" style={{ width: '100%', maxWidth: '550px', padding: '25px', maxHeight: '95vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: 'white', fontSize: '20px', margin: 0, fontWeight: '800' }}>{title}</h2>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            {children}
        </motion.div>
    </div>
);

const Field = ({ label, value, onChange, type = "text", required = false, autoComplete = "off", placeholder = "" }) => (
    <div>
        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{label}</label>
        <input type={type} className="input-field" required={required} value={value} onChange={e => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} />
    </div>
);

const SubmitButton = ({ disabled, text, message }) => (
    <div style={{ marginTop: '10px' }}>
        {message?.text && (
            <div style={{ padding: '12px', borderRadius: '12px', fontSize: '14px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: message.type === 'success' ? '#10b981' : '#f43f5e', border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}` }}>
                {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {message.text}
            </div>
        )}
        <button type="submit" disabled={disabled} className="btn-primary" style={{ width: '100%', padding: '15px', fontWeight: '800', textTransform: 'uppercase' }}>
            {disabled ? 'Processing...' : text}
        </button>
    </div>
);

export default Freelancers;