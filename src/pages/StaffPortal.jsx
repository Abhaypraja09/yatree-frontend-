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
    CheckCircle2,
    Camera,
    RefreshCcw,
    X,
    Check,
    TrendingUp,
    AlertCircle,
    ChevronRight,
    IndianRupee,
    Briefcase,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

const StaffPortal = () => {
    const { user, logout } = useAuth();
    const [status, setStatus] = useState(null);
    const [history, setHistory] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [punching, setPunching] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'attendance', 'leaves', 'salary'
    const [currentTime, setCurrentTime] = useState(new Date());
    const [report, setReport] = useState(null);
    const [cycles, setCycles] = useState([]);
    const [selectedCycleIndex, setSelectedCycleIndex] = useState(0);

    const [cameraActive, setCameraActive] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [punchType, setPunchType] = useState(null); // 'in' or 'out'
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);

    const [leaveForm, setLeaveForm] = useState({
        startDate: '',
        endDate: '',
        type: 'Sick Leave',
        reason: ''
    });
    const [submittingLeave, setSubmittingLeave] = useState(false);

    useEffect(() => {
        const init = async () => {
            await Promise.all([
                fetchStatus(),
                fetchHistory(),
                fetchLeaves(),
                fetchCycles()
            ]);
            setLoading(false);
        };
        init();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchCycles = async () => {
        try {
            const { data } = await axios.get('/api/staff/salary-cycles');
            setCycles(data);
            if (data && data.length > 0) {
                setReport(data[selectedCycleIndex]);
            }
        } catch (error) {
            console.error('Error fetching cycles:', error);
        }
    };

    useEffect(() => {
        if (cycles && cycles.length > selectedCycleIndex) {
            setReport(cycles[selectedCycleIndex]);
        }
    }, [selectedCycleIndex, cycles]);

    const fetchLeaves = async () => {
        try {
            const { data } = await axios.get('/api/staff/leaves');
            setLeaves(data);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        }
    };

    const handleLeaveRequest = async (e) => {
        e.preventDefault();
        setSubmittingLeave(true);
        try {
            await axios.post('/api/staff/leave', leaveForm);
            alert('Leave request submitted successfully');
            setLeaveForm({ startDate: '', endDate: '', type: 'Sick Leave', reason: '' });
            fetchLeaves();
        } catch (error) {
            alert(error.response?.data?.message || 'Error submitting leave');
        } finally {
            setSubmittingLeave(false);
        }
    };

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
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    const startCamera = async (type) => {
        setPunchType(type);
        setCameraActive(true);
        setCapturedPhoto(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera error:', err);
            alert('Could not access camera. Please ensure permissions are granted.');
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleInstantPunch = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedPhoto(dataUrl);
            stopCamera();
            handlePunch(dataUrl);
        }
    };

    const handlePunch = async (photoUrl = capturedPhoto) => {
        if (!photoUrl) {
            alert('Please capture a photo first.');
            return;
        }

        const type = punchType;
        setPunching(true);
        try {
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by your browser or device.');
                return;
            }

            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            let address = `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

            try {
                const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
                const geoData = await geoRes.json();
                if (geoData.display_name) address = geoData.display_name;
            } catch (e) { }

            const endpoint = type === 'in' ? '/api/staff/punch-in' : '/api/staff/punch-out';
            await axios.post(endpoint, {
                latitude,
                longitude,
                address,
                photo: photoUrl
            });

            setCameraActive(false);
            setCapturedPhoto(null);
            fetchStatus();
            fetchHistory();
            fetchCycles();
        } catch (error) {
            alert(error.response?.data?.message || 'Error processing punch.');
            setCapturedPhoto(null); // Reset if it failed
            // Don't close camera active if failed so they can retry
        } finally {
            setPunching(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: '#020617',
            color: 'white',
            paddingBottom: '100px',
            fontFamily: "'Inter', sans-serif"
        }}>
            <SEO title="Staff Portal | Dashboard" />

            {/* Header Area */}
            <div style={{
                background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.4))',
                padding: '40px 20px',
                marginBottom: '30px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '22px',
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 15px 30px rgba(14, 165, 233, 0.4)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <User size={32} color="white" />
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(255,255,255,0.2), transparent)', pointerEvents: 'none' }}></div>
                        </div>
                        <div>
                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#fbbf24', letterSpacing: '2px', textTransform: 'uppercase' }}>Active Personnel</span>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '2px 0', letterSpacing: '-0.8px' }}>{user?.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <p style={{ fontSize: '12px', color: '#10b981', fontWeight: '800', margin: 0 }}>{user?.designation || 'Staff Member'}</p>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', margin: 0 }}>ID: {user?.username}</p>
                            </div>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={logout}
                        style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                    >
                        <LogOut size={20} />
                    </motion.button>
                </div>
            </div>

            <main style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>

                {/* Navigation Pills */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '8px',
                    borderRadius: '24px',
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '35px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(10px)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    position: 'sticky',
                    top: '20px',
                    zIndex: 100
                }}>
                    {[
                        { id: 'dashboard', label: 'HUB', icon: TrendingUp },
                        { id: 'attendance', label: 'LOGS', icon: Clock },
                        { id: 'leaves', label: 'SOS', icon: Calendar },
                        { id: 'salary', label: 'PAY', icon: IndianRupee }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1,
                                minWidth: '80px',
                                padding: '14px 10px',
                                borderRadius: '18px',
                                border: 'none',
                                background: activeTab === tab.id ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)',
                                fontWeight: '900',
                                fontSize: '11px',
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: activeTab === tab.id ? '0 10px 20px -5px rgba(99, 102, 241, 0.4)' : 'none'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Greeting & Quick Summary */}
                            <div style={{ marginBottom: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#0ea5e9', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                        {currentTime.getHours() < 12 ? 'MORNING PROTOCOL' : (currentTime.getHours() < 17 ? 'AFTERNOON SHIFT' : 'EVENING ROTATION')}
                                    </p>
                                    <h1 style={{ margin: '8px 0 0 0', fontSize: '36px', color: 'white', fontWeight: '950', letterSpacing: '-1.5px' }}>
                                        Hi, {user?.name.split(' ')[0]}
                                    </h1>
                                </div>
                                <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '10px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ margin: 0, fontSize: '14px', color: 'white', fontWeight: '900' }}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>{currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Premium Clock Card */}
                            <div style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                padding: '40px 20px',
                                borderRadius: '40px',
                                textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(30px)',
                                marginBottom: '30px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    <h1 style={{ fontSize: '72px', fontWeight: '950', margin: 0, letterSpacing: '-4px', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '8px' }}>
                                        {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.2)', marginTop: '16px', letterSpacing: '0' }}>:{currentTime.toLocaleTimeString('en-IN', { second: '2-digit' })}</span>
                                    </h1>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '3px', marginTop: '10px' }}>STANDARD TIME SEQUENCE</p>

                                    <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                                        {!status ? (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => startCamera('in')}
                                                style={{
                                                    width: '100%', maxWidth: '300px', height: '80px', borderRadius: '40px',
                                                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                                    border: 'none',
                                                    color: 'white', cursor: 'pointer',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px',
                                                    boxShadow: '0 15px 30px rgba(14, 165, 233, 0.4)'
                                                }}
                                            >
                                                <Camera size={24} />
                                                <span style={{ fontWeight: '950', fontSize: '22px', letterSpacing: '1px' }}>QUICK PUNCH IN</span>
                                            </motion.button>
                                        ) : status.punchOut?.time ? (
                                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '30px', borderRadius: '30px', border: '1px solid rgba(16, 185, 129, 0.2)', width: '100%' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                                    <div style={{ background: '#10b981', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                                                        <CheckCircle2 size={24} color="white" />
                                                    </div>
                                                    <h3 style={{ margin: 0, color: 'white', fontSize: '22px', fontWeight: '950', letterSpacing: '-0.5px' }}>Shift Completed</h3>
                                                </div>
                                            </div>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => startCamera('out')}
                                                style={{
                                                    width: '100%', maxWidth: '300px', height: '80px', borderRadius: '40px',
                                                    background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                                                    border: 'none',
                                                    color: 'white', cursor: 'pointer',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px',
                                                    boxShadow: '0 15px 30px rgba(244, 63, 94, 0.4)'
                                                }}
                                            >
                                                <LogOut size={24} />
                                                <span style={{ fontWeight: '950', fontSize: '22px', letterSpacing: '1px' }}>QUICK PUNCH OUT</span>
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Earnings & Presence Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                                <div style={{
                                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.6))',
                                    padding: '28px',
                                    borderRadius: '35px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                        <p style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', margin: 0, letterSpacing: '1.5px' }}>ACCUMULATED PAY</p>
                                    </div>
                                    <h2 style={{ fontSize: '40px', fontWeight: '950', margin: 0, color: 'white', letterSpacing: '-2px' }}>Rs. {report?.finalSalary?.toLocaleString() || '0'}</h2>
                                </div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    padding: '28px',
                                    borderRadius: '35px',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center'
                                }}>
                                    <span style={{ fontSize: '36px', color: 'white', fontWeight: '950', lineHeight: 1, letterSpacing: '-1px' }}>{report?.presentDays || 0}</span>
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', marginTop: '6px', letterSpacing: '1px' }}>PRESENCE</span>
                                </div>
                            </div>

                        </motion.div>

                    )}

                    {activeTab === 'attendance' && (
                        <motion.div
                            key="attendance"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, letterSpacing: '-0.5px' }}>
                                    <Clock size={22} color="#0ea5e9" /> ACTIVITY VAULT
                                </h3>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>{history.length} RECORDS FOUND</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {history.length === 0 ? (
                                    <div style={{ padding: '100px 20px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '40px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 25px' }}>
                                            <Clock size={40} style={{ opacity: 0.1 }} />
                                        </div>
                                        <h4 style={{ color: 'white', margin: '0 0 8px 0', fontWeight: '900' }}>Awaiting Signals</h4>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '700', fontSize: '13px' }}>Your activity logs will materialize here.</p>
                                    </div>
                                ) : history.map((item, idx) => (
                                    <motion.div
                                        key={item._id}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -5, background: 'rgba(30, 41, 59, 0.7)', borderColor: 'rgba(14, 165, 233, 0.3)' }}
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.5)',
                                            padding: '24px',
                                            borderRadius: '32px',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>
                                                    {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' })}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase' }}>{item.status === 'present' ? 'FULL DAY' : item.status}</span>
                                                    {item.punchIn?.location?.address === 'Admin Added' && (
                                                        <span style={{ fontSize: '9px', fontWeight: '900', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase' }}>OVERRIDE</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>DURATION</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '950', color: '#0ea5e9' }}>
                                                    {item.punchIn?.time && item.punchOut?.time ? (
                                                        (() => {
                                                            const diff = new Date(item.punchOut.time) - new Date(item.punchIn.time);
                                                            const hours = Math.floor(diff / (1000 * 60 * 60));
                                                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                            return `${hours}h ${minutes}m`;
                                                        })()
                                                    ) : '--'}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            {/* Punch In */}
                                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '18px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                                    <div style={{ width: '22px', height: '22px', borderRadius: '7px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <ArrowUpRight size={14} color="#10b981" />
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>ARRIVAL</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        {item.punchIn?.photo ? (
                                                            <img src={item.punchIn.photo} style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="Punch In" />
                                                        ) : (
                                                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><User size={20} style={{ opacity: 0.1 }} /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '16px', fontWeight: '950', color: 'white' }}>{item.punchIn?.time ? new Date(item.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', marginTop: '3px', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.punchIn?.location?.address || 'Verified Hub'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Punch Out */}
                                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '18px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                                    <div style={{ width: '22px', height: '22px', borderRadius: '7px', background: 'rgba(244, 63, 94, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <ArrowDownLeft size={14} color="#f43f5e" />
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>DEPARTURE</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        {item.punchOut?.photo ? (
                                                            <img src={item.punchOut.photo} style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="Punch Out" />
                                                        ) : (
                                                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><User size={20} style={{ opacity: 0.1 }} /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '16px', fontWeight: '950', color: 'white' }}>{item.punchOut?.time ? new Date(item.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', marginTop: '3px', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.punchOut?.location?.address || 'Verified Link'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {
                        activeTab === 'leaves' && (
                            <motion.div
                                key="leaves"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div style={{
                                    background: 'rgba(244, 63, 94, 0.08)',
                                    border: '1px solid rgba(244, 63, 94, 0.2)',
                                    padding: '25px',
                                    borderRadius: '32px',
                                    marginBottom: '35px',
                                    display: 'flex',
                                    gap: '20px',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ background: '#f43f5e', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px rgba(244, 63, 94, 0.4)' }}>
                                        <AlertCircle size={24} color="white" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '950', color: 'white' }}>Leave Allowance</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '700', lineHeight: '1.4' }}>
                                            Standard monthly allowance resets each cycle. Unapproved leaves will be deducted from daily accrual rate.
                                        </p>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '35px', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '35px' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: '950', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px' }}>
                                        <Calendar size={22} color="#fbbf24" /> FILE LEAVE REQUEST
                                    </h3>
                                    <form onSubmit={handleLeaveRequest} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                                            <div className="form-group">
                                                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '12px', display: 'block', letterSpacing: '2px' }}>DEPARTURE</label>
                                                <input type="date" required className="input-field" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} style={{ height: '56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                            </div>
                                            <div className="form-group">
                                                <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '12px', display: 'block', letterSpacing: '2px' }}>RETURN</label>
                                                <input type="date" required className="input-field" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} style={{ height: '56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '12px', display: 'block', letterSpacing: '2px' }}>REASONING CATEGORY</label>
                                            <select className="input-field" value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })} style={{ height: '56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                                                <option value="Sick Leave">Sick Leave / Medical</option>
                                                <option value="Casual Leave">Casual Leave</option>
                                                <option value="Personal">Personal Emergency</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', marginBottom: '12px', display: 'block', letterSpacing: '2px' }}>REASON (OPTIONAL DETAILS)</label>
                                            <textarea className="input-field" rows="3" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} style={{ height: 'auto', paddingTop: '18px', resize: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} placeholder="Provide necessary context..." />
                                        </div>
                                        <button type="submit" disabled={submittingLeave} style={{
                                            height: '64px',
                                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                            border: 'none',
                                            borderRadius: '20px',
                                            color: '#000',
                                            fontWeight: '950',
                                            fontSize: '16px',
                                            letterSpacing: '1px',
                                            cursor: 'pointer',
                                            boxShadow: '0 20px 40px -10px rgba(251, 191, 36, 0.4)',
                                            marginTop: '10px'
                                        }}>
                                            {submittingLeave ? 'TRANSMITTING...' : 'SUBMIT REQUEST'}
                                        </button>
                                    </form>
                                </div>

                                <h3 style={{ fontSize: '18px', fontWeight: '950', marginBottom: '20px', letterSpacing: '-0.5px' }}>SIGNAL HISTORY</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {leaves.length === 0 ? (
                                        <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.2)', fontWeight: '800' }}>NO PREVIOUS SIGNALS DETECTED</p>
                                        </div>
                                    ) : leaves.map(leave => (
                                        <div key={leave._id} style={{
                                            background: 'rgba(15, 23, 42, 0.4)',
                                            padding: '24px',
                                            borderRadius: '32px',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px' }}>{leave.type}</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: '900', color: 'white' }}>{new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                            </div>
                                            <div style={{
                                                padding: '8px 16px',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                fontWeight: '950',
                                                letterSpacing: '1px',
                                                background: leave.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : leave.status === 'Rejected' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                                color: leave.status === 'Approved' ? '#10b981' : leave.status === 'Rejected' ? '#f43f5e' : '#fbbf24',
                                                border: `1px solid ${leave.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : leave.status === 'Rejected' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`
                                            }}>
                                                {leave.status.toUpperCase()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    }

                    {
                        activeTab === 'salary' && (
                            <motion.div
                                key="salary"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {/* Salary Cycle Selector */}
                                {cycles.length > 0 && (
                                    <div style={{ marginBottom: '25px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '10px', display: 'block', letterSpacing: '2px' }}>
                                            FINANCIAL CYCLE
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                className="premium-input"
                                                style={{ height: '56px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '18px', fontWeight: '800', fontSize: '15px', padding: '0 20px', appearance: 'none', width: '100%' }}
                                                value={selectedCycleIndex}
                                                onChange={(e) => setSelectedCycleIndex(parseInt(e.target.value))}
                                            >
                                                {cycles.map((c, idx) => (
                                                    <option key={idx} value={idx}>
                                                        {c.cycleLabel} {idx === 0 ? '[ ACTIVE CYCLE ]' : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div style={{
                                    background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
                                    padding: '45px 30px',
                                    borderRadius: '40px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    textAlign: 'center',
                                    marginBottom: '30px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)'
                                }}>
                                    <div style={{ position: 'absolute', top: '-30%', right: '-20%', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 60%)', filter: 'blur(50px)' }}></div>
                                    <div style={{ position: 'absolute', bottom: '-30%', left: '-20%', width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 60%)', filter: 'blur(50px)' }}></div>

                                    <p style={{ fontSize: '10px', fontWeight: '950', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '15px', position: 'relative', zIndex: 2 }}>{selectedCycleIndex === 0 ? 'PROJECTED ACCRUAL' : 'TOTAL CYCLE EARNINGS'}</p>
                                    <h1 style={{ fontSize: '64px', fontWeight: '950', color: 'white', margin: '0 0 10px 0', letterSpacing: '-2px', textShadow: '0 0 40px rgba(16, 185, 129, 0.4)', position: 'relative', zIndex: 2 }}>
                                        <span style={{ fontSize: '32px', color: '#10b981', verticalAlign: 'top', marginRight: '4px' }}>Rs. </span>
                                        {report?.finalSalary?.toLocaleString() || '0'}
                                    </h1>
                                    <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 2 }}>
                                        <p style={{ fontSize: '11px', color: '#0ea5e9', margin: 0, fontWeight: '900', letterSpacing: '1px' }}>
                                            {report?.cycleLabel || ''}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <div style={{ padding: '24px 30px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '950', letterSpacing: '1px', color: 'white' }}>PAYROLL TELEMETRY</h4>
                                    </div>
                                    <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>Base Parameter (Monthly)</span>
                                            </div>
                                            <span style={{ fontWeight: '950', fontSize: '16px', color: 'white' }}>Rs. {report?.salary?.toLocaleString() || '0'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>Per Day Rate</span>
                                            </div>
                                            <span style={{ fontWeight: '950', fontSize: '16px', color: 'white' }}>Rs. {report?.salary ? Math.round(report?.salary / 30).toLocaleString() : '0'} / Day</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9' }}></div>
                                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>Active Presence</span>
                                            </div>
                                            <span style={{ fontWeight: '950', fontSize: '16px', color: '#0ea5e9' }}>{report?.presentDays || 0} Units</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px rgba(244,63,94,0.5)' }}></div>
                                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>Buffer Protocol Breach</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ fontWeight: '950', fontSize: '16px', color: '#f43f5e', display: 'block' }}>-Rs. {report?.deduction?.toLocaleString() || '0'}</span>
                                                {report?.extraLeaves > 0 && <span style={{ fontSize: '10px', color: 'rgba(244,63,94,0.6)', fontWeight: '800', letterSpacing: '1px' }}>({report.extraLeaves} Overage)</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}></div>
                                                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>Weekend Multiplier</span>
                                            </div>
                                            <span style={{ fontWeight: '950', fontSize: '16px', color: '#10b981' }}>+Rs. {report?.sundayBonus?.toLocaleString() || '0'}</span>
                                        </div>

                                        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)', margin: '5px 0' }}></div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ fontWeight: '950', fontSize: '14px', letterSpacing: '1px', color: 'rgba(255,255,255,0.8)' }}>NET YIELD</span>
                                            <span style={{ fontWeight: '950', fontSize: '24px', color: '#10b981' }}>Rs. {report?.finalSalary?.toLocaleString() || '0'}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >
            </main >

            {/* Holographic Camera Integration */}
            <AnimatePresence>
                {cameraActive && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(30px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(2, 6, 23, 0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(14, 165, 233, 0.3)', boxShadow: '0 0 20px rgba(14, 165, 233, 0.4)' }}>
                                    <Camera size={20} color="#0ea5e9" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '950', margin: 0, letterSpacing: '1px', color: 'white' }}>BIOMETRIC SCAN</h2>
                                    <p style={{ margin: 0, fontSize: '10px', color: '#0ea5e9', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>{punchType === 'in' ? 'Arrival Protocol' : 'Departure Protocol'}</p>
                                </div>
                            </div>
                            <button onClick={() => { stopCamera(); setCameraActive(false); }} style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '44px', height: '44px', borderRadius: '50%', transition: '0.3s' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '20px' }}>
                            <div style={{ position: 'relative', width: '100%', maxWidth: '350px', aspectRatio: '1/1', borderRadius: '50%', overflow: 'hidden', border: '5px solid rgba(14, 165, 233, 0.3)', boxShadow: '0 0 60px rgba(14, 165, 233, 0.4)' }}>
                                {!capturedPhoto ? (
                                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                ) : (
                                    <img src={capturedPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Captured Identity" />
                                )}
                                <canvas ref={canvasRef} style={{ display: 'none' }} />


                                {/* Active Scanning Ray */}
                                {!capturedPhoto && (
                                    <motion.div
                                        animate={{ y: [0, 450, 0] }}
                                        transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                                        style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '100px', background: 'linear-gradient(to bottom, transparent, rgba(14, 165, 233, 0.4), transparent)', borderBottom: '2px solid #0ea5e9', zIndex: 5, pointerEvents: 'none' }}
                                    />
                                )}

                                {/* Photo Captured Success State Overlay */}
                                {capturedPhoto && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 15 }}>
                                        <div style={{ background: '#10b981', borderRadius: '50%', padding: '10px', boxShadow: '0 0 30px #10b981', marginBottom: '10px' }}>
                                            <Check size={30} color="white" />
                                        </div>
                                        <span style={{ fontWeight: '950', fontSize: '18px', color: 'white', letterSpacing: '2px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>IDENTITY LOGGED</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '20px', background: 'linear-gradient(to top, #020617 80%, transparent)', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '400px' }}>
                                <button
                                    onClick={() => setCapturedPhoto(null)}
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', height: '64px', borderRadius: '30px', fontWeight: '950', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', letterSpacing: '1px' }}
                                >
                                    <RefreshCcw size={20} />
                                </button>
                                <button
                                    onClick={handleInstantPunch}
                                    disabled={punching}
                                    style={{ flex: 2, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', border: 'none', color: 'white', height: '64px', borderRadius: '30px', fontWeight: '950', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', fontSize: '16px', letterSpacing: '1px', boxShadow: '0 15px 30px rgba(99, 102, 241, 0.5)' }}
                                >
                                    {punching ? 'UPLOADING...' : <><Camera size={24} /> SECURE BIOMETRICS</>}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .spinner {
                    border: 3px solid rgba(14, 165, 233, 0.1);
                    border-radius: 50%;
                    border-top: 3px solid #0ea5e9;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .input-field {
                    width: 100%;
                    padding: 0 16px;
                    border-radius: 16px;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 20px;
                    transition: 0.3s;
                    box-sizing: border-box;
                }
                .input-field:focus {
                    border-color: #0ea5e9 !important;
                    outline: none;
                }
                ::-webkit-scrollbar { display: none; }
            `}</style>
        </div >
    );
};

export default StaffPortal;
