import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Search, CreditCard, Plus, X, CheckCircle, AlertCircle, Download, History, Zap, Car, Filter, ArrowUpRight, ArrowDownLeft, ChevronDown, Calendar, ChevronRight, Wallet } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import * as XLSX from 'xlsx-js-style';
import { todayIST, formatDateIST, nowIST } from '../utils/istUtils';

const Fastag = () => {
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedVehicle, setExpandedVehicle] = useState(null);

    // Recharge Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [rechargeData, setRechargeData] = useState({
        amount: '',
        method: 'UPI',
        remarks: '',
        date: todayIST()
    });
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
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=all`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            const fetchedVehicles = data.vehicles || [];

            const cleanedVehicles = fetchedVehicles
                .filter(v => v.isOutsideCar !== true)
                .map(v => ({
                    ...v,
                    displayCarNumber: v.carNumber ? v.carNumber.split('#')[0] : 'Unknown',
                    // Sort history inside vehicle
                    fastagHistory: (v.fastagHistory || []).sort((a, b) => nowIST(b.date) - nowIST(a.date))
                }));

            setVehicles(cleanedVehicles);
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

            setMessage({ type: 'success', text: 'Recharge Successful!' });
            setTimeout(() => {
                setShowModal(false);
                setRechargeData({ amount: '', method: 'UPI', remarks: '', date: todayIST() });
                setMessage({ type: '', text: '' });
                fetchVehicles();
            }, 1000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to recharge' });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.displayCarNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.fastagNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalFleetBalance = vehicles.reduce((sum, v) => sum + (v.fastagBalance || 0), 0);

    return (
        <div className="container-fluid" style={{ paddingBottom: '80px' }}>
            <SEO title="Fastag Wallet" description="Manage fleet Fastag balances and history." />

            {/* Premium Header */}
            <header style={{ padding: '40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet color="#fbbf24" size={20} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(251, 191, 36, 0.8)', letterSpacing: '2px', textTransform: 'uppercase' }}>Fleet Wallet</span>
                    </div>
                    <h1 style={{ color: 'white', fontSize: '38px', fontWeight: '900', margin: 0, letterSpacing: '-1.5px' }}>
                        Fastag <span style={{ color: '#fbbf24' }}>Manager</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{
                        padding: '15px 25px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>Total Balance</span>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#fbbf24' }}>₹ {totalFleetBalance.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={() => { setSelectedVehicle(null); setShowModal(true); }}
                        style={{
                            padding: '18px 32px',
                            background: '#fbbf24',
                            color: '#000',
                            border: 'none',
                            borderRadius: '20px',
                            fontWeight: '900',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 15px 30px -10px rgba(251, 191, 36, 0.4)'
                        }}
                    >
                        <Plus size={20} strokeWidth={3} /> INITIALIZE TOP-UP
                    </button>
                </div>
            </header>

            {/* Search & Filter Bar */}
            <div style={{
                marginBottom: '30px',
                display: 'flex',
                gap: '15px',
                background: 'rgba(255,255,255,0.05)',
                padding: '10px',
                borderRadius: '22px',
                border: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input
                        type="text"
                        placeholder="Search by vehicle number or Fastag ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            height: '56px',
                            background: 'transparent',
                            border: 'none',
                            paddingLeft: '55px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* Vehicle List Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px', color: 'rgba(255,255,255,0.2)' }}>
                        <div className="spinner"></div>
                        <p style={{ marginTop: '20px', fontWeight: '700' }}>Fetching wallet data...</p>
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Car size={40} color="rgba(255,255,255,0.1)" />
                        <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: '15px', fontWeight: '600' }}>No vehicles found matching your search.</p>
                    </div>
                ) : (
                    filteredVehicles.map(v => (
                        <div key={v._id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <motion.div
                                layout
                                onClick={() => setExpandedVehicle(expandedVehicle === v._id ? null : v._id)}
                                style={{
                                    background: expandedVehicle === v._id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: expandedVehicle === v._id ? '28px 28px 0 0' : '24px',
                                    padding: '20px 30px',
                                    cursor: 'pointer',
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(150px, 1fr) minmax(150px, 1fr) minmax(120px, 1fr) auto',
                                    alignItems: 'center',
                                    gap: '20px',
                                    transition: 'all 0.3s ease',
                                    borderBottom: expandedVehicle === v._id ? '1px solid rgba(255,255,255,0.03)' : '1px solid rgba(255,255,255,0.08)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{
                                        width: '45px',
                                        height: '45px',
                                        borderRadius: '14px',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Car size={22} color="rgba(255,255,255,0.4)" />
                                    </div>
                                    <div>
                                        <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '900' }}>{v.displayCarNumber}</h3>
                                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{v.model || 'Unknown Model'}</p>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <History size={12} color="rgba(255,255,255,0.3)" />
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase' }}>Available Balance</span>
                                    </div>
                                    <span style={{
                                        fontSize: '22px',
                                        fontWeight: '900',
                                        color: (v.fastagBalance || 0) < 500 ? '#f43f5e' : '#10b981'
                                    }}>
                                        ₹ {v.fastagBalance || 0}
                                    </span>
                                </div>

                                <div>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        padding: '6px 14px',
                                        borderRadius: '10px',
                                        background: (v.fastagBalance || 0) < 500 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: (v.fastagBalance || 0) < 500 ? '#f43f5e' : '#10b981',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {(v.fastagBalance || 0) < 500 ? 'LOW BALANCE' : 'WALLET HEALTHY'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedVehicle(v); setShowModal(true); }}
                                        style={{
                                            padding: '12px 20px',
                                            background: 'rgba(251, 191, 36, 0.1)',
                                            color: '#fbbf24',
                                            border: '1px solid rgba(251, 191, 36, 0.2)',
                                            borderRadius: '14px',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <Zap size={14} /> RECHARGE
                                    </button>
                                    <div style={{ color: 'rgba(255,255,255,0.2)' }}>
                                        <ChevronRight size={24} style={{ transform: expandedVehicle === v._id ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                                    </div>
                                </div>
                            </motion.div>

                            <AnimatePresence>
                                {expandedVehicle === v._id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{
                                            overflow: 'hidden',
                                            background: 'rgba(255,255,255,0.015)',
                                            borderRadius: '0 0 28px 28px',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderTop: 'none'
                                        }}
                                    >
                                        <div style={{ padding: '25px 30px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <h4 style={{ color: 'white', margin: 0, fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <History size={16} color="#fbbf24" /> Payment History
                                                </h4>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                                                    Showing latest {v.fastagHistory?.length || 0} transactions
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {v.fastagHistory?.length === 0 ? (
                                                    <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                                                        No history found for this vehicle.
                                                    </div>
                                                ) : (
                                                    v.fastagHistory.map((h, idx) => (
                                                        <div key={idx} style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '120px 100px 1fr 100px',
                                                            padding: '15px 20px',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            borderRadius: '14px',
                                                            alignItems: 'center',
                                                            gap: '20px'
                                                        }}>
                                                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '700' }}>
                                                                {formatDateIST(h.date)}
                                                            </div>
                                                            <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '900' }}>
                                                                +₹ {h.amount}
                                                            </div>
                                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600' }}>
                                                                {h.remarks || 'Wallet Recharge'}
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>
                                                                    {h.method}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>

            {/* Redesigned Recharge Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '480px', padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.8)', background: 'rgba(15, 15, 20, 0.95)', backdropFilter: 'blur(20px)' }}
                        >
                            <div style={{ padding: '30px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                        <Zap color="#fbbf24" size={24} />
                                    </div>
                                    <div>
                                        <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>Wallet Recharge</h2>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>{selectedVehicle ? `For ${selectedVehicle.displayCarNumber}` : 'Global Top-up'}</div>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                            </div>

                            <form onSubmit={handleRecharge} style={{ padding: '30px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {!selectedVehicle && (
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Select Vehicle</label>
                                            <select
                                                required
                                                value={selectedVehicle?._id || ''}
                                                onChange={(e) => setSelectedVehicle(vehicles.find(v => v._id === e.target.value))}
                                                style={{ width: '100%', height: '54px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '0 20px', color: 'white', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                                            >
                                                <option value="" style={{ background: '#0a0a0c' }}>-- Choose Vehicle --</option>
                                                {vehicles.map(v => (
                                                    <option key={v._id} value={v._id} style={{ background: '#0a0a0c' }}>{v.displayCarNumber} (Bal: ₹{v.fastagBalance})</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Amount (₹)</label>
                                            <input
                                                type="number"
                                                required
                                                placeholder="0.00"
                                                value={rechargeData.amount}
                                                onChange={(e) => setRechargeData({ ...rechargeData, amount: e.target.value })}
                                                style={{ width: '100%', height: '54px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '0 20px', color: 'white', fontSize: '18px', fontWeight: '900', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Payment Mode</label>
                                            <select
                                                value={rechargeData.method}
                                                onChange={(e) => setRechargeData({ ...rechargeData, method: e.target.value })}
                                                style={{ width: '100%', height: '54px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '0 20px', color: 'white', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                                            >
                                                <option value="UPI" style={{ background: '#0a0a0c' }}>UPI</option>
                                                <option value="Cash" style={{ background: '#0a0a0c' }}>Cash</option>
                                                <option value="Bank" style={{ background: '#0a0a0c' }}>Bank Transfer</option>
                                                <option value="Card" style={{ background: '#0a0a0c' }}>Debit/Credit Card</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Transaction Date</label>
                                        <div style={{ position: 'relative' }}>
                                            <Calendar size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                            <input
                                                type="date"
                                                required
                                                value={rechargeData.date}
                                                onChange={(e) => setRechargeData({ ...rechargeData, date: e.target.value })}
                                                style={{ width: '100%', height: '54px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '0 20px 0 55px', color: 'white', fontSize: '14px', fontWeight: '600', outline: 'none', colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Notes / Transaction ID</label>
                                        <input
                                            type="text"
                                            placeholder="Optional remarks"
                                            value={rechargeData.remarks}
                                            onChange={(e) => setRechargeData({ ...rechargeData, remarks: e.target.value })}
                                            style={{ width: '100%', height: '54px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '0 20px', color: 'white', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                                        />
                                    </div>

                                    {message.text && (
                                        <div style={{ padding: '15px', borderRadius: '16px', fontSize: '13px', fontWeight: '700', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: message.type === 'success' ? '#10b981' : '#f43f5e', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                            {message.text}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', border: 'none', borderRadius: '18px', height: '60px', marginTop: '30px', fontWeight: '900', fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', letterSpacing: '0.5px', boxShadow: '0 10px 25px -5px rgba(251, 191, 36, 0.4)' }}
                                >
                                    {submitting ? 'PROCESSING...' : 'CONFIRM RECHARGE'}
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
