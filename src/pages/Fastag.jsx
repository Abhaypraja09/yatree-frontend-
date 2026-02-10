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

            setMessage({ type: 'success', text: 'Top-up successful!' });
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

    const totalFleetBalance = vehicles.reduce((sum, v) => sum + (v.fastagBalance || 0), 0);
    const lowBalanceCount = vehicles.filter(v => (v.fastagBalance || 0) < 200).length;

    return (
        <div className="container-fluid" style={{ paddingBottom: '60px' }}>
            <SEO title="Fastag Wallet Control" description="Control fleet operational costs with real-time Fastag tracking and instant recharges." />

            <header style={{ padding: 'clamp(20px, 5vw, 40px) 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                <div className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '25px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Financial assets</span>
                        </div>
                        <h1 className="resp-title" style={{ margin: 0, fontWeight: '900', letterSpacing: '-1.5px' }}>
                            Fastag <span style={{ color: 'var(--primary)' }}>Wallets</span>
                        </h1>
                        <p className="resp-subtitle" style={{ marginTop: '8px', maxWidth: '500px' }}>
                            Manage virtual balances for <b>{selectedCompany?.name}</b> fleet vehicles.
                        </p>
                    </div>

                    <div className="flex-resp" style={{ gap: '15px' }}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '15px 25px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase' }}>Fleet total</span>
                            <span style={{ color: 'white', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>₹ {totalFleetBalance.toLocaleString()}</span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '15px 25px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#f43f5e', letterSpacing: '1px', textTransform: 'uppercase' }}>Critical Alert</span>
                            <span style={{ color: 'white', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>{lowBalanceCount} LOW</span>
                        </motion.div>
                    </div>
                </div>

                <div style={{ position: 'relative', maxWidth: '600px', margin: '30px 0 0' }}>
                    <Search size={20} style={{ position: 'absolute', left: '20px', top: '15px', color: 'rgba(255,255,255,0.3)' }} />
                    <input
                        type="text"
                        placeholder="Search by car number or fastag identification..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ paddingLeft: '55px', width: '100%', marginBottom: 0, height: '52px', borderRadius: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '14px' }}
                    />
                </div>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
                        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600', letterSpacing: '1px' }}>SYNCING ASSETS...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '120px 0', background: 'rgba(30, 41, 59, 0.2)', borderRadius: '30px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                        <CreditCard size={60} style={{ margin: '0 auto 20px', opacity: 0.1, color: 'var(--primary)' }} />
                        <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0 }}>No Records Found</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Try searching with a different vehicle number.</p>
                    </div>
                ) : filtered.map((v, idx) => (
                    <motion.div
                        key={v._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className="glass-card"
                        style={{
                            padding: '25px',
                            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
                            border: '1px solid rgba(255,255,255,0.06)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '150px', height: '150px', background: (v.fastagBalance || 0) < 200 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(14, 165, 233, 0.1)', filter: 'blur(50px)', pointerEvents: 'none' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                            <div>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Registration No.</span>
                                <h3 style={{ color: 'white', margin: '2px 0 0', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>{v.carNumber}</h3>
                            </div>
                            <div style={{ width: '40px', height: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CreditCard size={16} color="rgba(255,255,255,0.3)" />
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', position: 'relative', zIndex: 1 }}>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>FASTag ID / UPI</span>
                            <p style={{ color: 'white', margin: '2px 0 0', fontSize: '13px', fontWeight: '600' }}>{v.fastagNumber || <span style={{ opacity: 0.3 }}>Not Linked</span>}</p>
                        </div>

                        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                            <div>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>Virtual Credit</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                    <span style={{ color: (v.fastagBalance || 0) < 200 ? '#f43f5e' : '#10b981', fontSize: '26px', fontWeight: '900' }}>₹{v.fastagBalance?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedVehicle(v); setShowModal(true); }}
                                className="glass-card-hover-effect"
                                style={{
                                    background: (v.fastagBalance || 0) < 200 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.05)',
                                    color: (v.fastagBalance || 0) < 200 ? '#f43f5e' : 'white',
                                    border: `1px solid ${(v.fastagBalance || 0) < 200 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                    padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <Plus size={14} /> RECHARGE
                            </button>
                        </div>

                        {/* Status Bar */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
                            background: (v.fastagBalance || 0) < 200 ? 'linear-gradient(90deg, #f43f5e, transparent)' : 'linear-gradient(90deg, #10b981, transparent)',
                            opacity: 0.6
                        }} />
                    </motion.div>
                ))}
            </div>

            {/* Recharge Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
                        zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px'
                    }}>
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="glass-card"
                            style={{
                                width: '100%', maxWidth: '440px', padding: '30px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '22px', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>Wallet Top-up</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>For vehicle <b>{selectedVehicle?.carNumber}</b></p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="glass-card-hover-effect"
                                    style={{ color: 'white', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '32px', width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                ><X size={18} /></button>
                            </div>

                            <form onSubmit={handleRecharge} style={{ display: 'grid', gap: '20px' }}>
                                <div className="input-field-group">
                                    <label className="input-label">Payment Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="0.00"
                                        required
                                        autoFocus
                                        value={rechargeData.amount}
                                        onChange={(e) => setRechargeData({ ...rechargeData, amount: e.target.value })}
                                        style={{ height: '50px', fontSize: '20px', fontWeight: '800' }}
                                    />
                                </div>

                                <div className="input-field-group">
                                    <label className="input-label">Payment Method / Resource</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Ex: HDFC Bank, GPay, UPI ID"
                                        value={rechargeData.method}
                                        onChange={(e) => setRechargeData({ ...rechargeData, method: e.target.value })}
                                        style={{ height: '50px' }}
                                    />
                                </div>

                                <div className="input-field-group">
                                    <label className="input-label">Notes (Optional)</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Add transaction reference..."
                                        rows="2"
                                        value={rechargeData.remarks}
                                        onChange={(e) => setRechargeData({ ...rechargeData, remarks: e.target.value })}
                                        style={{ resize: 'none', paddingTop: '15px' }}
                                    />
                                </div>

                                {message.text && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px',
                                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                            color: message.type === 'success' ? '#10b981' : '#f43f5e',
                                            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
                                        }}
                                    >
                                        {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                        {message.text}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary"
                                    style={{ height: '50px', fontSize: '15px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}
                                >
                                    {submitting ? 'PROCESSING...' : 'CONFIRM TOP-UP'}
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
