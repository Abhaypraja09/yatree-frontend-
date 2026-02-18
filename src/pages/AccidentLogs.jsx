import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    ShieldAlert,
    Plus,
    Search,
    Trash2,
    Calendar,
    MapPin,
    Clock,
    User,
    Car,
    FileText,
    Image as ImageIcon,
    Filter,
    X,
    ChevronDown,
    IndianRupee,
    AlertTriangle,
    CheckCircle2,
    Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const AccidentLogs = () => {
    const { selectedCompany } = useCompany();
    const [logs, setLogs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Form State
    const [formData, setFormData] = useState({
        vehicleId: '',
        driverId: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        location: '',
        status: 'Pending'
    });
    const [photos, setPhotos] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (selectedCompany) {
            fetchLogs();
            fetchVehicles();
            fetchDrivers();
        }
    }, [selectedCompany, selectedMonth, selectedYear]);

    const fetchLogs = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/accident-logs/${selectedCompany._id}`);
            setLogs(data || []);
        } catch (err) {
            console.error('Error fetching logs', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`);
            setVehicles(data.vehicles || []);
        } catch (err) {
            console.error('Error fetching vehicles', err);
        }
    };

    const fetchDrivers = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false`);
            setDrivers(data.drivers || []);
        } catch (err) {
            console.error('Error fetching drivers', err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(key => {
                fd.append(key, formData[key]);
            });
            fd.append('companyId', selectedCompany._id);
            if (photos.length > 0) {
                photos.forEach(photo => {
                    fd.append('photos', photo);
                });
            }

            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/accident-logs', fd, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setShowModal(false);
            resetForm();
            fetchLogs();
            alert('Incident log added successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving log');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this log?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/accident-logs/${id}`);
            fetchLogs();
        } catch (err) {
            console.error(err);
        }
    };

    const handleExportExcel = async () => {
        if (filteredLogs.length === 0) return alert('No logs to export');
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        const data = filteredLogs.map(log => ({
            'Date': new Date(log.date).toLocaleDateString('en-IN'),
            'Vehicle': log.vehicle?.carNumber || 'N/A',
            'Driver': log.driver?.name || 'N/A',
            'Location': log.location || 'N/A',
            'Amount': log.amount || 0,
            'Status': log.status || 'Pending',
            'Description': log.description || ''
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Accident Logs");
        XLSX.writeFile(wb, `Accident_Logs_${selectedCompany.name}_${new Date().toLocaleDateString()}.xlsx`);
    };

    const resetForm = () => {
        setFormData({
            vehicleId: '',
            driverId: '',
            date: new Date().toISOString().split('T')[0],
            amount: '',
            description: '',
            location: '',
            status: 'Pending'
        });
        setPhotos([]);
    };

    const filteredLogs = logs.filter(log =>
        log.vehicle?.carNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Active Logs - Incidents & Accidents" description="Track vehicle accidents and incident logs for your fleet." />

            {/* Header */}
            <header className="flex-resp" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', padding: '30px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: 'clamp(40px, 10vw, 50px)',
                        height: 'clamp(40px, 10vw, 50px)',
                        background: 'linear-gradient(135deg, white, #f8fafc)',
                        borderRadius: '16px',
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <ShieldAlert size={28} color="#f43f5e" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }}></div>
                            <span style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Safety Management</span>
                        </div>
                        <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
                            Active <span className="text-gradient-red">Logs</span>
                        </h1>
                    </div>
                </div>

                <div className="mobile-search-row" style={{ display: 'flex', gap: '10px', flex: '1', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="glass-card" style={{ padding: '0', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '380px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', flex: '1 1 auto' }}>
                        <Search size={18} style={{ margin: '0 15px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search by vehicle, driver or details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', height: '52px', width: '100%', outline: 'none', fontSize: '14px' }}
                        />
                    </div>
                    <button
                        className="btn-secondary"
                        onClick={handleExportExcel}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '52px', padding: '0 20px', borderRadius: '14px', fontWeight: '800', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <Download size={18} /> <span className="hide-mobile">Export Excel</span>
                    </button>
                    <button
                        className="btn-primary glass-card-hover-effect"
                        onClick={() => setShowModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '52px', padding: '0 25px', borderRadius: '14px', fontWeight: '800', background: 'linear-gradient(135deg, #f43f5e, #be123c)' }}
                    >
                        <Plus size={20} /> <span className="hide-mobile">Report Incident</span><span className="show-mobile">Add</span>
                    </button>
                </div>
            </header>

            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><AlertTriangle size={22} /></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Total Incidents</p>
                        <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: '4px 0 0' }}>{logs.length}</h3>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><IndianRupee size={22} /></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Total Loss Estimates</p>
                        <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: '4px 0 0' }}>₹{logs.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}</h3>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CheckCircle2 size={22} /></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Resolved / Closed</p>
                        <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: '4px 0 0' }}>{logs.filter(l => l.status === 'Closed').length}</h3>
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}><div className="spinner"></div></div>
            ) : (
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden', background: 'transparent' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', padding: '0 10px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Date & Location</th>
                                    <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Vehicle & Driver</th>
                                    <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Description</th>
                                    <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Loss (Est.)</th>
                                    <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredLogs.length === 0 ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>No logs found matching your criteria.</td></tr>
                                    ) : (
                                        filteredLogs.map((log, idx) => (
                                            <motion.tr
                                                key={log._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px' }}
                                                className="glass-card-hover-effect"
                                            >
                                                <td style={{ padding: '20px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                    <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(244, 63, 94, 0.8)', marginTop: '4px', fontWeight: '600' }}>
                                                        <MapPin size={12} /> {log.location || 'Unknown Location'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}><Car size={16} color="#0ea5e9" /></div>
                                                        <div>
                                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>{log.vehicle?.carNumber}</div>
                                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600' }}>{log.driver?.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px', maxWidth: '300px' }}>
                                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                                                        {log.description}
                                                    </p>
                                                    {log.photos?.length > 0 && (
                                                        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                                                            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <ImageIcon size={10} /> {log.photos.length} Photos
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '20px' }}>
                                                    <div style={{ color: '#f43f5e', fontWeight: '900', fontSize: '15px' }}>₹{log.amount?.toLocaleString() || '0'}</div>
                                                </td>
                                                <td style={{ padding: '20px' }}>
                                                    <span style={{
                                                        padding: '6px 14px',
                                                        borderRadius: '20px',
                                                        fontSize: '11px',
                                                        fontWeight: '800',
                                                        textTransform: 'uppercase',
                                                        background: log.status === 'Pending' ? 'rgba(245, 158, 11, 0.1)' :
                                                            log.status === 'Closed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                                                        color: log.status === 'Pending' ? '#f59e0b' :
                                                            log.status === 'Closed' ? '#10b981' : '#38bdf8',
                                                        border: `1px solid ${log.status === 'Pending' ? 'rgba(245, 158, 11, 0.2)' :
                                                            log.status === 'Closed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)'}`
                                                    }}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px', textAlign: 'right', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                                    <button
                                                        onClick={() => handleDelete(log._id)}
                                                        style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.3s' }}
                                                        className="glass-card-hover-effect"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        )
                                        ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay" style={{ backdropFilter: 'blur(10px)', zIndex: 1100 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="glass-card modal-content"
                            style={{ maxWidth: '650px', width: '95%', padding: '0', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <AlertTriangle color="#f43f5e" size={24} />
                                    <div>
                                        <h2 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '800' }}>Report New Incident</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0' }}>Provide accurate details for internal investigation.</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} style={{ padding: '30px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label className="input-label">Vehicle Involved *</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                className="input-field"
                                                required
                                                value={formData.vehicleId}
                                                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                                style={{ appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
                                            >
                                                <option value="" style={{ background: '#0f172a' }}>Select Vehicle</option>
                                                {vehicles.map(v => (
                                                    <option key={v._id} value={v._id} style={{ background: '#0f172a' }}>{v.carNumber} - {v.model}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="input-label">Driver Assigned *</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                className="input-field"
                                                required
                                                value={formData.driverId}
                                                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                                style={{ appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
                                            >
                                                <option value="" style={{ background: '#0f172a' }}>Select Driver</option>
                                                {drivers.map(d => (
                                                    <option key={d._id} value={d._id} style={{ background: '#0f172a' }}>{d.name} ({d.mobile})</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label className="input-label">Incident Date *</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            style={{ background: 'rgba(255,255,255,0.03)' }}
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Incident Location *</label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                            <input
                                                type="text"
                                                className="input-field"
                                                required
                                                placeholder="e.g. Near New Delhi Railway Station"
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                style={{ paddingLeft: '45px', background: 'rgba(255,255,255,0.03)' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label className="input-label">Estimated Loss / Cost</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', fontWeight: '800' }}>₹</span>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="Repair estimate"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                style={{ paddingLeft: '35px', background: 'rgba(255,255,255,0.03)' }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="input-label">Case Status</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                className="input-field"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                style={{ appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
                                            >
                                                <option value="Pending" style={{ background: '#0f172a' }}>Pending Review</option>
                                                <option value="Repaired" style={{ background: '#0f172a' }}>Under Repair</option>
                                                <option value="Insurance Claimed" style={{ background: '#0f172a' }}>Insurance Claimed</option>
                                                <option value="Closed" style={{ background: '#0f172a' }}>Case Closed</option>
                                            </select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '25px' }}>
                                    <label className="input-label">Incident Description / Remarks *</label>
                                    <textarea
                                        className="input-field"
                                        required
                                        placeholder="Briefly explain what happened, damages sustained, and any third-party involvement..."
                                        rows="4"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        style={{ height: 'auto', paddingTop: '15px', background: 'rgba(255,255,255,0.03)' }}
                                    ></textarea>
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <label className="input-label">Evidence / Site Photos</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
                                        {photos.map((photo, i) => (
                                            <div key={i} style={{ position: 'relative', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <img src={URL.createObjectURL(photo)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                                                    style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(244, 63, 94, 0.8)', border: 'none', color: 'white', padding: '4px', borderRadius: '50%', cursor: 'pointer' }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {photos.length < 5 && (
                                            <label style={{ height: '100px', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }} className="glass-card-hover-effect">
                                                <Plus size={24} style={{ opacity: 0.3 }} />
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', marginTop: '5px' }}>Add Photo</span>
                                                <input type="file" multiple accept="image/*" hidden onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files)])} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        style={{ flex: 1, height: '52px', fontWeight: '800', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary"
                                        style={{ flex: 2, height: '52px', fontWeight: '900', borderRadius: '14px', background: 'linear-gradient(135deg, #f43f5e, #be123c)', border: 'none', boxShadow: '0 8px 24px rgba(244, 63, 94, 0.3)' }}
                                    >
                                        {submitting ? <div className="spinner" style={{ width: '20px', height: '20px' }}></div> : 'Save Incident Report'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AccidentLogs;
