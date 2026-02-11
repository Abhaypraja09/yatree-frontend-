import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Clock,
    MapPin,
    LogOut,
    User,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const StaffPortal = () => {
    const { user, logout } = useAuth();
    const [status, setStatus] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [punching, setPunching] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchStatus();
        fetchHistory();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchStatus = async () => {
        try {
            const { data } = await axios.get('/api/staff/status');
            setStatus(data.staff ? data : null);
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get('/api/staff/history');
            setHistory(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching history:', error);
            setLoading(false);
        }
    };

    const handlePunch = async (type) => {
        setPunching(true);
        try {
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by your browser or device.');
                return;
            }

            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                alert('CRITICAL ERROR: Browser blocks location on insecure connections. Please use https://.');
                setPunching(false);
                return;
            }

            const position = await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject({ code: 3, message: 'Position acquisition timed out.' });
                }, 15000);

                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        clearTimeout(timeoutId);
                        resolve(pos);
                    },
                    (err) => {
                        clearTimeout(timeoutId);
                        reject(err);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 12000,
                        maximumAge: 0
                    }
                );
            });

            const { latitude, longitude, accuracy } = position.coords;
            let address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;

            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
                const geoData = await geoRes.json();
                if (geoData.display_name) {
                    address = geoData.display_name;
                }
            } catch (geoErr) {
                address = `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Acc: ${Math.round(accuracy)}m)`;
            }

            const endpoint = type === 'in' ? '/api/staff/punch-in' : '/api/staff/punch-out';
            await axios.post(endpoint, { latitude, longitude, address });

            fetchStatus();
            fetchHistory();
        } catch (error) {
            let userMsg = 'Error fetching location.';
            if (error.code === 1) userMsg = 'PERMISSION_DENIED: Please click "Allow" for location.';
            else if (error.code === 2) userMsg = 'POSITION_UNAVAILABLE: GPS signal not found.';
            else if (error.code === 3) userMsg = 'TIMEOUT: Failed to get location quickly.';
            alert(userMsg);
        } finally {
            setPunching(false);
        }
    };

    if (loading) return <div style={{ color: 'white', padding: '100px', textAlign: 'center' }}>Loading Portal...</div>;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #1e293b, #0f172a)',
            padding: '20px',
            color: 'white'
        }}>
            <SEO title="Staff Portal" />

            <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: '800'
                    }}>
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', margin: 0 }}>{user.name}</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Staff Portal</p>
                    </div>
                </div>
                <button onClick={logout} style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '8px 15px', borderRadius: '10px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LogOut size={16} /> Logout
                </button>
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: '40px 20px', textAlign: 'center', marginBottom: '30px', position: 'relative', overflow: 'hidden' }}
                >
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase' }}>
                        {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 style={{ fontSize: '48px', fontWeight: '900', margin: '0 0 40px 0' }}>
                        {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </h1>

                    {!status ? (
                        <button
                            disabled={punching}
                            onClick={() => handlePunch('in')}
                            className="btn-primary"
                            style={{ width: '200px', height: '200px', borderRadius: '50%', fontSize: '24px', fontWeight: '900', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px', margin: '0 auto' }}
                        >
                            {punching ? (
                                <>
                                    <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
                                    <span style={{ fontSize: '12px' }}>CAPTURING GPS...</span>
                                </>
                            ) : (
                                <>
                                    <Clock size={48} />
                                    PUNCH IN
                                </>
                            )}
                        </button>
                    ) : status.punchOut?.time ? (
                        <div style={{ padding: '30px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <CheckCircle2 size={60} color="#10b981" style={{ margin: '0 auto 20px auto' }} />
                            <h2 style={{ color: '#10b981', margin: '0 0 5px 0' }}>Duty Completed</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Successfully punched out for today.</p>
                        </div>
                    ) : (
                        <button
                            disabled={punching}
                            onClick={() => handlePunch('out')}
                            style={{
                                width: '200px',
                                height: '200px',
                                borderRadius: '50%',
                                fontSize: '24px',
                                fontWeight: '900',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '10px',
                                margin: '0 auto',
                                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                                color: 'white'
                            }}
                        >
                            {punching ? (
                                <>
                                    <div className="spinner" style={{ width: '40px', height: '40px', borderColor: 'white', borderTopColor: 'transparent' }}></div>
                                    <span style={{ fontSize: '12px' }}>CAPTURING GPS...</span>
                                </>
                            ) : (
                                <>
                                    <Clock size={48} />
                                    PUNCH OUT
                                </>
                            )}
                        </button>
                    )}
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                    <div className="glass-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <ArrowUpRight color="#10b981" size={20} />
                            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Punch In</span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '24px' }}>{status?.punchIn?.time ? new Date(status.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            <MapPin size={12} /> {status?.punchIn?.location?.address?.split(',')[0] || 'Pending'}
                        </p>
                    </div>

                    <div className="glass-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <ArrowDownLeft color="#f43f5e" size={20} />
                            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Punch Out</span>
                        </div>
                        <h2 style={{ margin: 0, fontSize: '24px' }}>
                            {status?.punchOut?.time ? new Date(status.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            <MapPin size={12} /> {status?.punchOut?.location?.address?.split(',')[0] || 'Pending'}
                        </p>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>Recent Attendance</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {history.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>No history found.</p>
                        ) : history.slice(0, 7).map(item => (
                            <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Calendar size={14} color="var(--primary)" />
                                    <span style={{ fontSize: '14px', fontWeight: '700' }}>{item.date}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '800' }}>
                                        IN: {new Date(item.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div style={{ color: '#f43f5e', fontSize: '12px', fontWeight: '800' }}>
                                        OUT: {item.punchOut?.time ? new Date(item.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffPortal;
