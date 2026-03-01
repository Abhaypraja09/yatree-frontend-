import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import {
    Users, Clock, Fuel, X, Camera, LogIn, IndianRupee, Activity,
    Calendar, ChevronLeft, ChevronRight, Car, Search, Filter,
    CheckCircle2, AlertCircle, History, MapPin, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

import { DateTime } from 'luxon';

const LiveFeed = () => {
    const { user } = useAuth();
    const { selectedCompany, selectedDate, setSelectedDate } = useCompany();
    const [stats, setStats] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('drivers'); // 'drivers', 'vehicles', 'history'
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTimeIST, setCurrentTimeIST] = useState(DateTime.now().setZone('Asia/Kolkata').toFormat('hh:mm:ss a'));
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [showDriverModal, setShowDriverModal] = useState(false);
    const dateInputRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTimeIST(DateTime.now().setZone('Asia/Kolkata').toFormat('hh:mm:ss a'));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getTodayLocal = () => {
        return DateTime.now().setZone('Asia/Kolkata').toFormat('yyyy-MM-dd');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return DateTime.fromISO(dateStr).setLocale('en-IN').toFormat('dd MMM yyyy');
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '--:--';
        // Handle both ISO strings and JavaScript Date objects
        const dt = typeof timeStr === 'string' ? DateTime.fromISO(timeStr) : DateTime.fromJSDate(timeStr);
        return dt.setZone('Asia/Kolkata').toFormat('hh:mm a');
    };

    const formatDuration = (start, end) => {
        if (!start || !end) return '0h';
        const d1 = typeof start === 'string' ? DateTime.fromISO(start) : DateTime.fromJSDate(start);
        const d2 = typeof end === 'string' ? DateTime.fromISO(end) : DateTime.fromJSDate(end);
        const diff = d2.diff(d1, ['hours', 'minutes']).toObject();
        const h = Math.floor(Math.abs(diff.hours || 0));
        const m = Math.floor(Math.abs(diff.minutes || 0));
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
            setLastUpdated(DateTime.now().setZone('Asia/Kolkata').toFormat('hh:mm:ss a'));
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
                gap: '10px',
                padding: '12px 24px',
                borderRadius: '14px',
                border: 'none',
                background: activeTab === id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: activeTab === id ? 'white' : 'rgba(255, 255, 255, 0.5)',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
            }}
        >
            <Icon size={18} strokeWidth={activeTab === id ? 2.5 : 2} />
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
            {count !== undefined && (
                <span style={{
                    background: activeTab === id ? '#0ea5e9' : 'rgba(255,255,255,0.1)',
                    color: activeTab === id ? 'white' : 'rgba(255,255,255,0.4)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    marginLeft: '4px'
                }}>
                    {count}
                </span>
            )}
            {activeTab === id && (
                <motion.div
                    layoutId="activeTab"
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '20%',
                        right: '20%',
                        height: '3px',
                        background: '#0ea5e9',
                        borderRadius: '10px 10px 0 0'
                    }}
                />
            )}
        </button>
    );

    return (
        <div style={{ padding: 'clamp(15px, 4vw, 40px)', minHeight: '100vh', background: 'radial-gradient(circle at top right, #1e293b, #0f172a)' }}>
            <SEO title="Live Fleet Control" description="Real-time mission control for drivers and vehicles." />

            <header style={{ marginBottom: '30px' }}>
                <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{
                            width: 'clamp(46px, 10vw, 56px)',
                            height: 'clamp(46px, 10vw, 56px)',
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            borderRadius: '16px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 10px 25px rgba(14, 165, 233, 0.3)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            flexShrink: 0
                        }}>
                            <Activity size={26} color="white" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>LIVE MISSION CONTROL</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: '950', margin: 0, letterSpacing: '-2px' }}>
                                Live <span style={{ color: '#0ea5e9' }}>Feed</span> Hub
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '4px' }}>
                                {lastUpdated && (
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
                                        LAST SYNC: {lastUpdated}
                                    </div>
                                )}
                                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', height: '10px' }}></div>
                                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '800', letterSpacing: '0.5px' }}>
                                    {currentTimeIST}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '16px', display: 'flex', gap: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                                onClick={() => {
                                    const d = new Date(selectedDate);
                                    d.setDate(d.getDate() - 1);
                                    setSelectedDate(d.toISOString().split('T')[0]);
                                }}
                                style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div
                                style={{
                                    height: '36px', padding: '0 16px', borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.08)', display: 'flex',
                                    alignItems: 'center', gap: '10px', color: 'white',
                                    fontWeight: '800', fontSize: '13px', cursor: 'pointer',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    position: 'relative', overflow: 'hidden'
                                }}
                            >
                                <Calendar size={16} color="#0ea5e9" />
                                {formatDate(selectedDate)}
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
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
                                style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer' }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <button
                            onClick={fetchFeed}
                            disabled={loading}
                            style={{
                                width: '45px',
                                height: '45px',
                                borderRadius: '14px',
                                background: loading ? 'rgba(255,255,255,0.02)' : 'rgba(14, 165, 233, 0.1)',
                                border: '1px solid rgba(14, 165, 233, 0.2)',
                                color: '#0ea5e9',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                transition: 'all 0.3s'
                            }}
                            title="Refresh Feed"
                        >
                            <motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ repeat: loading ? Infinity : 0, duration: 1, ease: 'linear' }}>
                                <History size={20} />
                            </motion.div>
                        </button>
                    </div>
                </div>
            </header>


            {/* Main Content Area */}
            <div className="glass-card" style={{ padding: '0', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                {/* Navbar & Search */}
                <div style={{ padding: '10px 15px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(0,0,0,0.1)' }}>
                    <div className="premium-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px' }}>
                        <TabButton id="drivers" label="Drivers" icon={Users} count={stats?.liveDriversFeed?.length} />
                        <TabButton id="vehicles" label="Fleet" icon={Car} count={stats?.totalVehicles} />
                    </div>

                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px 15px 12px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: 'clamp(15px, 3vw, 25px)', minHeight: '60vh' }} className="custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'drivers' && (
                            <motion.div
                                key="drivers"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '15px' }}
                            >
                                {filteredDrivers.sort((a, b) => {
                                    const statusPriority = { 'Present': 1, 'Completed': 2, 'Lapsed': 3, 'Absent': 4 };
                                    return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
                                }).map((driver) => (
                                    <div key={driver._id}
                                        onClick={() => {
                                            setSelectedDriver(driver);
                                            setShowDriverModal(true);
                                        }}
                                        style={{
                                            padding: '16px',
                                            background: driver.status === 'Present' ? 'rgba(16, 185, 129, 0.05)' : (driver.status === 'Completed' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.02)'),
                                            borderRadius: '20px',
                                            border: `1px solid ${driver.status === 'Present' ? 'rgba(16, 185, 129, 0.15)' : (driver.status === 'Completed' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)')}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease-in-out',
                                            position: 'relative',
                                            zIndex: 1
                                        }}
                                        className="driver-card-hover"
                                    >
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                <div style={{
                                                    width: '46px',
                                                    height: '46px',
                                                    borderRadius: '14px',
                                                    background: driver.isFreelancer ? 'rgba(129, 140, 248, 0.1)' : 'rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    border: `1px solid ${driver.isFreelancer ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255,255,255,0.1)'}`
                                                }}>
                                                    <Users size={20} color={driver.status === 'Present' ? '#10b981' : (driver.status === 'Completed' ? '#8b5cf6' : (driver.isFreelancer ? '#818cf8' : 'rgba(255,255,255,0.3)'))} />
                                                </div>
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '-2px',
                                                    right: '-2px',
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    background: driver.status === 'Present' ? '#10b981' : (driver.status === 'Completed' ? '#8b5cf6' : '#334155'),
                                                    border: '3px solid #1e293b',
                                                    boxShadow: driver.status === 'Present' ? '0 0 10px #10b981' : (driver.status === 'Completed' ? '0 0 10px #8b5cf6' : 'none')
                                                }}></div>
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <h4 style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driver.name}</h4>
                                                    {!driver.isFreelancer && (
                                                        <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', letterSpacing: '0.5px' }}>CO.</span>
                                                    )}
                                                    {driver.isFreelancer && (
                                                        <span style={{ fontSize: '9px', background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', letterSpacing: '0.5px' }}>FREELANCER</span>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    <Phone size={10} color="rgba(255,255,255,0.3)" />
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{driver.mobile}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', flexShrink: 0 }}>
                                            {['Present', 'Completed', 'Lapsed'].includes(driver.status) ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>

                                                    {driver.attendances && driver.attendances.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                                                            {driver.attendances.map((att, idx) => {
                                                                // Derive true status from punchOut time — never trust att.status alone
                                                                const isActuallyCompleted = att.status === 'completed' && !!att.punchOut?.time;
                                                                const isLapsed = att.status === 'incomplete' && driver.status === 'Lapsed';

                                                                let attStatus = 'ON DUTY';
                                                                let chipBg = '#10b98120', chipColor = '#10b981', chipBorder = 'rgba(16, 185, 129, 0.2)';

                                                                if (isActuallyCompleted) {
                                                                    attStatus = 'COMPLETED';
                                                                    chipBg = '#8b5cf620'; chipColor = '#8b5cf6'; chipBorder = 'rgba(139, 92, 246, 0.2)';
                                                                } else if (isLapsed) {
                                                                    attStatus = 'LAPSED';
                                                                    chipBg = '#f59e0b20'; chipColor = '#f59e0b'; chipBorder = 'rgba(245, 158, 11, 0.2)';
                                                                }

                                                                return (
                                                                    <div key={idx} style={{
                                                                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px',
                                                                        paddingTop: idx > 0 ? '6px' : '0',
                                                                        borderTop: idx > 0 ? '1px dashed rgba(255,255,255,0.05)' : 'none'
                                                                    }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            {att.vehicle?.carNumber && (
                                                                                <div style={{ fontSize: '10px', color: '#0ea5e9', fontWeight: '800', background: 'rgba(14, 165, 233, 0.1)', padding: '3px 6px', borderRadius: '6px' }}>
                                                                                    #{att.vehicle.carNumber.split('#')[0].slice(-4)}
                                                                                </div>
                                                                            )}
                                                                            <span style={{
                                                                                fontSize: '9px',
                                                                                background: chipBg,
                                                                                color: chipColor,
                                                                                padding: '3px 8px',
                                                                                borderRadius: '6px',
                                                                                fontWeight: '800',
                                                                                border: `1px solid ${chipBorder}`,
                                                                                whiteSpace: 'nowrap'
                                                                            }}>
                                                                                {attStatus}
                                                                            </span>
                                                                        </div>

                                                                        <div style={{ display: 'flex', gap: '6px', fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                                                            {att.punchIn?.time && <span>IN: {formatTime(att.punchIn.time)}</span>}
                                                                            {att.punchOut?.time && <span>| OUT: {formatTime(att.punchOut.time)}</span>}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Off Duty</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(255,255,255,0.02)', padding: '4px 10px', borderRadius: '6px' }}>Absent</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'vehicles' && (
                            <motion.div
                                key="vehicles"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '15px' }}
                            >
                                {filteredVehicles.sort((a, b) => (a.status !== 'Idle' ? -1 : 1)).map((vehicle) => (
                                    <div key={vehicle._id} style={{
                                        padding: '16px',
                                        background: vehicle.status !== 'Idle' ? 'rgba(14, 165, 233, 0.05)' : 'rgba(255,255,255,0.02)',
                                        borderRadius: '20px',
                                        border: `1px solid ${vehicle.status !== 'Idle' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.05)'}`,
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                            <div style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <Car size={24} color={vehicle.status !== 'Idle' ? '#0ea5e9' : 'rgba(255,255,255,0.3)'} />
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <h4 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '900', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vehicle.carNumber.split('#')[0]}</h4>
                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{vehicle.model}</span>
                                            </div>
                                        </div>
                                        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                                            {vehicle.attendances && vehicle.attendances.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', width: '100%' }}>
                                                    {vehicle.fuelAmount > 0 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                                            <Fuel size={12} color="#f59e0b" />
                                                            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '800' }}>₹{vehicle.fuelAmount}</span>
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                                                        {vehicle.attendances.map((att, idx) => {
                                                            // Derive true status from punchOut time — never trust att.status alone
                                                            const isActuallyCompleted = att.status === 'completed' && !!att.punchOut?.time;
                                                            const isLapsed = att.status === 'incomplete' && vehicle.status === 'Lapsed';

                                                            let attStatus = 'ON DUTY';
                                                            let chipBg = '#0ea5e920', chipColor = '#0ea5e9', chipBorder = 'rgba(14, 165, 233, 0.3)';

                                                            if (isActuallyCompleted) {
                                                                attStatus = 'COMPLETED';
                                                                chipBg = '#8b5cf620'; chipColor = '#8b5cf6'; chipBorder = 'rgba(139, 92, 246, 0.3)';
                                                            } else if (isLapsed) {
                                                                attStatus = 'LAPSED';
                                                                chipBg = '#f59e0b20'; chipColor = '#f59e0b'; chipBorder = 'rgba(245, 158, 11, 0.3)';
                                                            }

                                                            return (
                                                                <div key={idx} style={{
                                                                    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px',
                                                                    paddingTop: idx > 0 ? '6px' : '0',
                                                                    borderTop: idx > 0 ? '1px dashed rgba(255,255,255,0.05)' : 'none'
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        {att.driver?.name && (
                                                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: '800' }}>
                                                                                👤 {att.driver.name}
                                                                            </div>
                                                                        )}
                                                                        <span style={{
                                                                            fontSize: '9px',
                                                                            background: chipBg,
                                                                            color: chipColor,
                                                                            padding: '3px 8px',
                                                                            borderRadius: '6px',
                                                                            fontWeight: '800',
                                                                            border: `1px solid ${chipBorder}`,
                                                                            whiteSpace: 'nowrap'
                                                                        }}>
                                                                            {attStatus}
                                                                        </span>
                                                                    </div>

                                                                    <div style={{ display: 'flex', gap: '6px', fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                                                        {att.punchIn?.time && <span>IN: {formatTime(att.punchIn.time)}</span>}
                                                                        {att.punchOut?.time && <span>| OUT: {formatTime(att.punchOut.time)}</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                                    {vehicle.fuelAmount > 0 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                                            <Fuel size={12} color="#f59e0b" />
                                                            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '800' }}>₹{vehicle.fuelAmount}</span>
                                                        </div>
                                                    )}
                                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: '900', letterSpacing: '1px', padding: '4px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>IDLE</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                                                        border: `1px solid ${(att.status === 'completed' && !!att.punchOut?.time) ? 'rgba(139, 92, 246, 0.2)' : 'rgba(14, 165, 233, 0.2)'}`
                                                    }}>
                                                        {(att.status === 'completed' && !!att.punchOut?.time) ? 'COMPLETED' : (att.punchOut?.time ? 'COMPLETED' : 'ON DUTY')}
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

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
                                                            {att.punchIn?.selfie && (
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <img src={att.punchIn.selfie} onClick={() => window.open(att.punchIn.selfie)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>SELFIE</div>
                                                                </div>
                                                            )}
                                                            {att.punchIn?.kmPhoto && (
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <img src={att.punchIn.kmPhoto} onClick={() => window.open(att.punchIn.kmPhoto)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>METER</div>
                                                                </div>
                                                            )}
                                                            {att.punchIn?.carSelfie && (
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <img src={att.punchIn.carSelfie} onClick={() => window.open(att.punchIn.carSelfie)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>CAR</div>
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
                                                                    {att.punchOut?.selfie && (
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <img src={att.punchOut.selfie} onClick={() => window.open(att.punchOut.selfie)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>SELFIE</div>
                                                                        </div>
                                                                    )}
                                                                    {att.punchOut?.kmPhoto && (
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <img src={att.punchOut.kmPhoto} onClick={() => window.open(att.punchOut.kmPhoto)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>METER</div>
                                                                        </div>
                                                                    )}
                                                                    {att.punchOut?.carSelfie && (
                                                                        <div style={{ textAlign: 'center' }}>
                                                                            <img src={att.punchOut.carSelfie} onClick={() => window.open(att.punchOut.carSelfie)} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '700' }}>CAR</div>
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
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
            `}</style>
        </div>
    );
};

export default LiveFeed;
