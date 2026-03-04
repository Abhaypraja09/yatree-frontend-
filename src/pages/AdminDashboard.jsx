import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import {
    Activity, Users, Car, CreditCard, AlertTriangle, ShieldAlert,
    TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Clock,
    ChevronLeft, ChevronRight, Filter, Search, MoreHorizontal,
    Plus, Download, Wrench, Briefcase, Fuel, Calendar, X, IndianRupee, Camera, ShieldCheck, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const StatCard = ({ icon: Icon, label, value, color, loading, trend, onClick }) => (
    <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`stat-card glass-card ${loading ? 'stale-card' : ''}`}
        style={{
            background: `linear-gradient(145deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)`,
            border: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
            overflow: 'hidden',
            padding: 'clamp(15px, 2.5vw, 24px)',
            cursor: 'pointer',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
            borderRadius: '24px'
        }}
    >
        <div style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '140px',
            height: '140px',
            background: color,
            filter: 'blur(70px)',
            opacity: 0.1,
            pointerEvents: 'none'
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', zIndex: 1 }}>
            <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${color}40`,
                color: color,
                boxShadow: `0 8px 16px -4px ${color}30`
            }}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            <div>
                <p style={{
                    fontSize: '10px',
                    fontWeight: '900',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1.8px',
                    marginBottom: '6px'
                }}>{label}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h3 style={{
                        fontSize: 'clamp(22px, 3vw, 28px)',
                        fontWeight: '900',
                        color: 'white',
                        letterSpacing: '-1px',
                        margin: 0,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        {loading ? '...' : value || 0}
                    </h3>
                    {trend && (
                        <span style={{
                            fontSize: '9px',
                            color: '#10b981',
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            fontWeight: '900',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px #10b981' }}></div>
                            LIVE
                        </span>
                    )}
                </div>
            </div>
        </div>
    </motion.div>
);

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { selectedCompany, selectedDate, setSelectedDate } = useCompany();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
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

    const fetchStats = async () => {
        const userInfoRaw = localStorage.getItem('userInfo');
        if (!userInfoRaw || !selectedCompany) return;

        setLoading(true);
        try {
            const userInfo = JSON.parse(userInfoRaw);
            const { data } = await axios.get(`/api/admin/dashboard/${selectedCompany._id}?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [selectedCompany, selectedDate]);

    return (
        <div className="admin-dashboard-container" style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.08) 0%, transparent 60%), radial-gradient(circle at 0% 100%, rgba(99, 102, 241, 0.05) 0%, transparent 40%)',
            minHeight: '100vh',
            padding: 'clamp(15px, 4vw, 40px)',
            color: 'white'
        }}>
            <SEO title="Admin Dashboard" description="Overview of fleet operations, driver attendance, and financial metrics." />

            <style>{`
                .admin-dashboard-container { overflow-x: hidden; }
                .glass-card {
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    box-shadow: 0 10px 30px -5px rgba(0,0,0,0.3);
                }
                .status-pill { border-radius: 20px; letter-spacing: 0.5px; }
                .vehicle-badge { letter-spacing: 0.5px; }
            `}</style>



            <div className="glass-card dashboard-header" style={{
                background: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '32px',
                padding: 'clamp(20px, 4vw, 32px)',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '40px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <header className="mobile-stack" style={{
                    justifyContent: 'space-between',
                    width: '100%'
                }}>
                    <div className="header-logo-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div className="header-logo-container" style={{
                                background: 'linear-gradient(135deg, white, #f8fafc)',
                                borderRadius: '16px',
                                padding: '8px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                            }}>
                                <Shield size={28} color="#fbbf24" />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                                    <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Fleet Control Center</span>
                                </div>
                                <h1 className="header-title" style={{ color: 'white', fontWeight: '900', margin: 0, letterSpacing: '-1.5px' }}>
                                    Executive <span className="text-gradient-yellow">Dashboard</span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="date-selector-wrapper" style={{ flexShrink: 0 }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.4)',
                            padding: '4px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                            <button
                                onClick={() => {
                                    const d = new Date(selectedDate);
                                    d.setDate(d.getDate() - 1);
                                    setSelectedDate(d.toISOString().split('T')[0]);
                                }}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: 'rgba(255,255,255,0.6)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>

                            <div
                                style={{
                                    padding: '0 15px',
                                    height: '36px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    background: 'rgba(251, 191, 36, 0.1)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(251, 191, 36, 0.15)',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Calendar size={15} color="#fbbf24" strokeWidth={2.5} />
                                <span style={{ color: 'white', fontSize: '13px', fontWeight: '900', letterSpacing: '0.5px' }}>
                                    {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                </span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                                    style={{
                                        position: 'absolute',
                                        opacity: 0,
                                        width: '100%',
                                        height: '100%',
                                        left: 0,
                                        top: 0,
                                        cursor: 'pointer',
                                        zIndex: 2,
                                        pointerEvents: 'auto'
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
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: 'rgba(255,255,255,0.6)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ChevronRight size={18} strokeWidth={2.5} />
                            </button>

                            <button
                                onClick={() => setSelectedDate(getTodayLocal())}
                                style={{
                                    marginLeft: '5px',
                                    padding: '0 12px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: selectedDate === getTodayLocal() ? '#fbbf24' : 'rgba(255,255,255,0.05)',
                                    color: selectedDate === getTodayLocal() ? 'black' : 'rgba(255,255,255,0.4)',
                                    fontWeight: '900',
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
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
                        <div className="stats-grid">
                            {/* Row 1 */}
                            <StatCard icon={Users} label="TOTAL DRIVER SALARY" value={`₹${(stats.monthlyRegularSalaryTotal || 0).toLocaleString()}`} color="#fbbf24" loading={loading} onClick={() => navigate('/admin/driver-salaries')} trend="MONTHLY" />
                            <StatCard icon={Fuel} label="FUEL (MONTHLY)" value={`₹${stats.monthlyFuelAmount?.toLocaleString() || 0}`} color="#0ea5e9" loading={loading} onClick={() => navigate('/admin/fuel')} />
                            <StatCard icon={TrendingUp} label="OUTSIDE CARS (MONTHLY)" value={`₹${(stats.monthlyOutsideCarsTotal || 0).toLocaleString()}`} color="#8b5cf6" loading={loading} onClick={() => navigate('/admin/outside-cars')} />
                            <StatCard icon={AlertTriangle} label="TOTAL ACCIDENT COST" value={`₹${(stats.monthlyAccidentAmount || 0).toLocaleString()}`} color="#f43f5e" loading={loading} onClick={() => navigate('/admin/accident-logs')} trend="ALL TIME" />
                            <StatCard icon={IndianRupee} label="TODAY'S FASTAG FEED" value={`₹${stats.dailyFastagTotal?.toLocaleString() || 0}`} color="#fbbf24" loading={loading} onClick={() => navigate('/admin/fastag')} trend="TODAY" />
                            <StatCard icon={CreditCard} label="TODAY'S DRIVER ADVANCE" value={`₹${(stats.dailyAdvanceTotal || 0).toLocaleString()}`} color="#f59e0b" loading={loading} onClick={() => navigate('/admin/driver-salaries')} trend="TODAY" />
                            <StatCard icon={Users} label="FREELANCERS (MONTHLY)" value={`₹${(stats.monthlyFreelancerSalaryTotal || 0).toLocaleString()}`} color="#f59e0b" loading={loading} onClick={() => navigate('/admin/freelancers')} />

                            <StatCard icon={Wrench} label="MAINTENANCE (MONTHLY)" value={`₹${stats.monthlyMaintenanceAmount?.toLocaleString() || 0}`} color="#f43f5e" loading={loading} onClick={() => navigate('/admin/maintenance')} />

                            <StatCard icon={CreditCard} label="PARKING (MONTHLY)" value={`₹${stats.monthlyParkingAmount?.toLocaleString() || 0}`} color="#f59e0b" loading={loading} onClick={() => navigate('/admin/parking')} />
                            <StatCard icon={ShieldCheck} label="WARRANTY COST (TOTAL)" value={`₹${(stats.totalWarrantyCost || 0).toLocaleString()}`} color="#8b5cf6" loading={loading} onClick={() => navigate('/admin/warranties')} />
                            <StatCard icon={Users} label="CURRENT DRIVERS" value={stats.totalDrivers} color="#0ea5e9" loading={loading} onClick={() => navigate(user?.role === 'Executive' ? '/admin/freelancers' : '/admin/drivers')} />
                            <StatCard icon={Car} label="FLEET SIZE" value={stats.totalVehicles} color="#8b5cf6" loading={loading} onClick={() => navigate(user?.role === 'Executive' ? '/admin/outside-cars' : '/admin/vehicles')} />
                            <StatCard icon={Briefcase} label="TOTAL STAFF" value={stats.totalStaff} color="#f59e0b" loading={loading} onClick={() => navigate('/admin/staff')} />

                            <StatCard icon={Activity} label="TOTAL DUTIES" value={stats.countPunchIns} color="#3b82f6" loading={loading} onClick={() => { }} trend="LIVE" />
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
                                                    {alert.type === 'Service'
                                                        ? (alert.daysLeft <= 0 ? `${Math.abs(alert.daysLeft)} KM Overdue` : `${alert.daysLeft} KM Due`)
                                                        : (alert.daysLeft < 0 ? `${Math.abs(alert.daysLeft)}d Overdue` : (alert.daysLeft === 0 ? 'Today' : `${alert.daysLeft}d Left`))}
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

                        {/* LIVE STATUS OVERVIEW ROW */}
                        <div className="dashboard-feeds-container" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '20px',
                            marginTop: '10px',
                            marginBottom: '20px'
                        }}>
                            {/* Driver Overview Card */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                onClick={() => navigate('/admin/live-feed')}
                                className="glass-card"
                                style={{ padding: '24px', cursor: 'pointer', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.03)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <Users color="#10b981" size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '900' }}>Driver Presence</h3>
                                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(16, 185, 129, 0.6)', fontWeight: '700' }}>{stats.countPunchIns} Present Today</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight color="rgba(16, 185, 129, 0.4)" />
                                </div>
                            </motion.div>

                            {/* Vehicle Overview Card */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                onClick={() => navigate('/admin/live-feed')}
                                className="glass-card"
                                style={{ padding: '24px', cursor: 'pointer', border: '1px solid rgba(14, 165, 233, 0.2)', background: 'rgba(14, 165, 233, 0.03)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <Car color="#0ea5e9" size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '900' }}>Fleet Utilization</h3>
                                            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(14, 165, 233, 0.6)', fontWeight: '700' }}>{stats.liveVehiclesFeed?.filter(v => v.status !== 'Idle').length} In Operation</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight color="rgba(14, 165, 233, 0.4)" />
                                </div>
                            </motion.div>
                        </div>

                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;