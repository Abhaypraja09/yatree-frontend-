import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    Users,
    Car,
    Clock,
    TrendingUp,
    CreditCard,
    X,
    ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
    <div className={`stat-card glass-card ${loading ? 'stale-card' : ''}`}>
        <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: `${color}15`, color: color }}>
                <Icon size={16} />
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

                {/* Expenditure Section - Improved Grid */}
                <div style={{
                    marginTop: 'clamp(20px, 4vw, 25px)',
                    display: 'grid',
                    gap: 'clamp(12px, 2.5vw, 20px)'
                }} className="modal-grid-2">
                    {/* Fuel Card */}
                    <div className="glass-card" style={{ padding: 'clamp(12px, 2.5vw, 15px)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{
                            fontSize: 'clamp(9px, 2.2vw, 10px)',
                            color: 'var(--text-muted)',
                            marginBottom: '12px',
                            fontWeight: '800',
                            letterSpacing: '0.5px'
                        }}>
                            FUEL REFILL
                        </p>
                        {item.fuel?.filled ? (
                            <div style={{ display: 'grid', gap: '10px' }}>
                                {(item.fuel.entries && item.fuel.entries.length > 0) ? (
                                    item.fuel.entries.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                gap: '10px',
                                                alignItems: 'center',
                                                background: 'rgba(255,255,255,0.03)',
                                                padding: '8px',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <img
                                                src={entry.slipPhoto}
                                                onClick={() => window.open(entry.slipPhoto)}
                                                alt="Fuel slip"
                                                style={{
                                                    width: '35px',
                                                    height: '35px',
                                                    borderRadius: '6px',
                                                    objectFit: 'cover',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontSize: 'clamp(11px, 2.8vw, 12px)'
                                                }}>
                                                    <span style={{ color: 'white', fontWeight: '800' }}>
                                                        ₹{entry.amount}
                                                    </span>
                                                    <span style={{ color: 'var(--primary)', fontWeight: '700' }}>
                                                        {entry.km} KM
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        {item.fuel.slipPhoto && (
                                            <img
                                                src={item.fuel.slipPhoto}
                                                onClick={() => window.open(item.fuel.slipPhoto)}
                                                alt="Fuel slip"
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '6px',
                                                    objectFit: 'cover',
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        )}
                                        <div>
                                            <p style={{
                                                color: 'white',
                                                fontWeight: '800',
                                                fontSize: 'clamp(13px, 3.2vw, 15px)',
                                                margin: 0
                                            }}>
                                                ₹{item.fuel.amount}
                                            </p>
                                            <p style={{
                                                color: 'var(--primary)',
                                                fontWeight: '700',
                                                fontSize: 'clamp(10px, 2.5vw, 11px)',
                                                margin: 0
                                            }}>
                                                {item.fuel.km || '--'} KM
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {item.fuel.entries?.length > 1 && (
                                    <p style={{
                                        margin: 0,
                                        fontSize: 'clamp(10px, 2.5vw, 11px)',
                                        color: '#10b981',
                                        fontWeight: '800',
                                        textAlign: 'right'
                                    }}>
                                        Total: ₹{item.fuel.amount}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(12px, 2.8vw, 13px)', margin: 0 }}>
                                -
                            </p>
                        )}
                    </div>

                    {/* Parking & Toll Card */}
                    <div className="glass-card" style={{ padding: 'clamp(12px, 2.5vw, 15px)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{
                            fontSize: 'clamp(9px, 2.2vw, 10px)',
                            color: 'var(--text-muted)',
                            marginBottom: '12px',
                            fontWeight: '800',
                            letterSpacing: '0.5px'
                        }}>
                            PARKING & TOLL
                        </p>
                        {item.parking && item.parking.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {item.parking.map((p, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <span style={{
                                            color: 'white',
                                            fontWeight: '700',
                                            fontSize: 'clamp(10px, 2.3vw, 11px)'
                                        }}>
                                            ₹{p.amount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(12px, 2.8vw, 13px)', margin: 0 }}>
                                ₹ 0
                            </p>
                        )}
                    </div>

                    {/* Allowances Card */}
                    <div className="glass-card" style={{ padding: 'clamp(12px, 2.5vw, 15px)', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{
                            fontSize: 'clamp(9px, 2.2vw, 10px)',
                            color: 'var(--text-muted)',
                            marginBottom: '12px',
                            fontWeight: '800',
                            letterSpacing: '0.5px'
                        }}>
                            ALLOWANCES
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {item.punchOut?.allowanceTA > 0 && (
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    fontSize: 'clamp(10px, 2.3vw, 11px)',
                                    fontWeight: '700'
                                }}>
                                    TA: ₹{item.punchOut.allowanceTA}
                                </span>
                            )}
                            {item.punchOut?.nightStayAmount > 0 && (
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981',
                                    fontSize: 'clamp(10px, 2.3vw, 11px)',
                                    fontWeight: '700'
                                }}>
                                    Stay: ₹{item.punchOut.nightStayAmount}
                                </span>
                            )}
                            {(!item.punchOut?.allowanceTA && !item.punchOut?.nightStayAmount) && (
                                <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(12px, 2.8vw, 13px)', margin: 0 }}>
                                    -
                                </p>
                            )}
                        </div>
                    </div>
                </div>

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
    const { selectedCompany, selectedDate, setSelectedDate } = useCompany();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    const logoMap = {
        'YatreeDestination': '/logos/YD.Logo.webp',
        'GoGetGo': '/logos/gogetgo.webp'
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
        <div className="container-fluid admin-layout-wrapper">
            <SEO
                title={`${selectedCompany?.name || 'Admin'} Dashboard`}
                description={`Real-time stats and activity for ${selectedCompany?.name || 'your fleet'}.`}
            />

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
                        <p className="header-subtitle text-gradient-blue" style={{ fontWeight: '600' }}>
                            {selectedCompany?.name}
                        </p>
                    </div>
                </div>

                <div className="date-selector-container">
                    <div className="date-selector-inner">
                        <button
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() - 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }}
                            className="glass-card-hover-effect"
                            title="Previous Day"
                        >
                            ←
                        </button>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                if (e.target.value) {
                                    setSelectedDate(e.target.value);
                                }
                            }}
                        />

                        <button
                            onClick={() => {
                                const d = new Date(selectedDate);
                                d.setDate(d.getDate() + 1);
                                setSelectedDate(d.toISOString().split('T')[0]);
                            }}
                            className="glass-card-hover-effect"
                            title="Next Day"
                        >
                            →
                        </button>

                        <button
                            onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                setSelectedDate(today);
                            }}
                        >
                            Today
                        </button>
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
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <StatCard icon={Car} label="Fleet" value={stats.totalVehicles} color="#0ea5e9" loading={loading} />
                            <StatCard icon={Users} label="Drivers" value={stats.totalDrivers} color="#6366f1" loading={loading} />
                            <StatCard icon={CreditCard} label="Fastag" value={`₹${stats.totalFastagBalance?.toLocaleString() || 0}`} color="#10b981" loading={loading} />
                            <StatCard icon={Clock} label="Punch-In" value={stats.countPunchIns} color="#8b5cf6" loading={loading} />
                            <StatCard icon={TrendingUp} label="Finished" value={stats.countPunchOuts} color="#f59e0b" loading={loading} />
                        </div>

                        {/* Expiry Alerts */}
                        {stats.expiringAlerts && stats.expiringAlerts.length > 0 && (
                            <div className="glass-card" style={{
                                border: '1px solid rgba(244, 63, 94, 0.2)',
                                background: 'linear-gradient(145deg, rgba(244, 63, 94, 0.05), rgba(15, 23, 42, 0.2))'
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

                        {/* Activity Table */}
                        <div className="glass-card" style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 'clamp(16px, 3.5vw, 20px)',
                                flexWrap: 'wrap',
                                gap: '10px'
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

                            <div className="activity-table-wrapper">
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
                                                        background: item.status === 'completed'
                                                            ? 'rgba(16, 185, 129, 0.1)'
                                                            : 'rgba(245, 158, 11, 0.1)',
                                                        color: item.status === 'completed' ? '#10b981' : '#f59e0b',
                                                        border: `1px solid ${item.status === 'completed'
                                                            ? 'rgba(16, 185, 129, 0.2)'
                                                            : 'rgba(245, 158, 11, 0.2)'}`
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