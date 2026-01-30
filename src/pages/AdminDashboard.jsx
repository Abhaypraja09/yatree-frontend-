import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    Users,
    Car,
    Clock,
    TrendingUp,
    MapPin,
    Calendar,
    X,
    ShieldAlert,
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
    <div className={`stat-card glass-card ${loading ? 'stale-card' : ''}`}>
        <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: `${color}15`, color: color }}>
                <Icon size={14} />
            </div>
            <p className="stat-card-label">{label}</p>
        </div>
        <div className="stat-card-body">
            <h3 className="stat-card-value">
                {loading ? (
                    <span className="loading-dots">...</span>
                ) : (
                    value || 0
                )}
            </h3>
        </div>
    </div>
);

const AttendanceModal = ({ item, onClose }) => {
    useEffect(() => {
        // Prevent body scroll when modal is open
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
                        <h3 className="modal-section-title" style={{ color: '#10b981' }}>
                            Punch In
                        </h3>
                        <div className="photo-grid">
                            <div>
                                <p className="photo-label">SELFIE</p>
                                <img
                                    src={item.punchIn?.selfie}
                                    alt="Punch In Selfie"
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
                        <h3 className="modal-section-title" style={{ color: '#f43f5e' }}>
                            Punch Out
                        </h3>
                        {item.punchOut?.time ? (
                            <div className="photo-grid">
                                <div>
                                    <p className="photo-label">SELFIE</p>
                                    <img
                                        src={item.punchOut?.selfie}
                                        alt="Punch Out Selfie"
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
                                height: 'clamp(60px, 16vw, 85px)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '5px',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: 'var(--text-muted)',
                                border: '1px dashed rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.02)'
                            }}>
                                <Clock size={16} />
                                <p style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', margin: 0 }}>On Trip...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expenditure Row */}
                <div style={{
                    marginTop: 'clamp(16px, 4vw, 25px)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 'clamp(10px, 2.5vw, 20px)'
                }}>
                    <div className="glass-card" style={{ padding: 'clamp(10px, 2.5vw, 15px)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{ fontSize: 'clamp(9px, 2.2vw, 10px)', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>
                            FUEL REFILL
                        </p>
                        {item.fuel?.amount !== undefined ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {item.fuel.slipPhoto && (
                                    <img
                                        src={item.fuel.slipPhoto}
                                        alt="Fuel Slip"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            objectFit: 'cover',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                        loading="lazy"
                                    />
                                )}
                                <div>
                                    <p style={{ color: 'white', fontWeight: '800', fontSize: 'clamp(13px, 3.2vw, 16px)', margin: 0 }}>
                                        ₹ {item.fuel.amount}
                                    </p>
                                    <span style={{
                                        fontSize: 'clamp(8px, 2vw, 10px)',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: item.fuel.amount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                        color: item.fuel.amount > 0 ? '#10b981' : 'var(--text-muted)'
                                    }}>
                                        {item.fuel.amount > 0 ? 'Verified' : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(11px, 2.8vw, 13px)', margin: 0 }}>-</p>
                        )}
                    </div>

                    <div className="glass-card" style={{ padding: 'clamp(10px, 2.5vw, 15px)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{ fontSize: 'clamp(9px, 2.2vw, 10px)', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>
                            PARKING & TOLL
                        </p>
                        {item.parking && item.parking.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {item.parking.map((p, idx) => (
                                    <div key={idx} style={{
                                        padding: '3px 7px',
                                        borderRadius: '6px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <span style={{ color: 'white', fontWeight: '700', fontSize: 'clamp(9px, 2.3vw, 11px)' }}>
                                            ₹{p.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(11px, 2.8vw, 13px)', margin: 0 }}>₹ 0</p>
                        )}
                    </div>

                    <div className="glass-card" style={{ padding: 'clamp(10px, 2.5vw, 15px)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{ fontSize: 'clamp(9px, 2.2vw, 10px)', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>
                            ALLOWANCES
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {item.punchOut?.allowanceTA > 0 && (
                                <span style={{
                                    padding: '3px 7px',
                                    borderRadius: '6px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    fontSize: 'clamp(9px, 2.3vw, 11px)',
                                    fontWeight: '700'
                                }}>
                                    TA: ₹{item.punchOut.allowanceTA}
                                </span>
                            )}
                            {item.punchOut?.nightStayAmount > 0 && (
                                <span style={{
                                    padding: '3px 7px',
                                    borderRadius: '6px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    fontSize: 'clamp(9px, 2.3vw, 11px)',
                                    fontWeight: '700'
                                }}>
                                    Stay: ₹{item.punchOut.nightStayAmount}
                                </span>
                            )}
                            {(!item.punchOut?.allowanceTA && !item.punchOut?.nightStayAmount) && (
                                <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(11px, 2.8vw, 13px)', margin: 0 }}>-</p>
                            )}
                        </div>
                    </div>
                </div>

                {item.punchOut?.remarks && (
                    <div className="glass-card" style={{ marginTop: 'clamp(16px, 4vw, 20px)', padding: 'clamp(10px, 2.5vw, 15px)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{ fontSize: 'clamp(9px, 2.2vw, 10px)', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '800' }}>
                            REMARKS
                        </p>
                        <p style={{ color: 'white', fontSize: 'clamp(11px, 2.8vw, 13px)', lineHeight: '1.6', margin: 0, fontStyle: 'italic' }}>
                            "{item.punchOut.remarks}"
                        </p>
                    </div>
                )}

                <div style={{
                    marginTop: 'clamp(16px, 4vw, 25px)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 'clamp(10px, 2.5vw, 15px)'
                }}>
                    <div className="glass-card" style={{
                        padding: 'clamp(10px, 2.5vw, 15px)',
                        textAlign: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        background: 'rgba(16, 185, 129, 0.05)'
                    }}>
                        <p style={{ fontSize: 'clamp(9px, 2.2vw, 10px)', color: '#10b981', fontWeight: '800', marginBottom: '4px' }}>
                            DISTANCE COVERED
                        </p>
                        <h3 style={{ color: 'white', margin: 0, fontSize: 'clamp(18px, 4.5vw, 24px)', fontWeight: '800' }}>
                            {item.totalKM} <small style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', opacity: 0.6 }}>KM</small>
                        </h3>
                    </div>
                    <div className="glass-card" style={{
                        padding: 'clamp(10px, 2.5vw, 15px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: '1px solid rgba(14, 165, 233, 0.2)'
                    }}>
                        <div style={{
                            background: 'rgba(14, 165, 233, 0.15)',
                            padding: '7px',
                            borderRadius: '8px',
                            flexShrink: 0
                        }}>
                            <MapPin size={window.innerWidth < 640 ? 14 : 18} color="var(--primary)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                fontSize: 'clamp(9px, 2.2vw, 10px)',
                                color: 'var(--text-muted)',
                                fontWeight: '800',
                                marginBottom: '2px'
                            }}>
                                LOCATION
                            </p>
                            <p style={{
                                fontSize: 'clamp(9px, 2.3vw, 11px)',
                                color: 'white',
                                margin: 0,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {item.punchOut?.location?.address || item.punchIn?.location?.address || 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const AdminDashboard = () => {
    const { selectedCompany, selectedDate, setSelectedDate } = useCompany();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    const logoMap = {
        'YatreeDestination': '/logos/YD.Logo.webp',
        'GoGetGo': '/logos/gogetgo.webp'
    };

    const getDisplayDate = (dateStr) => {
        try {
            const [y, m, d] = dateStr.split('-');
            const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            return `${d} ${months[parseInt(m) - 1]} ${y}`;
        } catch (e) {
            return dateStr;
        }
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

    return (
        <div className="container-fluid admin-layout-wrapper" style={{ paddingBottom: '40px' }}>
            <SEO title={`${selectedCompany?.name || 'Admin'} Dashboard`} description={`Real-time stats and activity for ${selectedCompany?.name || 'your fleet'}.`} />
            <header className="dashboard-header">
                <div className="header-logo-section">
                    <div className="header-logo-container">
                        <img
                            src={logoMap[selectedCompany?.name]}
                            alt={`${selectedCompany?.name} Logo`}
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    </div>
                    <div>
                        <h1 className="header-title text-gradient">Intel Center</h1>
                        <p className="header-subtitle text-gradient-blue" style={{ fontWeight: '600' }}>{selectedCompany?.name}</p>
                    </div>
                </div>

                <div className="date-selector-container">
                    <div className="date-display-card glass-card glass-card-hover-effect">
                        <Calendar size={14} color="var(--primary)" />
                        <span className="current-date-text">
                            {getDisplayDate(selectedDate)}
                        </span>
                        <input
                            type="date"
                            className="hidden-date-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </header>

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
                            <StatCard icon={Car} label="Fleet" value={stats.totalVehicles} color="#0ea5e9" loading={loading} />
                            <StatCard icon={Users} label="Drivers" value={stats.totalDrivers} color="#6366f1" loading={loading} />
                            <StatCard icon={CreditCard} label="Fastag" value={`₹${stats.totalFastagBalance?.toLocaleString() || 0}`} color="#10b981" loading={loading} />
                            <StatCard icon={Clock} label="Punch-In" value={stats.countPunchIns} color="#8b5cf6" loading={loading} />
                            <div className="stats-grid-last-span">
                                <StatCard icon={TrendingUp} label="Finished" value={stats.countPunchOuts} color="#f59e0b" loading={loading} />
                            </div>
                        </div>

                        {stats.expiringAlerts && stats.expiringAlerts.length > 0 && (
                            <div className="glass-card" style={{
                                padding: 'clamp(14px, 3.5vw, 25px)',
                                border: '1px solid rgba(244, 63, 94, 0.2)',
                                background: 'linear-gradient(145deg, rgba(244, 63, 94, 0.05), rgba(15, 23, 42, 0.2))'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginBottom: 'clamp(14px, 3.5vw, 20px)',
                                    flexWrap: 'wrap'
                                }}>
                                    <ShieldAlert color="#f43f5e" size={window.innerWidth < 640 ? 16 : 20} />
                                    <h3 style={{
                                        fontSize: 'clamp(12px, 3.2vw, 16px)',
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
                                        <div key={index} className="alert-card glass-card-hover-effect" style={{
                                            background: alert.status === 'Expired' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            border: `1px solid ${alert.status === 'Expired' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '6px' }}>
                                                <span className="alert-identifier" style={{ color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', flex: 1, fontWeight: '700' }}>
                                                    {alert.identifier}
                                                </span>
                                                <span style={{
                                                    fontSize: 'clamp(8px, 2vw, 10px)',
                                                    padding: '3px 6px',
                                                    borderRadius: '6px',
                                                    background: alert.status === 'Expired' ? '#f43f5e' : '#f59e0b',
                                                    color: 'white',
                                                    fontWeight: '800',
                                                    flexShrink: 0,
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                                }}>
                                                    {alert.status}
                                                </span>
                                            </div>
                                            <div className="alert-type" style={{ color: 'white', marginBottom: '6px' }}>
                                                {alert.documentType}
                                            </div>
                                            <div className="alert-date" style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                                                Expires: <span style={{ color: 'white', fontWeight: '700' }}>
                                                    {new Date(alert.expiryDate).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="glass-card" style={{ padding: 'clamp(14px, 3.5vw, 25px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'clamp(14px, 3.5vw, 20px)',
                                flexWrap: 'wrap',
                                gap: '10px'
                            }}>
                                <h3 style={{
                                    fontSize: 'clamp(13px, 3.2vw, 16px)',
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

                            <div className="activity-table-wrapper">
                                <table className="activity-table">
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <th>Driver Details</th>
                                            <th>Assigned Car</th>
                                            <th>Trip Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.attendanceDetails?.map((item) => (
                                            <tr key={item._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="hover-row">
                                                <td>
                                                    <div className="driver-name">{item.driver?.name}</div>
                                                    <div className="driver-mobile">{item.driver?.mobile}</div>
                                                </td>
                                                <td>
                                                    <span className="vehicle-badge">
                                                        {item.vehicle?.carNumber}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="status-pill" style={{
                                                        background: item.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: item.status === 'completed' ? '#10b981' : '#f59e0b',
                                                        border: `1px solid ${item.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                                                    }}>
                                                        {item.status === 'completed' ? 'Duty Ended' : 'On Trip'}
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
                                                    <Users size={window.innerWidth < 640 ? 24 : 32} style={{ opacity: 0.1, marginBottom: '10px' }} />
                                                    <p style={{ fontSize: 'clamp(11px, 2.8vw, 14px)', margin: 0 }}>
                                                        No activity recorded for this date
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {selectedItem && (
                        <AttendanceModal item={selectedItem} onClose={() => setSelectedItem(null)} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminDashboard;