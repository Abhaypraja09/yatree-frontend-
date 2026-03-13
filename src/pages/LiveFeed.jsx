import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import {
    Users, Clock, Fuel, X, Camera, LogIn, IndianRupee, Activity,
    Calendar, ChevronLeft, ChevronRight, Car, Search, Filter,
    CheckCircle2, AlertCircle, History, MapPin, Phone, Trash2, PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { 
    todayIST, 
    formatDateIST, 
    formatTimeIST, 
    nowIST 
} from '../utils/istUtils';

const styles = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
  .pulse-animation {
    animation: pulse 2s infinite ease-in-out;
  }
  .search-input-focus:focus {
    background: rgba(255,255,255,0.08) !important;
    border-color: rgba(14, 165, 233, 0.4) !important;
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.1);
  }
  .premium-scroll::-webkit-scrollbar {
    height: 4px;
  }
  .premium-scroll::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    borderRadius: 10px;
  }
`;

const LiveFeed = () => {
    const { user } = useAuth();
    const { selectedCompany, selectedDate, setSelectedDate } = useCompany();
    const [stats, setStats] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('drivers'); // 'drivers', 'vehicles', 'history'
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTimeIST, setCurrentTimeIST] = useState(formatTimeIST(nowIST(), true));
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const dateInputRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTimeIST(formatTimeIST(nowIST(), true));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getTodayLocal = () => todayIST();

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return formatDateIST(dateStr);
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        return formatTimeIST(timeStr);
    };

    const formatDuration = (start, end) => {
        if (!start || !end) return '0h';
        const d1 = nowIST(start);
        const d2 = nowIST(end);
        const diffMs = Math.abs(d2 - d1);
        const h = Math.floor(diffMs / (1000 * 60 * 60));
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${h}h ${m}m`;
    };

    const fetchFeed = async () => {
        if (!selectedCompany) return;
        setLoading(true);
        try {
            const userInfoRaw = localStorage.getItem('userInfo');
            const userInfo = JSON.parse(userInfoRaw);
            const { data } = await axios.get(`/api/admin/dashboard/${selectedCompany._id}?date=${selectedDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setStats(data);
            setLastUpdated(formatTimeIST(nowIST(), true));
        } catch (err) {
            console.error('Error fetching feed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 60000); // Auto refresh every minute
        return () => clearInterval(interval);
    }, [selectedCompany, selectedDate]);

    const filteredDrivers = stats?.liveDriversFeed?.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.mobile.includes(searchQuery)
    ) || [];

    const filteredVehicles = stats?.liveVehiclesFeed?.filter(v =>
        v.carNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // History is filtered for the selectedDate and by searchQuery
    const dutyHistory = (stats?.dutyHistoryThisMonth || [])
        .filter(log => log.date === selectedDate)
        .filter(log =>
            searchQuery === '' ||
            log.driver?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.vehicle?.carNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const TabButton = ({ id, label, icon: Icon, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 28px',
                borderRadius: '16px',
                border: 'none',
                background: activeTab === id ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                color: activeTab === id ? '#38bdf8' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: '900',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {activeTab === id && (
                <motion.div
                    layoutId="activeTabGlow"
                    style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05), transparent)', zIndex: 0 }}
                />
            )}
            <Icon size={18} strokeWidth={activeTab === id ? 3 : 2} style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', position: 'relative', zIndex: 1 }}>{label}</span>
            {count !== undefined && (
                <span style={{
                    background: activeTab === id ? '#0ea5e9' : 'rgba(255,255,255,0.05)',
                    color: activeTab === id ? 'white' : 'rgba(255,255,255,0.3)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: '900',
                    position: 'relative',
                    zIndex: 1
                }}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="livefeed-root" style={{ padding: 'clamp(15px, 4vw, 40px)', minHeight: '100vh', background: 'radial-gradient(circle at top right, #1e293b, #0f172a)', overflowX: 'hidden' }}>
            <style>{styles}</style>
            <SEO title="Live Fleet Control" description="Real-time mission control for drivers and vehicles." />

            <header style={{ marginBottom: '30px' }}>
                <div className="livefeed-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '32px', height: '32px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                                <Activity size={18} color="#0ea5e9" className="pulse-animation" />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Fleet Operation Hub</span>
                        </div>
                        <h1 style={{ color: 'white', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '950', margin: 0, letterSpacing: '-1.5px', lineHeight: 1 }}>
                            Live <span style={{ background: 'linear-gradient(to right, #0ea5e9, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Feed</span>
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '18px', display: 'flex', gap: '4px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                            <button
                                onClick={() => {
                                    const d = nowIST(selectedDate);
                                    d.setUTCDate(d.getUTCDate() - 1);
                                    setSelectedDate(d.toISOString().split('T')[0]);
                                }}
                                style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                                className="driver-card-hover"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div style={{ height: '40px', padding: '0 20px', borderRadius: '14px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: '800', fontSize: '14px', border: '1px solid rgba(14, 165, 233, 0.2)', position: 'relative' }}>
                                <Calendar size={16} color="#0ea5e9" />
                                {formatDate(selectedDate)}
                                <input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={(e) => setSelectedDate(e.target.value)} 
                                    onClick={(e) => e.target.showPicker?.()}
                                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer', colorScheme: 'dark', zIndex: 10 }} 
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const d = nowIST(selectedDate);
                                    d.setUTCDate(d.getUTCDate() + 1);
                                    setSelectedDate(d.toISOString().split('T')[0]);
                                }}
                                style={{ width: '40px', height: '40px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
                                className="driver-card-hover"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <button onClick={fetchFeed} disabled={loading} style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ repeat: loading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                                <History size={20} />
                            </motion.div>
                        </button>
                    </div>
                </div>

                {/* Stats Grid — 5 boxes */}
                <div className="livefeed-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
                    {[
                        { label: 'Active Drivers', value: stats?.liveDriversFeed?.filter(d => d.status === 'Present').length || 0, icon: Users, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                        { label: 'In Use Fleet', value: stats?.liveVehiclesFeed?.filter(v => v.status === 'In Use').length || 0, icon: Car, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' },
                        {
                            label: 'Daily Fuel',
                            value: `₹${(stats?.dailyFuelAmount?.total || 0).toLocaleString()}`,
                            icon: Fuel,
                            color: '#f59e0b',
                            bg: 'rgba(245, 158, 11, 0.1)'
                        },
                        { label: 'Completed', value: stats?.liveDriversFeed?.filter(d => d.status === 'Completed').length || 0, icon: CheckCircle2, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}
                        >
                            <div style={{ width: '45px', height: '45px', background: stat.bg, borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${stat.color}20`, flexShrink: 0 }}>
                                <stat.icon size={22} color={stat.color} />
                            </div>
                            <div>
                                <div style={{ fontSize: '20px', fontWeight: '950', color: 'white', lineHeight: 1.1, marginBottom: '2px' }}>{stat.value}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
                                {stat.subValue && <div style={{ fontSize: '10px', color: stat.color, fontWeight: '900', marginTop: '2px' }}>{stat.subValue}</div>}
                            </div>
                        </motion.div>
                    ))}

                    {/* 5th Box — Company vs Freelancer */}
                    {(() => {
                        const feed = stats?.liveDriversFeed || [];
                        const companyDrivers = feed.filter(d => !d.isFreelancer);
                        const companyTotal = companyDrivers.length;
                        const companyActive = companyDrivers.filter(d => d.status === 'Present').length;
                        const companyCompleted = companyDrivers.filter(d => d.status === 'Completed').length;
                        const companyAbsent = companyDrivers.filter(d => d.status === 'Absent').length;

                        const freelancerFeed = feed.filter(d => d.isFreelancer);
                        const freelancerActive = freelancerFeed.filter(d => d.status === 'Present').length;
                        const freelancerCompleted = freelancerFeed.filter(d => d.status === 'Completed').length;
                        const freelancerAvailable = freelancerActive + freelancerCompleted;

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                                style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}
                            >
                                <div style={{ width: '45px', height: '45px', background: 'rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                                    <PieChart size={22} color="rgba(255,255,255,0.8)" />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {/* Company section */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '9px', fontWeight: '900', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.8px' }}>COMPANY (TODAY)</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '18px', fontWeight: '950', color: 'white' }}>{companyActive + companyCompleted}</span>
                                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                                                <span style={{ color: '#10b981' }}>{companyActive} Act</span> • <span style={{ color: '#8b5cf6' }}>{companyCompleted} Done</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                                    {/* Freelancer section */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '9px', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>FREELANCER (TODAY)</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '18px', fontWeight: '950', color: 'white' }}>{freelancerAvailable}</span>
                                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                                                <span style={{ color: '#10b981' }}>{freelancerActive} Act</span> • <span style={{ color: '#818cf8' }}>{freelancerCompleted} Done</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })()}
                </div>
            </header>


            {/* Dashboard Container */}
            <div style={{ background: 'rgba(30, 41, 59, 0.3)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', backdropFilter: 'blur(30px)' }}>
                {/* Control Bar */}
                <div className="livefeed-control-bar" style={{ padding: '20px 30px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
                    <div className="livefeed-tabs" style={{ display: 'flex', gap: '8px' }}>
                        <TabButton id="drivers" label="Drivers" icon={Users} count={stats?.liveDriversFeed?.length} />
                        <TabButton id="vehicles" label="Fleet" icon={Car} count={stats?.totalVehicles} />
                        <TabButton id="fuel" label="Fuel" icon={Fuel} count={stats?.dailyFuelEntries?.length} />
                    </div>

                    <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px', width: '100%' }}>
                        <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} size={18} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px 24px 16px 56px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '20px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            className="search-input-focus"
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: '25px', minHeight: '60vh' }} className="custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'drivers' && (
                            <motion.div
                                key="drivers"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="livefeed-cards-grid"
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}
                            >
                                {filteredDrivers.sort((a, b) => {
                                    const statusPriority = { 'Present': 1, 'Completed': 2, 'Absent': 3 };
                                    return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
                                }).map((driver) => (
                                    <motion.div
                                        key={driver._id}
                                        whileHover={{ y: -5, background: 'rgba(255,255,255,0.05)' }}
                                        onClick={() => {
                                            setSelectedDriver(driver);
                                            setShowDriverModal(true);
                                        }}
                                        style={{
                                            padding: '20px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '24px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '16px',
                                                    background: driver.status === 'Present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    border: `1px solid ${driver.status === 'Present' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)'}`
                                                }}>
                                                    <span style={{ fontSize: '18px', fontWeight: '900', color: driver.status === 'Present' ? '#10b981' : 'white' }}>{driver.name.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <h4 style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: '800' }}>{driver.name}</h4>
                                                        {driver.status === 'Present' && <div className="pulse-animation" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />}
                                                    </div>
                                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600', marginTop: '1px' }}>{driver.mobile}</div>
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                color: driver.status === 'Present' ? '#10b981' : (driver.status === 'Completed' ? '#8b5cf6' : 'rgba(255,255,255,0.3)'),
                                                background: driver.status === 'Present' ? 'rgba(16, 185, 129, 0.1)' : (driver.status === 'Completed' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)'),
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {driver.status}
                                            </div>
                                        </div>

                                        {driver.attendances && driver.attendances.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {driver.attendances.map((att, idx) => {
                                                    const isComp = att.status === 'completed' && !!att.punchOut?.time;
                                                    return (
                                                        <div key={idx} style={{
                                                            padding: '12px',
                                                            background: 'rgba(0,0,0,0.2)',
                                                            borderRadius: '16px',
                                                            border: '1px solid rgba(255,255,255,0.03)',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <Car size={14} color={isComp ? 'rgba(255,255,255,0.2)' : '#0ea5e9'} />
                                                                <span style={{ fontSize: '13px', color: 'white', fontWeight: '700' }}>{att.vehicle?.carNumber?.split('#')[0]}</span>
                                                            </div>
                                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                                                {formatTime(att.punchIn?.time)}
                                                                {att.punchOut?.time && ` → ${formatTime(att.punchOut.time)}`}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>NO ACTIVE SHIFTS</div>
                                        )}

                                        {driver.isFreelancer && (
                                            <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'flex-end' }}>
                                                <span style={{ fontSize: '9px', background: 'rgba(129, 140, 248, 0.1)', color: '#818cf8', padding: '2px 8px', borderRadius: '6px', fontWeight: '900', letterSpacing: '0.5px' }}>FREELANCER</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'vehicles' && (
                            <motion.div
                                key="vehicles"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}
                            >
                                {filteredVehicles.sort((a, b) => (a.status !== 'Idle' ? -1 : 1)).map((vehicle) => (
                                    <motion.div
                                        key={vehicle._id}
                                        whileHover={{ y: -5, background: 'rgba(255,255,255,0.05)' }}
                                        style={{
                                            padding: '20px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '24px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '16px',
                                                    background: 'rgba(14, 165, 233, 0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    border: '1px solid rgba(14, 165, 233, 0.1)'
                                                }}>
                                                    <Car size={24} color="#0ea5e9" />
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, color: 'white', fontSize: '16px', fontWeight: '800' }}>{vehicle.carNumber.split('#')[0]}</h4>
                                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600' }}>{vehicle.model}</div>
                                                </div>
                                            </div>
                                            {vehicle.fuelAmount > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '10px', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                                    <Fuel size={12} />
                                                    <span style={{ fontSize: '11px', fontWeight: '900' }}>₹{vehicle.fuelAmount}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            {vehicle.attendances && vehicle.attendances.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {vehicle.attendances.map((att, idx) => {
                                                        const isComp = att.status === 'completed' && !!att.punchOut?.time;
                                                        return (
                                                            <div key={idx} style={{
                                                                padding: '10px 14px',
                                                                borderRadius: '14px',
                                                                background: isComp ? 'transparent' : 'rgba(255,255,255,0.03)',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '11px', fontWeight: '900', color: 'white' }}>
                                                                        {att.driver?.name?.charAt(0) || '👤'}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '12px', color: 'white', fontWeight: '700' }}>{att.driver?.name || 'Driver'}</div>
                                                                        <div style={{ fontSize: '10px', color: isComp ? 'rgba(255,255,255,0.3)' : '#0ea5e9', fontWeight: '800', textTransform: 'uppercase' }}>{isComp ? 'Completed' : 'On Duty'}</div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
                                                                    {formatTime(att.punchIn?.time)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>IDLE</div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'fuel' && (
                            <motion.div
                                key="fuel"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}
                            >
                                {(stats?.dailyFuelEntries || []).filter(f =>
                                    (f.driver?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                    (f.vehicle?.carNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                                    (f.stationName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                                ).map((fuelEntry, i) => (
                                    <motion.div
                                        key={fuelEntry._id || `fuel-${i}`}
                                        whileHover={{ y: -5, background: 'rgba(255,255,255,0.05)' }}
                                        style={{
                                            padding: '20px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '24px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '16px',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '50px',
                                                    height: '50px',
                                                    borderRadius: '16px',
                                                    background: 'rgba(245, 158, 11, 0.1)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    border: '1px solid rgba(245, 158, 11, 0.2)'
                                                }}>
                                                    <Fuel size={24} color="#f59e0b" />
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '900' }}>₹{fuelEntry.amount}</h4>
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '700', marginTop: '2px' }}>
                                                        {fuelEntry.quantity ? `${fuelEntry.quantity}L ${fuelEntry.fuelType || ''}` : fuelEntry.fuelType || 'Fuel'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                color: '#f59e0b',
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {fuelEntry.paymentMode || 'N/A'}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600' }}>
                                                    <Users size={14} color="#0ea5e9" />
                                                    {fuelEntry.driver || 'Unknown'}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '700' }}>
                                                    <Clock size={12} />
                                                    {formatTime(fuelEntry.date)}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600' }}>
                                                    <Car size={14} color="#0ea5e9" />
                                                    {fuelEntry.vehicle?.carNumber?.split('#')[0] || 'N/A'}
                                                </div>
                                                {fuelEntry.odometer && (
                                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '700' }}>
                                                        {fuelEntry.odometer} KM
                                                    </div>
                                                )}
                                            </div>
                                            {(fuelEntry.stationName || fuelEntry.source) && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '600', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <MapPin size={12} color="rgba(255,255,255,0.4)" />
                                                    {fuelEntry.stationName || fuelEntry.source}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Premium Driver Detail Modal */}
            <AnimatePresence>
                {showDriverModal && selectedDriver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '20px'
                        }}
                        onClick={() => setShowDriverModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: '700px',
                                maxHeight: '90vh',
                                background: '#1e293b',
                                borderRadius: '32px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{ padding: '24px 30px', background: 'rgba(14, 165, 233, 0.1)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        boxShadow: '0 8px 16px rgba(14, 165, 233, 0.2)'
                                    }}>
                                        <Users size={24} color="white" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>{selectedDriver.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                            <Phone size={12} color="rgba(255,255,255,0.4)" />
                                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '700' }}>{selectedDriver.mobile}</span>
                                            {selectedDriver.isFreelancer && <span style={{ fontSize: '10px', background: 'rgba(129, 140, 248, 0.2)', color: '#8bafff', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>FREELANCER</span>}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowDriverModal(false)}
                                    style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }} className="custom-scrollbar">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    {selectedDriver.attendances && selectedDriver.attendances.length > 0 ? (
                                        selectedDriver.attendances.map((att, idx) => (
                                            <div key={idx} style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '24px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                padding: '24px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '20px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ padding: '6px 14px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '10px', color: '#0ea5e9', fontWeight: '900', fontSize: '13px' }}>
                                                            SHIFT #{idx + 1}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Car size={16} color="#0ea5e9" />
                                                            <span style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>{att.vehicle?.carNumber || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '11px',
                                                        fontWeight: '900',
                                                        background: (att.status === 'completed' && !!att.punchOut?.time) ? 'rgba(139, 92, 246, 0.1)' : 'rgba(14, 165, 233, 0.1)',
                                                        color: (att.status === 'completed' && !!att.punchOut?.time) ? '#8b5cf6' : '#0ea5e9',
                                                        border: `1px solid ${(att.status === 'completed' && !!att.punchOut?.time) ? 'rgba(139, 92, 246, 0.2)' : 'rgba(14, 165, 233, 0.2)'}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        {(att.status === 'completed' && !!att.punchOut?.time) ? 'COMPLETED' : (att.punchOut?.time ? 'COMPLETED' : 'ON DUTY')}

                                                        {user?.role === 'Admin' && (
                                                            <button
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    if (window.confirm('Are you sure you want to delete this duty record?')) {
                                                                        try {
                                                                            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                                                                            await axios.delete(`/api/admin/attendance/${att._id}`, {
                                                                                headers: { Authorization: `Bearer ${userInfo.token}` }
                                                                            });
                                                                            alert('Duty deleted successfully');
                                                                            fetchFeed();
                                                                            setShowDriverModal(false);
                                                                        } catch (err) {
                                                                            alert('Error deleting duty: ' + (err.response?.data?.message || err.message));
                                                                        }
                                                                    }
                                                                }}
                                                                style={{
                                                                    background: 'rgba(244, 63, 94, 0.15)',
                                                                    border: 'none',
                                                                    color: '#f43f5e',
                                                                    cursor: 'pointer',
                                                                    padding: '4px',
                                                                    borderRadius: '6px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    marginLeft: '5px'
                                                                }}
                                                                title="Delete Duty"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expenses & Fuel Badges in Modal */}
                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                    {/* Approved Fuel Block */}
                                                    {att.fuel?.amount > 0 && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            padding: '6px 12px',
                                                            borderRadius: '10px',
                                                            border: '1px solid rgba(16, 185, 129, 0.2)',
                                                            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.05)'
                                                        }}>
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                <Fuel size={14} color="white" />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ color: 'white', fontSize: '13px', fontWeight: '900' }}>₹{att.fuel.amount}</span>
                                                                <span style={{ color: '#10b981', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                    Verified & Approved <CheckCircle2 size={10} />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Pending Fuel Block */}
                                                    {att.pendingExpenses?.filter(e => e.type === 'fuel' && e.status === 'pending').map((pf, pidx) => (
                                                        <div key={pidx} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            background: 'rgba(245, 158, 11, 0.1)',
                                                            padding: '6px 12px',
                                                            borderRadius: '10px',
                                                            border: '1px solid rgba(245, 158, 11, 0.2)',
                                                            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.05)'
                                                        }}>
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                <Fuel size={14} color="white" />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ color: 'white', fontSize: '13px', fontWeight: '900' }}>₹{pf.amount}</span>
                                                                <span style={{ color: '#f59e0b', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                    Admin Approval Pending <Clock size={10} className="pulse-animation" />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(() => {
                                                        const parkingExpense = att.approvedExpenses?.find(e => e.type === 'parking');
                                                        if (parkingExpense && parkingExpense.amount > 0) {
                                                            return (
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '6px', color: '#38bdf8', fontSize: '11px', fontWeight: '800' }}>
                                                                    <MapPin size={12} /> ₹{parkingExpense.amount} Parking
                                                                </span>
                                                            )
                                                        }
                                                        return null;
                                                    })()}
                                                    {att.outsideTrip?.occurred && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.1)', padding: '4px 10px', borderRadius: '6px', color: '#8b5cf6', fontSize: '11px', fontWeight: '800' }}>
                                                            <Activity size={12} /> Outstation {att.outsideTrip.tripType}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="livefeed-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                    {/* Punch In Details */}
                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                                        <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <LogIn size={12} /> Punch In
                                                        </div>
                                                        <div style={{ marginBottom: '15px' }}>
                                                            <div style={{ fontSize: '24px', color: 'white', fontWeight: '950' }}>{formatTime(att.punchIn?.time)}</div>
                                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Odometer: {att.punchIn?.km || 0} KM</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                            {att.punchIn?.kmPhoto && (
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <img src={att.punchIn.kmPhoto} onClick={() => window.open(att.punchIn.kmPhoto)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>METER</div>
                                                                </div>
                                                            )}
                                                            {att.punchIn?.selfie && (
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <img src={att.punchIn.selfie} onClick={() => window.open(att.punchIn.selfie)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>DRIVER</div>
                                                                </div>
                                                            )}
                                                            {(att.punchIn?.carSelfie || att.punchIn?.carPhoto) && (
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <img src={att.punchIn.carSelfie || att.punchIn.carPhoto} onClick={() => window.open(att.punchIn.carSelfie || att.punchIn.carPhoto)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>VEHICLE</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Punch Out Details */}
                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                                                        <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <X size={12} /> Punch Out
                                                        </div>
                                                        {att.punchOut?.time ? (
                                                            <>
                                                                <div style={{ marginBottom: '15px' }}>
                                                                    <div style={{ fontSize: '24px', color: 'white', fontWeight: '950' }}>{formatTime(att.punchOut.time)}</div>
                                                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Odometer: {att.punchOut.km || 0} KM</div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                                    {att.punchOut?.kmPhoto && (
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <img src={att.punchOut.kmPhoto} onClick={() => window.open(att.punchOut.kmPhoto)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>METER</div>
                                                                        </div>
                                                                    )}
                                                                    {att.punchOut?.selfie && !selectedDriver?.isFreelancer && (
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <img src={att.punchOut.selfie} onClick={() => window.open(att.punchOut.selfie)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>DRIVER</div>
                                                                        </div>
                                                                    )}
                                                                    {(att.punchOut?.carSelfie || att.punchOut?.carPhoto) && (
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <img src={att.punchOut.carSelfie || att.punchOut.carPhoto} onClick={() => window.open(att.punchOut.carSelfie || att.punchOut.carPhoto)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>VEHICLE</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div style={{ height: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '8px' }}>
                                                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 15px #0ea5e9' }} />
                                                                <div style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: '900', letterSpacing: '1px' }}>IN PROGRESS</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Duty Summary */}
                                                <div className="livefeed-duty-summary" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Travel Distance</div>
                                                        <div style={{ fontSize: '18px', color: 'white', fontWeight: '950' }}>{att.totalKM || (att.punchOut?.km ? att.punchOut.km - (att.punchIn?.km || 0) : 0)} <span style={{ fontSize: '11px', opacity: 0.5 }}>KM</span></div>
                                                    </div>
                                                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                                                    <div style={{ textAlign: 'center', flex: 1 }}>
                                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Duty Duration</div>
                                                        <div style={{ fontSize: '18px', color: '#8b5cf6', fontWeight: '950' }}>{att.punchIn?.time && att.punchOut?.time ? formatDuration(att.punchIn.time, att.punchOut.time) : '--'}</div>
                                                    </div>
                                                </div>

                                                {/* Locations if available */}
                                                {(att.punchIn?.location?.address || att.punchOut?.location?.address) && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {att.punchIn?.location?.address && (
                                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                                <MapPin size={14} color="#10b981" style={{ marginTop: '2px' }} />
                                                                <div>
                                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>START LOCATION</div>
                                                                    <div style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{att.punchIn.location.address}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {att.punchOut?.location?.address && (
                                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                                <MapPin size={14} color="#f43f5e" style={{ marginTop: '2px' }} />
                                                                <div>
                                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>END LOCATION</div>
                                                                    <div style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{att.punchOut.location.address}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(0,0,0,0.1)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                            <Clock size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '15px' }} />
                                            <h4 style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>No Attendance Recorded for this date.</h4>
                                        </div>
                                    )}

                                    {/* Standalone Fuel Entries (Freelancer Fuel etc) */}
                                    {selectedDriver.fuelEntries && selectedDriver.fuelEntries.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                DIRECT FUEL ENTRIES
                                            </div>
                                            {selectedDriver.fuelEntries.map((fe, fIdx) => (
                                                <div key={fIdx} style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: 'rgba(245, 158, 11, 0.05)',
                                                    padding: '15px 20px',
                                                    borderRadius: '16px',
                                                    border: '1px solid rgba(245, 158, 11, 0.1)'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            <Fuel size={20} color="#f59e0b" />
                                                        </div>
                                                        <div>
                                                            <div style={{ color: 'white', fontSize: '16px', fontWeight: '900' }}>₹{fe.amount}</div>
                                                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '600', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <Car size={10} /> {fe.vehicle?.carNumber?.split('#')[0] || 'N/A'}
                                                                {fe.stationName && <><MapPin size={10} style={{ marginLeft: '4px' }} /> {fe.stationName}</>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                                        <span style={{ color: '#f59e0b', fontSize: '10px', fontWeight: '800', background: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                                                            {fe.paymentMode || 'N/A'}
                                                        </span>
                                                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '700' }}>
                                                            <Clock size={10} style={{ marginBottom: '-2px', marginRight: '3px' }} />
                                                            {formatTime(fe.date)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ padding: '20px 30px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowDriverModal(false)}
                                    style={{ padding: '12px 30px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '800', cursor: 'pointer' }}
                                >
                                    Close Details
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                .glass-card { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
                .pulse-animation {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.9); }
                }
                .driver-card-hover:hover {
                    transform: translateY(-5px);
                    background: rgba(255,255,255,0.08) !important;
                    border-color: rgba(255,255,255,0.2) !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .driver-card-hover:active {
                    transform: translateY(0);
                }

                /* ---- LIVE FEED MOBILE FIXES ---- */
                @media (max-width: 768px) {
                    /* Main wrapper padding */
                    .livefeed-root {
                        padding: 20px 15px !important;
                    }
                    /* Stats: 2 columns */
                    .livefeed-stats-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                    /* Stat card size */
                    .livefeed-stats-grid > div {
                        padding: 16px !important;
                        border-radius: 18px !important;
                    }
                    /* Control bar stacks vertically */
                    .livefeed-control-bar {
                        flex-direction: column !important;
                        padding: 15px !important;
                        gap: 12px !important;
                    }
                    /* Tabs scroll horizontally */
                    .livefeed-tabs {
                        overflow-x: auto !important;
                        width: 100% !important;
                        padding-bottom: 4px !important;
                        scrollbar-width: none !important;
                    }
                    .livefeed-tabs::-webkit-scrollbar { display: none; }
                    /* Tabs button smaller */
                    .livefeed-tabs button {
                        white-space: nowrap !important;
                        padding: 8px 14px !important;
                        font-size: 10px !important;
                    }
                    /* Search full width */
                    .livefeed-control-bar > div:last-child {
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    /* Driver cards go 1 column */
                    .livefeed-cards-grid {
                        grid-template-columns: 1fr !important;
                    }
                    /* Detail modal punch grid: 1 col */
                    .livefeed-detail-grid {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                    }
                    /* Duty summary wrap */
                    .livefeed-duty-summary {
                        flex-direction: column !important;
                        gap: 10px !important;
                    }
                    .livefeed-duty-summary > div:nth-child(2) {
                        display: none !important;
                    }
                    /* Stat card font sizes */
                    .livefeed-stats-grid .stat-val {
                        font-size: 24px !important;
                    }
                }
                @media (max-width: 480px) {
                    .livefeed-stats-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 10px !important;
                    }
                }
            `}</style>

        </div>
    );
};

export default LiveFeed;
