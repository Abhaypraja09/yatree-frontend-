import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Search, X, Car, ParkingSquare, TrendingDown, Wallet, Plus, Calendar, User, FileText, IndianRupee, CheckCircle, AlertCircle, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const DriverSalaries = () => {
    const { selectedCompany } = useCompany();
    const [salaries, setSalaries] = useState([]);
    const [loading, setLoading] = useState(true);

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDriverDetails, setSelectedDriverDetails] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Advances states
    const [advances, setAdvances] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [advanceFormData, setAdvanceFormData] = useState({
        driverId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        remark: ''
    });
    const [submittingAdvance, setSubmittingAdvance] = useState(false);
    const [advanceMessage, setAdvanceMessage] = useState({ type: '', text: '' });
    const [editingAdvanceId, setEditingAdvanceId] = useState(null);

    useEffect(() => {
        if (selectedCompany) {
            fetchSalaries();
            fetchAdvanceData();
        }
    }, [selectedCompany, month, year]);

    const fetchSalaries = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/salary-summary/${selectedCompany._id}?month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setSalaries(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchAdvanceData = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const [advRes, driversRes] = await Promise.all([
                axios.get(`/api/admin/advances/${selectedCompany._id}?month=${month}&year=${year}&isFreelancer=false`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                }),
                axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false&isFreelancer=false`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                })
            ]);
            setAdvances(advRes.data || []);
            setDrivers(driversRes.data.drivers || []);
        } catch (err) { console.error('Error fetching advance data:', err); }
    };

    const handleAddAdvance = async (e) => {
        e.preventDefault();
        setSubmittingAdvance(true);
        setAdvanceMessage({ type: '', text: '' });
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (editingAdvanceId) {
                await axios.put(`/api/admin/advances/${editingAdvanceId}`, {
                    ...advanceFormData,
                    companyId: selectedCompany._id
                }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                setAdvanceMessage({ type: 'success', text: 'Advance updated successfully!' });
            } else {
                await axios.post('/api/admin/advances', {
                    ...advanceFormData,
                    companyId: selectedCompany._id
                }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                setAdvanceMessage({ type: 'success', text: 'Advance recorded successfully!' });
            }

            setTimeout(() => {
                setShowAdvanceModal(false);
                setEditingAdvanceId(null);
                setAdvanceFormData({
                    driverId: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    remark: ''
                });
                setAdvanceMessage({ type: '', text: '' });
                fetchSalaries();
                fetchAdvanceData();
            }, 1500);
        } catch (err) {
            setAdvanceMessage({ type: 'error', text: err.response?.data?.message || 'Operation failed' });
        } finally {
            setSubmittingAdvance(false);
        }
    };

    const handleEditClick = (advance) => {
        setEditingAdvanceId(advance._id);
        setAdvanceFormData({
            driverId: advance.driver?._id || '',
            amount: advance.amount || '',
            date: advance.date ? new Date(advance.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            remark: advance.remark || ''
        });
        setShowAdvanceModal(true);
    };

    const handleDeleteAdvance = async (id) => {
        if (!window.confirm('Are you sure you want to delete this advance record?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/advances/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchSalaries();
            fetchAdvanceData();
        } catch (err) {
            console.error('Failed to delete advance:', err);
            alert('Failed to delete advance record');
        }
    };

    const fetchDriverDetails = async (driverId) => {
        setDetailLoading(true);
        setShowDetailModal(true);
        setSelectedDriverDetails(null);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/salary-details/${driverId}?month=${month}&year=${year}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setSelectedDriverDetails(data);
        } catch (err) {
            console.error(err);
            alert('Error: ' + (err.response?.data?.message || err.message));
            setShowDetailModal(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const filteredSalaries = salaries.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.mobile?.includes(searchTerm)
    );

    const filteredAdvances = advances.filter(a =>
        a.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.remark?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPayout = filteredSalaries.reduce((sum, s) => sum + (s.netPayable || 0), 0);

    // Summary from details
    const det = selectedDriverDetails;
    const driverName = det?.driver?.name || det?.driver?.[0]?.name || '';
    const summary = det?.summary || {};
    const totalWages = summary.totalWages || 0;
    const parkingTotal = summary.parkingTotal || det?.parkingEntries?.reduce((s, p) => s + (Number(p.amount) || 0), 0) || 0;
    const totalAdvances = summary.totalAdvances || det?.advances?.reduce((s, a) => s + (Number(a.amount) || 0), 0) || 0;
    const grandTotal = summary.grandTotal || (totalWages + parkingTotal);
    const netPayable = summary.netPayable || (grandTotal - totalAdvances);

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Driver Payroll" description="View driver salary reports, duty days, and advances." />

            {/* Header */}
            <header className="flex-resp" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', padding: '30px 0', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: 'clamp(40px,10vw,50px)', height: 'clamp(40px,10vw,50px)', background: 'linear-gradient(135deg, white, #f8fafc)', borderRadius: '16px', padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <IndianRupee size={28} color="#fbbf24" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                            <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Payroll System</span>
                        </div>
                        <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', margin: 0, letterSpacing: '-1px', cursor: 'pointer' }}>
                            Driver <span className="text-gradient-yellow">Salaries</span>
                        </h1>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="glass-card"
                        style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', background: '#0f172a', borderRadius: '10px' }}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="glass-card"
                        style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', background: '#0f172a', borderRadius: '10px' }}>
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <div className="glass-card" style={{ padding: '0', display: 'flex', alignItems: 'center', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Search size={18} style={{ margin: '0 15px', color: 'rgba(255,255,255,0.4)' }} />
                        <input type="text" placeholder="Search..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', height: '45px', outline: 'none' }} />
                    </div>
                    <button
                        onClick={() => setShowAdvanceModal(true)}
                        className="btn-primary"
                        style={{ height: '45px', padding: '0 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', whiteSpace: 'nowrap' }}
                    >
                        <Plus size={18} /> RECORD ADVANCE
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div className="glass-card" style={{ flex: '1', minWidth: '200px', padding: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Total Net Payable ({new Date(0, month - 1).toLocaleString('default', { month: 'short' })} {year})
                    </p>
                    <h3 style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>₹ {totalPayout.toLocaleString()}</h3>
                </div>
                <div className="glass-card" style={{ flex: '1', minWidth: '200px', padding: '20px', background: 'linear-gradient(135deg, rgba(244,63,94,0.1) 0%, rgba(244,63,94,0.05) 100%)', border: '1px solid rgba(244,63,94,0.2)' }}>
                    <p style={{ fontSize: '11px', fontWeight: '800', color: '#f43f5e', marginBottom: '4px', textTransform: 'uppercase' }}>
                        Total Advances Issued
                    </p>
                    <h3 style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>₹ {filteredAdvances.reduce((sum, a) => sum + (a.amount || 0), 0).toLocaleString()}</h3>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="glass-card hide-mobile" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', padding: '0 10px', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left' }}>
                            {['Driver', 'Daily Wage', 'Duty Days', 'Total Earnings', 'Advances (This Month)', 'Pending Balance', 'Net Payable'].map(h => (
                                <th key={h} style={{ padding: '15px 25px', color: h === 'Net Payable' ? '#10b981' : 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'white' }}>Loading report...</td></tr>
                            ) : filteredSalaries.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No records found for this period.</td></tr>
                            ) : (
                                filteredSalaries.map((s, idx) => (
                                    <motion.tr key={s.driverId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }} onClick={() => fetchDriverDetails(s.driverId)}
                                        className="glass-card-hover-effect"
                                        style={{ background: 'rgba(30,41,59,0.4)', borderRadius: '12px', cursor: 'pointer' }}>
                                        <td style={{ padding: '20px 25px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                            <div style={{ fontWeight: '700', color: 'white' }}>{s.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.mobile}</div>
                                        </td>
                                        <td style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontFamily: 'monospace' }}>₹ {s.dailyWage}</td>
                                        <td style={{ padding: '20px 25px', color: 'white', fontWeight: '800' }}>{s.workingDays || 0}</td>
                                        <td style={{ padding: '20px 25px', color: '#38bdf8', fontWeight: '700' }}>₹ {s.totalEarned}</td>
                                        <td style={{ padding: '20px 25px', color: '#f43f5e', fontWeight: '700' }}>₹ {s.totalAdvances}</td>
                                        <td style={{ padding: '20px 25px', color: '#f59e0b', fontWeight: '700' }}>₹ {s.pendingAdvance}</td>
                                        <td style={{ padding: '20px 25px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', color: '#10b981', fontWeight: '900', fontSize: '15px' }}>₹ {s.netPayable}</td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Mobile View */}
            <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredSalaries.map(s => (
                    <div key={s.driverId} className="glass-card" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => fetchDriverDetails(s.driverId)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <div>
                                <h3 style={{ margin: 0, color: 'white', fontSize: '16px' }}>{s.name}</h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>{s.mobile}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#10b981' }}>NET PAYABLE</p>
                                <h3 style={{ margin: 0, color: '#10b981', fontSize: '18px' }}>₹ {s.netPayable}</h3>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                            {[['DAILY WAGE', `₹ ${s.dailyWage}`, 'rgba(255,255,255,0.7)'], ['DUTY DAYS', s.workingDays, 'white'], ['TOTAL EARNINGS', `₹ ${s.totalEarned}`, 'white'], ['ADVANCES', `₹ ${s.totalAdvances}`, '#f43f5e']].map(([label, val, color]) => (
                                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '10px' }}>{label}</p>
                                    <p style={{ margin: '4px 0 0', color, fontWeight: '700' }}>{val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Advance Payment History Section */}
            <div style={{ marginTop: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                    <div style={{ width: '4px', height: '24px', background: '#fbbf24', borderRadius: '2px' }}></div>
                    <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Advance <span style={{ color: '#fbbf24' }}>Payment History</span></h2>
                </div>

                <div className="glass-card hide-mobile" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', padding: '0 10px', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left' }}>
                                <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Driver</th>
                                <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                                <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</th>
                                <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Remarks</th>
                                <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdvances.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '120px 0', background: 'rgba(30, 41, 59, 0.2)', borderRadius: '30px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                                    <IndianRupee size={60} style={{ margin: '0 auto 20px', opacity: 0.1, color: '#fbbf24' }} />
                                    <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0 }}>No Advance Records</h3>
                                    <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Record a new advance to start tracking.</p>
                                </td></tr>
                            ) : filteredAdvances.map((advance, idx) => (
                                <motion.tr
                                    key={advance._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className="glass-card-hover-effect"
                                    style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px' }}
                                >
                                    <td style={{ padding: '20px 25px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                                {advance.driver?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: '700' }}>{advance.driver?.name}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{advance.driver?.mobile}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                                            {new Date(advance.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ color: 'white', fontWeight: '800' }}>₹ {advance.amount?.toLocaleString()}</div>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {advance.remark || '-'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(advance); }}
                                                style={{
                                                    background: 'rgba(56, 189, 248, 0.1)',
                                                    color: '#38bdf8',
                                                    border: 'none',
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteAdvance(advance._id); }}
                                                style={{
                                                    background: 'rgba(244, 63, 94, 0.1)',
                                                    color: '#f43f5e',
                                                    border: 'none',
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredAdvances.map(advance => (
                        <div key={advance._id} className="glass-card" style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                        {advance.driver?.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', color: 'white' }}>{advance.driver?.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(advance.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#fbbf24', fontWeight: '800' }}>₹{advance.amount}</div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleEditClick(advance)} style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '10px' }}>Edit</button>
                                        <button onClick={() => handleDeleteAdvance(advance._id)} style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: '10px' }}>Delete</button>
                                    </div>
                                </div>
                            </div>
                            {advance.remark && <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{advance.remark}"</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* RECORD ADVANCE MODAL */}
            <AnimatePresence>
                {showAdvanceModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                            className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '40px', border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                                <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>{editingAdvanceId ? 'Edit Advance' : 'Record Advance'}</h2>
                                <button onClick={() => { setShowAdvanceModal(false); setEditingAdvanceId(null); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>

                            <form onSubmit={handleAddAdvance} style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Select Driver</label>
                                    <select
                                        className="input-field"
                                        required
                                        value={advanceFormData.driverId}
                                        onChange={(e) => setAdvanceFormData({ ...advanceFormData, driverId: e.target.value })}
                                        style={{ width: '100%', height: '50px', background: '#1e293b', color: 'white' }}
                                    >
                                        <option value="" style={{ background: '#1e293b', color: 'white' }}>Choose a driver...</option>
                                        {drivers.map(d => (
                                            <option key={d._id} value={d._id} style={{ background: '#1e293b', color: 'white' }}>
                                                {d.name} ({d.mobile})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Amount</label>
                                        <input type="number" className="input-field" required value={advanceFormData.amount} onChange={(e) => setAdvanceFormData({ ...advanceFormData, amount: e.target.value })} style={{ width: '100%', height: '50px' }} placeholder="₹ 0" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Date</label>
                                        <input type="date" className="input-field" required value={advanceFormData.date} onChange={(e) => setAdvanceFormData({ ...advanceFormData, date: e.target.value })} style={{ width: '100%', height: '50px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>Remark</label>
                                    <textarea className="input-field" value={advanceFormData.remark} onChange={(e) => setAdvanceFormData({ ...advanceFormData, remark: e.target.value })} style={{ width: '100%', padding: '15px' }} rows="2" placeholder="Ex: Fuel advance, Family need..." />
                                </div>

                                {advanceMessage.text && (
                                    <div style={{ padding: '12px', borderRadius: '10px', background: advanceMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: advanceMessage.type === 'success' ? '#10b981' : '#f43f5e', border: `1px solid ${advanceMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`, fontSize: '13px', fontWeight: '700' }}>
                                        {advanceMessage.text}
                                    </div>
                                )}

                                <button type="submit" disabled={submittingAdvance} className="btn-primary" style={{ height: '50px', fontWeight: '900', fontSize: '15px' }}>
                                    {submittingAdvance ? 'PROCESSING...' : (editingAdvanceId ? 'UPDATE ADVANCE' : 'CONFIRM ADVANCE')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* DETAIL MODAL */}
            <AnimatePresence>
                {showDetailModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }} className="glass-card"
                            style={{ padding: '0', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a' }}>

                            {/* Modal Header */}
                            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)', position: 'sticky', top: 0, backdropFilter: 'blur(10px)', zIndex: 5 }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0 }}>Salary Breakdown</h2>
                                    {driverName && <p style={{ color: 'var(--primary)', fontSize: '13px', margin: '4px 0 0', fontWeight: '600' }}>{driverName}</p>}
                                </div>
                                <button onClick={() => setShowDetailModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', border: 'none' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ padding: '20px' }}>
                                {detailLoading ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>Loading details...</div>
                                ) : (
                                    <>
                                        {/* ─── SUMMARY CARDS ─── */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                                            {/* Total Wages */}
                                            <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '12px', padding: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                    <Car size={14} color="#38bdf8" />
                                                    <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>Wages & Bonus</span>
                                                </div>
                                                <div style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>₹{totalWages.toLocaleString()}</div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{summary.workingDays || det?.breakdown?.length || 0} duty days</div>
                                            </div>

                                            {/* Parking Reimbursements */}
                                            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                    <ParkingSquare size={14} color="#f59e0b" />
                                                    <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '800', textTransform: 'uppercase' }}>Parking</span>
                                                </div>
                                                <div style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>₹{parkingTotal.toLocaleString()}</div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{det?.parkingEntries?.length || 0} entries</div>
                                            </div>

                                            {/* Total Earned */}
                                            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                    <Wallet size={14} color="#10b981" />
                                                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase' }}>Total Earned</span>
                                                </div>
                                                <div style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>₹{grandTotal.toLocaleString()}</div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>Wages + Parking</div>
                                            </div>

                                            {/* Advances */}
                                            <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '12px', padding: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                                    <TrendingDown size={14} color="#f43f5e" />
                                                    <span style={{ fontSize: '10px', color: '#f43f5e', fontWeight: '800', textTransform: 'uppercase' }}>Advances</span>
                                                </div>
                                                <div style={{ color: 'white', fontWeight: '900', fontSize: '20px' }}>₹{totalAdvances.toLocaleString()}</div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{det?.advances?.length || 0} taken</div>
                                            </div>
                                        </div>

                                        {/* NET PAYABLE BANNER */}
                                        <div style={{ background: netPayable >= 0 ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' : 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))', border: `1px solid ${netPayable >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: netPayable >= 0 ? '#10b981' : '#f43f5e', textTransform: 'uppercase', marginBottom: '4px' }}>Net Payable This Month</div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>₹{grandTotal.toLocaleString()} earned − ₹{totalAdvances.toLocaleString()} advances</div>
                                            </div>
                                            <div style={{ color: netPayable >= 0 ? '#10b981' : '#f43f5e', fontWeight: '900', fontSize: '26px' }}>₹{Math.abs(netPayable).toLocaleString()}</div>
                                        </div>

                                        {/* ─── DUTY BREAKDOWN TABLE ─── */}
                                        <h3 style={{ fontSize: '14px', color: 'white', marginBottom: '15px', borderLeft: '3px solid #3b82f6', paddingLeft: '10px' }}>Duty Calendar (Earnings)</h3>
                                        <div style={{ overflowX: 'auto', marginBottom: '30px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Date</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>WAGES</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Same Day Return</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Parking</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Night</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Bonus</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', color: 'white' }}>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {det?.breakdown?.map((day, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                            <td style={{ padding: '12px', color: 'white' }}>
                                                                {new Date(day.date).toLocaleDateString()}
                                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{day.type || 'Duty'}</div>
                                                                {day.remarks && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{day.remarks}</div>}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>₹{day.wage || 0}</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#38bdf8', fontWeight: '600' }}>₹{day.sameDayReturn || 0}</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b', fontWeight: '800' }}>₹{day.parking || 0}</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: '600' }}>₹{day.nightStay || 0}</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>₹{day.otherBonuses || 0}</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: '700' }}>₹{(day.total || 0).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {/* Standalone Parking Entries */}
                                                    {det?.parkingEntries?.filter(p => {
                                                        const pDateStr = new Date(p.date).toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split(',')[0];
                                                        return !det?.breakdown?.some(d => d.date === pDateStr);
                                                    }).map((p, idx) => (
                                                        <tr key={`p-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(245,158,11,0.02)' }}>
                                                            <td style={{ padding: '12px', color: 'white' }}>
                                                                {new Date(p.date).toLocaleDateString()}
                                                                <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '800' }}>STANDALONE PARKING</div>
                                                                {p.remark && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{p.remark}</div>}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>-</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>-</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b', fontWeight: '800' }}>₹{p.amount || 0}</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>-</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>-</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: '700' }}>₹{(p.amount || 0).toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                    {det?.breakdown?.length === 0 && (
                                                        <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No completed duties found this month.</td></tr>
                                                    )}
                                                    {/* Wages Subtotal row */}
                                                    {det?.breakdown?.length > 0 && (
                                                        <tr style={{ background: 'rgba(16,185,129,0.05)', borderTop: '2px solid rgba(16,185,129,0.15)' }}>
                                                            <td colSpan="6" style={{ padding: '15px 12px', color: '#10b981', fontWeight: '800', fontSize: '13px', textTransform: 'uppercase' }}>Grand Total (Wages + Parking + Bonuses)</td>
                                                            <td style={{ padding: '15px 12px', textAlign: 'right', color: '#10b981', fontWeight: '900', fontSize: '15px' }}>₹{grandTotal.toLocaleString()}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>



                                        {/* ─── ADVANCES TABLE ─── */}
                                        <h3 style={{ fontSize: '14px', color: 'white', marginBottom: '15px', borderLeft: '3px solid #f43f5e', paddingLeft: '10px' }}>Advances Taken (This Month)</h3>
                                        <div style={{ overflowX: 'auto', marginBottom: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Date</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Reason</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', color: 'white' }}>Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {det?.advances?.map((adv, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                            <td style={{ padding: '12px', color: 'white' }}>{new Date(adv.date).toLocaleDateString()}</td>
                                                            <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{adv.remark}</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#f43f5e', fontWeight: '700' }}>₹{adv.amount}</td>
                                                        </tr>
                                                    ))}
                                                    {det?.advances?.length === 0 && (
                                                        <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No advances taken this month.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverSalaries;
