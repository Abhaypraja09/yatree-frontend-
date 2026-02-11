import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import {
    Users,
    Car,
    Clock,
    TrendingUp,
    CreditCard,
    X,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Calendar,
    UserCheck,
    Wallet,
    Fuel,
    Wrench,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const StatCard = ({ icon: Icon, label, value, color, loading, trend, onClick }) => (
    <motion.div
        whileHover={{ y: -5, scale: 1.01 }}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`stat-card glass-card ${loading ? 'stale-card' : ''}`}
        style={{
            background: `linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)`,
            border: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
            overflow: 'hidden',
            padding: 'clamp(15px, 2.5vw, 24px)',
            cursor: 'pointer'
        }}
    >
        <div style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '120px',
            height: '120px',
            background: color,
            filter: 'blur(60px)',
            opacity: 0.07,
            pointerEvents: 'none'
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${color}30`,
                color: color,
                boxShadow: `0 8px 16px -4px ${color}20`
            }}>
                <Icon size={20} />
            </div>
            <div>
                <p style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    marginBottom: '4px'
                }}>{label}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <h3 style={{ fontSize: '26px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', margin: 0 }}>
                        {loading ? '...' : value || 0}
                    </h3>
                    {trend && (
                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <TrendingUp size={10} /> LIVE
                        </span>
                    )}
                </div>
            </div>
        </div>
    </motion.div>
);

const AttendanceModal = ({ item, onClose, onApproveReject }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="glass-card modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h2 className="modal-title">Attendance Details</h2>
                    <button onClick={onClose} className="modal-close-btn">
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-grid-2">
                    {/* Punch In */}
                    <div>
                        <h3 className="modal-section-title" style={{ color: '#10b981', borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>
                            Duty Started
                        </h3>
                        <div className="photo-grid">
                            <div>
                                <p className="photo-label">SELFIE</p>
                                <img
                                    src={item.punchIn?.selfie}
                                    alt="Start Duty Selfie"
                                    className="photo-thumbnail"
                                    loading="lazy"
                                />
                            </div>
                            <div>
                                <p className="photo-label">KM METER</p>
                                <img
                                    src={item.punchIn?.kmPhoto}
                                    alt="KM Photo"
                                    className="photo-thumbnail"
                                    loading="lazy"
                                />
                            </div>
                            <div>
                                <p className="photo-label">CAR SELFIE</p>
                                <img
                                    src={item.punchIn?.carSelfie}
                                    alt="Car Selfie"
                                    className="photo-thumbnail"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Punch Out */}
                    <div>
                        <h3 className="modal-section-title" style={{ color: '#f43f5e', borderLeft: '4px solid #f43f5e', paddingLeft: '12px' }}>
                            Duty Ended
                        </h3>
                        {item.punchOut?.time ? (
                            <div className="photo-grid">
                                <div>
                                    <p className="photo-label">SELFIE</p>
                                    <img
                                        src={item.punchOut?.selfie}
                                        alt="Duty Ended Selfie"
                                        className="photo-thumbnail"
                                        loading="lazy"
                                    />
                                </div>
                                <div>
                                    <p className="photo-label">KM METER</p>
                                    <img
                                        src={item.punchOut?.kmPhoto}
                                        alt="KM Photo"
                                        className="photo-thumbnail"
                                        loading="lazy"
                                    />
                                </div>
                                <div>
                                    <p className="photo-label">CAR SELFIE</p>
                                    <img
                                        src={item.punchOut?.carSelfie}
                                        alt="Car Selfie"
                                        className="photo-thumbnail"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                height: 'clamp(70px, 16vw, 85px)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'var(--text-muted)',
                                border: '1px dashed rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.02)'
                            }}>
                                <Clock size={20} />
                                <p style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', margin: 0, fontWeight: '600' }}>
                                    On Trip...
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expenditure Section removed as per user request */}

                {/* Remarks Section */}
                {item.punchOut?.remarks && (
                    <div className="glass-card" style={{
                        marginTop: 'clamp(18px, 4vw, 20px)',
                        padding: 'clamp(12px, 2.5vw, 15px)',
                        border: '1px solid rgba(255,255,255,0.03)'
                    }}>
                        <p style={{
                            fontSize: 'clamp(9px, 2.2vw, 10px)',
                            color: 'var(--text-muted)',
                            marginBottom: '8px',
                            fontWeight: '800'
                        }}>
                            REMARKS
                        </p>
                        <p style={{
                            color: 'white',
                            fontSize: 'clamp(12px, 2.8vw, 13px)',
                            lineHeight: '1.6',
                            margin: 0,
                            fontStyle: 'italic'
                        }}>
                            "{item.punchOut.remarks}"
                        </p>
                    </div>
                )}

                {/* Issues Section */}
                {item.punchOut?.otherRemarks && (
                    <div className="glass-card" style={{
                        marginTop: 'clamp(12px, 2.5vw, 15px)',
                        padding: 'clamp(12px, 2.5vw, 15px)',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        background: 'rgba(244, 63, 94, 0.05)'
                    }}>
                        <p style={{
                            fontSize: 'clamp(9px, 2.2vw, 10px)',
                            color: '#f43f5e',
                            marginBottom: '8px',
                            fontWeight: '800'
                        }}>
                            ISSUES / MAINTENANCE
                        </p>
                        <p style={{
                            color: 'white',
                            fontSize: 'clamp(12px, 2.8vw, 13px)',
                            lineHeight: '1.6',
                            margin: 0
                        }}>
                            {item.punchOut.otherRemarks}
                        </p>
                    </div>
                )}

                {item.pendingExpenses && item.pendingExpenses.length > 0 && (
                    <div style={{ marginTop: 'clamp(18px, 4vw, 25px)' }}>
                        <h3 className="modal-section-title" style={{ color: '#f59e0b', borderLeft: '4px solid #f59e0b', paddingLeft: '12px' }}>
                            Awaiting Slips
                        </h3>
                        <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                            {item.pendingExpenses.map((exp, idx) => (
                                <div key={exp._id} className="glass-card" style={{
                                    padding: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            cursor: exp.slipPhoto ? 'pointer' : 'default',
                                            background: 'rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }} onClick={() => exp.slipPhoto && window.open(exp.slipPhoto, '_blank')}>
                                            {exp.slipPhoto ? (
                                                <img src={exp.slipPhoto} alt="Slip" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                                            ) : (
                                                <Camera size={20} style={{ opacity: 0.3 }} />
                                            )}
                                        </div>
                                        <div>
                                            <p style={{ color: 'white', fontSize: '14px', fontWeight: '700', margin: 0, textTransform: 'capitalize' }}>
                                                {exp.type} - ₹{exp.amount}
                                            </p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: 0 }}>
                                                {exp.type === 'fuel' ? `${exp.km} KM` : 'Parking Slip'}
                                            </p>
                                        </div>
                                    </div>

                                    {exp.status === 'pending' ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => onApproveReject(item._id, exp._id, 'approved')}
                                                style={{
                                                    background: 'rgba(16, 185, 129, 0.15)',
                                                    color: '#10b981',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                                }}
                                            >
                                                APPROVE
                                            </button>
                                            <button
                                                onClick={() => onApproveReject(item._id, exp._id, 'rejected')}
                                                style={{
                                                    background: 'rgba(244, 63, 94, 0.15)',
                                                    color: '#f43f5e',
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    border: '1px solid rgba(244, 63, 94, 0.2)'
                                                }}
                                            >
                                                REJECT
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            color: exp.status === 'approved' ? '#10b981' : '#f43f5e',
                                            textTransform: 'uppercase',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            background: exp.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'
                                        }}>
                                            {exp.status}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Distance Summary */}
                <div style={{
                    marginTop: 'clamp(18px, 4vw, 25px)',
                    display: 'grid',
                    gap: 'clamp(12px, 2.5vw, 15px)'
                }} className="modal-grid-2">
                    <div className="glass-card" style={{
                        padding: 'clamp(14px, 2.5vw, 15px)',
                        textAlign: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        background: 'rgba(16, 185, 129, 0.05)'
                    }}>
                        <p style={{
                            fontSize: 'clamp(9px, 2.2vw, 10px)',
                            color: '#10b981',
                            fontWeight: '800',
                            marginBottom: '6px'
                        }}>
                            DISTANCE COVERED
                        </p>
                        <h3 style={{
                            color: 'white',
                            margin: 0,
                            fontSize: 'clamp(20px, 4.5vw, 24px)',
                            fontWeight: '800'
                        }}>
                            {item.totalKM} <small style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', opacity: 0.6 }}>KM</small>
                        </h3>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { selectedCompany, selectedDate, setSelectedDate } = useCompany();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const dateInputRef = useRef(null);


    const getTodayLocal = () => {
        return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    useEffect(() => {
        let isCancelled = false;

        const fetchStats = async () => {
            const userInfoRaw = localStorage.getItem('userInfo');
            if (!userInfoRaw || !selectedCompany) return;

            setLoading(true);
            try {
                const userInfo = JSON.parse(userInfoRaw);
                const { data } = await axios.get(`/api/admin/dashboard/${selectedCompany._id}?date=${selectedDate}`, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                if (!isCancelled) setStats(data);
            } catch (err) {
                console.error('Error fetching stats', err);
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };

        fetchStats();

        return () => {
            isCancelled = true;
        };
    }, [selectedCompany, selectedDate]);

    const handleApproveRejectExpense = async (attendanceId, expenseId, status) => {
        try {
            const userInfoRaw = localStorage.getItem('userInfo');
            const userInfo = JSON.parse(userInfoRaw);
            await axios.patch(`/api/admin/attendance/${attendanceId}/expense/${expenseId}`, { status }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            // Refresh stats to show updated status
            const { data } = await axios.get(`/api/admin/dashboard/${selectedCompany._id}?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setStats(data);
            // Also update selectedItem if it's the one we are viewing
            if (selectedItem && selectedItem._id === attendanceId) {
                const updatedItem = data.attendanceDetails.find(a => a._id === attendanceId);
                setSelectedItem(updatedItem);
            }
        } catch (err) {
            console.error('Error processing expense', err);
            alert('Failed to process expense');
        }
    };

    return (
        <div className="container-fluid admin-layout-wrapper" style={{
            padding: 'clamp(12px, 2vw, 20px)',
            maxWidth: '100vw',
            overflow: 'hidden'
        }}>
            <SEO
                title={`${selectedCompany?.name || 'Admin'} Dashboard`}
                description={`Real-time stats and activity for ${selectedCompany?.name || 'your fleet'}.`}
            />

            <div style={{
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, transparent 100%)',
                borderRadius: 'clamp(12px, 3vw, 24px)',
                padding: 'clamp(15px, 3vw, 24px)',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: 'clamp(15px, 3vw, 30px)',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <header style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(15px, 3vw, 20px)',
                    width: '100%'
                }}>
                    <div className="header-logo-section">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                width: ' clamp(44px, 10vw, 56px)',
                                height: 'clamp(44px, 10vw, 56px)',
                                background: 'white',
                                borderRadius: '14px',
                                padding: '8px',
                                boxShadow: '0 12px 24px -6px rgba(0,0,0,0.4)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <img
                                src="/logos/logo.png"
                                alt="Yatree Destination Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </motion.div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Fleet Overview</span>
                            </div>
                            <h1 style={{
                                fontSize: 'clamp(18px, 4.5vw, 24px)',
                                fontWeight: '900',
                                color: 'white',
                                margin: '2px 0 0 0',
                                letterSpacing: '-0.5px'
                            }}>
                                Yatree Destination <span className="hide-mobile">Dashboard</span>
                            </h1>
                        </div>
                    </div>

                    <div style={{ width: '100%' }}>
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.2)',
                            padding: '6px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            width: '100%',
                            flexWrap: 'wrap'
                        }}>
                            <div style={{ display: 'flex', gap: '2px' }}>
                                <button
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() - 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '8px',
                                        background: '#334155',
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <ChevronLeft size={20} strokeWidth={3} />
                                </button>

                                <div
                                    style={{ position: 'relative', flex: 1, cursor: 'pointer' }}
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
                                    <div
                                        style={{
                                            height: '36px',
                                            padding: '0 15px',
                                            background: '#334155',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                            whiteSpace: 'nowrap',
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        <Calendar size={16} color="#ffffff" />
                                        <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700' }}>{formatDate(selectedDate)}</span>
                                    </div>
                                    <input
                                        type="date"
                                        ref={dateInputRef}
                                        value={selectedDate}
                                        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            pointerEvents: 'none'
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        const d = new Date(selectedDate);
                                        d.setDate(d.getDate() + 1);
                                        setSelectedDate(d.toISOString().split('T')[0]);
                                    }}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '8px',
                                        background: '#334155',
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <ChevronRight size={20} strokeWidth={3} />
                                </button>
                            </div>

                            <button
                                onClick={() => setSelectedDate(getTodayLocal())}
                                style={{
                                    padding: '0 12px',
                                    height: '30px',
                                    borderRadius: '8px',
                                    background: selectedDate === getTodayLocal() ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontWeight: '800',
                                    fontSize: '10px',
                                    textTransform: 'uppercase'
                                }}
                            >
                                Today
                            </button>
                        </div>
                    </div>
                </header>
            </div>

            <div style={{ position: 'relative', minHeight: '600px' }}>
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(15, 23, 42, 0.4)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 10,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: '16px',
                                pointerEvents: 'none'
                            }}
                        >
                            <div className="spinner"></div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="dashboard-main-container"
                    >
                        {/* Stats Grid */}
                        <div className="stats-grid" style={{
                            marginBottom: 'clamp(20px, 4vw, 40px)',
                            width: '100%'
                        }}>
                            <StatCard icon={Car} label="FLEET SIZE" value={stats.totalVehicles} color="#0ea5e9" loading={loading} onClick={() => navigate(user?.role === 'Executive' ? '/admin/outside-cars' : '/admin/vehicles')} />
                            <StatCard icon={Users} label="TOTAL DRIVERS" value={stats.totalDrivers} color="#6366f1" loading={loading} onClick={() => navigate(user?.role === 'Executive' ? '/admin/freelancers' : '/admin/drivers')} />
                            {user?.role === 'Admin' && (
                                <>
                                    <StatCard icon={CreditCard} label="FASTAG BALANCE" value={`₹${stats.totalFastagBalance?.toLocaleString() || 0}`} color="#10b981" loading={loading} onClick={() => navigate('/admin/fastag')} />
                                    <StatCard icon={Wallet} label="DRIVER ADVANCES" value={`₹${stats.totalAdvancePending?.toLocaleString() || 0}`} color="#f43f5e" loading={loading} onClick={() => navigate('/admin/advances')} />
                                    <StatCard icon={Fuel} label="FUEL (MONTHLY)" value={`₹${stats.monthlyFuelAmount?.toLocaleString() || 0}`} color="#0ea5e9" loading={loading} onClick={() => navigate('/admin/fuel')} />
                                </>
                            )}
                            <StatCard icon={Wrench} label="MAINTENANCE (MONTHLY)" value={`₹${stats.monthlyMaintenanceAmount?.toLocaleString() || 0}`} color="#f59e0b" loading={loading} onClick={() => navigate('/admin/maintenance')} />
                            <StatCard icon={Clock} label="ON ACTIVE DUTY" value={stats.countPunchIns} color="#8b5cf6" loading={loading} trend={true} onClick={() => navigate('/admin/reports')} />
                            <StatCard icon={TrendingUp} label="DUTY CONCLUDED" value={stats.countPunchOuts} color="#f59e0b" loading={loading} onClick={() => navigate('/admin/reports')} />
                            {user?.role === 'Admin' && (
                                <>
                                    <StatCard icon={Briefcase} label="TOTAL STAFF" value={stats.totalStaff} color="#8b5cf6" loading={loading} onClick={() => navigate('/admin/staff')} />
                                    <StatCard icon={UserCheck} label="STAFF PRESENT" value={stats.countStaffPresent} color="#10b981" loading={loading} onClick={() => navigate('/admin/staff')} />
                                </>
                            )}
                        </div>

                        {/* Expiry Alerts */}
                        {stats.expiringAlerts && stats.expiringAlerts.length > 0 && (
                            <div className="glass-card" style={{
                                border: '1px solid rgba(244, 63, 94, 0.2)',
                                background: 'linear-gradient(145deg, rgba(244, 63, 94, 0.05), rgba(15, 23, 42, 0.2))',
                                marginBottom: 'clamp(20px, 4vw, 30px)',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginBottom: 'clamp(16px, 3.5vw, 20px)',
                                    flexWrap: 'wrap'
                                }}>
                                    <ShieldAlert color="#f43f5e" size={20} />
                                    <h3 style={{
                                        fontSize: 'clamp(13px, 3.2vw, 16px)',
                                        fontWeight: '700',
                                        color: 'white',
                                        margin: 0,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Expiry Alerts (Within 30 Days)
                                    </h3>
                                </div>
                                <div className="expiry-alerts-grid">
                                    {stats.expiringAlerts.map((alert, index) => (
                                        <div
                                            key={index}
                                            className="alert-card glass-card-hover-effect"
                                            style={{
                                                background: alert.status === 'Expired'
                                                    ? 'rgba(244, 63, 94, 0.1)'
                                                    : 'rgba(245, 158, 11, 0.1)',
                                                border: `1px solid ${alert.status === 'Expired'
                                                    ? 'rgba(244, 63, 94, 0.2)'
                                                    : 'rgba(245, 158, 11, 0.2)'}`,
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: '10px',
                                                gap: '8px'
                                            }}>
                                                <span className="alert-identifier" style={{
                                                    color: 'rgba(255,255,255,0.9)',
                                                    textTransform: 'uppercase',
                                                    flex: 1,
                                                    fontWeight: '700'
                                                }}>
                                                    {alert.identifier}
                                                </span>
                                                <span style={{
                                                    fontSize: 'clamp(9px, 2vw, 10px)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    background: alert.daysLeft < 0
                                                        ? '#f43f5e'
                                                        : (alert.daysLeft === 0 ? '#0ea5e9' : '#f59e0b'),
                                                    color: 'white',
                                                    fontWeight: '800',
                                                    flexShrink: 0,
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                                }}>
                                                    {alert.daysLeft < 0
                                                        ? `${Math.abs(alert.daysLeft)}d Ago`
                                                        : (alert.daysLeft === 0 ? 'Today' : `${alert.daysLeft}d Left`)}
                                                </span>
                                            </div>
                                            <div className="alert-type" style={{ color: 'white', marginBottom: '8px' }}>
                                                {alert.documentType}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-end',
                                                flexWrap: 'wrap',
                                                gap: '8px'
                                            }}>
                                                <div className="alert-date" style={{
                                                    color: 'rgba(255,255,255,0.6)',
                                                    fontWeight: '500',
                                                    fontSize: 'clamp(10px, 2.5vw, 12px)'
                                                }}>
                                                    Exp: <span style={{ color: 'white', fontWeight: '700' }}>
                                                        {new Date(alert.expiryDate).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <a
                                                    href={`https://wa.me/916367466426?text=${encodeURIComponent(`REMINDER: Vehicle document for ${alert.identifier} (${alert.documentType}) is expiring on ${new Date(alert.expiryDate).toLocaleDateString()}. Please renew it ASAP.`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        background: 'rgba(37, 211, 102, 0.2)',
                                                        color: '#25D366',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: 'clamp(9px, 2.2vw, 10px)',
                                                        fontWeight: '800',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        textDecoration: 'none',
                                                        border: '1px solid rgba(37, 211, 102, 0.3)'
                                                    }}
                                                    title="Send WhatsApp Reminder"
                                                >
                                                    <span style={{ fontSize: '14px' }}>💬</span> WA
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activity Feed - Responsive */}
                        <div className="glass-card" style={{
                            border: '1px solid rgba(255,255,255,0.05)',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'clamp(16px, 3.5vw, 20px)',
                                flexWrap: 'wrap',
                                gap: '10px',
                            }}>
                                <h3 style={{
                                    fontSize: 'clamp(14px, 3.2vw, 16px)',
                                    fontWeight: '700',
                                    color: 'white',
                                    margin: 0
                                }}>
                                    Activity Feed
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        background: '#10b981',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 10px #10b981'
                                    }}></span>
                                    <span style={{
                                        fontSize: 'clamp(9px, 2.2vw, 11px)',
                                        color: 'var(--text-muted)',
                                        fontWeight: '600',
                                        letterSpacing: '0.5px'
                                    }}>
                                        LIVE UPDATES
                                    </span>
                                </div>
                            </div>

                            {/* Desktop/Tablet Table View */}
                            <div className="activity-table-wrapper hide-mobile">
                                <table className="activity-table">
                                    <thead>
                                        <tr>
                                            <th>Driver Details</th>
                                            <th>Assigned Car</th>
                                            <th>Trip Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.attendanceDetails?.map((item) => (
                                            <tr key={item._id} className="hover-row">
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div>
                                                            <div className="driver-name" style={{ fontWeight: '800', color: 'white' }}>{item.driver?.name}</div>
                                                            <div className="driver-mobile" style={{ fontSize: '11px', opacity: 0.6 }}>{item.driver?.mobile}</div>
                                                        </div>

                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="vehicle-badge">
                                                        {item.vehicle?.carNumber}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="status-pill staff-badge" style={{
                                                        background: item.status === 'completed'
                                                            ? 'rgba(16, 185, 129, 0.1)'
                                                            : 'rgba(56, 189, 248, 0.1)',
                                                        color: item.status === 'completed' ? '#10b981' : '#38bdf8',
                                                        border: `1px solid ${item.status === 'completed'
                                                            ? 'rgba(16, 185, 129, 0.2)'
                                                            : 'rgba(56, 189, 248, 0.2)'}`,
                                                        fontWeight: '800',
                                                        textTransform: 'uppercase',
                                                        fontSize: '10px',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        {item.status === 'completed' ? 'Duty Concluded' : 'On Active Duty'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="action-button glass-card-hover-effect"
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!stats.attendanceDetails || stats.attendanceDetails.length === 0) && (
                                            <tr>
                                                <td colSpan="4" style={{
                                                    padding: 'clamp(40px, 10vw, 60px) clamp(16px, 4vw, 25px)',
                                                    textAlign: 'center',
                                                    color: 'var(--text-muted)'
                                                }}>
                                                    <Users size={32} style={{ opacity: 0.15, marginBottom: '12px' }} />
                                                    <p style={{ fontSize: 'clamp(12px, 2.8vw, 14px)', margin: 0 }}>
                                                        No activity recorded for this date
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="show-mobile">
                                {(!stats.attendanceDetails || stats.attendanceDetails.length === 0) ? (
                                    <div className="glass-card" style={{
                                        padding: '40px 20px',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)'
                                    }}>
                                        <Users size={32} style={{ opacity: 0.15, marginBottom: '12px', margin: '0 auto' }} />
                                        <p style={{ fontSize: '14px', margin: 0 }}>
                                            No activity recorded for this date
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '15px' }}>
                                        {stats.attendanceDetails.map((item) => (
                                            <div key={item._id} className="glass-card" style={{
                                                padding: '15px',
                                                border: '1px solid rgba(255,255,255,0.08)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(56, 189, 248, 0.1)',
                                                            color: '#38bdf8',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            <Users size={20} />
                                                        </div>
                                                        <div>
                                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '15px', lineHeight: '1.2' }}>{item.driver?.name}</div>
                                                            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>{item.vehicle?.carNumber}</div>
                                                        </div>
                                                    </div>
                                                    <span className="status-pill" style={{
                                                        background: item.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                                                        color: item.status === 'completed' ? '#10b981' : '#38bdf8',
                                                        border: `1px solid ${item.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)'}`,
                                                        fontSize: '10px',
                                                        padding: '4px 8px',
                                                        fontWeight: '800'
                                                    }}>
                                                        {item.status === 'completed' ? 'DONE' : 'ACTIVE'}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                    {item.driverPendingAdvance > 0 ? (
                                                        <div style={{
                                                            color: '#f43f5e',
                                                            background: 'rgba(244, 63, 94, 0.1)',
                                                            padding: '4px 10px',
                                                            borderRadius: '8px',
                                                            fontSize: '11px',
                                                            fontWeight: '800',
                                                            border: '1px solid rgba(244, 63, 94, 0.2)'
                                                        }}>
                                                            ADV: ₹{item.driverPendingAdvance}
                                                        </div>
                                                    ) : <span></span>}

                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        style={{
                                                            background: 'rgba(14, 165, 233, 0.1)',
                                                            color: '#0ea5e9',
                                                            border: '1px solid rgba(14, 165, 233, 0.2)',
                                                            padding: '8px 20px',
                                                            borderRadius: '10px',
                                                            fontSize: '12px',
                                                            fontWeight: '800',
                                                            letterSpacing: '0.5px'
                                                        }}
                                                    >
                                                        VIEW DETAILS
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
                <AnimatePresence>
                    {selectedItem && (
                        <AttendanceModal
                            item={selectedItem}
                            onClose={() => setSelectedItem(null)}
                            onApproveReject={handleApproveRejectExpense}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminDashboard;