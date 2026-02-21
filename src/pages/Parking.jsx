import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import * as XLSX from 'xlsx';
import {
    MapPin, Plus, Search, Trash2, Calendar, History, Car, User, Shield, FileSpreadsheet, Edit, IndianRupee, Eye, X, Image as ImageIcon, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const CameraModal = ({ onCapture, onClose }) => {
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const streamRef = React.useRef(null);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = newStream;
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Could not access camera. Please ensure permissions are granted.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const capture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                const file = new File([blob], `parking.jpg`, { type: 'image/jpeg' });
                onCapture(file, canvas.toDataURL('image/jpeg'));
                stopCamera();
                onClose();
            }, 'image/jpeg', 0.8);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ color: 'white', margin: 0 }}>Capture Parking Photo</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                {error ? (
                    <div style={{ color: '#f43f5e', padding: '20px', textAlign: 'center' }}>{error}</div>
                ) : (
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px', background: 'black' }} />
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {!error && (
                    <button onClick={capture} style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <Camera size={20} /> CAPTURE PHOTO
                    </button>
                )}
            </div>
        </div>
    );
};

const ParkingPage = () => {
    const { selectedCompany } = useCompany();
    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseUrl = import.meta.env.VITE_API_URL || '';
        return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    };
    const [entries, setEntries] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [pendingEntries, setPendingEntries] = useState([]);
    const [carServiceEntries, setCarServiceEntries] = useState([]);
    const [activeTab, setActiveTab] = useState('parking'); // 'parking' | 'carservices'
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDriver, setFilterDriver] = useState('All');
    const [dateRange, setDateRange] = useState({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    // Form State
    const [formData, setFormData] = useState({
        driverId: '',
        driver: '', // Will start storing name here too for legacy/display
        amount: '',
        date: new Date().toISOString().split('T')[0],
        receiptPhoto: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [lastSeenPendingOther, setLastSeenPendingOther] = useState(0);
    const [lastSeenPendingParking, setLastSeenPendingParking] = useState(0);

    useEffect(() => {
        if (selectedCompany) {
            fetchEntries();
            fetchPendingEntries();
            fetchDrivers();
            fetchCarServiceEntries();
        }
    }, [selectedCompany, dateRange]);

    useEffect(() => {
        if (activeTab === 'carservices') {
            setLastSeenPendingOther(pendingEntries.filter(e => e.type === 'other').length);
        } else if (activeTab === 'parking') {
            setLastSeenPendingParking(pendingEntries.filter(e => e.type === 'parking').length);
        }
    }, [activeTab, pendingEntries]);

    const fetchPendingEntries = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/parking/pending/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPendingEntries(data || []);
        } catch (err) { console.error(err); }
    };

    const fetchCarServiceEntries = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(
                `/api/admin/car-services/${selectedCompany._id}?from=${dateRange.from}&to=${dateRange.to}`,
                { headers: { Authorization: `Bearer ${userInfo.token}` } }
            );
            setCarServiceEntries(data || []);
        } catch (err) { console.error('Car services fetch error:', err); }
    };

    const fetchEntries = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/parking/${selectedCompany._id}?from=${dateRange.from}&to=${dateRange.to}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setEntries(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchDrivers = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false&isFreelancer=false`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setDrivers(data.drivers || []);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.post('/api/admin/parking', {
                ...formData,
                companyId: selectedCompany._id
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });

            alert('Parking entry added successfully');
            setShowModal(false);
            resetForm();
            fetchEntries();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving entry');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.delete(`/api/admin/parking/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchEntries();
        } catch (err) { console.error(err); }
    };

    const handleApproveReject = async (attendanceId, expenseId, status) => {
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.patch(`/api/admin/attendance/${attendanceId}/expense/${expenseId}`,
                { status },
                { headers: { Authorization: `Bearer ${userInfo.token}` } }
            );
            fetchPendingEntries();
            fetchEntries();
        } catch (err) {
            console.error(err);
            alert('Error processing request');
        }
    };

    const handleEdit = (entry) => {
        setFormData({
            driverId: entry.driverId?._id || '',
            driver: entry.driver || '',
            amount: entry.amount || '',
            date: new Date(entry.date).toISOString().split('T')[0],
            receiptPhoto: entry.receiptPhoto || ''
        });
        setShowModal(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.type === 'change' ? e.target.files[0] : e;
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);
        uploadData.append('upload_preset', 'yatreedestination');

        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

            const res = await axios.post('/api/admin/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo?.token}` }
            });
            setFormData({ ...formData, receiptPhoto: res.data.url });
        } catch (err) {
            console.error('Upload failed:', err);
            alert('Image upload failed. Please try again.');
        }
    };

    const resetForm = () => {
        setFormData({
            driverId: '',
            driver: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            receiptPhoto: ''
        });
    };

    const downloadExcel = () => {
        const dataToExport = filteredEntries.map(e => ({
            'Date': new Date(e.date).toLocaleDateString('en-IN'),
            'Vehicle': e.vehicle?.carNumber || 'N/A',
            'Driver': e.driver || 'N/A',
            'Amount (₹)': e.amount,
            'Source': e.source || 'Admin'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Parking Logs');
        XLSX.writeFile(wb, `Parking_Report_${selectedCompany?.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const filteredEntries = entries.filter(e => {
        const carNum = e.vehicle?.carNumber || '';
        const drvName = e.driver || '';

        const matchesSearch = (carNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
            drvName.toLowerCase().includes(searchTerm.toLowerCase()));

        const isFreelancer = e.driverId?.isFreelancer || e.driver?.includes('(F)');
        if (isFreelancer) return false;

        const matchesDriver = filterDriver === 'All' || (e.driverId?._id === filterDriver) || (e.driver === filterDriver);
        return matchesSearch && matchesDriver;
    });

    const totalAmount = filteredEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const driverAmount = filteredEntries.filter(e => e.source === 'Driver').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const officeAmount = filteredEntries.filter(e => e.source === 'Admin').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const pendingParking = pendingEntries.filter(e => e.type === 'parking');
    const pendingOther = pendingEntries.filter(e => e.type === 'other');

    const unreadParking = Math.max(0, pendingParking.length - (activeTab === 'parking' ? pendingParking.length : lastSeenPendingParking));
    const unreadOther = Math.max(0, pendingOther.length - (activeTab === 'carservices' ? pendingOther.length : lastSeenPendingOther));

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Parking Management" description="Track parking expenses, driver payments, and office costs." />

            <header style={{ padding: 'clamp(20px, 4vw, 40px) 0' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: 'clamp(40px,10vw,50px)',
                            height: 'clamp(40px,10vw,50px)',
                            background: 'linear-gradient(135deg, white, #f8fafc)',
                            borderRadius: '16px',
                            padding: '8px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}>
                            <MapPin size={28} color="#fbbf24" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                                <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Logistics Hub</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', margin: 0, letterSpacing: '-1px', cursor: 'pointer' }}>
                                Parking <span className="text-gradient-yellow">Manager</span>
                            </h1>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        width: 'auto',
                        justifyContent: 'flex-start'
                    }}>
                        <button
                            onClick={downloadExcel}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                height: '48px',
                                padding: '0 20px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                background: 'rgba(255,255,255,0.03)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                flex: '1 1 auto'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        >
                            <FileSpreadsheet size={18} /> <span className="hide-mobile">Export Report</span>
                            <span className="show-mobile">Export</span>
                        </button>
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                height: '48px',
                                padding: '0 24px',
                                borderRadius: '12px',
                                fontWeight: '800',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                                color: 'black',
                                border: 'none',
                                boxShadow: '0 8px 20px -6px rgba(251, 191, 36, 0.5)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                flex: '1 1 180px',
                                justifyContent: 'center',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Plus size={20} /> <span>New Entry</span>
                        </button>
                    </div>
                </div>

                <div className="glass-card" style={{
                    padding: '12px',
                    borderRadius: '16px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        width: '100%'
                    }}>
                        <div style={{ position: 'relative', flex: '1 1 300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '15px', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="text"
                                placeholder="Search vehicle, driver or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    height: '48px',
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px',
                                    padding: '0 15px 0 45px',
                                    color: 'white',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div className="glass-card" style={{ padding: '0 15px', display: 'flex', alignItems: 'center', height: '48px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', flex: '1 1 200px', background: 'rgba(0,0,0,0.2)' }}>
                            <User size={18} style={{ marginRight: '10px', color: 'var(--primary)' }} />
                            <select
                                value={filterDriver}
                                onChange={(e) => setFilterDriver(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%' }}
                            >
                                <option value="All" style={{ background: '#1e293b' }}>All Drivers</option>
                                {drivers.map(d => (
                                    <option key={d._id} value={d._id} style={{ background: '#1e293b' }}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            flex: '1 1 300px',
                            minWidth: '0'
                        }} className="mobile-stack">
                            <div style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
                                <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '17px', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{
                                        height: '48px',
                                        padding: '0 12px 0 35px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        width: '100%',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        colorScheme: 'dark'
                                    }}
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                />
                            </div>
                            <div style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
                                <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '17px', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type="date"
                                    className="input-field"
                                    style={{
                                        height: '48px',
                                        padding: '0 12px 0 35px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        width: '100%',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        colorScheme: 'dark'
                                    }}
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Tab Switcher ── */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '32px',
                background: 'rgba(255,255,255,0.03)',
                padding: '6px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)',
                width: 'fit-content'
            }}>
                {[
                    { key: 'parking', label: '🅿️ Parking Logs', count: pendingParking.length, badge: unreadParking > 0 },
                    { key: 'carservices', label: '🚗 Car Services', count: pendingOther.length, badge: unreadOther > 0 }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '10px 22px',
                            borderRadius: '12px',
                            fontWeight: '800',
                            fontSize: '13px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            background: activeTab === tab.key
                                ? tab.key === 'carservices'
                                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                    : 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                : 'transparent',
                            color: activeTab === tab.key ? 'white' : 'rgba(255,255,255,0.45)',
                            boxShadow: activeTab === tab.key
                                ? tab.key === 'carservices' ? '0 4px 16px rgba(245,158,11,0.35)' : '0 4px 16px rgba(99,102,241,0.35)'
                                : 'none',
                            position: 'relative'
                        }}
                    >
                        {tab.label}
                        {tab.badge && (
                            <span style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                background: '#f43f5e',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '10px',
                                fontWeight: '900',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(244, 63, 94, 0.4)'
                            }}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════
                CAR SERVICES SECTION (Car Wash / Puncture)
               ══════════════════════════════════════════ */}
            {activeTab === 'carservices' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    {/* Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px',
                        marginBottom: '32px'
                    }}>
                        {[
                            {
                                label: 'Total Spent',
                                value: `₹${carServiceEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString()}`,
                                icon: '💰', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)'
                            },
                            {
                                label: 'Total Services',
                                value: carServiceEntries.length,
                                icon: '🔧', color: '#818cf8', bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)'
                            },
                            {
                                label: 'Car Wash',
                                value: carServiceEntries.filter(e => (e.notes || '').toLowerCase().includes('car wash')).length,
                                icon: '🛁', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.2)'
                            },
                            {
                                label: 'Puncture',
                                value: carServiceEntries.filter(e => (e.notes || '').toLowerCase().includes('puncture')).length,
                                icon: '🔩', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)'
                            }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -4 }}
                                className="glass-card"
                                style={{
                                    padding: '20px 24px',
                                    background: stat.bg,
                                    border: `1px solid ${stat.border}`,
                                    borderRadius: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}
                            >
                                <span style={{ fontSize: '28px' }}>{stat.icon}</span>
                                <div>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px', letterSpacing: '1px' }}>{stat.label}</p>
                                    <h2 style={{ color: stat.color, fontSize: '26px', fontWeight: '900', margin: 0 }}>{stat.value}</h2>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Table */}
                    <div className="glass-card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(245,158,11,0.15)' }}>
                        <div style={{
                            padding: '20px 24px',
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.06))',
                            borderBottom: '1px solid rgba(245,158,11,0.12)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <h3 style={{ color: '#fbbf24', fontSize: '16px', fontWeight: '900', margin: 0 }}>Car Services Log</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '4px 0 0' }}>Approved Car Wash & Puncture entries from drivers</p>
                            </div>
                            <span style={{
                                background: 'rgba(245,158,11,0.15)',
                                color: '#f59e0b',
                                padding: '4px 14px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '800',
                                border: '1px solid rgba(245,158,11,0.25)'
                            }}>{carServiceEntries.length} Records</span>
                        </div>

                        {carServiceEntries.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <span style={{ fontSize: '48px' }}>🚗</span>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginTop: '16px' }}>No car service records in this date range</p>
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>Car Wash & Puncture entries will appear here after driver submits and admin approves</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                            {['Date', 'Driver', 'Vehicle', 'Service', 'Amount', 'Receipt'].map(h => (
                                                <th key={h} style={{
                                                    padding: '14px 20px',
                                                    textAlign: 'left',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    whiteSpace: 'nowrap'
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carServiceEntries.map((entry, i) => {
                                            const serviceTypes = (entry.notes || 'Other').split(',').map(s => s.trim());
                                            return (
                                                <tr
                                                    key={entry._id}
                                                    style={{
                                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                        background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(245,158,11,0.05)'}
                                                    onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
                                                >
                                                    <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                                                        {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <p style={{ color: 'white', fontWeight: '700', margin: 0, fontSize: '13px' }}>{entry.driver}</p>
                                                    </td>
                                                    <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '600' }}>
                                                        {entry.vehicle?.carNumber || 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                            {serviceTypes.map((st, j) => (
                                                                <span key={j} style={{
                                                                    background: st.toLowerCase().includes('wash') ? 'rgba(34,211,238,0.12)' : st.toLowerCase().includes('puncture') ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                                                    color: st.toLowerCase().includes('wash') ? '#22d3ee' : st.toLowerCase().includes('puncture') ? '#10b981' : '#f59e0b',
                                                                    padding: '3px 10px',
                                                                    borderRadius: '20px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '800',
                                                                    border: `1px solid ${st.toLowerCase().includes('wash') ? 'rgba(34,211,238,0.2)' : st.toLowerCase().includes('puncture') ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                                                    textTransform: 'capitalize'
                                                                }}>{st}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '15px' }}>₹{(Number(entry.amount) || 0).toLocaleString()}</span>
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        {entry.receiptPhoto ? (
                                                            <img
                                                                src={getImageUrl(entry.receiptPhoto)}
                                                                onClick={() => { setSelectedImage(entry.receiptPhoto); setShowImageModal(true); }}
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                                                alt="receipt"
                                                            />
                                                        ) : (
                                                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ── SHARED PENDING APPROVALS SECTION ── */}
            {(activeTab === 'parking' ? pendingParking.length : pendingOther.length) > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: activeTab === 'carservices' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: activeTab === 'carservices' ? '#f59e0b' : '#f43f5e'
                        }}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0 }}>Review Requests</h3>
                            <p style={{
                                color: activeTab === 'carservices' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(244, 63, 94, 0.6)',
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                margin: 0
                            }}>
                                {(activeTab === 'parking' ? pendingParking : pendingOther).length} Pending {activeTab === 'carservices' ? 'Services' : 'Approvals'}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {(activeTab === 'parking' ? pendingParking : pendingOther).map((entry) => {
                            // Determine display label based on type
                            const serviceLabel = entry.type === 'other'
                                ? (entry.fuelType || 'Other Service')
                                : 'Parking';
                            const isOtherService = entry.type === 'other';
                            const labelColor = isOtherService ? '#f59e0b' : '#818cf8';
                            const labelBg = isOtherService ? 'rgba(245,158,11,0.1)' : 'rgba(129,140,248,0.1)';
                            const labelBorder = isOtherService ? 'rgba(245,158,11,0.25)' : 'rgba(129,140,248,0.25)';

                            return (
                                <motion.div
                                    key={entry._id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="glass-card"
                                    style={{
                                        padding: '24px',
                                        border: `1px solid ${activeTab === 'carservices' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                                        background: activeTab === 'carservices'
                                            ? 'linear-gradient(145deg, rgba(245, 158, 11, 0.05), rgba(15, 23, 42, 0.4))'
                                            : 'linear-gradient(145deg, rgba(244, 63, 94, 0.05), rgba(15, 23, 42, 0.4))',
                                        borderRadius: '20px'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                        {entry.slipPhoto ? (
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={getImageUrl(entry.slipPhoto)}
                                                    onClick={() => { setSelectedImage(entry.slipPhoto); setShowImageModal(true); }}
                                                    style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}
                                                />
                                                <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: isOtherService ? '#f59e0b' : '#f43f5e', color: 'white', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '900' }}>{isOtherService ? 'BILL' : 'SLIP'}</div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => { setSelectedImage(''); setShowImageModal(true); }}
                                                style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                            >
                                                <Eye size={24} color="rgba(255,255,255,0.2)" />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                                                <h4 style={{ color: 'white', fontWeight: '900', fontSize: '22px', margin: 0 }}>₹{entry.amount}</h4>
                                                <span style={{
                                                    background: activeTab === 'carservices' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                                    color: activeTab === 'carservices' ? '#f59e0b' : '#f43f5e',
                                                    fontSize: '9px',
                                                    padding: '3px 8px',
                                                    borderRadius: '6px',
                                                    fontWeight: '800',
                                                    textTransform: 'uppercase',
                                                    border: `1px solid ${activeTab === 'carservices' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
                                                }}>Review</span>
                                            </div>
                                            <span style={{
                                                display: 'inline-block',
                                                background: labelBg,
                                                color: labelColor,
                                                fontSize: '10px',
                                                padding: '2px 10px',
                                                borderRadius: '6px',
                                                fontWeight: '800',
                                                border: `1px solid ${labelBorder}`,
                                                marginTop: '6px',
                                                marginBottom: '2px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {serviceLabel}
                                            </span>
                                            <p style={{ color: 'white', fontSize: '13px', fontWeight: '700', margin: '4px 0 0' }}>{entry.driver}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0' }}>{entry.carNumber}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => handleApproveReject(entry.attendanceId, entry._id, 'approved')}
                                            style={{
                                                flex: 1.5,
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                                            }}
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleApproveReject(entry.attendanceId, entry._id, 'rejected')}
                                            style={{ flex: 1, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ══ PARKING TAB CONTENT ══ */}
            {activeTab === 'parking' && (
                <>

                    {/* Stats Row */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                        gap: '20px',
                        marginBottom: '40px'
                    }}>
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="glass-card"
                            style={{
                                padding: '24px',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(30, 41, 59, 0.4) 100%)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px'
                            }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <IndianRupee size={28} />
                            </div>
                            <div>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Total Expense</p>
                                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>₹{totalAmount.toLocaleString()}</h2>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="glass-card"
                            style={{
                                padding: '24px',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 0.4) 100%)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px'
                            }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <History size={28} />
                            </div>
                            <div>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>From Driver Apps</p>
                                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>₹{driverAmount.toLocaleString()}</h2>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="glass-card"
                            style={{
                                padding: '24px',
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(30, 41, 59, 0.4) 100%)',
                                border: '1px solid rgba(245, 158, 11, 0.2)',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px'
                            }}
                        >
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <Shield size={28} />
                            </div>
                            <div>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '1px' }}>Office Manual</p>
                                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>₹{officeAmount.toLocaleString()}</h2>
                            </div>
                        </motion.div>
                    </div>

                    {/* Main List */}
                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {loading ? (
                            <div style={{ padding: '100px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
                        ) : filteredEntries.length === 0 ? (
                            <div style={{ padding: '100px', textAlign: 'center' }}>
                                <MapPin size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />
                                <h3 style={{ color: 'white', opacity: 0.6 }}>No parking records found</h3>
                            </div>
                        ) : (
                            <>
                                <div className="hide-mobile" style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Driver</th>
                                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount</th>
                                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Source</th>
                                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right', letterSpacing: '1px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEntries.map((e) => (
                                                <tr key={e._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s ease' }} className="hover-row">
                                                    <td style={{ padding: '18px 25px' }}>
                                                        <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                    </td>
                                                    <td style={{ padding: '18px 25px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                                                <User size={16} />
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'white', fontWeight: '600' }}>{e.driver}</div>
                                                                {e.vehicle && (
                                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <Car size={10} /> {e.vehicle.carNumber}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '18px 25px' }}>
                                                        <div style={{ color: '#34d399', fontWeight: '800', fontSize: '16px' }}>₹{e.amount}</div>
                                                    </td>
                                                    <td style={{ padding: '18px 25px' }}>
                                                        <span style={{
                                                            fontSize: '9px',
                                                            padding: '4px 10px',
                                                            borderRadius: '20px',
                                                            background: e.source === 'Admin' ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                                                            color: e.source === 'Admin' ? '#fbbf24' : '#818cf8',
                                                            fontWeight: '800',
                                                            border: `1px solid ${e.source === 'Admin' ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px'
                                                        }}>
                                                            {e.source}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                            <button
                                                                onClick={() => { setSelectedImage(e.receiptPhoto || ''); setShowImageModal(true); }}
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '10px',
                                                                    background: e.receiptPhoto ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.05)',
                                                                    color: e.receiptPhoto ? '#10b981' : '#f43f5e',
                                                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease',
                                                                    opacity: e.receiptPhoto ? 1 : 0.6
                                                                }}
                                                                title={e.receiptPhoto ? "View Photo" : "Photo Missing"}
                                                            >
                                                                <Eye size={16} style={{ opacity: e.receiptPhoto ? 1 : 0.5 }} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(e)}
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '10px',
                                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                                    color: '#818cf8',
                                                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                title="Edit Entry"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(e._id)}
                                                                style={{
                                                                    width: '36px',
                                                                    height: '36px',
                                                                    borderRadius: '10px',
                                                                    background: 'rgba(244,63,94,0.1)',
                                                                    color: '#f43f5e',
                                                                    border: '1px solid rgba(244,63,94,0.2)',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                                onMouseOver={(e) => { e.currentTarget.style.background = '#f43f5e'; e.currentTarget.style.color = 'white'; }}
                                                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="show-mobile" style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {filteredEntries.map((e) => (
                                        <motion.div
                                            key={e._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '20px',
                                                padding: '20px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '4px',
                                                height: '100%',
                                                background: e.source === 'Admin' ? '#fbbf24' : '#818cf8',
                                                opacity: 0.6
                                            }}></div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'white', fontWeight: '800', fontSize: '16px', letterSpacing: '0.5px' }}>{e.driver}</div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                            {e.vehicle && <span style={{ opacity: 0.6 }}>• {e.vehicle.carNumber}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ color: '#34d399', fontWeight: '900', fontSize: '20px' }}>₹{e.amount}</div>
                                                    <span style={{
                                                        fontSize: '8px',
                                                        padding: '2px 8px',
                                                        borderRadius: '10px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        color: 'rgba(255,255,255,0.5)',
                                                        fontWeight: '900',
                                                        textTransform: 'uppercase',
                                                        border: '1px solid rgba(255,255,255,0.1)'
                                                    }}>{e.source}</span>
                                                </div>
                                            </div>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr',
                                                gap: '12px',
                                                marginBottom: '16px',
                                                padding: '12px',
                                                background: 'rgba(0,0,0,0.2)',
                                                borderRadius: '14px',
                                                border: '1px solid rgba(255,255,255,0.03)'
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '2px' }}>Location</div>
                                                    <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{e.location || 'Not Specified'}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{
                                                    color: 'rgba(255,255,255,0.4)',
                                                    fontSize: '11px',
                                                    fontStyle: 'italic',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <History size={12} /> {e.remark || 'No additional remarks'}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {e.receiptPhoto && (
                                                        <button
                                                            onClick={() => { setSelectedImage(e.receiptPhoto); setShowImageModal(true); }}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '8px',
                                                                background: 'rgba(16, 185, 129, 0.1)',
                                                                color: '#10b981',
                                                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(e._id)}
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '8px',
                                                            background: 'rgba(244,63,94,0.1)',
                                                            color: '#f43f5e',
                                                            border: '1px solid rgba(244,63,94,0.2)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Modal */}
                    <AnimatePresence>
                        {showModal && (
                            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '15px', overflowY: 'auto' }}>
                                <motion.div
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 50, opacity: 0 }}
                                    className="premium-glass"
                                    style={{ width: '100%', maxWidth: '500px', padding: '0', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', overflow: 'visible', margin: 'auto', borderRadius: '24px' }}
                                >
                                    <div style={{ padding: '24px 30px', background: 'linear-gradient(to right, #1e293b, #0f172a)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
                                        <div>
                                            <h2 style={{ color: 'white', fontSize: '20px', margin: 0, fontWeight: '800' }}>{editingId ? 'Edit Entry' : 'Manual Entry'}</h2>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', margin: '4px 0 0' }}>Parking Record</p>
                                        </div>
                                        <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '50%', padding: '10px', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                                    </div>

                                    <form onSubmit={handleCreate} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle</label>
                                            <div style={{ position: 'relative' }}>
                                                <Car size={18} style={{ position: 'absolute', left: '15px', top: '16px', color: 'var(--primary)' }} />
                                                <select
                                                    className="input-field"
                                                    style={{ height: '52px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px 0 45px', width: '100%', outline: 'none', cursor: 'pointer' }}
                                                    value={formData.vehicleId || ''}
                                                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                                    required
                                                >
                                                    <option value="" style={{ background: '#1e293b' }}>Select Vehicle</option>
                                                    {vehicles.map(v => (
                                                        <option key={v._id} value={v._id} style={{ background: '#1e293b' }}>{v.carNumber}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Driver</label>
                                            <div style={{ position: 'relative' }}>
                                                <User size={18} style={{ position: 'absolute', left: '15px', top: '16px', color: 'var(--primary)' }} />
                                                <select
                                                    className="input-field"
                                                    style={{ height: '52px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px 0 45px', width: '100%', outline: 'none', cursor: 'pointer' }}
                                                    value={formData.driverId || ''}
                                                    onChange={(e) => {
                                                        const selected = drivers.find(d => d._id === e.target.value);
                                                        setFormData({ ...formData, driverId: e.target.value, driver: selected ? selected.name : '' });
                                                    }}
                                                    required
                                                >
                                                    <option value="" style={{ background: '#1e293b' }}>Select Driver</option>
                                                    {drivers.map(d => (
                                                        <option key={d._id} value={d._id} style={{ background: '#1e293b' }}>{d.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                            gap: '15px'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount (₹)</label>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{ position: 'absolute', left: '15px', top: '16px', color: '#34d399', fontWeight: '900' }}>₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="input-field"
                                                        style={{ height: '52px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px 0 32px', width: '100%', outline: 'none' }}
                                                        value={formData.amount}
                                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</label>
                                                <input
                                                    type="date"
                                                    className="input-field"
                                                    style={{ height: '52px', borderRadius: '14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px', width: '100%', outline: 'none', colorScheme: 'dark' }}
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Parking Photo (Camera)</label>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {formData.receiptPhoto ? (
                                                    <div style={{ position: 'relative' }}>
                                                        <img src={getImageUrl(formData.receiptPhoto)} alt="Receipt" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                                                        <button type="button" onClick={() => setFormData({ ...formData, receiptPhoto: '' })} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f43f5e', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCamera(true)}
                                                            style={{
                                                                width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #fbbf24, #d97706)', border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease', color: 'black', boxShadow: '0 8px 15px rgba(251, 191, 36, 0.3)'
                                                            }}
                                                        >
                                                            <Camera size={24} />
                                                            <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: '900' }}>Camera</span>
                                                        </button>

                                                        <label style={{
                                                            width: '80px', height: '80px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease'
                                                        }}>
                                                            <ImageIcon size={20} color="rgba(255,255,255,0.3)" />
                                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', fontWeight: '800' }}>Gallery</span>
                                                            <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                                        </label>
                                                    </div>
                                                )}
                                                <div style={{ flex: '1 1 200px' }}>
                                                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>Use <b>Camera</b> for direct photo or <b>Gallery</b>.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            style={{
                                                height: '56px',
                                                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                                                borderRadius: '16px',
                                                fontWeight: '900',
                                                fontSize: '16px',
                                                color: 'black',
                                                border: 'none',
                                                boxShadow: '0 12px 24px -8px rgba(251, 191, 36, 0.5)',
                                                cursor: submitting ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.3s ease',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px'
                                            }}
                                        >
                                            {submitting ? 'Saving...' : 'Save Record'}
                                        </button>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                        {showImageModal && (
                            <div
                                style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' }}
                                onClick={() => setShowImageModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    style={{ position: 'relative', maxWidth: 'min(700px, 90vw)', width: '100%', display: 'flex', justifyContent: 'center' }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {selectedImage ? (
                                        <img
                                            src={getImageUrl(selectedImage)}
                                            alt="Parking Photo"
                                            style={{ width: '100%', height: 'auto', maxHeight: '85vh', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                                        />
                                    ) : (
                                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '50px', borderRadius: '20px', textAlign: 'center', width: '100%' }}>
                                            <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
                                            <p style={{ color: 'white', fontWeight: '700' }}>No receipt image available.</p>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '10px' }}>To fix this: Click the Edit (Pen) icon on the entry and upload the receipt manually.</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setShowImageModal(false)}
                                        style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#f43f5e', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(244, 63, 94, 0.4)', zIndex: 100 }}
                                    >
                                        <X size={20} />
                                    </button>
                                </motion.div>
                            </div>
                        )}
                        {showCamera && (
                            <CameraModal
                                onClose={() => setShowCamera(false)}
                                onCapture={(file) => handleFileUpload(file)}
                            />
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
};

export default ParkingPage;
