import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Search, CreditCard, Plus, X, CheckCircle, AlertCircle, Download, History, Zap, Car, Filter, ArrowUpRight, ArrowDownLeft, ChevronDown, Calendar as CalendarIcon, ChevronRight, Wallet } from 'lucide-react';
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
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

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
                    {(() => {
                        const totalCompanyMonth = vehicles.reduce((sum, v) => {
                            const monthTotal = (v.fastagHistory || []).filter(h => {
                                const d = nowIST(h.date);
                                return d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear;
                            }).reduce((s, h) => s + (Number(h.amount) || 0), 0);
                            return sum + monthTotal;
                        }, 0);
                        return (
                            <div style={{
                                padding: '15px 30px',
                                background: 'rgba(251, 191, 36, 0.05)',
                                border: '1px solid rgba(251, 191, 36, 0.15)',
                                borderRadius: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                textAlign: 'right',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <span style={{ fontSize: '10px', color: 'rgba(251, 191, 36, 0.5)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>{months[selectedMonth]} Total Spent</span>
                                <span style={{ fontSize: '26px', fontWeight: '900', color: '#fbbf24', textShadow: '0 0 20px rgba(251, 191, 36, 0.2)' }}>₹ {totalCompanyMonth.toLocaleString()}</span>
                            </div>
                        );
                    })()}

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
                        <Plus size={18} />
                        New Recharge
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
                border: '1px solid rgba(255,255,255,0.05)',
                flexWrap: 'wrap'
            }}>
                <div style={{ position: 'relative', flex: 1.5, minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input
                        type="text"
                        placeholder="Search by vehicle number or model..."
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

                <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '250px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                height: '56px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '16px',
                                padding: '0 20px',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: '700',
                                outline: 'none',
                                appearance: 'none',
                                textAlign: 'center'
                            }}
                        >
                            {months.map((m, idx) => <option key={m} value={idx} style={{ background: '#111', color: 'white' }}>{m}</option>)}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    </div>

                    <div style={{ position: 'relative', flex: 0.8 }}>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                height: '56px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '16px',
                                padding: '0 20px',
                                color: 'white',
                                fontSize: '15px',
                                fontWeight: '700',
                                outline: 'none',
                                appearance: 'none',
                                textAlign: 'center'
                            }}
                        >
                            {years.map(y => <option key={y} value={y} style={{ background: '#111', color: 'white' }}>{y}</option>)}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                    </div>
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
                    filteredVehicles.map(v => {
                        const monthUsage = (v.fastagHistory || []).filter(h => {
                            const d = nowIST(h.date);
                            return d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear;
                        }).reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

                        return (
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
                                        gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr) minmax(150px, 1fr) auto',
                                        alignItems: 'center',
                                        gap: '20px',
                                        transition: 'all 0.3s ease'
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
                                            <Zap size={12} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.5))' }} />
                                            <span style={{ fontSize: '10px', color: 'rgba(251, 191, 36, 0.6)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{months[selectedMonth]} Added</span>
                                        </div>
                                        <span style={{
                                            fontSize: '28px',
                                            fontWeight: '950',
                                            color: monthUsage > 0 ? 'white' : 'rgba(255,255,255,0.05)',
                                            letterSpacing: '-1px'
                                        }}>
                                            ₹ {monthUsage.toLocaleString()}
                                        </span>
                                    </div>

                                    <div style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'right' }}>
                                        <ChevronRight size={24} style={{ transform: expandedVehicle === v._id ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
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
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <div style={{ display: 'flex', gap: '30px' }}>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Current Wallet Balance</div>
                                                            <div style={{ fontSize: '18px', fontWeight: '900', color: (v.fastagBalance || 0) < 500 ? '#f43f5e' : '#10b981' }}>₹ {(v.fastagBalance || 0).toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Transactions ({months[selectedMonth]})</div>
                                                            <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>{(v.fastagHistory || []).filter(h => {
                                                                const d = nowIST(h.date);
                                                                return d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear;
                                                            }).length}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedVehicle(v); setShowModal(true); }}
                                                        style={{
                                                            padding: '10px 20px',
                                                            background: 'rgba(251, 191, 36, 0.1)',
                                                            color: '#fbbf24',
                                                            border: '1px solid rgba(251, 191, 36, 0.2)',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: '800',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}
                                                    >
                                                        <Plus size={14} /> RECHARGE WALLET
                                                    </button>
                                                </div>

                                                <h4 style={{ color: 'rgba(255,255,255,0.4)', margin: '0 0 15px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    Payment History
                                                </h4>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {(() => {
                                                    const filteredHistory = (v.fastagHistory || []).filter(h => {
                                                        const d = nowIST(h.date);
                                                        return d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear;
                                                    });

                                                    if (filteredHistory.length === 0) {
                                                        return (
                                                            <div style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                                                                No history found for {months[selectedMonth]} {selectedYear}.
                                                            </div>
                                                        );
                                                    }

                                                    return filteredHistory.map((h, idx) => (
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
                                                    ));
                                                })()}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Premium Recharge Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{ 
                                width: '100%', 
                                maxWidth: '520px', 
                                background: '#0a0a0c', 
                                borderRadius: '32px', 
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 50px 100px -25px rgba(0,0,0,1)',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{ position: 'relative', padding: '40px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), transparent)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{ 
                                            width: '60px', 
                                            height: '60px', 
                                            borderRadius: '18px', 
                                            background: 'rgba(251, 191, 36, 0.1)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            border: '1px solid rgba(251, 191, 36, 0.15)',
                                            boxShadow: '0 0 30px rgba(251, 191, 36, 0.1)'
                                        }}>
                                            <Zap color="#fbbf24" size={28} style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.5))' }} />
                                        </div>
                                        <div>
                                            <h2 style={{ color: 'white', margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '-1px' }}>Initialize Recharge</h2>
                                            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                {selectedVehicle ? `Vehicle: ${selectedVehicle.displayCarNumber}` : 'New Fleet Transaction'}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowModal(false)}
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                                    >
                                        <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleRecharge} style={{ padding: '40px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                    
                                    {!selectedVehicle && (
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Target Vehicle</label>
                                            <select
                                                required
                                                value={selectedVehicle?._id || ''}
                                                onChange={(e) => setSelectedVehicle(vehicles.find(v => v._id === e.target.value))}
                                                style={{ width: '100%', height: '58px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '0 20px', color: 'white', fontSize: '15px', fontWeight: '800', outline: 'none', appearance: 'none' }}
                                            >
                                                <option value="" style={{ background: '#0a0a0c' }}>Search or select vehicle...</option>
                                                {vehicles.map(v => (
                                                    <option key={v._id} value={v._id} style={{ background: '#0a0a0c' }}>{v.displayCarNumber} - {v.model}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Top-up Amount</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24', fontWeight: '900', fontSize: '20px' }}>₹</span>
                                                <input
                                                    type="number"
                                                    required
                                                    placeholder="0.00"
                                                    value={rechargeData.amount}
                                                    onChange={(e) => setRechargeData({ ...rechargeData, amount: e.target.value })}
                                                    style={{ width: '100%', height: '58px', background: 'rgba(251, 191, 36, 0.03)', border: '1px solid rgba(251, 191, 36, 0.15)', borderRadius: '18px', padding: '0 20px 0 45px', color: 'white', fontSize: '22px', fontWeight: '950', outline: 'none' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Payment via</label>
                                            <select
                                                value={rechargeData.method}
                                                onChange={(e) => setRechargeData({ ...rechargeData, method: e.target.value })}
                                                style={{ width: '100%', height: '58px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '0 20px', color: 'white', fontSize: '15px', fontWeight: '800', outline: 'none', appearance: 'none' }}
                                            >
                                                <option value="UPI" style={{ background: '#0a0a0c' }}>Instant UPI</option>
                                                <option value="Cash" style={{ background: '#0a0a0c' }}>Hand Cash</option>
                                                <option value="Bank" style={{ background: '#0a0a0c' }}>Bank Transfer</option>
                                                <option value="Card" style={{ background: '#0a0a0c' }}>Corporate Card</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Transaction Date</label>
                                        <div style={{ position: 'relative' }}>
                                            <CalendarIcon size={18} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                            <input
                                                type="date"
                                                required
                                                value={rechargeData.date}
                                                onChange={(e) => setRechargeData({ ...rechargeData, date: e.target.value })}
                                                style={{ width: '100%', height: '58px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '0 20px 0 55px', color: 'white', fontSize: '15px', fontWeight: '800', outline: 'none', colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Remarks (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Monthly top-up, Trip #402..."
                                            value={rechargeData.remarks}
                                            onChange={(e) => setRechargeData({ ...rechargeData, remarks: e.target.value })}
                                            style={{ width: '100%', height: '58px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '0 20px', color: 'white', fontSize: '15px', fontWeight: '700', outline: 'none' }}
                                        />
                                    </div>

                                    {message.text && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            style={{ padding: '15px 20px', borderRadius: '16px', fontSize: '13px', fontWeight: '800', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: message.type === 'success' ? '#10b981' : '#f43f5e', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '12px' }}
                                        >
                                            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                            {message.text}
                                        </motion.div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ 
                                        width: '100%', 
                                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                                        color: '#000', 
                                        border: 'none', 
                                        borderRadius: '20px', 
                                        height: '65px', 
                                        marginTop: '40px', 
                                        fontWeight: '950', 
                                        fontSize: '16px', 
                                        cursor: submitting ? 'not-allowed' : 'pointer', 
                                        letterSpacing: '0.5px', 
                                        boxShadow: '0 15px 35px -10px rgba(251, 191, 36, 0.5)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onMouseEnter={e => { if(!submitting) e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)'; }}
                                    onMouseLeave={e => { if(!submitting) e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
                                >
                                    {submitting ? 'VALIDATING...' : 'AUTHORIZE RECHARGE'}
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
