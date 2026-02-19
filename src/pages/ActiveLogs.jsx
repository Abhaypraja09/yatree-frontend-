import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    AlertTriangle,
    Plus,
    Search,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    MapPin,
    Calendar,
    User,
    Car,
    FileText,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const ActiveLogs = () => {
    const { selectedCompany } = useCompany();
    const [logs, setLogs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterVehicle, setFilterVehicle] = useState('All');
    const [viewPhoto, setViewPhoto] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        vehicleId: '',
        driverId: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        description: '',
        amount: '',
        status: 'Pending'
    });
    const [photos, setPhotos] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (selectedCompany) {
            fetchLogs();
            fetchVehiclesAndDrivers();
        }
    }, [selectedCompany]);

    const fetchLogs = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/accident-logs/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setLogs(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchVehiclesAndDrivers = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));

            const [vRes, dRes] = await Promise.all([
                axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=all`, { headers: { Authorization: `Bearer ${userInfo.token}` } }),
                axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false`, { headers: { Authorization: `Bearer ${userInfo.token}` } })
            ]);

            setVehicles(vRes.data.vehicles || []);
            setDrivers(dRes.data.drivers || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(key => fd.append(key, formData[key]));
            fd.append('companyId', selectedCompany._id);

            Array.from(photos).forEach(file => {
                fd.append('photos', file);
            });

            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/accident-logs', fd, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`
                }
            });

            setShowModal(false);
            resetForm();
            fetchLogs();
            alert('Incident report logged successfully');
        } catch (err) {
            console.error(err);
            alert('Failed to log incident');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this log?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/accident-logs/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchLogs();
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            vehicleId: '',
            driverId: '',
            date: new Date().toISOString().split('T')[0],
            location: '',
            description: '',
            amount: '',
            status: 'Pending'
        });
        setPhotos([]);
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = (
            log.vehicle?.carNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
        const matchesVehicle = filterVehicle === 'All' || log.vehicle?._id === filterVehicle;
        return matchesSearch && matchesStatus && matchesVehicle;
    });

    const totalEstLoss = filteredLogs.reduce((sum, log) => sum + (Number(log.amount) || 0), 0);
    const resolvedCount = filteredLogs.filter(l => l.status === 'Resolved').length;

    // Helper to render status badge
    const StatusBadge = ({ status }) => (
        <span style={{
            fontSize: '10px',
            backgroundColor: status === 'Resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: status === 'Resolved' ? '#10b981' : '#f59e0b',
            padding: '4px 8px',
            borderRadius: '6px',
            fontWeight: '800',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
        }}>
            {status}
        </span>
    );

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Active Accident Logs" description="Track and manage vehicle accidents and incidents." />

            <header className="flex-resp" style={{ justifyContent: 'space-between', padding: '30px 0', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                    <h1 className="resp-title" style={{ color: 'white', margin: 0, letterSpacing: '-1px', fontSize: 'clamp(24px, 5vw, 32px)' }}>
                        Incident <span className="text-gradient">Logs</span>
                    </h1>
                    <p className="resp-subtitle" style={{ marginTop: '5px' }}>Track vehicle damage and on-road incidents.</p>
                </div>

                <div className="flex-resp" style={{ gap: '15px', flex: '1', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="glass-card" style={{ padding: '0', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '300px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
                        <Search size={18} style={{ margin: '0 15px', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Search incidents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', height: '50px', width: '100%', outline: 'none', fontSize: '14px' }}
                        />
                    </div>

                    <div className="glass-card" style={{ padding: '0 15px', display: 'flex', alignItems: 'center', height: '50px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', flex: '0 1 auto' }}>
                        <Car size={18} style={{ marginRight: '10px', color: 'var(--primary)' }} />
                        <select
                            value={filterVehicle}
                            onChange={(e) => setFilterVehicle(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', maxWidth: '150px' }}
                        >
                            <option value="All">All Vehicles</option>
                            {vehicles.map(v => (
                                <option key={v._id} value={v._id} style={{ background: '#1e293b' }}>{v.carNumber}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setShowModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '52px', padding: '0 25px', borderRadius: '14px', fontWeight: '800', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', whiteSpace: 'nowrap' }}
                    >
                        <Plus size={20} /> <span className="hide-mobile">New Incident</span><span className="show-mobile">Add</span>
                    </button>
                </div>
            </header>

            {/* Stats Row */}
            <div className="stats-grid">
                <div className="glass-card stat-card" style={{ background: 'rgba(244, 63, 94, 0.05)', borderColor: 'rgba(244, 63, 94, 0.1)' }}>
                    <div className="stat-card-header">
                        <div className="stat-card-icon" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}><AlertTriangle size={18} /></div>
                        <p className="stat-card-label">Total Incidents</p>
                    </div>
                    <h2 className="stat-card-value">{filteredLogs.length}</h2>
                </div>

                <div className="glass-card stat-card" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.1)' }}>
                    <div className="stat-card-header">
                        <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><Clock size={18} /></div>
                        <p className="stat-card-label">Est. Cost</p>
                    </div>
                    <h2 className="stat-card-value">₹{totalEstLoss.toLocaleString()}</h2>
                </div>

                <div className="glass-card stat-card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.1)' }}>
                    <div className="stat-card-header">
                        <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><CheckCircle2 size={18} /></div>
                        <p className="stat-card-label">Resolved</p>
                    </div>
                    <h2 className="stat-card-value">{resolvedCount}</h2>
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ color: 'var(--text-muted)', marginTop: '20px', fontSize: '14px' }}>Loading logs...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <AlertTriangle size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />
                    <h3 style={{ color: 'white' }}>No incidents recorded</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Use the "New Incident" button to log vehicle damage.</p>
                </div>
            ) : (
                <>
                    {/* DESKTOP VIEW: TABLE */}
                    <div className="glass-card hide-mobile" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="table-responsive">
                            <table className="activity-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th>Date & Loc</th>
                                        <th>Vehicle / Driver</th>
                                        <th>Description</th>
                                        <th>Est. Cost</th>
                                        <th>Status</th>
                                        <th>Evidence</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <tr key={log._id} className="hover-row">
                                            <td>
                                                <div style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{new Date(log.date).toLocaleDateString('en-GB')}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={10} /> {log.location || 'Unknown'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="vehicle-badge" style={{ marginBottom: '4px' }}>{log.vehicle?.carNumber || 'Unknown'}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{log.driver?.name}</div>
                                            </td>
                                            <td style={{ maxWidth: '300px' }}>
                                                <div style={{ color: 'white', fontSize: '13px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {log.description}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ color: '#f43f5e', fontWeight: '800' }}>₹{Number(log.amount || 0).toLocaleString()}</div>
                                            </td>
                                            <td>
                                                <StatusBadge status={log.status} />
                                            </td>
                                            <td>
                                                {log.photos && log.photos.length > 0 ? (
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        {log.photos.slice(0, 3).map((p, i) => (
                                                            <div key={i} className="img-overlay" style={{ position: 'relative', cursor: 'zoom-in', transition: '0.2s' }}>
                                                                <img
                                                                    src={p}
                                                                    onClick={() => setViewPhoto(p)}
                                                                    style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                                                />
                                                            </div>
                                                        ))}
                                                        {log.photos.length > 3 && (
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '10px', color: 'white', fontWeight: '700' }}>
                                                                +{log.photos.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>No img</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    onClick={() => handleDelete(log._id)}
                                                    className="action-button"
                                                    style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '6px 10px' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MOBILE VIEW: CARDS */}
                    <div className="show-mobile">
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {filteredLogs.map((log) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={log._id}
                                    className="glass-card"
                                    style={{ padding: '15px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                <span className="vehicle-badge" style={{ fontSize: '12px' }}>{log.vehicle?.carNumber || 'N/A'}</span>
                                                <StatusBadge status={log.status} />
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <User size={12} /> {log.driver?.name || 'Unknown'}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#f43f5e', fontWeight: '800', fontSize: '16px' }}>₹{Number(log.amount || 0).toLocaleString()}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(log.date).toLocaleDateString('en-GB')}</div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px', marginBottom: '12px' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Description</p>
                                        <p style={{ color: 'white', fontSize: '13px', lineHeight: '1.4', margin: 0 }}>{log.description}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', fontSize: '11px', color: 'var(--primary)' }}>
                                            <MapPin size={12} /> {log.location || 'Location not tagged'}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {log.photos && log.photos.map((p, i) => (
                                                <img
                                                    key={i}
                                                    src={p}
                                                    onClick={() => setViewPhoto(p)}
                                                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(log._id)}
                                            style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card modal-content"
                            style={{
                                maxWidth: '600px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflowY: 'auto'
                            }}
                        >
                            <div className="modal-header" style={{ marginBottom: '20px' }}>
                                <h2 className="modal-title">Log New Incident</h2>
                                <button onClick={() => setShowModal(false)} className="modal-close-btn"><XCircle size={20} /></button>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div>
                                        <label className="input-label">Vehicle Involved</label>
                                        <select className="input-field" value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })} required>
                                            <option value="">-- Select Vehicle --</option>
                                            {vehicles.map(v => <option key={v._id} value={v._id}>{v.carNumber} ({v.model})</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="input-label">Driver</label>
                                        <select className="input-field" value={formData.driverId} onChange={e => setFormData({ ...formData, driverId: e.target.value })} required>
                                            <option value="">-- Select Driver --</option>
                                            {drivers.map(d => <option key={d._id} value={d._id}>{d.name} ({d.mobile})</option>)}
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label className="input-label">Date</label>
                                            <input type="date" className="input-field" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                        </div>
                                        <div>
                                            <label className="input-label">Est. Cost</label>
                                            <input type="number" className="input-field" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="input-label">Location</label>
                                        <input type="text" className="input-field" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Highway 44" required />
                                    </div>

                                    <div>
                                        <label className="input-label">Description</label>
                                        <textarea className="input-field" style={{ minHeight: '80px', resize: 'vertical' }} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe damage details..." required />
                                    </div>

                                    <div>
                                        <label className="input-label">Evidence Photos</label>
                                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                                            <input type="file" multiple onChange={e => setPhotos(e.target.files)} className="input-field" style={{ paddingTop: '10px' }} />
                                            <Camera size={18} style={{ position: 'absolute', right: '15px', top: '15px', color: 'var(--text-muted)' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="input-label">Current Status</label>
                                        <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                            <option value="Pending">Pending Review</option>
                                            <option value="In Repair">In Repair</option>
                                            <option value="Resolved">Resolved / Closed</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary"
                                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', height: '50px', marginTop: '10px' }}
                                    >
                                        {submitting ? 'Processing...' : <><CheckCircle2 size={18} /> Submit Incident Report</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Photo View Modal */}
            {viewPhoto && (
                <div onClick={() => setViewPhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out', padding: '20px' }}>
                    <img src={viewPhoto} style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
                </div>
            )}
        </div>
    );
};

export default ActiveLogs;
