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
    Briefcase
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

    const takePhoto = () => {
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
        }
    };

    const handlePunch = async () => {
        if (!capturedPhoto) {
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
                photo: capturedPhoto
            });

            setCameraActive(false);
            setCapturedPhoto(null);
            fetchStatus();
            fetchHistory();
            fetchCycles();
        } catch (error) {
            alert(error.response?.data?.message || 'Error processing punch.');
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
                background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), transparent)',
                padding: '30px 20px',
                marginBottom: '20px'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '18px',
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 10px 20px rgba(14, 165, 233, 0.3)'
                        }}>
                            <User size={28} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>{user?.name}</h2>
                            <p style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', margin: '2px 0 0' }}>{user?.designation || 'Staff Member'}</p>
                            {user?.joiningDate && (
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: '600', margin: '2px 0 0' }}>
                                    📅 Joined: {new Date(user.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · Cycle: {new Date(user.joiningDate).getDate()}th
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', padding: '10px 18px', borderRadius: '14px', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <LogOut size={16} /> LOGOUT
                    </button>
                </div>
            </div>

            <main style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>

                {/* Navigation Pills */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '6px',
                    borderRadius: '20px',
                    display: 'flex',
                    gap: '6px',
                    marginBottom: '30px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflowX: 'auto',
                    scrollbarWidth: 'none'
                }}>
                    {[
                        { id: 'dashboard', label: 'DASHBOARD', icon: TrendingUp },
                        { id: 'attendance', label: 'HISTORY', icon: Clock },
                        { id: 'leaves', label: 'EMERGENCY', icon: Calendar },
                        { id: 'salary', label: 'PAYROLL', icon: IndianRupee }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1,
                                minWidth: '100px',
                                padding: '12px 10px',
                                borderRadius: '15px',
                                border: 'none',
                                background: activeTab === tab.id ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)',
                                fontWeight: '900',
                                fontSize: '10px',
                                letterSpacing: '0.5px',
                                cursor: 'pointer',
                                transition: '0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {/* Current Time Card */}
                            <div style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                padding: '40px 20px',
                                borderRadius: '32px',
                                textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.06)',
                                backdropFilter: 'blur(10px)',
                                marginBottom: '24px'
                            }}>
                                <p style={{ fontSize: '13px', color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>
                                    {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                                <h1 style={{ fontSize: '56px', fontWeight: '900', margin: 0, letterSpacing: '-2px' }}>
                                    {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    <span style={{ fontSize: '20px', opacity: 0.3, marginLeft: '8px' }}>{currentTime.toLocaleTimeString('en-IN', { second: '2-digit' })}</span>
                                </h1>

                                <div style={{ marginTop: '40px' }}>
                                    {!status ? (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => startCamera('in')}
                                            style={{
                                                width: '180px', height: '180px', borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                                border: '8px solid rgba(14, 165, 233, 0.2)',
                                                color: 'white', fontWeight: '900', fontSize: '18px',
                                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '15px',
                                                boxShadow: '0 20px 40px rgba(14, 165, 233, 0.4)', cursor: 'pointer'
                                            }}
                                        >
                                            <Camera size={40} />
                                            PUNCH IN
                                        </motion.button>
                                    ) : status.punchOut?.time ? (
                                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            <CheckCircle2 size={50} color="#10b981" style={{ margin: '0 auto 15px' }} />
                                            <h3 style={{ margin: 0, color: '#10b981', fontWeight: '900' }}>DUTY COMPLETED</h3>
                                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>See you tomorrow, {user?.name.split(' ')[0]}!</p>
                                        </div>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => startCamera('out')}
                                            style={{
                                                width: '180px', height: '180px', borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                                                border: '8px solid rgba(244, 63, 94, 0.2)',
                                                color: 'white', fontWeight: '900', fontSize: '18px',
                                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '15px',
                                                boxShadow: '0 20px 40px rgba(244, 63, 94, 0.4)', cursor: 'pointer'
                                            }}
                                        >
                                            <Camera size={40} />
                                            PUNCH OUT
                                        </motion.button>
                                    )}
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <ArrowUpRight size={16} color="#10b981" />
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>CHECK IN</span>
                                    </div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{status?.punchIn?.time ? new Date(status.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</h2>
                                </div>

                                <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <ArrowDownLeft size={16} color="#f43f5e" />
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>CHECK OUT</span>
                                    </div>
                                    <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{status?.punchOut?.time ? new Date(status.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</h2>
                                </div>
                            </div>

                            {/* Monthly Quick View */}
                            <div style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(99, 102, 241, 0.1))', padding: '24px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }}>Current Month Est.</p>
                                    <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: '#10b981' }}>₹{report?.finalSalary?.toLocaleString() || '0'}</h2>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase' }}>Present Days</p>
                                    <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{report?.presentDays || 0}d</h2>
                                </div>
                            </div>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '15px' }}>
                                *Attendance is expected for all 30 days. Emergency leave buffer is for urgent cases only.
                            </p>
                        </motion.div>
                    )}

                    {activeTab === 'attendance' && (
                        <motion.div
                            key="attendance"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Clock size={20} color="#0ea5e9" /> ACTIVITY LOGS
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {history.length === 0 ? (
                                    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px' }}>
                                        <Clock size={48} style={{ opacity: 0.1, marginBottom: '15px' }} />
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>No activity records found.</p>
                                    </div>
                                ) : history.map(item => (
                                    <div key={item._id} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '15px' }}>{item.date}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {item.status === 'present' ? 'FULL DAY DUTY' : item.status.toUpperCase()}
                                                {item.punchIn?.location?.address === 'Admin Added' && (
                                                    <span style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', padding: '2px 7px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', border: '1px solid rgba(251,191,36,0.2)' }}>ADMIN</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#10b981' }}>{item.punchIn?.time ? new Date(item.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                                <div style={{ fontSize: '13px', fontWeight: '900', color: '#f43f5e', marginTop: '4px' }}>{item.punchOut?.time ? new Date(item.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</div>
                                            </div>
                                            <ChevronRight size={16} color="rgba(255,255,255,0.1)" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'leaves' && (
                        <motion.div
                            key="leaves"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            {/* Emergency Notice */}
                            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '15px 20px', borderRadius: '20px', marginBottom: '25px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <AlertCircle size={20} color="#f43f5e" />
                                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                                    <strong>Emergency Policy:</strong> Staff is expected to be present for 30 days. These 4 leaves are reserved for <strong>emergencies only</strong>. Unnecessary leaves are discouraged.
                                </p>
                            </div>

                            <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '30px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '30px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Calendar size={20} color="#fbbf24" /> REPORT EMERGENCY LEAVE
                                </h3>
                                <form onSubmit={handleLeaveRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', display: 'block', letterSpacing: '1px' }}>Start Date</label>
                                            <input type="date" required className="input-field" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} style={{ marginBottom: 0, height: '52px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', display: 'block', letterSpacing: '1px' }}>End Date</label>
                                            <input type="date" required className="input-field" value={leaveForm.endDate} onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} style={{ marginBottom: 0, height: '52px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', display: 'block', letterSpacing: '1px' }}>Leave Category</label>
                                        <select className="input-field" value={leaveForm.type} onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })} style={{ marginBottom: 0, height: '52px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                                            <option value="Sick Leave">Sick Leave</option>
                                            <option value="Casual Leave">Casual Leave</option>
                                            <option value="Personal">Personal</option>
                                            <option value="Emergency">Emergency</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', display: 'block', letterSpacing: '1px' }}>Reason / Details</label>
                                        <textarea className="input-field" rows="3" value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} style={{ marginBottom: 0, resize: 'none', padding: '15px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
                                    </div>
                                    <button type="submit" disabled={submittingLeave} style={{ height: '56px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', border: 'none', borderRadius: '16px', color: 'white', fontWeight: '900', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)' }}>
                                        {submittingLeave ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                                    </button>
                                </form>
                            </div>

                            <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '20px' }}>PREVIOUS REQUESTS</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {leaves.length === 0 ? (
                                    <p style={{ textAlign: 'center', opacity: 0.3, padding: '20px' }}>No leave history.</p>
                                ) : leaves.map(leave => (
                                    <div key={leave._id} style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <span style={{ fontWeight: '900', fontSize: '14px' }}>{leave.type}</span>
                                            <span style={{ fontSize: '10px', fontWeight: '900', color: leave.status === 'Approved' ? '#10b981' : leave.status === 'Rejected' ? '#f43f5e' : '#fbbf24', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px' }}>
                                                {leave.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{leave.startDate} to {leave.endDate}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'salary' && (
                        <motion.div
                            key="salary"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                        >
                            {/* Salary Cycle Selector */}
                            {cycles.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '1px' }}>
                                        SELECT SALARY CYCLE
                                    </label>
                                    <select
                                        className="input-field"
                                        style={{ height: '52px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '16px', fontWeight: '700' }}
                                        value={selectedCycleIndex}
                                        onChange={(e) => setSelectedCycleIndex(parseInt(e.target.value))}
                                    >
                                        {cycles.map((c, idx) => (
                                            <option key={idx} value={idx}>
                                                {c.cycleLabel} {idx === 0 ? '(Current)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{
                                background: 'linear-gradient(135deg, #0f172a, #020617)',
                                padding: '40px 30px',
                                borderRadius: '32px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                textAlign: 'center',
                                marginBottom: '25px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)', filter: 'blur(40px)' }}></div>
                                <p style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>{selectedCycleIndex === 0 ? 'Current Cycle Estimate' : 'Cycle Earnings'}</p>
                                <h1 style={{ fontSize: '56px', fontWeight: '900', color: '#10b981', margin: 0 }}>₹{report?.finalSalary?.toLocaleString() || '0'}</h1>
                                <p style={{ fontSize: '12px', color: '#0ea5e9', marginTop: '10px', fontWeight: '800' }}>
                                    {report?.cycleLabel || ''}
                                </p>
                            </div>

                            <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900' }}>PAYROLL BREAKDOWN</h4>
                                </div>
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Monthly Base Salary</span>
                                        <span style={{ fontWeight: '900' }}>₹{report?.salary?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Days Present</span>
                                        <span style={{ fontWeight: '900' }}>{report?.presentDays || 0} Days</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '14px', color: 'rgba(244, 63, 94, 0.6)', fontWeight: '700' }}>Leaves (Over Emergency Buffer)</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontWeight: '900', color: '#f43f5e', display: 'block' }}>-₹{report?.deduction?.toLocaleString() || '0'}</span>
                                            {report?.extraLeaves > 0 && <span style={{ fontSize: '10px', color: 'rgba(244,63,94,0.6)', fontWeight: '700' }}>({report.extraLeaves} extra leave{report.extraLeaves > 1 ? 's' : ''})</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '14px', color: 'rgba(16, 185, 129, 0.6)', fontWeight: '700' }}>Sunday Bonuses</span>
                                        <span style={{ fontWeight: '900', color: '#10b981' }}>+₹{report?.sundayBonus?.toLocaleString() || '0'}</span>
                                    </div>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '900', fontSize: '16px' }}>NET PAYABLE</span>
                                        <span style={{ fontWeight: '900', fontSize: '20px', color: '#10b981' }}>₹{report?.finalSalary?.toLocaleString() || '0'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Camera Overlay */}
            <AnimatePresence>
                {cameraActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>ID VERIFICATION</h2>
                            <button onClick={() => { stopCamera(); setCameraActive(false); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <X size={28} />
                            </button>
                        </div>

                        <div style={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                            {!capturedPhoto ? (
                                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                            ) : (
                                <img src={capturedPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            {/* Scanning Effect Overlay */}
                            {!capturedPhoto && (
                                <motion.div
                                    animate={{ y: [0, 300, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    style={{ position: 'absolute', top: '10%', left: '10%', right: '10%', height: '2px', background: 'rgba(14, 165, 233, 0.5)', boxShadow: '0 0 20px #0ea5e9', zIndex: 5 }}
                                />
                            )}
                        </div>

                        <div style={{ padding: '50px 20px', background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                            {!capturedPhoto ? (
                                <button
                                    onClick={takePhoto}
                                    style={{
                                        width: '80px', height: '80px', borderRadius: '50%', background: 'white',
                                        border: '8px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid #000' }} />
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: '20px', width: '100%', maxWidth: '400px' }}>
                                    <button
                                        onClick={() => { setCapturedPhoto(null); startCamera(punchType); }}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '18px', borderRadius: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
                                    >
                                        <RefreshCcw size={20} /> RETAKE
                                    </button>
                                    <button
                                        onClick={handlePunch}
                                        disabled={punching}
                                        style={{ flex: 1, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', border: 'none', color: 'white', padding: '18px', borderRadius: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.4)' }}
                                    >
                                        {punching ? 'VERIFYING...' : <><Check size={20} /> AUTHORIZE</>}
                                    </button>
                                </div>
                            )}
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
        </div>
    );
};

export default StaffPortal;
