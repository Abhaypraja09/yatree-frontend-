import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Search, Plus, X, CheckCircle, AlertCircle, IndianRupee, Calendar, User, FileText, Filter } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

const Advances = () => {
    const { selectedCompany } = useCompany();
    const [advances, setAdvances] = useState([]);
    const [salarySummary, setSalarySummary] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Add Advance Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        driverId: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        remark: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (selectedCompany) {
            fetchData();
        }
    }, [selectedCompany, selectedMonth, selectedYear]);

    const fetchData = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            // Fetch drivers for the dropdown
            const [driversRes, advancesRes, salaryRes] = await Promise.all([
                axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false&isFreelancer=false`),
                axios.get(`/api/admin/advances/${selectedCompany._id}?month=${selectedMonth}&year=${selectedYear}&isFreelancer=false`),
                axios.get(`/api/admin/salary-summary/${selectedCompany._id}?month=${selectedMonth}&year=${selectedYear}`)
            ]);

            setDrivers(driversRes.data.drivers || []);
            setAdvances(Array.isArray(advancesRes.data) ? advancesRes.data : []);
            setSalarySummary(Array.isArray(salaryRes.data) ? salaryRes.data : []);

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdvance = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            await axios.post('/api/admin/advances', {
                ...formData,
                companyId: selectedCompany._id
            });

            setMessage({ type: 'success', text: 'Advance recorded successfully!' });
            setTimeout(() => {
                setShowModal(false);
                setFormData({
                    driverId: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    remark: ''
                });
                setMessage({ type: '', text: '' });
                fetchData();
            }, 1500);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to record advance' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this advance record?')) return;

        try {
            await axios.delete(`/api/admin/advances/${id}`);
            fetchData();
            // Show toast or message if you have a toast component
        } catch (err) {
            console.error('Failed to delete advance:', err);
            alert('Failed to delete advance record');
        }
    };

    const filtered = advances.filter(a => {
        const matchesSearch = (a.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.remark?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'All' || a.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalAdvanceAmount = advances.reduce((sum, a) => sum + (a.amount || 0), 0);
    const recoveredAmount = advances.reduce((sum, a) => sum + (a.recoveredAmount || 0), 0);
    const pendingAmount = totalAdvanceAmount - recoveredAmount;

    return (
        <div className="container-fluid" style={{ paddingBottom: '60px' }}>
            <SEO title="Driver Advances" description="Manage and track advances given to drivers and their recovery status." />

            <header style={{ paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                <div className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
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
                            <IndianRupee size={28} color="#fbbf24" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                                <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Financial Oversight</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(24px,5vw,32px)', fontWeight: '900', margin: 0, letterSpacing: '-1px', cursor: 'pointer' }}>
                                Cash <span className="text-gradient-yellow">Advances</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex-resp" style={{ gap: '12px' }}>
                        <div className="glass-card" style={{ padding: '15px 25px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>Total</span>
                            <span style={{ color: 'white', fontSize: '20px', fontWeight: '900' }}>₹{totalAdvanceAmount.toLocaleString()}</span>
                        </div>
                        <div className="glass-card" style={{ padding: '15px 25px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase' }}>Advance Payment</span>
                            <span style={{ color: 'white', fontSize: '20px', fontWeight: '900' }}>₹{pendingAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-resp" style={{ marginTop: '40px', gap: '15px' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: 'min(100%, 300px)' }}>
                        <Search size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        <input
                            type="text"
                            placeholder="Search drivers or remarks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '50px', height: '50px', borderRadius: '15px' }}
                        />
                    </div>

                    <div className="flex-resp" style={{ width: 'auto', gap: '10px' }}>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="input-field"
                            style={{ height: '50px', width: '130px', borderRadius: '15px' }}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1} style={{ background: '#0f172a' }}>
                                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="input-field"
                            style={{ height: '50px', width: '110px', borderRadius: '15px' }}
                        >
                            {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - 2 + i;
                                return <option key={year} value={year} style={{ background: '#0f172a' }}>{year}</option>;
                            })}
                        </select>                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary"
                            style={{ height: '50px', padding: '0 20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', whiteSpace: 'nowrap' }}
                        >
                            <Plus size={20} /> <span className="hide-mobile">RECORD ADVANCE</span><span className="show-mobile">RECORD</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Personnel Salary Ledger Section */}
            <section style={{ marginBottom: '60px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                    <div style={{ width: '4px', height: '24px', background: '#fbbf24', borderRadius: '2px' }}></div>
                    <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Personnel <span style={{ color: '#fbbf24' }}>Salary Ledger</span></h2>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '4px 12px', borderRadius: '20px', fontWeight: '800', marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: '1px' }}>Real-time Duty Calculation</span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                    gap: '20px'
                }}>
                    {salarySummary.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', padding: '60px', background: 'rgba(30, 41, 59, 0.2)', borderRadius: '30px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.05)' }}>
                            <IndianRupee size={40} style={{ margin: '0 auto 15px', opacity: 0.2, color: 'var(--text-muted)' }} />
                            <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '600' }}>No salary data available yet. Attendance records are required for calculation.</p>
                        </div>
                    ) : salarySummary.map((s, idx) => (
                        <motion.div
                            key={s.driverId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-card"
                            style={{
                                padding: '30px',
                                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
                                border: '1px solid rgba(255,255,255,0.05)',
                                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '18px' }}>
                                        {s.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0 }}>{s.name}</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px', fontWeight: '600' }}>{s.mobile} • {s.workingDays} Duty Days</p>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '6px 14px', borderRadius: '20px',
                                    background: s.netPayable >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                    color: s.netPayable >= 0 ? '#10b981' : '#f43f5e',
                                    fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', border: `1px solid ${s.netPayable >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                                    letterSpacing: '1px'
                                }}>
                                    {s.netPayable >= 0 ? 'Net Payable' : 'Extra Advance'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Earned Salery</span>
                                    <div style={{ color: 'white', fontSize: '20px', fontWeight: '900', marginTop: '6px' }}>₹{s.totalEarned.toLocaleString()}</div>
                                </div>
                                <div style={{ background: 'rgba(251, 191, 36, 0.04)', padding: '18px', borderRadius: '16px', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                                    <span style={{ fontSize: '10px', color: '#fbbf24', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Advance Balance</span>
                                    <div style={{ color: '#fbbf24', fontSize: '20px', fontWeight: '900', marginTop: '6px' }}>₹{s.pendingAdvance.toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{
                                marginTop: '25px', padding: '20px', borderRadius: '18px',
                                background: s.netPayable >= 0 ? 'rgba(14, 165, 233, 0.1)' : 'rgba(244, 63, 94, 0.12)',
                                border: `1px solid ${s.netPayable >= 0 ? 'rgba(14, 165, 233, 0.2)' : 'rgba(244, 63, 94, 0.25)'}`,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span style={{ color: 'white', fontWeight: '800', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dene Wali Salary</span>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ color: 'white', fontSize: '24px', fontWeight: '1000' }}>₹{Math.abs(s.netPayable).toLocaleString()}</span>
                                    <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Final Settlement</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                <div style={{ width: '4px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}></div>
                <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0 }}>Advance Payment History</h2>
            </div>

            <div className="glass-card hide-mobile" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', padding: '0 10px', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left' }}>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Driver</th>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</th>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Recovered</th>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Remarks</th>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '80px 0' }}>
                                <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>LOADING TRANSACTIONS...</p>
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '120px 0', background: 'rgba(30, 41, 59, 0.2)', borderRadius: '30px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                                <IndianRupee size={60} style={{ margin: '0 auto 20px', opacity: 0.1, color: '#fbbf24' }} />
                                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0 }}>No Advance Records</h3>
                                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Record a new advance to start tracking.</p>
                            </td></tr>
                        ) : filtered.map((advance, idx) => (
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
                                    <div style={{ color: '#10b981', fontWeight: '700' }}>₹ {advance.recoveredAmount?.toLocaleString() || 0}</div>
                                </td>
                                <td style={{ padding: '20px 25px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {advance.remark || '-'}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 25px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                    <button
                                        onClick={() => handleDelete(advance._id)}
                                        style={{
                                            background: 'rgba(244, 63, 94, 0.1)',
                                            color: '#f43f5e',
                                            border: 'none',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        className="hover:bg-red-500/20"
                                    >
                                        <X size={16} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="show-mobile">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                        <p>No advances found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {filtered.map(advance => (
                            <motion.div
                                key={advance._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card"
                                style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '14px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
                                            {advance.driver?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '800', color: 'white', fontSize: '16px' }}>{advance.driver?.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(advance.date).toLocaleDateString('en-IN')}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#fbbf24', fontWeight: '800', fontSize: '16px' }}>₹{advance.amount?.toLocaleString()}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Amount</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', marginBottom: '10px' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Recovered</div>
                                        <div style={{ color: '#10b981', fontWeight: '700', fontSize: '14px' }}>₹{advance.recoveredAmount?.toLocaleString() || 0}</div>
                                    </div>
                                </div>

                                {advance.remark && (
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '10px' }}>
                                        "{advance.remark}"
                                    </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => handleDelete(advance._id)}
                                        style={{
                                            background: 'rgba(244, 63, 94, 0.1)',
                                            color: '#f43f5e',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                    >
                                        <X size={14} /> DELETE
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Advance Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
                        zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                    }}>
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="glass-card"
                            style={{
                                width: '100%', maxWidth: '480px', padding: '40px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '35px' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '24px', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>Record Advance</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px' }}>Issue a new payment advance to a driver.</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="glass-card-hover-effect"
                                    style={{ color: 'white', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                ><X size={20} /></button>
                            </div>


                            <form onSubmit={handleAddAdvance} style={{ display: 'grid', gap: '25px' }}>
                                <div className="input-field-group">
                                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={14} /> Select Driver</label>
                                    <select
                                        className="input-field"
                                        required
                                        value={formData.driverId}
                                        onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                        style={{ height: '54px' }}
                                    >
                                        <option value="" style={{ background: '#0f172a', color: 'white' }}>Select a driver...</option>
                                        {drivers.map(d => (
                                            <option key={d._id} value={d._id} style={{ background: '#0f172a', color: 'white' }}>{d.name} ({d.mobile})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-grid-2">
                                    <div className="input-field-group">
                                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><IndianRupee size={14} /> Amount</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="0"
                                            required
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            style={{ height: '54px' }}
                                        />
                                    </div>
                                    <div className="input-field-group">
                                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> Date</label>
                                        <input
                                            type="date"
                                            className="input-field"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            style={{ height: '54px' }}
                                        />
                                    </div>
                                </div>

                                <div className="input-field-group">
                                    <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={14} /> Remark / Purpose</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Ex: Urgent family need, Fuel advance..."
                                        rows="2"
                                        value={formData.remark}
                                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                                        style={{ resize: 'none', paddingTop: '15px' }}
                                    />
                                </div>

                                {message.text && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px',
                                            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                            color: message.type === 'success' ? '#10b981' : '#f43f5e',
                                            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
                                        }}
                                    >
                                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                        {message.text}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary"
                                    style={{ height: '56px', fontSize: '16px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}
                                >
                                    {submitting ? 'RECORDING...' : 'CONFIRM ADVANCE'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Advances;
