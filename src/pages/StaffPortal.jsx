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
    const [selectedPhoto, setSelectedPhoto] = useState(null);
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

    // Dynamic Color Mapping for Tabs
    const tabColors = {
        dashboard: '#0ea5e9',
        attendance: '#6366f1',
        leaves: '#fbbf24',
        salary: '#10b981'
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0B1121',
            color: 'white',
            fontFamily: "'Outfit', sans-serif",
            position: 'relative',
            overflowX: 'hidden',
            paddingBottom: '120px'
        }}>
            <SEO
                title="WORKFORCE COMMAND | BIOMETRIC PORTAL"
                description="High-fidelity biometric identity and payroll orchestration portal."
            />

            {/* Cinematic Background Elements */}
            <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '40%', height: '40%', background: `radial-gradient(circle, ${tabColors[activeTab]}15 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none', transition: 'background 0.8s ease', zIndex: 0 }}></div>
            <div style={{ position: 'fixed', bottom: '-10%', left: '-5%', width: '40%', height: '40%', background: `radial-gradient(circle, ${tabColors[activeTab]}10 0%, transparent 70%)`, filter: 'blur(80px)', pointerEvents: 'none', transition: 'background 0.8s ease', zIndex: 0 }}></div>
            <div style={{ position: 'fixed', top: '20%', left: '10%', width: '200px', height: '200px', background: `${tabColors[activeTab]}05`, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.8s ease', zIndex: 0 }}></div>

            {/* Photo Preview Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 15, 0.98)', zIndex: 11000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', backdropFilter: 'blur(30px)' }}
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ position: 'relative', width: '100%', maxWidth: '500px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={selectedPhoto} style={{ width: '100%', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }} alt="Sign-in Shot" />
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'white', color: 'black', border: 'none', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}
                            >
                                <X size={20} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header / Navigation Overlay */}
            <div style={{
                padding: '24px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'rgba(11, 17, 33, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '15px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                {user?.profilePhoto ? <img src={user.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.charAt(0)}
                            </div>
                            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', border: '2px solid #0B1121' }}></div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>{user?.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{user?.designation || 'Staff'}</span>
                                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                <span style={{ fontSize: '10px', color: '#0ea5e9', fontWeight: '900' }}>#{user?._id.slice(-4).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={logout}
                        style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '0 16px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '800', fontSize: '12px' }}
                    >
                        <LogOut size={18} />
                        EXIT
                    </motion.button>
                </div>
            </div>

            <main style={{
                maxWidth: '1200px',
                margin: '30px auto 40px',
                padding: '0 16px',
            }}>
                {/* Responsive Navigation Pills */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '8px',
                    borderRadius: '24px',
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '30px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(30px)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    position: 'sticky',
                    top: '90px',
                    zIndex: 90,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>
                    {[
                        { id: 'dashboard', label: 'HUB', icon: TrendingUp, color: '#0ea5e9' },
                        { id: 'attendance', label: 'LOGS', icon: Clock, color: '#6366f1' },
                        { id: 'leaves', label: 'LEAVES', icon: Calendar, color: '#fbbf24' },
                        { id: 'salary', label: 'PAY', icon: IndianRupee, color: '#10b981' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1,
                                minWidth: '90px',
                                padding: '14px 10px',
                                borderRadius: '18px',
                                border: 'none',
                                background: activeTab === tab.id ? `${tab.color}20` : 'transparent',
                                color: activeTab === tab.id ? tab.color : 'rgba(255,255,255,0.4)',
                                fontWeight: activeTab === tab.id ? '950' : '700',
                                fontSize: '11px',
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>


                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="resp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                                {/* Status Header - Spans full width */}
                                <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 10px #0ea5e9' }}></div>
                                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                            {currentTime.getHours() < 12 ? 'Morning Protocol' : (currentTime.getHours() < 17 ? 'Afternoon Shift' : 'Evening Rotation')}
                                        </span>
                                    </div>
                                    <h1 style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: '950', color: 'white', margin: 0, letterSpacing: '-1.5px' }}>
                                        Welcome, {user?.name.split(' ')[0]}
                                    </h1>
                                </div>

                                {/* Main Clock & Action Card */}
                                <motion.div
                                    style={{
                                        gridColumn: 'span 2',
                                        background: 'rgba(15, 23, 42, 0.4)',
                                        padding: 'clamp(40px, 10vw, 80px) 20px',
                                        borderRadius: '45px',
                                        textAlign: 'center',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        backdropFilter: 'blur(40px)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: '0 40px 100px -20px rgba(0,0,0,0.7), inset 0 0 1px 1px rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        minHeight: '420px'
                                    }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.12) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
                                    <div style={{ position: 'absolute', top: '20px', left: '20px', fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: '900', letterSpacing: '2px', mixBlendMode: 'overlay' }}>BIOMETRIC_PORTAL_V2.0</div>

                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        <div style={{
                                            fontSize: 'clamp(72px, 18vw, 120px)',
                                            fontWeight: '1000',
                                            margin: 0,
                                            letterSpacing: '-6px',
                                            color: 'white',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'baseline',
                                            gap: '6px',
                                            lineHeight: 0.9,
                                            textShadow: '0 0 40px rgba(14, 165, 233, 0.3)'
                                        }}>
                                            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            <motion.span
                                                animate={{ opacity: [1, 0.3, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                style={{ fontSize: 'clamp(24px, 5vw, 40px)', color: 'rgba(14, 165, 233, 0.5)', fontWeight: '600', letterSpacing: '0' }}
                                            >
                                                :{currentTime.toLocaleTimeString('en-IN', { second: '2-digit' })}
                                            </motion.span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '15px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <span style={{ fontSize: '11px', color: 'white', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                                    {currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'center' }}>
                                            {!status?.attendance ? (
                                                <motion.button
                                                    whileHover={{ scale: 1.05, y: -4, boxShadow: '0 25px 50px -12px rgba(14, 165, 233, 0.6)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => startCamera('in')}
                                                    style={{
                                                        width: '100%', maxWidth: '350px', height: '80px', borderRadius: '28px',
                                                        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                                        border: 'none', color: 'white', cursor: 'pointer',
                                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px',
                                                        boxShadow: '0 20px 40px -10px rgba(14, 165, 233, 0.4)',
                                                        fontSize: '20px', fontWeight: '1000', letterSpacing: '1px'
                                                    }}
                                                >
                                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <Camera size={24} />
                                                    </div>
                                                    INITIATE ARRIVAL
                                                </motion.button>
                                            ) : status.attendance?.punchOut?.time ? (
                                                <motion.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    style={{
                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                        padding: '30px 50px',
                                                        borderRadius: '32px',
                                                        border: '1px solid rgba(16, 185, 129, 0.25)',
                                                        display: 'inline-flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        boxShadow: 'inset 0 0 30px rgba(16, 185, 129, 0.1)'
                                                    }}>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 20px #10b981' }}>
                                                        <CheckCircle2 size={28} color="white" />
                                                    </div>
                                                    <span style={{ color: '#10b981', fontSize: '18px', fontWeight: '1000', letterSpacing: '1px' }}>SHIFT SECURED</span>
                                                </motion.div>
                                            ) : (
                                                <motion.button
                                                    whileHover={{ scale: 1.05, y: -4, boxShadow: '0 25px 50px -12px rgba(244, 63, 94, 0.6)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => startCamera('out')}
                                                    style={{
                                                        width: '100%', maxWidth: '350px', height: '80px', borderRadius: '28px',
                                                        background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                                                        border: 'none', color: 'white', cursor: 'pointer',
                                                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px',
                                                        boxShadow: '0 20px 40px -10px rgba(244, 63, 94, 0.4)',
                                                        fontSize: '20px', fontWeight: '1000', letterSpacing: '1px'
                                                    }}
                                                >
                                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        <LogOut size={24} />
                                                    </div>
                                                    TERMINATE DEPLOY
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Stats Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <motion.div
                                        whileHover={{ transform: 'translateY(-5px)' }}
                                        style={{
                                            background: 'rgba(16, 185, 129, 0.05)',
                                            padding: '28px',
                                            borderRadius: '35px',
                                            border: '1px solid rgba(16, 185, 129, 0.12)',
                                            backdropFilter: 'blur(30px)',
                                            flex: 1,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(30px)', borderRadius: '50%' }}></div>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                                            <IndianRupee size={20} color="#10b981" />
                                        </div>
                                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Accrued Yield</p>
                                        <h2 style={{ fontSize: '36px', margin: '4px 0', fontWeight: '950', color: 'white', letterSpacing: '-1px' }}>₹{report?.finalSalary?.toLocaleString() || '0'}</h2>
                                        <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#10b981', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{report?.presentDays || 0} COMPLETED CYCLES</p>
                                    </motion.div>

                                    <motion.div
                                        whileHover={{ transform: 'translateY(-5px)' }}
                                        style={{
                                            background: 'rgba(99, 102, 241, 0.05)',
                                            padding: '28px',
                                            borderRadius: '35px',
                                            border: '1px solid rgba(99, 102, 241, 0.12)',
                                            backdropFilter: 'blur(30px)',
                                            flex: 1,
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(30px)', borderRadius: '50%' }}></div>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                                            <TrendingUp size={20} color="#6366f1" />
                                        </div>
                                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Efficiency Index</p>
                                        <h2 style={{ fontSize: '36px', margin: '4px 0', fontWeight: '950', color: 'white', letterSpacing: '-1px' }}>{Math.round(((report?.presentDays || 0) / 26) * 100)}%</h2>
                                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '15px', overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((report?.presentDays || 0) / 26) * 100}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #0ea5e9)' }}
                                            />
                                        </div>
                                    </motion.div>
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
                            style={{ gridColumn: 'span 12' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '12px', margin: 0, letterSpacing: '-0.5px' }}>
                                    <Clock size={22} color="#0ea5e9" /> ACTIVITY VAULT
                                </h3>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>{history.length} RECORDS FOUND</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {history.length === 0 ? (
                                    <div style={{ gridColumn: '1 / -1', padding: '100px 20px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '40px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <Clock size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                                        <h4 style={{ color: 'white', margin: '0 0 8px 0', fontWeight: '950', fontSize: '18px' }}>No Activity Signals</h4>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '700', fontSize: '14px' }}>Deployment logs will appear in this secure vault.</p>
                                    </div>
                                ) : history.map((item, idx) => (
                                    <motion.div
                                        key={item._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        whileHover={{ y: -5, borderColor: 'rgba(14, 165, 233, 0.3)' }}
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.5)',
                                            padding: '24px',
                                            borderRadius: '32px',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '20px',
                                            transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            cursor: 'default',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>
                                                    {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                                                </div>
                                                <div style={{ fontSize: '20px', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>
                                                    {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '9px', fontWeight: '950', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '5px 12px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    {item.status === 'present' ? 'NORMALIZED' : item.status}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <p style={{ margin: '0 0 10px 0', fontSize: '9px', fontWeight: '950', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>ARRIVAL</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {item.punchIn?.photo ? (
                                                        <motion.img
                                                            whileHover={{ scale: 1.1 }}
                                                            src={item.punchIn.photo}
                                                            style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                                            onClick={() => setSelectedPhoto(item.punchIn.photo)}
                                                        />
                                                    ) : <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }} />}
                                                    <div>
                                                        <div style={{ fontSize: '15px', fontWeight: '950', color: 'white' }}>{item.punchIn?.time ? new Date(item.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <p style={{ margin: '0 0 10px 0', fontSize: '9px', fontWeight: '950', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>DEPARTURE</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {item.punchOut?.photo ? (
                                                        <motion.img
                                                            whileHover={{ scale: 1.1 }}
                                                            src={item.punchOut.photo}
                                                            style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                                            onClick={() => setSelectedPhoto(item.punchOut.photo)}
                                                        />
                                                    ) : <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }} />}
                                                    <div>
                                                        <div style={{ fontSize: '15px', fontWeight: '950', color: 'white' }}>{item.punchOut?.time ? new Date(item.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={10} color="#0ea5e9" />
                                                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>HUB VERIFIED</span>
                                            </div>
                                            {item.punchIn?.time && item.punchOut?.time && (
                                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#0ea5e9' }}>
                                                    {(() => {
                                                        const diff = new Date(item.punchOut.time) - new Date(item.punchIn.time);
                                                        const h = Math.floor(diff / 3600000);
                                                        const m = Math.floor((diff % 3600000) / 60000);
                                                        return `${h}H ${m}M TRANSIT`;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'leaves' && (
                        <motion.div
                            key="leaves"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: 'clamp(20px, 5vw, 40px)', borderRadius: '40px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '35px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

                                <h3 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', letterSpacing: '-1px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '15px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                        <Calendar size={22} color="#fbbf24" />
                                    </div>
                                    ABSENCE PROTOCOL
                                </h3>

                                <form onSubmit={handleLeaveRequest} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    <div className="resp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label">DEPARTURE CYCLE</label>
                                            <input type="date" required className="premium-compact-input" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} />
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">RETURN CYCLE</label>
                                            <input type="date" required className="premium-compact-input" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="premium-input-group">
                                        <label className="premium-label">CLASSIFICATION</label>
                                        <select className="premium-compact-input" value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}>
                                            <option value="Sick Leave">Medical / Recuperation</option>
                                            <option value="Casual Leave">Scheduled Absence</option>
                                            <option value="Personal">Critical Emergency</option>
                                        </select>
                                    </div>

                                    <div className="premium-input-group">
                                        <label className="premium-label">CONTEXTUAL BRIEF</label>
                                        <textarea className="premium-compact-input" rows="3" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} style={{ height: 'auto', paddingTop: '16px', resize: 'none' }} placeholder="Provide mission-critical details..." />
                                    </div>

                                    <motion.button
                                        type="submit"
                                        disabled={submittingLeave}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            height: '64px',
                                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                            border: 'none',
                                            borderRadius: '20px',
                                            color: '#000',
                                            fontWeight: '950',
                                            fontSize: '16px',
                                            letterSpacing: '1px',
                                            cursor: 'pointer',
                                            boxShadow: '0 15px 30px -5px rgba(251, 191, 36, 0.4)',
                                            marginTop: '10px'
                                        }}
                                    >
                                        {submittingLeave ? 'TRANSMITTING...' : 'AUTHORIZE REQUEST'}
                                    </motion.button>
                                </form>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }}></div>
                                <h3 style={{ fontSize: '18px', fontWeight: '950', margin: 0, letterSpacing: '-0.5px' }}>SIGNAL HISTORY</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {leaves.length === 0 ? (
                                    <div style={{ padding: '60px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '35px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontWeight: '900', letterSpacing: '2px' }}>NO DATA STREAMS</p>
                                    </div>
                                ) : leaves.map(leave => (
                                    <motion.div
                                        key={leave._id}
                                        whileHover={{ x: 5 }}
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.4)',
                                            padding: '24px',
                                            borderRadius: '24px',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '15px',
                                            flexWrap: 'wrap'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                                                <Info size={18} color="#fbbf24" />
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '950', color: 'white' }}>{new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' }}>{leave.type} CLASSIFICATION</p>
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '8px 16px',
                                            borderRadius: '10px',
                                            fontSize: '10px',
                                            fontWeight: '950',
                                            letterSpacing: '1.5px',
                                            background: leave.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : leave.status === 'Rejected' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                            color: leave.status === 'Approved' ? '#10b981' : leave.status === 'Rejected' ? '#f43f5e' : '#fbbf24',
                                            border: `1px solid ${leave.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : leave.status === 'Rejected' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`,
                                            textTransform: 'uppercase'
                                        }}>
                                            {leave.status}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'salary' && (
                        <motion.div
                            key="salary"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                        >
                            <div className="resp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                                {/* Cycle Selector & Main Display Card */}
                                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '4px', height: '16px', background: '#10b981', borderRadius: '4px' }}></div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '950', margin: 0, letterSpacing: '-0.5px' }}>FINANCIAL TELEMETRY</h3>
                                        </div>
                                        {cycles.length > 0 && (
                                            <select
                                                value={selectedCycleIndex}
                                                onChange={(e) => setSelectedCycleIndex(parseInt(e.target.value))}
                                                className="premium-compact-input"
                                                style={{ width: 'auto', height: '40px', padding: '0 35px 0 15px', marginBottom: 0 }}
                                            >
                                                {cycles.map((c, idx) => (
                                                    <option key={idx} value={idx}>{c.cycleLabel}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.5))',
                                        padding: 'clamp(30px, 8vw, 60px) 40px',
                                        borderRadius: '40px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        textAlign: 'center',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)'
                                    }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 70% 20%, rgba(16, 185, 129, 0.1), transparent 60%)' }}></div>
                                        <p style={{ fontSize: '11px', fontWeight: '950', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '15px' }}>
                                            {selectedCycleIndex === 0 ? 'ESTIMATED ACCRUAL' : 'SETTLED REVENUE'}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '10px' }}>
                                            <span style={{ fontSize: '32px', fontWeight: '900', color: '#10b981' }}>₹</span>
                                            <h1 style={{ fontSize: 'clamp(50px, 12vw, 80px)', fontWeight: '950', color: 'white', margin: 0, letterSpacing: '-3px' }}>
                                                {report?.finalSalary?.toLocaleString() || '0'}
                                            </h1>
                                        </div>
                                        <div style={{ marginTop: '25px', display: 'inline-flex', padding: '8px 24px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '100px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#10b981', fontWeight: '950', letterSpacing: '1px' }}>{report?.cycleLabel || 'ACTIVE STREAMS'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Breakdown Column */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{
                                        background: 'rgba(15, 23, 42, 0.4)',
                                        borderRadius: '35px',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        overflow: 'hidden',
                                        backdropFilter: 'blur(30px)'
                                    }}>
                                        <div style={{ padding: '24px 30px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '950', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>PAYROLL METRICS</span>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', alignSelf: 'center', boxShadow: '0 0 10px #10b981' }}></div>
                                        </div>
                                        <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {[
                                                { label: 'GROSS PAYOUT', value: report?.salary, color: 'white', icon: Briefcase },
                                                { label: 'ACTIVE DEPLOYS', value: `${report?.presentDays || 0} Days`, color: '#0ea5e9', icon: CheckCircle2 },
                                                { label: 'OVERTIME BONUS', value: report?.sundayBonus, color: '#10b981', prefix: '+ ₹', icon: TrendingUp },
                                                { label: 'MISSION DEDUCTION', value: report?.deduction, color: '#f43f5e', prefix: '- ₹', icon: AlertCircle }
                                            ].map((item, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <item.icon size={14} style={{ opacity: 0.3 }} />
                                                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>{item.label}</span>
                                                    </div>
                                                    <span style={{ fontSize: '16px', color: item.color, fontWeight: '950' }}>
                                                        {typeof item.value === 'number' ? `${item.prefix || '₹'} ${item.value.toLocaleString()}` : item.value}
                                                    </span>
                                                </div>
                                            ))}
                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                padding: '24px',
                                                borderRadius: '24px',
                                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                                boxShadow: 'inset 0 0 30px rgba(16, 185, 129, 0.05)'
                                            }}>
                                                <span style={{ fontSize: '15px', fontWeight: '950', color: 'rgba(255,255,255,0.8)' }}>NET REVENUE</span>
                                                <span style={{ fontSize: '24px', fontWeight: '950', color: '#10b981', letterSpacing: '-1px' }}>₹ {report?.finalSalary?.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence >
            </main >

            {/* Holographic Camera Integration */}
            < AnimatePresence >
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
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '350px',
                                aspectRatio: '1/1',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '4px solid rgba(14, 165, 233, 0.2)',
                                padding: '10px',
                                background: 'rgba(0,0,0,0.3)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 0 50px rgba(14, 165, 233, 0.15)'
                            }}>
                                <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                                    {!capturedPhoto ? (
                                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                    ) : (
                                        <img src={capturedPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Captured Identity" />
                                    )}
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                                    {/* Holographic Overlays */}
                                    {!capturedPhoto && (
                                        <>
                                            <div style={{ position: 'absolute', top: '10%', left: '10%', width: '20px', height: '20px', borderLeft: '2px solid #0ea5e9', borderTop: '2px solid #0ea5e9' }}></div>
                                            <div style={{ position: 'absolute', top: '10%', right: '10%', width: '20px', height: '20px', borderRight: '2px solid #0ea5e9', borderTop: '2px solid #0ea5e9' }}></div>
                                            <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '20px', height: '20px', borderLeft: '2px solid #0ea5e9', borderBottom: '2px solid #0ea5e9' }}></div>
                                            <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '20px', height: '20px', borderRight: '2px solid #0ea5e9', borderBottom: '2px solid #0ea5e9' }}></div>

                                            <motion.div
                                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '1px', background: 'rgba(14, 165, 233, 0.5)', zIndex: 10 }}
                                            ></motion.div>
                                            <motion.div
                                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                                                style={{ position: 'absolute', left: '50%', top: '5%', bottom: '5%', width: '1px', background: 'rgba(14, 165, 233, 0.5)', zIndex: 10 }}
                                            ></motion.div>
                                        </>
                                    )}

                                    {/* Active Scanning Ray */}
                                    {!capturedPhoto && (
                                        <motion.div
                                            animate={{ y: [-150, 450, -150] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            style={{
                                                position: 'absolute',
                                                top: '0',
                                                left: '0',
                                                right: '0',
                                                height: '100px',
                                                background: 'linear-gradient(to bottom, transparent, rgba(14, 165, 233, 0.4), transparent)',
                                                borderBottom: '2px solid #0ea5e9',
                                                zIndex: 11,
                                                pointerEvents: 'none'
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Photo Captured Success State Overlay */}
                                {capturedPhoto && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 15, borderRadius: '50%' }}>
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            style={{ background: '#10b981', borderRadius: '50%', padding: '15px', boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)', marginBottom: '15px' }}
                                        >
                                            <Check size={32} color="white" />
                                        </motion.div>
                                        <span style={{ fontWeight: '800', fontSize: '16px', color: 'white', letterSpacing: '3px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>BIOMETRIC VERIFIED</span>
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
            </AnimatePresence >

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