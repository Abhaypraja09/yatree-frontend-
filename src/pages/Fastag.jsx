import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Search, CreditCard, Plus, X, CheckCircle, AlertCircle, Download, History, Zap, Car, Filter, ArrowUpRight, ArrowDownLeft, ChevronDown, Calendar } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import * as XLSX from 'xlsx-js-style';

const Fastag = () => {
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState([]);
    const [selectedCarFilter, setSelectedCarFilter] = useState('All');

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
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=all`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            const fetchedVehicles = data.vehicles || [];

            // Filter out outside cars and clean up car numbers
            const cleanedVehicles = fetchedVehicles
                .filter(v => v.isOutsideCar !== true)
                .map(v => ({
                    ...v,
                    displayCarNumber: v.carNumber ? v.carNumber.split('#')[0] : 'Unknown'
                }));

            setVehicles(cleanedVehicles);

            // Process History
            const allHistory = cleanedVehicles.flatMap(v =>
                (v.fastagHistory || []).map(h => ({
                    ...h,
                    carNumber: v.displayCarNumber,
                    vehicleId: v._id,
                    // Ensure date is valid for sorting
                    dateObj: new Date(h.date)
                }))
            ).sort((a, b) => b.dateObj - a.dateObj);

            setHistory(allHistory);

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

    const exportHistory = () => {
        const dataToExport = filteredHistory.map(h => ({
            'Date': new Date(h.date).toLocaleDateString('en-GB'),
            'Time': new Date(h.date).toLocaleTimeString('en-GB'),
            'Vehicle': h.carNumber,
            'Amount': h.amount,
            'Method': h.method,
            'Remarks': h.remarks
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fastag History");
        XLSX.writeFile(wb, `Fastag_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const filteredVehicles = vehicles.filter(v =>
        (selectedCarFilter === 'All' || v.displayCarNumber === selectedCarFilter) &&
        (v.displayCarNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.fastagNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredHistory = history.filter(h =>
        (selectedCarFilter === 'All' || h.carNumber === selectedCarFilter) &&
        (h.carNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalFleetBalance = vehicles.reduce((sum, v) => sum + (v.fastagBalance || 0), 0);

    return (
        <div className="container-fluid" style={{ paddingBottom: '80px' }}>
            <SEO title="Fastag Manager" description="Effectively manage fleet Fastag balances and history." />

            {/* Header Section */}
            <header className="flex-resp" style={{
                padding: 'clamp(20px, 3vh, 30px) 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '30px',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div>
                    <h1 className="resp-title" style={{ margin: 0, fontWeight: '900', letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            padding: '10px',
                            borderRadius: '14px',
                            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)'
                        }}>
                            <Zap size={24} color="white" fill="white" />
                        </div>
                        Fastag Manager
                    </h1>
                    <p className="resp-subtitle" style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                        Track balances & recharge company vehicles
                    </p>
                </div>

                <div className="flex-resp" style={{ gap: '15px' }}>
                    <div className="glass-card" style={{
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                        <div>
                            <p style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>Wallet Total</p>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', margin: 0 }}>₹ {totalFleetBalance.toLocaleString()}</h2>
                        </div>
                    </div>

                    <button
                        onClick={() => { setSelectedVehicle(null); setShowModal(true); }}
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '14px 24px',
                            fontSize: '14px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4)'
                        }}
                    >
                        <Plus size={20} strokeWidth={3} /> NEW RECHARGE
                    </button>
                </div>
            </header>

            {/* SECTION 1: Active Vehicles Grid */}
            <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Car size={18} color="var(--primary)" /> Company Fleet Balances
                    </h3>
                    <div style={{ position: 'relative', width: '250px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Find vehicle..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field"
                            style={{
                                paddingLeft: '38px',
                                marginBottom: 0,
                                height: '40px',
                                fontSize: '13px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '10px'
                            }}
                        />
                    </div>
                </div>

                <div className="grid-1-2-3-4" style={{ gap: '15px' }}>
                    {filteredVehicles.length === 0 ? (
                        <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                            No active company vehicles found.
                        </div>
                    ) : (
                        filteredVehicles.map(v => (
                            <motion.div
                                key={v._id}
                                whileHover={{ y: -5 }}
                                className="glass-card"
                                style={{
                                    padding: '20px',
                                    borderLeft: `4px solid ${(v.fastagBalance || 0) < 500 ? '#f43f5e' : '#10b981'}`,
                                    background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'white' }}>{v.displayCarNumber}</h4>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        background: (v.fastagBalance || 0) < 500 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: (v.fastagBalance || 0) < 500 ? '#f43f5e' : '#10b981'
                                    }}>
                                        {(v.fastagBalance || 0) < 500 ? 'LOW' : 'ACTIVE'}
                                    </span>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Current Balance</p>
                                    <p style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: 0 }}>₹ {v.fastagBalance || 0}</p>
                                </div>

                                <button
                                    onClick={() => { setSelectedVehicle(v); setShowModal(true); }}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    <Zap size={14} /> RECHARGE
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* SECTION 2: Transaction History */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <History size={18} color="#f59e0b" /> Transaction History
                    </h3>
                    <button
                        onClick={exportHistory}
                        className="btn-secondary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '11px',
                            fontWeight: '800',
                            padding: '8px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '8px'
                        }}
                    >
                        <Download size={14} /> EXPORT EXCEL
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table" style={{ margin: 0, width: '100%' }}>
                        <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <tr>
                                <th style={{ padding: '20px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Date & Time</th>
                                <th style={{ padding: '20px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Vehicle</th>
                                <th style={{ padding: '20px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Amount</th>
                                <th style={{ padding: '20px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Method</th>
                                <th style={{ padding: '20px', textAlign: 'left', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Loading records...</td></tr>
                            ) : filteredHistory.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>No recharge history found.</td></tr>
                            ) : (
                                filteredHistory.map((h, idx) => (
                                    <tr key={idx} className="hover-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '18px 20px', color: 'white', fontSize: '13px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                                    <Calendar size={14} color="var(--primary)" />
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: '700', display: 'block' }}>{new Date(h.date).toLocaleDateString('en-GB')}</span>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 20px', fontWeight: '700', color: 'white', fontSize: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Car size={14} color="var(--text-muted)" />
                                                {h.carNumber}
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 20px', fontWeight: '800', color: '#10b981', fontSize: '15px' }}>+₹ {h.amount}</td>
                                        <td style={{ padding: '18px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '6px', fontWeight: '600' }}>{h.method}</span>
                                        </td>
                                        <td style={{ padding: '18px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{h.remarks || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recharge Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-card"
                            style={{ width: '90%', maxWidth: '450px', padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                        >
                            <div style={{ padding: '30px', background: 'linear-gradient(135deg, var(--primary), #2563eb)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>Top Up Funds</h2>
                                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: '6px 0 0 0' }}>Recharge Fastag instantly</p>
                                    </div>
                                    <button onClick={() => setShowModal(false)} style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }}><X size={18} /></button>
                                </div>
                            </div>

                            <div style={{ padding: '30px' }}>
                                <form onSubmit={handleRecharge} style={{ display: 'grid', gap: '25px' }}>

                                    {/* Vehicle Selection - Only if not pre-selected */}
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Select Vehicle</label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                className="input-field"
                                                value={selectedVehicle?._id || ''}
                                                onChange={(e) => {
                                                    const vehicle = vehicles.find(v => v._id === e.target.value);
                                                    setSelectedVehicle(vehicle);
                                                }}
                                                style={{ height: '50px', fontWeight: '700', paddingRight: '40px', cursor: 'pointer', appearance: 'none', background: 'rgba(255,255,255,0.05)' }}
                                                required
                                            >
                                                <option value="" disabled style={{ color: '#000' }}>-- Select Vehicle --</option>
                                                {vehicles.filter(v => ((selectedCarFilter === 'All' || !selectedVehicle) ? true : v._id === selectedVehicle._id)).map(v => (
                                                    <option key={v._id} value={v._id} style={{ color: '#000' }}>
                                                        {v.displayCarNumber} (Bal: ₹{v.fastagBalance})
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Recharge Amount (₹)</label>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: '600', color: 'var(--text-muted)' }}>₹</span>
                                            <input
                                                type="number"
                                                className="input-field"
                                                placeholder="0.00"
                                                required
                                                autoFocus
                                                value={rechargeData.amount}
                                                onChange={(e) => setRechargeData({ ...rechargeData, amount: e.target.value })}
                                                style={{ height: '50px', fontSize: '20px', fontWeight: '800', paddingLeft: '35px', background: 'rgba(255,255,255,0.05)' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Payment Method</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. UPI, NetBanking, Card"
                                            value={rechargeData.method}
                                            onChange={(e) => setRechargeData({ ...rechargeData, method: e.target.value })}
                                            style={{ height: '50px', fontWeight: '600', background: 'rgba(255,255,255,0.05)' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Remarks (Optional)</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="Transaction ID, notes, etc."
                                            rows="2"
                                            value={rechargeData.remarks}
                                            onChange={(e) => setRechargeData({ ...rechargeData, remarks: e.target.value })}
                                            style={{ resize: 'none', background: 'rgba(255,255,255,0.05)' }}
                                        />
                                    </div>

                                    {message.text && (
                                        <div style={{
                                            padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                            color: message.type === 'success' ? '#10b981' : '#f43f5e',
                                            display: 'flex', alignItems: 'center', gap: '10px', border: message.type === 'success' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)'
                                        }}>
                                            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                            {message.text}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary"
                                        style={{
                                            height: '54px',
                                            marginTop: '10px',
                                            width: '100%',
                                            fontSize: '15px',
                                            letterSpacing: '0.5px',
                                            background: submitting ? 'var(--text-muted)' : 'linear-gradient(135deg, var(--primary), #2563eb)',
                                            boxShadow: submitting ? 'none' : '0 8px 20px rgba(37, 99, 235, 0.3)'
                                        }}
                                    >
                                        {submitting ? 'PROCESSING RECHARGE...' : 'CONFIRM RECHARGE'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Fastag;
