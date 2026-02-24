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

const LiveFeed = () => {
    const { user } = useAuth();
    const { selectedCompany, selectedDate, setSelectedDate } = useCompany();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('drivers'); // 'drivers', 'vehicles', 'history'
    const [searchQuery, setSearchQuery] = useState('');
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

    // History is derived from dutyHistoryThisMonth (last 30 days) filtered up to selectedDate and by searchQuery
    const dutyHistory = (stats?.dutyHistoryThisMonth || [])
        .filter(log => new Date(log.date) <= new Date(selectedDate))
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
                                onClick={() => dateInputRef.current?.showPicker()}
                                style={{ height: '36px', padding: '0 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: '800', fontSize: '13px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <Calendar size={16} color="#0ea5e9" />
                                {formatDate(selectedDate)}
                                <input
                                    type="date"
                                    ref={dateInputRef}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={{ visibility: 'hidden', width: 0, position: 'absolute' }}
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
                        <TabButton id="history" label="Activity" icon={History} />
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
                                    <div key={driver._id} style={{
                                        padding: '16px',
                                        background: driver.status === 'Present' ? 'rgba(16, 185, 129, 0.05)' : (driver.status === 'Completed' ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.02)'),
                                        borderRadius: '20px',
                                        border: `1px solid ${driver.status === 'Present' ? 'rgba(16, 185, 129, 0.15)' : (driver.status === 'Completed' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)')}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}>
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
                                                                let attStatus = 'ON DUTY';
                                                                let chipBg = '#10b98120', chipColor = '#10b981', chipBorder = 'rgba(16, 185, 129, 0.2)';

                                                                if (att.status === 'completed') {
                                                                    attStatus = 'COMPLETED';
                                                                    chipBg = '#8b5cf620'; chipColor = '#8b5cf6'; chipBorder = 'rgba(139, 92, 246, 0.2)';
                                                                } else if (att.status === 'incomplete' && driver.status === 'Lapsed') {
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
                                                                                {attStatus} {driver.attendances.length > 1 ? `#${idx + 1}` : ''}
                                                                            </span>
                                                                        </div>

                                                                        <div style={{ display: 'flex', gap: '6px', fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                                                            {att.punchIn?.time && <span>IN: {new Date(att.punchIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
                                                                            {att.punchOut?.time && <span>| OUT: {new Date(att.punchOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
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
                                                            let attStatus = 'ON DUTY';
                                                            let chipBg = '#0ea5e920', chipColor = '#0ea5e9', chipBorder = 'rgba(14, 165, 233, 0.3)';

                                                            if (att.status === 'completed') {
                                                                attStatus = 'COMPLETED';
                                                                chipBg = '#8b5cf620'; chipColor = '#8b5cf6'; chipBorder = 'rgba(139, 92, 246, 0.3)';
                                                            } else if (att.status === 'incomplete' && vehicle.status === 'Lapsed') {
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
                                                                            {attStatus} {vehicle.attendances.length > 1 ? `#${idx + 1}` : ''}
                                                                        </span>
                                                                    </div>

                                                                    <div style={{ display: 'flex', gap: '6px', fontSize: '9px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                                                        {att.punchIn?.time && <span>IN: {new Date(att.punchIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
                                                                        {att.punchOut?.time && <span>| OUT: {new Date(att.punchOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>}
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

                        {activeTab === 'history' && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
                            >
                                {dutyHistory.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)' }}>
                                        <Clock size={40} style={{ marginBottom: '10px', opacity: 0.5 }} />
                                        <p style={{ fontWeight: '700' }}>No activity logs for this date.</p>
                                    </div>
                                ) : (
                                    dutyHistory.map((log) => (
                                        <div key={log._id} style={{
                                            padding: '20px',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '20px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '15px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontWeight: '900', fontSize: '12px' }}>
                                                        {new Date(log.date).toLocaleDateString('en-GB')}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <Users size={16} color="#8b5cf6" />
                                                        <span style={{ color: 'white', fontWeight: '800', fontSize: '13px' }}>{log.driver?.name || 'Unknown Driver'}</span>
                                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{log.driver?.mobile}</span>
                                                    </div>
                                                    <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }}></div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <Car size={16} color="#0ea5e9" />
                                                        <span style={{ color: '#0ea5e9', fontWeight: '800', fontSize: '13px' }}>{log.vehicle?.carNumber?.split('#')[0] || 'Unknown Vehicle'}</span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                    {log.fuel && log.fuel.amount > 0 && (
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '6px', color: '#f59e0b', fontSize: '11px', fontWeight: '800' }}>
                                                            <Fuel size={12} /> ₹{log.fuel.amount} Fuel
                                                        </span>
                                                    )}
                                                    {(() => {
                                                        const parkingExpense = log.approvedExpenses?.find(e => e.type === 'parking');
                                                        if (parkingExpense && parkingExpense.amount > 0) {
                                                            return (
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '6px', color: '#38bdf8', fontSize: '11px', fontWeight: '800' }}>
                                                                    <MapPin size={12} /> ₹{parkingExpense.amount} Parking
                                                                </span>
                                                            )
                                                        }
                                                        return null;
                                                    })()}
                                                    {log.status === 'completed' ? (
                                                        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(16, 185, 129, 0.3)' }}>DUTY COMPLETED</span>
                                                    ) : (
                                                        <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(244, 63, 94, 0.3)' }}>ON DUTY</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                {/* IN */}
                                                <div>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>Punch In</div>
                                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                                        <span style={{ color: '#10b981', fontSize: '16px', fontWeight: '900' }}>{log.punchIn?.time ? new Date(log.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '700' }}>{log.punchIn?.km || 0} KM</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                                        {log.punchIn?.selfie && <img src={log.punchIn.selfie} onClick={() => window.open(log.punchIn.selfie)} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} title="Driver Selfie" loading="lazy" />}
                                                        {log.punchIn?.kmPhoto && <img src={log.punchIn.kmPhoto} onClick={() => window.open(log.punchIn.kmPhoto)} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} title="Meter Reading" loading="lazy" />}
                                                        {log.punchIn?.carSelfie && <img src={log.punchIn.carSelfie} onClick={() => window.open(log.punchIn.carSelfie)} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} title="Car Photo" loading="lazy" />}
                                                    </div>
                                                </div>
                                                {/* OUT */}
                                                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '15px' }}>
                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>Punch Out</div>
                                                    {log.punchOut?.time ? (
                                                        <>
                                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                                                <span style={{ color: '#f43f5e', fontSize: '16px', fontWeight: '900' }}>{new Date(log.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '700' }}>{log.punchOut.km || 0} KM</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                                                                {log.punchOut?.selfie && <img src={log.punchOut.selfie} onClick={() => window.open(log.punchOut.selfie)} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} title="Driver Selfie" loading="lazy" />}
                                                                {log.punchOut?.kmPhoto && <img src={log.punchOut.kmPhoto} onClick={() => window.open(log.punchOut.kmPhoto)} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} title="Meter Reading" loading="lazy" />}
                                                                {log.punchOut?.carSelfie && <img src={log.punchOut.carSelfie} onClick={() => window.open(log.punchOut.carSelfie)} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} title="Car Photo" loading="lazy" />}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '800', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} />
                                                            IN PROGRESS
                                                        </div>
                                                    )}
                                                </div>
                                                {/* EXPENSES EVIDENCE */}
                                                {(log.fuel?.slipPhoto || log.approvedExpenses?.some(e => e.receiptPhoto)) && (
                                                    <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '15px' }}>
                                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '800', marginBottom: '4px', textTransform: 'uppercase' }}>Evidence</div>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {log.fuel?.slipPhoto && <img src={log.fuel.slipPhoto} onClick={() => window.open(log.fuel.slipPhoto)} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} title="Fuel Slip" loading="lazy" />}
                                                            {log.approvedExpenses?.map((e, idx) => e.receiptPhoto && (
                                                                <img key={idx} src={e.receiptPhoto} onClick={() => window.open(e.receiptPhoto)} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }} title={`${e.type} Receipt`} loading="lazy" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* SUMMARY */}
                                                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '800' }}>Total Duty KM:</span>
                                                        <span style={{ fontSize: '16px', color: 'white', fontWeight: '900' }}>{log.totalKM || 0} <span style={{ fontSize: '10px', opacity: 0.5 }}>KM</span></span>
                                                    </div>
                                                    {log.status === 'completed' && log.punchOut?.time && log.punchIn?.time && (() => {
                                                        const hrs = ((new Date(log.punchOut.time) - new Date(log.punchIn.time)) / (1000 * 60 * 60)).toFixed(1);
                                                        return (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '800' }}>Duration:</span>
                                                                <span style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: '900' }}>{hrs} Hours</span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                .glass-card { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
            `}</style>
        </div>
    );
};

export default LiveFeed;
