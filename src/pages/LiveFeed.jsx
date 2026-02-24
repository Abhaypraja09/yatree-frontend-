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

    // History is derived from attendanceToday (stats.attendanceDetails)
    const dutyHistory = stats?.attendanceDetails || [];

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            borderRadius: '18px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 10px 25px rgba(14, 165, 233, 0.3)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <Activity size={30} color="white" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>REAL-TIME MISSION CONTROL</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: '950', margin: 0, letterSpacing: '-2px' }}>
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

            {/* Quick Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px',
                marginBottom: '30px'
            }}>
                {[
                    { label: 'PRESENT DRIVERS', value: stats?.countPunchIns || 0, total: stats?.liveDriversFeed?.length || 0, icon: Users, color: '#10b981' },
                    { label: 'VEHICLES IN USE', value: stats?.liveVehiclesFeed?.filter(v => v.status === 'In Use').length || 0, total: stats?.totalVehicles || 0, icon: Car, color: '#0ea5e9' },
                    { label: 'COMPLETED DUTIES', value: stats?.countPunchOuts || 0, icon: CheckCircle2, color: '#8b5cf6' },
                    { label: 'IDLE FLEET', value: stats?.liveVehiclesFeed?.filter(v => v.status === 'Idle').length || 0, icon: Clock, color: 'rgba(255,255,255,0.4)' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card"
                        style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${stat.color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${stat.color}25` }}>
                            <stat.icon size={22} color={stat.color} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>{stat.label}</p>
                            <h3 style={{ margin: '2px 0 0 0', color: 'white', fontSize: '20px', fontWeight: '900' }}>
                                {stat.value}{stat.total ? <span style={{ fontSize: '13px', opacity: 0.3, fontWeight: '700' }}> / {stat.total}</span> : ''}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="glass-card" style={{ padding: '0', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                {/* Navbar & Search */}
                <div style={{ padding: '15px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <TabButton id="drivers" label="Drivers" icon={Users} count={stats?.liveDriversFeed?.length} />
                        <TabButton id="vehicles" label="Fleet" icon={Car} count={stats?.totalVehicles} />
                        <TabButton id="history" label="Activity Logs" icon={History} />
                    </div>

                    <div style={{ position: 'relative', flex: '1', maxWidth: '300px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={16} />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '10px 15px 10px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: '600' }}
                        />
                    </div>
                </div>

                {/* Content Grid */}
                <div style={{ padding: '25px', maxHeight: '70vh', overflowY: 'auto' }} className="custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === 'drivers' && (
                            <motion.div
                                key="drivers"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}
                            >
                                {filteredDrivers.sort((a, b) => (a.status === 'Present' ? -1 : 1)).map((driver) => (
                                    <div key={driver._id} style={{
                                        padding: '16px',
                                        background: driver.status === 'Present' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                                        borderRadius: '20px',
                                        border: `1px solid ${driver.status === 'Present' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)'}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '14px',
                                                    background: driver.isFreelancer ? 'rgba(129, 140, 248, 0.1)' : 'rgba(255,255,255,0.05)',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    border: `1px solid ${driver.isFreelancer ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255,255,255,0.1)'}`
                                                }}>
                                                    <Users size={24} color={driver.status === 'Present' ? '#10b981' : (driver.isFreelancer ? '#818cf8' : 'rgba(255,255,255,0.3)')} />
                                                </div>
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '-2px',
                                                    right: '-2px',
                                                    width: '14px',
                                                    height: '14px',
                                                    borderRadius: '50%',
                                                    background: driver.status === 'Present' ? '#10b981' : '#334155',
                                                    border: '3px solid #1e293b',
                                                    boxShadow: driver.status === 'Present' ? '0 0 10px #10b981' : 'none'
                                                }}></div>
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <h4 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '900' }}>{driver.name}</h4>
                                                    {!driver.isFreelancer && (
                                                        <span style={{ fontSize: '8px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CO.</span>
                                                    )}
                                                </div>
                                                {driver.isFreelancer && (
                                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#818cf8', textTransform: 'uppercase', marginTop: '1px' }}>
                                                        Freelancer
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    <Phone size={10} color="rgba(255,255,255,0.3)" />
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{driver.mobile}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            {driver.status === 'Present' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                                                    {driver.fuelAmount > 0 && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                                            <Fuel size={12} color="#f59e0b" />
                                                            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '950' }}>₹{driver.fuelAmount}</span>
                                                        </div>
                                                    )}
                                                    <span style={{
                                                        fontSize: '10px',
                                                        background: driver.status === 'Present' ? '#10b98120' : (driver.status === 'Lapsed' ? '#f59e0b20' : 'rgba(255,255,255,0.05)'),
                                                        color: driver.status === 'Present' ? '#10b981' : (driver.status === 'Lapsed' ? '#f59e0b' : 'rgba(255,255,255,0.3)'),
                                                        padding: '3px 10px',
                                                        borderRadius: '8px',
                                                        fontWeight: '900',
                                                        border: `1px solid ${driver.status === 'Present' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)'}`
                                                    }}>
                                                        {driver.status === 'Present' ? 'ON DUTY' : (driver.status === 'Lapsed' ? 'LAPSED' : 'OFF DUTY')}
                                                    </span>
                                                    {driver.currentAttendance?.vehicle?.carNumber && (
                                                        <div style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: '900', background: 'rgba(14, 165, 233, 0.1)', padding: '2px 6px', borderRadius: '6px' }}>#{driver.currentAttendance.vehicle.carNumber.split('#')[0].slice(-4)}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Off Duty</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'vehicles' && (
                            <motion.div
                                key="vehicles"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}
                            >
                                {filteredVehicles.sort((a, b) => (a.status !== 'Idle' ? -1 : 1)).map((vehicle) => (
                                    <div key={vehicle._id} style={{
                                        padding: '16px',
                                        background: vehicle.status !== 'Idle' ? 'rgba(14, 165, 233, 0.05)' : 'rgba(255,255,255,0.02)',
                                        borderRadius: '20px',
                                        border: `1px solid ${vehicle.status !== 'Idle' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.05)'}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <Car size={24} color={vehicle.status !== 'Idle' ? '#0ea5e9' : 'rgba(255,255,255,0.3)'} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '900' }}>{vehicle.carNumber.split('#')[0]}</h4>
                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{vehicle.model}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            {vehicle.status !== 'Idle' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {vehicle.fuelAmount > 0 && (
                                                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', border: '1px solid rgba(245, 158, 11, 0.2)', gap: '4px' }}>
                                                                <Fuel size={12} color="#f59e0b" />
                                                                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '950' }}>₹{vehicle.fuelAmount}</span>
                                                            </div>
                                                        )}
                                                        <span style={{
                                                            fontSize: '10px',
                                                            background: vehicle.status === 'In Use' ? '#0ea5e920' : (vehicle.status === 'Lapsed' ? '#f59e0b20' : '#8b5cf620'),
                                                            color: vehicle.status === 'In Use' ? '#0ea5e9' : (vehicle.status === 'Lapsed' ? '#f59e0b' : '#8b5cf6'),
                                                            padding: '3px 10px',
                                                            borderRadius: '8px',
                                                            fontWeight: '900',
                                                            border: `1px solid ${vehicle.status === 'In Use' ? 'rgba(14, 165, 233, 0.3)' : (vehicle.status === 'Lapsed' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(139, 92, 246, 0.3)')}`
                                                        }}>
                                                            {vehicle.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    {vehicle.currentDriver && (
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>👤 {vehicle.currentDriver.name}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: '800' }}>IDLE</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
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
                                            display: 'grid',
                                            gridTemplateColumns: '1.2fr 1fr 1fr 1fr 0.5fr',
                                            alignItems: 'center',
                                            gap: '20px'
                                        }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Users size={20} color="#8b5cf6" />
                                                </div>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>{log.driver?.name}</div>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{log.driver?.mobile}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Car size={20} color="#0ea5e9" />
                                                </div>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>{log.vehicle?.carNumber}</div>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{log.vehicle?.model}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <LogIn size={20} color="#10b981" />
                                                </div>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>{new Date(log.punchIn?.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{log.punchIn?.km} KM START</div>
                                                </div>
                                            </div>

                                            <div>
                                                {log.punchOut?.time ? (
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            <Clock size={20} color="#f43f5e" />
                                                        </div>
                                                        <div>
                                                            <div style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>{new Date(log.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{log.punchOut.km} KM END</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
                                                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8' }} />
                                                        <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>In Progress...</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ textAlign: 'right' }}>
                                                {log.totalKM && <div style={{ fontSize: '16px', fontWeight: '950', color: 'white' }}>{log.totalKM} <span style={{ fontSize: '10px', opacity: 0.4 }}>KM</span></div>}
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
