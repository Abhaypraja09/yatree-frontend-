import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Search, CreditCard, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

const Fastag = () => {
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Recharge Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [rechargeData, setRechargeData] = useState({ amount: '', method: '', remarks: '' });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (selectedCompany) {
            fetchVehicles();
        }
    }, [selectedCompany]);

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleRecharge = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post(`/api/admin/vehicles/${selectedVehicle._id}/fastag-recharge`, rechargeData, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });

            setMessage({ type: 'success', text: 'Recharge successful!' });
            setTimeout(() => {
                setShowModal(false);
                setRechargeData({ amount: '', method: '', remarks: '' });
                setMessage({ type: '', text: '' });
                fetchVehicles();
            }, 1000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to recharge' });
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = vehicles.filter(v =>
        v.carNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.fastagNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Fastag Wallet & Tracking" description="Monitor and recharge Fastag balances for your entire taxi fleet. Stay operational without toll delays." />
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '30px 0',
                flexWrap: 'wrap',
                gap: '20px'
            }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '28px', margin: 0, fontWeight: '800', letterSpacing: '-0.5px' }}>Fastag Management</h1>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '14px' }}>Tracking and recharging operational balances for {selectedCompany?.name}</p>
                </div>
                <div style={{ position: 'relative', flex: 1, maxWidth: '350px', minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search by car or fastag..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '40px', width: '100%', marginBottom: 0, height: '48px' }}
                    />
                </div>
            </header>

            <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Vehicle Identification</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Internal Fastag No.</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Fleet Credit</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Operational Status</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '80px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                    <div className="spinner"></div>
                                    <span>Syncing vehicle data...</span>
                                </div>
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                                <CreditCard size={40} style={{ margin: '0 auto 15px', opacity: 0.2 }} />
                                <p style={{ margin: 0, fontSize: '14px' }}>No vehicle records with fastag configuration found.</p>
                            </td></tr>
                        ) : filtered.map(v => (
                            <tr key={v._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.3s' }} className="hover-row">
                                <td style={{ padding: '18px 25px', fontWeight: '800', fontSize: '15px' }}>{v.carNumber}</td>
                                <td style={{ padding: '18px 25px', fontSize: '14px' }}>{v.fastagNumber || <span style={{ color: 'rgba(255,255,255,0.2)' }}>Unconfigured</span>}</td>
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="pulse-dot" style={{
                                            background: (v.fastagBalance || 0) < 200 ? '#f43f5e' : '#10b981',
                                            boxShadow: `0 0 10px ${(v.fastagBalance || 0) < 200 ? '#f43f5e' : '#10b981'}`
                                        }} />
                                        <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px' }}>₹ {v.fastagBalance?.toLocaleString() || 0}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    {(v.fastagBalance || 0) < 200 ? (
                                        <span style={{ color: '#f43f5e', fontSize: '10px', fontWeight: '900', background: 'rgba(244, 63, 94, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)', textTransform: 'uppercase' }}>Low Credit</span>
                                    ) : (
                                        <span style={{ color: '#10b981', fontSize: '10px', fontWeight: '900', background: 'rgba(16, 185, 129, 0.1)', padding: '5px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)', textTransform: 'uppercase' }}>Operational</span>
                                    )}
                                </td>
                                <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                    <button
                                        onClick={() => { setSelectedVehicle(v); setShowModal(true); }}
                                        className="btn-primary"
                                        style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px', fontWeight: '800' }}
                                    >
                                        <Plus size={16} /> <span className="mobile-hide">Top Up</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recharge Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
                        zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '450px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '20px', margin: 0, fontWeight: '700' }}>Fastag Recharge</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '5px 0 0 0' }}>Vehicle: {selectedVehicle?.carNumber}</p>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)', background: 'none' }}><X /></button>
                            </div>

                            <form onSubmit={handleRecharge} style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Recharge Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="Enter amount"
                                        required
                                        autoFocus
                                        value={rechargeData.amount}
                                        onChange={(e) => setRechargeData({ ...rechargeData, amount: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Payment Method / Bank</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. ICICI Bank, Paytm, UPI"
                                        value={rechargeData.method}
                                        onChange={(e) => setRechargeData({ ...rechargeData, method: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Remarks (Optional)</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Add any notes..."
                                        rows="2"
                                        value={rechargeData.remarks}
                                        onChange={(e) => setRechargeData({ ...rechargeData, remarks: e.target.value })}
                                        style={{ resize: 'none' }}
                                    />
                                </div>

                                {message.text && (
                                    <div style={{
                                        padding: '12px', borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                                        background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                        color: message.type === 'success' ? '#10b981' : '#f43f5e',
                                        border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
                                    }}>
                                        {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {message.text}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary"
                                    style={{ padding: '15px', fontWeight: '700' }}
                                >
                                    {submitting ? 'Processing...' : 'Add Payment'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Fastag;
