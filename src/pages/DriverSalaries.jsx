import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Search, X, DollarSign, Car, ParkingSquare, TrendingDown, Wallet } from 'lucide-react';
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

    useEffect(() => {
        if (selectedCompany) fetchSalaries();
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
                        <DollarSign size={28} color="#10b981" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                            <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Financials</span>
                        </div>
                        <h1 style={{ color: 'white', fontSize: 'clamp(24px,5vw,32px)', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
                            Driver <span className="text-gradient-green">Salaries</span>
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
                </div>
            </header>

            {/* Total Payout Card */}
            <div className="glass-card" style={{ padding: '20px', marginBottom: '30px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.05) 100%)', border: '1px solid rgba(16,185,129,0.2)', display: 'inline-block' }}>
                <p style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(16,185,129,0.8)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Total Net Payable ({new Date(0, month - 1).toLocaleString('default', { month: 'short' })} {year})
                </p>
                <h3 style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>₹ {totalPayout.toLocaleString()}</h3>
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
                                                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>Wage</th>
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
                                                            <td style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>₹{day.wage}</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: 'rgba(255,255,255,0.7)' }}>₹{day.bonuses}</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#10b981', fontWeight: '700' }}>₹{day.total}</td>
                                                        </tr>
                                                    ))}
                                                    {det?.breakdown?.length === 0 && (
                                                        <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No completed duties found this month.</td></tr>
                                                    )}
                                                    {/* Wages Subtotal row */}
                                                    {det?.breakdown?.length > 0 && (
                                                        <tr style={{ background: 'rgba(14,165,233,0.05)', borderTop: '1px solid rgba(14,165,233,0.15)' }}>
                                                            <td colSpan="3" style={{ padding: '12px', color: '#38bdf8', fontWeight: '700', fontSize: '12px' }}>Wages Subtotal</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#38bdf8', fontWeight: '900' }}>₹{totalWages.toLocaleString()}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* ─── PARKING SECTION ─── */}
                                        <h3 style={{ fontSize: '14px', color: 'white', marginBottom: '15px', borderLeft: '3px solid #f59e0b', paddingLeft: '10px' }}>
                                            Reimbursable Parking
                                            {parkingTotal > 0 && <span style={{ marginLeft: '10px', color: '#f59e0b', fontWeight: '900' }}>₹{parkingTotal.toLocaleString()}</span>}
                                        </h3>
                                        <div style={{ overflowX: 'auto', marginBottom: '30px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Date</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Location / Remark</th>
                                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)' }}>Source</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', color: 'white' }}>Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {det?.parkingEntries?.length > 0 ? det.parkingEntries.map((p, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                            <td style={{ padding: '12px', color: 'white' }}>{new Date(p.date).toLocaleDateString()}</td>
                                                            <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.location || p.remark || '—'}</td>
                                                            <td style={{ padding: '12px' }}>
                                                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: p.source === 'Driver' ? 'rgba(14,165,233,0.1)' : 'rgba(245,158,11,0.1)', color: p.source === 'Driver' ? '#38bdf8' : '#f59e0b', fontWeight: '700' }}>
                                                                    {p.source || 'Admin'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b', fontWeight: '700' }}>₹{p.amount}</td>
                                                        </tr>
                                                    )) : (
                                                        <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No parking entries this month.</td></tr>
                                                    )}
                                                    {det?.parkingEntries?.length > 0 && (
                                                        <tr style={{ background: 'rgba(245,158,11,0.05)', borderTop: '1px solid rgba(245,158,11,0.15)' }}>
                                                            <td colSpan="3" style={{ padding: '12px', color: '#f59e0b', fontWeight: '700', fontSize: '12px' }}>Parking Subtotal</td>
                                                            <td style={{ padding: '12px', textAlign: 'right', color: '#f59e0b', fontWeight: '900' }}>₹{parkingTotal.toLocaleString()}</td>
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
