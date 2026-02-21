import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import {
    Users, Clock, Fuel, X, Camera, LogIn, IndianRupee, Activity,
    Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const EditAttendanceModal = ({ item, onClose, onUpdate, vehicles, drivers }) => {
    const [formData, setFormData] = useState({
        vehicleId: item.vehicle?._id || '',
        driverId: item.driver?._id || '',
        startKm: item.punchIn?.km || '',
        status: item.status || 'active',
        remarks: item.punchOut?.remarks || ''
    });
    const [updating, setUpdating] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await onUpdate(item._id, formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to update attendance');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '500px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '0' }}
            >
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '700' }}>Edit Active Log</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Vehicle</label>
                        <select
                            className="input-field"
                            value={formData.vehicleId}
                            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                            style={{ background: '#1e293b' }}
                        >
                            {vehicles?.map(v => (
                                <option key={v._id} value={v._id}>{v.carNumber} ({v.model})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Start KM</label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.startKm}
                                onChange={(e) => setFormData({ ...formData, startKm: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Status</label>
                            <select
                                className="input-field"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                style={{ background: '#1e293b' }}
                            >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Remarks / Destination</label>
                        <textarea
                            className="input-field"
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            rows={3}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={updating} className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                            {updating ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

const AddFuelModal = ({ item, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        amount: '',
        odometer: item.vehicle?.lastOdometer || '',
        quantity: '',
        fuelType: 'Diesel',
        paymentSource: 'Yatree Office'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userInfoRaw = localStorage.getItem('userInfo');
            const userInfo = JSON.parse(userInfoRaw);

            await axios.post('/api/admin/fuel', {
                ...formData,
                vehicleId: item.vehicle?._id,
                companyId: item.company,
                driver: item.driver?.name,
                date: new Date()
            }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

            await axios.put(`/api/admin/attendance/${item._id}`, {
                fuel: {
                    filled: true,
                    amount: (item.fuel?.amount || 0) + Number(formData.amount),
                    entries: [...(item.fuel?.entries || []), {
                        amount: Number(formData.amount),
                        km: Number(formData.odometer),
                        fuelType: formData.fuelType,
                        paymentSource: formData.paymentSource
                    }]
                }
            }, { headers: { Authorization: `Bearer ${userInfo.token}` } });

            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to record fuel');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '450px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '25px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '900' }}>RECORD FUEL</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '4px 0 0 0', fontWeight: '700' }}>V: {item.vehicle?.carNumber} | D: {item.driver?.name}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Amount (₹)</label>
                            <input type="number" required className="input-field" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="e.g. 2000" style={{ background: '#1e293b' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Odometer (KM)</label>
                            <input type="number" required className="input-field" value={formData.odometer} onChange={(e) => setFormData({ ...formData, odometer: e.target.value })} placeholder="Current KM" style={{ background: '#1e293b' }} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Quantity (Ltrs)</label>
                            <input type="number" step="0.01" required className="input-field" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="Liters filled" style={{ background: '#1e293b' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Fuel Type</label>
                            <select className="input-field" value={formData.fuelType} onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })} style={{ background: '#1e293b' }}>
                                <option value="Diesel">Diesel</option>
                                <option value="Petrol">Petrol</option>
                                <option value="CNG">CNG</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        {loading ? 'Processing...' : <><Fuel size={18} /> SAVE FUEL ENTRY</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

const AttendanceModal = ({ item, onClose, onApproveReject }) => {
    return (
        <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '25px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '900' }}>Duty Session Details</h2>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    {/* Punch In */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <h3 style={{ color: '#10b981', margin: '0 0 15px 0', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>Duty Started</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '8px' }}>SELFIE</p>
                                <img src={item.punchIn?.selfie} alt="Start Selfie" style={{ width: '100%', aspectRatio: '1', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(item.punchIn?.selfie)} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '8px' }}>KM METER</p>
                                <img src={item.punchIn?.kmPhoto} alt="KM Photo" style={{ width: '100%', aspectRatio: '1', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(item.punchIn?.kmPhoto)} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '8px' }}>CAR PHOTO</p>
                                <img src={item.punchIn?.carSelfie} alt="Car Selfie" style={{ width: '100%', aspectRatio: '1', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(item.punchIn?.carSelfie)} />
                            </div>
                        </div>
                    </div>

                    {/* Punch Out */}
                    <div style={{ background: item.punchOut?.time ? 'rgba(244, 63, 94, 0.05)' : 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: `1px solid ${item.punchOut?.time ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.05)'}` }}>
                        <h3 style={{ color: item.punchOut?.time ? '#f43f5e' : 'rgba(255,255,255,0.4)', margin: '0 0 15px 0', fontSize: '14px', fontWeight: '900', textTransform: 'uppercase' }}>Duty Ended</h3>
                        {item.punchOut?.time ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '8px' }}>SELFIE</p>
                                    <img src={item.punchOut?.selfie} alt="End Selfie" style={{ width: '100%', aspectRatio: '1', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(item.punchOut?.selfie)} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '8px' }}>KM METER</p>
                                    <img src={item.punchOut?.kmPhoto} alt="KM Photo" style={{ width: '100%', aspectRatio: '1', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(item.punchOut?.kmPhoto)} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '8px' }}>CAR PHOTO</p>
                                    <img src={item.punchOut?.carSelfie} alt="Car Selfie" style={{ width: '100%', aspectRatio: '1', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(item.punchOut?.carSelfie)} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                <Clock size={24} />
                                <p style={{ fontSize: '11px', marginTop: '10px', fontWeight: '600' }}>Active on trip...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Additional Info */}
                <div style={{ marginTop: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '8px' }}>FUEL RECORDED</p>
                        <h4 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Fuel size={18} fill="#f43f5e" color="#f43f5e" />
                            ₹{(() => {
                                const recordedFuel = item.fuel?.amount || 0;
                                const pendingFuel = item.pendingExpenses?.filter(e => e.type === 'fuel' && e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
                                return recordedFuel + pendingFuel;
                            })()}
                        </h4>
                    </div>
                    <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '8px' }}>TOTAL DISTANCE</p>
                        <h4 style={{ color: 'white', margin: 0 }}>{item.totalKM || 0} KM</h4>
                    </div>
                    <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', marginBottom: '8px' }}>TOLLS & PARKING</p>
                        <h4 style={{ color: '#10b981', margin: 0 }}>₹{item.punchOut?.tollParkingAmount || 0}</h4>
                    </div>
                </div>

                {/* Remarks */}
                {item.punchOut?.remarks && (
                    <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
                        <p style={{ fontSize: '10px', color: '#10b981', fontWeight: '900', marginBottom: '8px' }}>REMARKS / DESTINATION</p>
                        <p style={{ color: 'white', fontSize: '14px', margin: 0, fontWeight: '600' }}>{item.punchOut.remarks}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const LiveFeed = () => {
    const { user } = useAuth();
    const { selectedCompany, selectedDate, setSelectedDate } = useCompany();
    const [stats, setStats] = useState(null);
    const dateInputRef = useRef(null);

    const getTodayLocal = () => {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const localDate = new Date(d.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [quickFuelItem, setQuickFuelItem] = useState(null);
    const [allVehicles, setAllVehicles] = useState([]);
    const [allDrivers, setAllDrivers] = useState([]);

    const fetchFeed = async () => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const userInfoRaw = localStorage.getItem('userInfo');
            const userInfo = JSON.parse(userInfoRaw);
            const { data } = await axios.get(`/api/admin/dashboard/${selectedCompany._id}?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setStats(data);
        } catch (err) {
            console.error('Error fetching feed', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoRaw = localStorage.getItem('userInfo');
            const userInfo = JSON.parse(userInfoRaw);
            const [vRes, dRes] = await Promise.all([
                axios.get(`/api/admin/vehicles/${selectedCompany._id}`, { headers: { Authorization: `Bearer ${userInfo.token}` } }),
                axios.get(`/api/admin/drivers/${selectedCompany._id}`, { headers: { Authorization: `Bearer ${userInfo.token}` } })
            ]);
            setAllVehicles(vRes.data.vehicles || []);
            setAllDrivers(dRes.data.drivers || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchFeed();
        fetchResources();
        const interval = setInterval(fetchFeed, 60000); // Auto refresh every minute
        return () => clearInterval(interval);
    }, [selectedCompany, selectedDate]);

    const handleUpdateAttendance = async (id, data) => {
        const userInfoRaw = localStorage.getItem('userInfo');
        const userInfo = JSON.parse(userInfoRaw);
        await axios.put(`/api/admin/attendance/${id}`, data, {
            headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        fetchFeed();
        alert('Record updated successfully');
    };

    const handleApproveRejectExpense = async (attendanceId, expenseId, status) => {
        try {
            const userInfoRaw = localStorage.getItem('userInfo');
            const userInfo = JSON.parse(userInfoRaw);
            await axios.patch(`/api/admin/attendance/${attendanceId}/expense/${expenseId}`, { status }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchFeed();
        } catch (err) {
            console.error('Error processing expense', err);
            alert('Failed to process expense');
        }
    };

    const handleFuelSuccess = () => {
        setQuickFuelItem(null);
        fetchFeed();
        alert('Fuel recorded successfully');
    };

    if (loading && !stats) return <div style={{ color: 'white', padding: '40px' }}>Loading Live Feed...</div>;

    return (
        <div style={{ padding: 'clamp(15px, 4vw, 40px)', minHeight: '100vh', background: 'radial-gradient(circle at top right, #1e293b, #0f172a)' }}>
            <SEO title="Live Feed" description="Real-time driver activity and mission control." />

            <header style={{ paddingBottom: '30px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: 'clamp(40px,10vw,50px)',
                            height: 'clamp(40px,10vw,50px)',
                            background: 'linear-gradient(135deg, white, #f8fafc)',
                            borderRadius: '16px',
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}>
                            <Activity size={28} color="#fbbf24" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                                <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>System Mission Control</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', margin: 0, letterSpacing: '-1.5px', cursor: 'pointer' }}>
                                Live <span className="text-gradient-yellow">Feed</span>
                            </h1>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '2px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <button
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() - 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                    style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: '#334155', color: '#ffffff', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <ChevronLeft size={16} strokeWidth={3} />
                                </button>

                                <div
                                    style={{ position: 'relative', cursor: 'pointer' }}
                                    onClick={() => {
                                        if (dateInputRef.current) {
                                            if (typeof dateInputRef.current.showPicker === 'function') {
                                                dateInputRef.current.showPicker();
                                            } else {
                                                dateInputRef.current.click();
                                            }
                                        }
                                    }}
                                >
                                    <div style={{ height: '30px', padding: '0 12px', background: '#334155', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
                                        <Calendar size={14} color="#ffffff" />
                                        <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: '700' }}>{formatDate(selectedDate)}</span>
                                    </div>
                                    <input
                                        type="date"
                                        ref={dateInputRef}
                                        value={selectedDate}
                                        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, pointerEvents: 'none' }}
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() + 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                    style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: '#334155', color: '#ffffff', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <ChevronRight size={16} strokeWidth={3} />
                                </button>
                            </div>
                            <button
                                onClick={() => setSelectedDate(getTodayLocal())}
                                style={{ padding: '0 10px', height: '28px', borderRadius: '8px', background: selectedDate === getTodayLocal() ? '#fbbf24' : 'rgba(255,255,255,0.05)', color: selectedDate === getTodayLocal() ? '#000' : 'white', fontWeight: '800', border: 'none', fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}
                            >
                                Today
                            </button>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700', margin: 0 }}>ACTIVE SESSIONS</p>
                            <h2 style={{ color: 'white', margin: 0, fontWeight: '900' }}>{stats?.attendanceDetails?.length || 0}</h2>
                        </div>
                    </div>
                </div>
            </header>

            <div className="glass-card" style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '0' }}>
                <div className="activity-table-wrapper hide-mobile">
                    <table className="activity-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <th style={{ padding: '20px' }}>Driver Details</th>
                                <th style={{ padding: '20px' }}>Vehicle & Fuel</th>
                                <th style={{ padding: '20px' }}>Status</th>
                                <th style={{ padding: '20px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.attendanceDetails?.map((item) => (
                                <tr key={item._id} className="hover-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: item.driver?.isFreelancer ? 'rgba(129, 140, 248, 0.1)' : 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${item.driver?.isFreelancer ? 'rgba(129, 140, 248, 0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                                                <Users size={18} color={item.driver?.isFreelancer ? '#818cf8' : 'rgba(255,255,255,0.6)'} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '900', color: 'white', fontSize: '14px' }}>
                                                    {item.driver?.name}
                                                </div>
                                                {item.driver?.isFreelancer && <div style={{ fontSize: '9px', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', marginTop: '-2px' }}>Freelancer Driver</div>}
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{item.driver?.mobile}</span>
                                                    {item.punchIn?.time && (
                                                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                            <LogIn size={10} /> {new Date(item.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span className="vehicle-badge" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '900' }}>
                                                    {item.vehicle?.carNumber}
                                                </span>
                                                {(() => {
                                                    const recordedFuel = item.fuel?.amount || 0;
                                                    const pendingFuel = item.pendingExpenses?.filter(e => e.type === 'fuel' && e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
                                                    const totalFuel = recordedFuel + pendingFuel;

                                                    if (totalFuel > 0 || item.pendingExpenses?.some(e => e.type === 'fuel' && e.status === 'pending')) {
                                                        return (
                                                            <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                                                                <Fuel size={12} fill="#f43f5e" />
                                                                <span style={{ fontSize: '10px', fontWeight: '900' }}>₹{totalFuel} FUEL</span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                            {item.punchOut?.remarks && (
                                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Dest: {item.punchOut.remarks}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        <span className="status-pill staff-badge" style={{
                                            background: item.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                                            color: item.status === 'completed' ? '#10b981' : '#38bdf8',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontWeight: '900',
                                            fontSize: '10px'
                                        }}>
                                            {item.status === 'completed' ? 'CONCLUDED' : 'ON DUTY'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => setSelectedItem(item)} className="action-button" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.2)', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>Details</button>
                                            <button onClick={() => setEditingItem(item)} className="action-button" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '800', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="show-mobile" style={{ padding: '15px', display: 'grid', gap: '15px' }}>
                    {stats?.attendanceDetails?.map((item) => (
                        <div key={item._id} className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Users size={20} color="#38bdf8" />
                                    </div>
                                    <div>
                                        <div style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>{item.driver?.name}</div>
                                        {item.driver?.isFreelancer && <div style={{ fontSize: '10px', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', marginTop: '2px' }}>Freelancer Driver</div>}
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600' }}>
                                            {item.vehicle?.carNumber}
                                            {(() => {
                                                const recordedFuel = item.fuel?.amount || 0;
                                                const pendingFuel = item.pendingExpenses?.filter(e => e.type === 'fuel' && e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
                                                const totalFuel = recordedFuel + pendingFuel;

                                                if (totalFuel > 0 || item.pendingExpenses?.some(e => e.type === 'fuel' && e.status === 'pending')) {
                                                    return (
                                                        <span style={{ color: '#f43f5e', marginLeft: '8px', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <Fuel size={10} fill="#f43f5e" /> ₹{totalFuel}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <span style={{ background: item.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)', color: item.status === 'completed' ? '#10b981' : '#38bdf8', padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900' }}>
                                    {item.status === 'completed' ? 'CONCLUDED' : 'ACTIVE'}
                                </span>
                            </div>
                            <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                                <button onClick={() => setSelectedItem(item)} style={{ flex: 1, padding: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>DETAILS</button>
                                <button onClick={() => setEditingItem(item)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '11px', fontWeight: '800' }}>EDIT</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {selectedItem && <AttendanceModal item={selectedItem} onClose={() => setSelectedItem(null)} onApproveReject={handleApproveRejectExpense} />}
                {editingItem && <EditAttendanceModal item={editingItem} onClose={() => setEditingItem(null)} onUpdate={handleUpdateAttendance} vehicles={allVehicles} drivers={allDrivers} />}
                {quickFuelItem && <AddFuelModal item={quickFuelItem} onClose={() => setQuickFuelItem(null)} onSuccess={handleFuelSuccess} />}
            </AnimatePresence>

            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                .hover-row:hover { background: rgba(255,255,255,0.03); }
                .glass-card { backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }
            `}</style>
        </div>
    );
};

export default LiveFeed;
