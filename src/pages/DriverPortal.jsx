import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    Camera,
    MapPin,
    CheckCircle,
    LogOut,
    Car,
    AlertTriangle,
    User as UserIcon,
    RefreshCw,
    X,
    Plus,
    Trash2,
    Droplets,
    Clock,
    Wrench,
    ChevronLeft,
    Wallet,
    LayoutDashboard,
    Download,
    ClipboardList
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';


const CameraModal = ({ side, onCapture, onClose }) => {
    const { t } = useLanguage();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode: side === 'selfie' ? 'user' : 'environment',
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
            setError(t('cameraError'));
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log("Track stopped:", track.label);
            });
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
                const file = new File([blob], `${side}.jpg`, { type: 'image/jpeg' });
                onCapture(file, canvas.toDataURL('image/jpeg'));
                stopCamera();
                onClose();
            }, 'image/jpeg', 0.8);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-card">
                <div className="modal-header">
                    <h3 className="modal-title">
                        {side === 'selfie' ? t('modalTakeSelfie') :
                            side === 'km' ? t('modalCaptureKm') :
                                side === 'car' ? t('modalTakeCarSelfie') :
                                    side === 'fuel' ? t('modalFuelSlip') :
                                        side === 'parking' ? t('modalParkingSlip') :
                                            side === 'other' ? t('modalOtherSlip') : t('modalCapturePhoto')}
                    </h3>
                    <button
                        onClick={() => {
                            stopCamera();
                            onClose();
                        }}
                        className="modal-close-btn"
                    >
                        <X size={20} />
                    </button>
                </div>
                {error ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#f43f5e' }}>{error}</div>
                ) : (
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '12px', background: '#000' }} />
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {!error && (
                    <button onClick={capture} className="btn-primary" style={{ width: '100%', marginTop: '20px', padding: '16px' }}>
                        <Camera size={20} style={{ display: 'inline', marginRight: '8px' }} />
                        {t('capture')}
                    </button>
                )}
            </div>
        </div>
    );
};

const DriverPortal = () => {
    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [km, setKm] = useState('');

    // Photo states
    const [selfie, setSelfie] = useState(null);
    const [selfiePreview, setSelfiePreview] = useState(null);
    const [kmPhoto, setKmPhoto] = useState(null);
    const [kmPreview, setKmPreview] = useState(null);
    const [carSelfie, setCarSelfie] = useState(null);
    const [carPreview, setCarPreview] = useState(null);

    // Question states (for Punch-Out)
    const [fuelFilled, setFuelFilled] = useState(false);
    const [fuelEntries, setFuelEntries] = useState([{ amount: '', km: '', fuelType: 'Diesel', slip: null, preview: null }]);
    // Use quantity in expenseEntries for fuel
    const [expenseEntries, setExpenseEntries] = useState([{ type: 'fuel', amount: '', quantity: '', km: '', fuelType: 'Diesel', paymentSource: 'Yatree Office', slip: null, preview: null }]);
    const [parkingPaid, setParkingPaid] = useState(false);
    const [parkingEntries, setParkingEntries] = useState([{ amount: '', slip: null, preview: null }]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [outsideTripOccurred, setOutsideTripOccurred] = useState(false);
    const [outsideTripTypes, setOutsideTripTypes] = useState([]);

    // New Fields for Report
    const [tollParkingAmount, setTollParkingAmount] = useState('');
    const [allowanceTA, setAllowanceTA] = useState(false);
    const [nightStay, setNightStay] = useState(false);
    const [otherRemarks, setOtherRemarks] = useState('');
    const [remarks, setRemarks] = useState('');

    // Camera Modal states
    const [activeCamera, setActiveCamera] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPunchOutForm, setShowPunchOutForm] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedVehicleId, setSelectedVehicleId] = useState('');

    // Mid-Trip Expense states
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseModalType, setExpenseModalType] = useState(null); // 'fuel', 'parking', 'other'

    // Ledger Tab
    const [activeTab, setActiveTab] = useState('home'); // 'home' or 'ledger'
    const [ledgerData, setLedgerData] = useState(null);
    const [ledgerLoading, setLedgerLoading] = useState(false);

    useEffect(() => {
        fetchDashboard();
        if (activeTab === 'ledger') {
            fetchLedger();
        }
    }, [activeTab]);

    const fetchLedger = async () => {
        setLedgerLoading(true);
        try {
            const { data } = await axios.get('/api/driver/ledger', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setLedgerData(data);
        } catch (err) {
            console.error('Error fetching ledger', err);
        } finally {
            setLedgerLoading(false);
        }
    };

    const fetchDashboard = async () => {
        try {
            const { data } = await axios.get('/api/driver/dashboard', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setDashboardData(data);
            if (data.vehicle?._id) {
                setSelectedVehicleId(data.vehicle._id);
            }
        } catch (err) {
            console.error('Error fetching dashboard', err);
        } finally {
            setLoading(false);
        }
    };


    const handlePunch = async (type) => {
        if (!km || !selfie || !kmPhoto || !carSelfie) {
            setMessage({ type: 'error', text: t('mandatoryFields') });
            return;
        }

        if (type === 'punch-out') {
            if (fuelFilled) {
                const invalid = fuelEntries.some(e => !e.amount || !e.slip || !e.km);
                if (invalid) {
                    setMessage({ type: 'error', text: t('fuelValidation') });
                    return;
                }
            }
            if (parkingPaid) {
                const invalid = parkingEntries.some(e => !e.amount || !e.slip);
                if (invalid) {
                    setMessage({ type: 'error', text: t('parkingValidation') });
                    return;
                }
            }
        }

        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('km', km);
        formData.append('selfie', selfie);
        formData.append('kmPhoto', kmPhoto);
        formData.append('carSelfie', carSelfie);
        formData.append('latitude', 0);
        formData.append('longitude', 0);
        formData.append('address', 'Location Disabled');

        if (type === 'punch-in') {
            formData.append('vehicleId', selectedVehicleId);
        }

        if (type === 'punch-out') {
            formData.append('remarks', remarks);
            formData.append('otherRemarks', otherRemarks);
            formData.append('fuelFilled', fuelFilled);
            if (fuelFilled) {
                fuelEntries.forEach(entry => {
                    formData.append('fuelAmounts', entry.amount);
                    formData.append('fuelKMs', entry.km);
                    formData.append('fuelTypes', entry.fuelType);
                    formData.append('fuelSlips', entry.slip);
                });
            }
            formData.append('parkingPaid', parkingPaid);
            if (parkingPaid) {
                parkingEntries.forEach((entry) => {
                    formData.append('parkingAmounts', entry.amount);
                    formData.append('parkingSlips', entry.slip);
                });
            }
            formData.append('outsideTripOccurred', outsideTripOccurred);
            if (outsideTripOccurred) {
                formData.append('outsideTripType', outsideTripTypes.join(','));
            }
        }

        try {
            await axios.post(`/api/driver/${type}`, formData, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage({ type: 'success', text: t(type === 'punch-in' ? 'punchInSuccess' : 'punchOutSuccess') });

            // Reset all states
            setKm('');
            setSelfie(null);
            setSelfiePreview(null);
            setKmPhoto(null);
            setKmPreview(null);
            setCarSelfie(null);
            setCarPreview(null);
            setFuelFilled(false);
            setFuelEntries([{ amount: '', km: '', slip: null, preview: null }]);
            setParkingPaid(false);
            setParkingEntries([{ amount: '', slip: null, preview: null }]);
            setActiveIndex(0);
            setOutsideTripOccurred(false);
            setRemarks('');
            setOtherRemarks('');
            setShowPunchOutForm(false);
            fetchDashboard();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestNewTrip = async () => {
        setIsSubmitting(true);
        try {
            await axios.post('/api/driver/request-trip', {}, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setMessage({ type: 'success', text: t('requestSent') });
            fetchDashboard();
        } catch (err) {
            setMessage({ type: 'error', text: t('requestFailed') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitExpense = async () => {
        // Filter out entries that don't have an amount
        const activeEntries = expenseEntries.filter(e => e.amount && e.amount > 0);

        if (activeEntries.length === 0) {
            setMessage({ type: 'error', text: t('mandatoryFields') });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();

        activeEntries.forEach((entry, index) => {
            formData.append('types', entry.type);
            formData.append('amounts', entry.amount);
            formData.append('kms', entry.km || 0);
            formData.append('fuelTypes', entry.fuelType || '');
            formData.append('fuelQuantities', entry.quantity || 0);
            formData.append('fuelRates', entry.rate || 0);
            formData.append('paymentSources', entry.paymentSource || 'Yatree Office');
            if (entry.slip) {
                // Important: Use the index from the activeEntries array
                formData.append(`slip_${index}`, entry.slip);
            }
        });

        try {
            await axios.post('/api/driver/add-expense', formData, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage({ type: 'success', text: t('expenseSubmitted') });
            setShowExpenseModal(false);
            setExpenseEntries([]);
            setActiveIndex(0);
            fetchDashboard();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportLedger = () => {
        if (!ledgerData) return;

        const dutyRows = ledgerData.history.map(att => ({
            'Date': att.date,
            'Vehicle': att.vehicle,
            'Daily Wage': att.dailyWage,
            'Bonuses': att.bonuses,
            'Total KM': att.totalKM,
            'Status': att.status,
            'Day Total': att.dailyWage + att.bonuses
        }));

        const advanceRows = ledgerData.advances.map(adv => ({
            'Date': new Date(adv.date).toLocaleDateString(),
            'Remark': adv.remark,
            'Amount Taken': adv.amount,
            'Recovered': adv.recovered,
            'Balance': adv.amount - adv.recovered,
            'Status': adv.status
        }));

        const summaryRows = [
            { 'Item': 'Total Duties', 'Value': ledgerData.summary.workingDays },
            { 'Item': 'Total Earned', 'Value': ledgerData.summary.totalEarned },
            { 'Item': 'Total Advances Taken', 'Value': ledgerData.summary.totalAdvances },
            { 'Item': 'Remaining Balance', 'Value': ledgerData.summary.pendingAdvance },
            { 'Item': 'Net Payable', 'Value': ledgerData.summary.netPayable }
        ];

        const wb = XLSX.utils.book_new();

        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Overview");

        const wsDuty = XLSX.utils.json_to_sheet(dutyRows);
        XLSX.utils.book_append_sheet(wb, wsDuty, "Duties");

        const wsAdvance = XLSX.utils.json_to_sheet(advanceRows);
        XLSX.utils.book_append_sheet(wb, wsAdvance, "Advances");

        XLSX.writeFile(wb, `Driver_Report_${user.name}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="spinner"></div></div>;

    const todayAttendance = dashboardData?.todayAttendance;
    const isPunchedIn = !!todayAttendance?.punchIn?.time;
    const isPunchedOut = !!todayAttendance?.punchOut?.time;
    const tripStatus = dashboardData?.driver?.tripStatus;
    const showPunchIn = tripStatus === 'approved';
    const showPunchOut = tripStatus === 'active';

    return (
        <div className="admin-layout-wrapper">
            <SEO title="Driver Portal" />
            <div className="main-content">
                <div className="container-fluid">
                    <header className="dashboard-header" style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="header-logo-section">
                            <img
                                src="/logos/logo.png"
                                alt="Yatree Destination"
                                style={{
                                    width: '100px',
                                    height: 'auto',
                                    marginRight: '15px'
                                }}
                            />
                            <div>
                                <h1 className="header-title" style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontWeight: '900', letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '4px' }}>
                                    Yatree Destination
                                </h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                                    <p className="header-subtitle" style={{ fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: '700', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{user.name}</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {showPunchOut && (
                                <>
                                    {todayAttendance?.pendingExpenses?.length > 0 && (
                                        <div style={{
                                            background: 'rgba(245, 158, 11, 0.15)',
                                            padding: '6px 10px',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: '#f59e0b',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            border: '1px solid rgba(245, 158, 11, 0.2)'
                                        }}>
                                            <Clock size={14} /> {todayAttendance.pendingExpenses.length}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            setExpenseEntries([{ type: 'fuel', amount: '', quantity: '', km: '', fuelType: 'Diesel', paymentSource: 'Yatree Office', slip: null, preview: null }]);
                                            setExpenseModalType('fuel');
                                            setShowExpenseModal(true);
                                        }}
                                        style={{
                                            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                            color: 'white',
                                            height: '42px',
                                            padding: '0 14px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            border: 'none',
                                            boxShadow: '0 6px 16px rgba(14, 165, 233, 0.25)',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '13px'
                                        }}
                                    >
                                        <Droplets size={18} /> {t('fuel')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setExpenseEntries([{ type: 'parking', amount: '', quantity: '', km: '', fuelType: '', slip: null, preview: null }]);
                                            setExpenseModalType('parking');
                                            setShowExpenseModal(true);
                                        }}
                                        style={{
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                            color: 'white',
                                            height: '42px',
                                            padding: '0 14px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            border: 'none',
                                            boxShadow: '0 6px 16px rgba(245, 158, 11, 0.25)',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '13px'
                                        }}
                                    >
                                        <Car size={18} /> {t('parking')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setExpenseEntries([{ type: 'other', amount: '', quantity: '', km: '', fuelType: 'Other', slip: null, preview: null }]);
                                            setExpenseModalType('other');
                                            setShowExpenseModal(true);
                                        }}
                                        style={{
                                            background: 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)',
                                            color: 'white',
                                            height: '42px',
                                            padding: '0 14px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            border: 'none',
                                            boxShadow: '0 6px 16px rgba(244, 63, 94, 0.25)',
                                            cursor: 'pointer',
                                            fontWeight: '700',
                                            fontSize: '13px'
                                        }}
                                    >
                                        <Wrench size={18} /> {t('driverSeva')}
                                    </button>
                                </>
                            )}
                            <div className="language-switcher" style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                                borderRadius: '12px',
                                padding: '5px',
                                display: 'flex',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <button
                                    onClick={() => setLanguage('en')}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: '9px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        background: language === 'en' ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' : 'transparent',
                                        color: 'white',
                                        transition: 'all 0.3s ease',
                                        boxShadow: language === 'en' ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'
                                    }}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => setLanguage('hi')}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: '9px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        background: language === 'hi' ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' : 'transparent',
                                        color: 'white',
                                        transition: 'all 0.3s ease',
                                        boxShadow: language === 'hi' ? '0 4px 12px rgba(14, 165, 233, 0.3)' : 'none'
                                    }}
                                >
                                    हिन्दी
                                </button>
                            </div>
                            <button onClick={logout} style={{
                                background: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.08) 100%)',
                                color: '#f43f5e',
                                padding: '10px 18px',
                                borderRadius: '12px',
                                fontWeight: '800',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                border: '1px solid rgba(244,63,94,0.2)',
                                boxShadow: '0 4px 12px rgba(244,63,94,0.15)',
                                transition: 'all 0.3s ease'
                            }}>
                                <LogOut size={16} /> {t('logout')}
                            </button>
                        </div>
                    </header>

                    <div className="tab-navigation" style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={() => setActiveTab('home')}
                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: activeTab === 'home' ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' : 'transparent', color: 'white', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', transition: 'all 0.3s' }}
                        >
                            <LayoutDashboard size={18} /> {t('today')}
                        </button>
                        <button
                            onClick={() => setActiveTab('ledger')}
                            style={{ flex: 1, padding: '12px', borderRadius: '12px', background: activeTab === 'ledger' ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' : 'transparent', color: 'white', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', transition: 'all 0.3s' }}
                        >
                            <Wallet size={18} /> {t('ledger')}
                        </button>
                    </div>

                    {activeTab === 'home' && (
                        <>
                            {(!dashboardData?.vehicle && !showPunchIn && tripStatus !== 'completed' && tripStatus !== 'pending_approval') ? (
                                <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                                    <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                                    <h2 style={{ color: 'white', marginBottom: '8px' }}>{t('noVehicle')}</h2>
                                    <p style={{ color: 'var(--text-muted)' }}>{t('startDutyMessage')}</p>
                                </div>
                            ) : (
                                <div className="form-section-wrapper">
                                    {/* Vehicle Info */}
                                    {dashboardData?.vehicle && (
                                        <div className="glass-card" style={{
                                            padding: 'clamp(20px, 5vw, 28px)',
                                            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
                                            border: '1px solid rgba(14, 165, 233, 0.15)',
                                            boxShadow: '0 8px 24px rgba(14, 165, 233, 0.1)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-20px',
                                                right: '-20px',
                                                width: '100px',
                                                height: '100px',
                                                background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
                                                pointerEvents: 'none'
                                            }}></div>
                                            <div style={{ marginBottom: '12px', position: 'relative' }}>
                                                <p className="section-subtitle" style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: '800', letterSpacing: '1px', color: 'rgba(14, 165, 233, 0.8)', marginBottom: '8px' }}>{t('assignedVehicle')}</p>
                                                <h2 style={{ fontSize: 'clamp(22px, 5.5vw, 28px)', color: 'white', fontWeight: '900', marginBottom: '6px', letterSpacing: '-0.5px' }}>{dashboardData.vehicle.carNumber}</h2>
                                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: '600' }}>{dashboardData.vehicle.model}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Tracker */}
                                    <div className="glass-card" style={{
                                        padding: 'clamp(20px, 5vw, 28px)',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                                    }}>
                                        <div className="modal-grid-2" style={{ gap: 'clamp(16px, 4vw, 24px)' }}>
                                            <div style={{
                                                background: isPunchedIn ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'rgba(255,255,255,0.02)',
                                                padding: 'clamp(16px, 4vw, 20px)',
                                                borderRadius: '16px',
                                                border: isPunchedIn ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                {isPunchedIn && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: '#10b981',
                                                        boxShadow: '0 0 12px #10b981',
                                                        animation: 'pulse 2s infinite'
                                                    }}></div>
                                                )}
                                                <p className="section-subtitle" style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '8px' }}>{t('punchIn')}</p>
                                                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '900', color: isPunchedIn ? '#10b981' : 'rgba(255,255,255,0.2)', letterSpacing: '-1px' }}>
                                                    {isPunchedIn ? new Date(todayAttendance.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </p>
                                            </div>
                                            <div style={{
                                                background: isPunchedOut ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.05) 100%)' : 'rgba(255,255,255,0.02)',
                                                padding: 'clamp(16px, 4vw, 20px)',
                                                borderRadius: '16px',
                                                border: isPunchedOut ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                {isPunchedOut && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: '#f43f5e',
                                                        boxShadow: '0 0 12px #f43f5e'
                                                    }}></div>
                                                )}
                                                <p className="section-subtitle" style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '8px' }}>{t('punchOut')}</p>
                                                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: '900', color: isPunchedOut ? '#f43f5e' : 'rgba(255,255,255,0.2)', letterSpacing: '-1px' }}>
                                                    {isPunchedOut ? new Date(todayAttendance.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Working Closed Screen */}
                                    {tripStatus === 'completed' && (
                                        <div className="glass-card" style={{
                                            padding: 'clamp(32px, 8vw, 48px)',
                                            textAlign: 'center',
                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
                                            border: '1px solid rgba(16, 185, 129, 0.15)',
                                            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)'
                                        }}>
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                margin: '0 auto 20px',
                                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid rgba(16, 185, 129, 0.2)',
                                                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)'
                                            }}>
                                                <CheckCircle size={40} color="#10b981" />
                                            </div>
                                            <h2 style={{ color: 'white', fontSize: 'clamp(20px, 5vw, 24px)', marginBottom: '12px', fontWeight: '900', letterSpacing: '-0.5px' }}>{t('dutyCompleted')}</h2>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '28px', fontSize: 'clamp(14px, 3.5vw, 15px)', fontWeight: '600' }}>{t('offDutyMessage')}</p>
                                            <button onClick={handleRequestNewTrip} disabled={isSubmitting} className="btn-primary" style={{
                                                width: '100%',
                                                maxWidth: '320px',
                                                margin: '0 auto',
                                                display: 'block',
                                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                padding: '16px 24px',
                                                fontSize: '15px',
                                                fontWeight: '800',
                                                borderRadius: '14px',
                                                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                                                border: 'none'
                                            }}>
                                                {isSubmitting ? t('processing') : t('startNewDuty')}
                                            </button>
                                        </div>
                                    )}

                                    {/* Waiting for Approval Screen */}
                                    {tripStatus === 'pending_approval' && (
                                        <div className="glass-card" style={{
                                            padding: 'clamp(32px, 8vw, 48px)',
                                            textAlign: 'center',
                                            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(14, 165, 233, 0.03) 100%)',
                                            border: '1px solid rgba(14, 165, 233, 0.15)',
                                            boxShadow: '0 8px 32px rgba(14, 165, 233, 0.15)'
                                        }}>
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                margin: '0 auto 20px',
                                                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid rgba(14, 165, 233, 0.2)',
                                                boxShadow: '0 8px 24px rgba(14, 165, 233, 0.2)'
                                            }}>
                                                <RefreshCw size={40} color="#0ea5e9" className="spinner" />
                                            </div>
                                            <h2 style={{ color: 'white', fontSize: 'clamp(20px, 5vw, 24px)', marginBottom: '12px', fontWeight: '900', letterSpacing: '-0.5px' }}>{t('waitingAdmin')}</h2>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px, 3.5vw, 15px)', fontWeight: '600' }}>{t('reviewMessage')}</p>
                                        </div>
                                    )}

                                    {/* On Duty Screen */}
                                    {showPunchOut && !showPunchOutForm && (
                                        <div className="glass-card" style={{
                                            padding: 'clamp(32px, 8vw, 48px)',
                                            textAlign: 'center',
                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
                                            border: '1px solid rgba(16, 185, 129, 0.15)',
                                            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '-50px',
                                                right: '-50px',
                                                width: '150px',
                                                height: '150px',
                                                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
                                                pointerEvents: 'none'
                                            }}></div>
                                            <div style={{
                                                width: '80px',
                                                height: '80px',
                                                margin: '0 auto 20px',
                                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid rgba(16, 185, 129, 0.2)',
                                                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
                                                position: 'relative'
                                            }}>
                                                <Car size={40} color="#10b981" />
                                            </div>
                                            <h2 style={{ color: 'white', fontSize: 'clamp(20px, 5vw, 24px)', marginBottom: '12px', fontWeight: '900', letterSpacing: '-0.5px', position: 'relative' }}>{t('onDuty')}</h2>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '28px', fontSize: 'clamp(14px, 3.5vw, 15px)', fontWeight: '600', position: 'relative' }}>{t('driveSafely')}</p>
                                            <button
                                                onClick={() => setShowPunchOutForm(true)}
                                                className="btn-primary"
                                                style={{
                                                    width: '100%',
                                                    background: 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)',
                                                    padding: '16px 24px',
                                                    boxShadow: '0 8px 24px rgba(244, 63, 94, 0.3)',
                                                    fontSize: '15px',
                                                    fontWeight: '800',
                                                    borderRadius: '14px',
                                                    border: 'none',
                                                    position: 'relative'
                                                }}
                                            >
                                                {t('submitReports')}
                                            </button>
                                        </div>
                                    )}

                                    {/* Main Form */}
                                    {(showPunchIn || (showPunchOut && showPunchOutForm)) && (
                                        <div className="glass-card" style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
                                            <div className="modal-header" style={{ marginBottom: 'clamp(16px, 4vw, 24px)' }}>
                                                {showPunchOut && (
                                                    <button onClick={() => setShowPunchOutForm(false)} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', padding: '6px', borderRadius: '8px' }}>
                                                        <ChevronLeft size={20} />
                                                    </button>
                                                )}
                                                <div>
                                                    <h2 className="modal-title">{showPunchIn ? t('dutyPunchIn') : t('dutyPunchOut')}</h2>
                                                    <p className="section-subtitle">{showPunchIn ? t('start') : t('end')}</p>
                                                </div>
                                            </div>


                                            <div className="input-wrapper-full" style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                                                <label className="input-label">{t('currentKm')}</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    placeholder={t('enterKm')}
                                                    value={km}
                                                    onChange={(e) => setKm(e.target.value)}
                                                />
                                            </div>

                                            {/* Vehicle Selection (Punch-In only) */}
                                            {showPunchIn && (
                                                <div className="input-wrapper-full" style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                                                    <label className="input-label">{t('selectVehicle')}</label>
                                                    <select
                                                        className="input-field"
                                                        value={selectedVehicleId}
                                                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '14px', padding: '12px' }}
                                                    >
                                                        <option value="" style={{ background: '#0f172a', color: 'white' }}>{t('selectCar')}</option>
                                                        {dashboardData?.availableVehicles?.map(v => (
                                                            <option key={v._id} value={v._id} style={{ background: '#0f172a', color: 'white' }}>
                                                                {v.carNumber} ({v.model})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Photo Captures */}
                                            <div className="photo-capture-grid" style={{ marginBottom: 'clamp(20px, 5vw, 28px)' }}>
                                                {/* Selfie */}
                                                <div>
                                                    <p className="input-label" style={{ marginBottom: '8px' }}>{t('driverSelfie')}</p>
                                                    {!selfiePreview ? (
                                                        <div
                                                            onClick={() => setActiveCamera('selfie')}
                                                            className="photo-capture-button"
                                                        >
                                                            <Camera size={24} color="var(--primary)" />
                                                            <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--text-muted)', fontWeight: '700' }}>{t('takeSelfie')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="photo-preview-container">
                                                            <img src={selfiePreview} alt="Selfie" className="photo-preview-image" />
                                                            <button
                                                                onClick={() => {
                                                                    setSelfie(null);
                                                                    setSelfiePreview(null);
                                                                }}
                                                                className="photo-delete-button"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* KM Photo */}
                                                <div>
                                                    <p className="input-label" style={{ marginBottom: '8px' }}>{t('kmPhoto')}</p>
                                                    {!kmPreview ? (
                                                        <div
                                                            onClick={() => setActiveCamera('km')}
                                                            className="photo-capture-button"
                                                        >
                                                            <Camera size={24} color="var(--primary)" />
                                                            <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--text-muted)', fontWeight: '700' }}>{t('takeKmPhoto')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="photo-preview-container">
                                                            <img src={kmPreview} alt="KM" className="photo-preview-image" />
                                                            <button
                                                                onClick={() => {
                                                                    setKmPhoto(null);
                                                                    setKmPreview(null);
                                                                }}
                                                                className="photo-delete-button"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Car Selfie */}
                                                <div>
                                                    <p className="input-label" style={{ marginBottom: '8px' }}>{t('carSelfie')}</p>
                                                    {!carPreview ? (
                                                        <div
                                                            onClick={() => setActiveCamera('car')}
                                                            className="photo-capture-button"
                                                        >
                                                            <Camera size={24} color="var(--primary)" />
                                                            <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--text-muted)', fontWeight: '700' }}>{t('takeCarPhoto')}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="photo-preview-container">
                                                            <img src={carPreview} alt="Car" className="photo-preview-image" />
                                                            <button
                                                                onClick={() => {
                                                                    setCarSelfie(null);
                                                                    setCarPreview(null);
                                                                }}
                                                                className="photo-delete-button"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Punch-Out Specific Questions */}
                                            {showPunchOut && (
                                                <div style={{ marginBottom: 'clamp(20px, 5vw, 28px)' }}>
                                                    <h3 className="section-title">{t('expenditureDetails')}</h3>





                                                    {/* Outside Trip Question */}
                                                    <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                                                        <p className="input-label" style={{ marginBottom: '10px' }}>{t('outsideCityQuestion')}</p>
                                                        <div className="yes-no-button-group">
                                                            <button
                                                                onClick={() => setOutsideTripOccurred(true)}
                                                                className="yes-no-button"
                                                                style={{ background: outsideTripOccurred ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white' }}
                                                            >
                                                                {t('yes')}
                                                            </button>
                                                            <button
                                                                onClick={() => setOutsideTripOccurred(false)}
                                                                className="yes-no-button"
                                                                style={{ background: !outsideTripOccurred ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white' }}
                                                            >
                                                                {t('no')}
                                                            </button>
                                                        </div>

                                                        {outsideTripOccurred && (
                                                            <div className="checkbox-group" style={{ marginTop: '12px' }}>
                                                                <div className="checkbox-item">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="checkbox-input"
                                                                        checked={outsideTripTypes.includes('Same Day')}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) setOutsideTripTypes([...outsideTripTypes, 'Same Day']);
                                                                            else setOutsideTripTypes(outsideTripTypes.filter(t => t !== 'Same Day'));
                                                                        }}
                                                                    />
                                                                    <label className="checkbox-label">{t('sameDay')}</label>
                                                                </div>

                                                                <div className="checkbox-item">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="checkbox-input"
                                                                        checked={outsideTripTypes.includes('Night Stay')}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) setOutsideTripTypes([...outsideTripTypes, 'Night Stay']);
                                                                            else setOutsideTripTypes(outsideTripTypes.filter(t => t !== 'Night Stay'));
                                                                        }}
                                                                    />
                                                                    <label className="checkbox-label">{t('nightStay')}</label>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Remarks (Punch-Out only) */}
                                            {showPunchOut && (
                                                <div style={{ marginBottom: 'clamp(20px, 5vw, 28px)' }}>
                                                    <div className="input-wrapper-full">
                                                        <label className="input-label">{t('remarksAdmin')}</label>
                                                        <textarea
                                                            className="input-field"
                                                            placeholder={t('enterRemarks')}
                                                            value={remarks}
                                                            onChange={(e) => setRemarks(e.target.value)}
                                                            style={{ marginBottom: '15px', resize: 'vertical', minHeight: '60px' }}
                                                        />
                                                    </div>

                                                    <div className="input-wrapper-full" style={{ marginTop: '4px' }}>
                                                        <label className="input-label">{t('otherRemarks')}</label>
                                                        <textarea
                                                            className="input-field"
                                                            placeholder={t('explainOptional')}
                                                            value={otherRemarks}
                                                            onChange={(e) => setOtherRemarks(e.target.value)}
                                                            style={{ fontSize: '14px', resize: 'vertical', minHeight: '60px' }}
                                                        />
                                                    </div>
                                                </div>
                                            )}


                                            {/* Message */}
                                            {message.text && (
                                                <div style={{ padding: '12px', background: message.type === 'error' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', borderRadius: '10px', marginBottom: '16px' }}>
                                                    <p style={{ color: message.type === 'error' ? '#f43f5e' : '#10b981', fontSize: 'clamp(12px, 3vw, 13px)', fontWeight: '600', margin: 0 }}>{message.text}</p>
                                                </div>
                                            )}

                                            {/* Submit Button */}
                                            <button
                                                onClick={() => {
                                                    if (showPunchIn && !selectedVehicleId) return setMessage({ type: 'error', text: 'Please select a vehicle' });
                                                    handlePunch(showPunchOut ? 'punch-out' : 'punch-in');
                                                }}
                                                disabled={isSubmitting}
                                                className="btn-primary"
                                                style={{ width: '100%', padding: '16px', fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: '800' }}
                                            >
                                                {isSubmitting ? t('processing').toUpperCase() : (showPunchOut ? t('submitPunchOut').toUpperCase() : t('submitPunchIn').toUpperCase())}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mid-Trip Expense Modal */}
                            {showExpenseModal && (
                                <div className="modal-overlay">
                                    <div className="modal-content glass-card" style={{ maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
                                        <div className="modal-header" style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div>
                                                <h3 className="modal-title">
                                                    {expenseModalType === 'fuel' ? t('logFuel') :
                                                        expenseModalType === 'parking' ? t('logParking') :
                                                            t('driverSeva')}
                                                </h3>
                                                <p className="section-subtitle">{t('logExpense').toUpperCase()}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setShowExpenseModal(false);
                                                    setExpenseEntries([]);
                                                    setExpenseModalType(null);
                                                    setActiveIndex(0);
                                                }}
                                                className="modal-close-btn"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gap: '16px', marginTop: '20px' }}>
                                            {expenseEntries.length === 0 ? (
                                                <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>{t('noExpensesYet') || 'No expenses added yet'}</p>
                                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                        {expenseModalType === 'fuel' && (
                                                            <button
                                                                onClick={() => setExpenseEntries([{ type: 'fuel', amount: '', quantity: '', km: '', fuelType: 'Diesel', paymentSource: 'Yatree Office', slip: null, preview: null }])}
                                                                className="btn-primary"
                                                                style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                            >
                                                                <Droplets size={20} /> {t('logFuel')}
                                                            </button>
                                                        )}
                                                        {expenseModalType === 'parking' && (
                                                            <button
                                                                onClick={() => setExpenseEntries([{ type: 'parking', amount: '', quantity: '', km: '', fuelType: '', slip: null, preview: null }])}
                                                                className="btn-primary"
                                                                style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '12px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                            >
                                                                <Car size={20} /> {t('logParking')}
                                                            </button>
                                                        )}
                                                        {expenseModalType === 'other' && (
                                                            <button
                                                                onClick={() => setExpenseEntries([{ type: 'other', amount: '', quantity: '', km: '', fuelType: 'Other', slip: null, preview: null }])}
                                                                className="btn-primary"
                                                                style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '12px', background: '#f43f5e', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                            >
                                                                <Wrench size={20} /> {t('driverSeva')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {expenseEntries.map((entry, index) => (
                                                        <div key={index} className="entry-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: entry.type === 'fuel' ? 'rgba(14, 165, 233, 0.15)' : (entry.type === 'parking' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        {entry.type === 'fuel' ? <Droplets size={16} color="#0ea5e9" /> : (entry.type === 'parking' ? <Car size={16} color="#f59e0b" /> : <Wrench size={16} color="#f43f5e" />)}
                                                                    </div>
                                                                    <span style={{ fontWeight: '800', fontSize: '12px', color: 'white', textTransform: 'uppercase' }}>
                                                                        {entry.type === 'fuel' ? t('logFuel') : (entry.type === 'parking' ? t('logParking') : t('driverSeva'))}
                                                                    </span>
                                                                </div>
                                                                <button onClick={() => setExpenseEntries(expenseEntries.filter((_, i) => i !== index))} style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '6px', borderRadius: '6px' }}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>

                                                            <div className="input-grid-2" style={{ marginBottom: '16px' }}>
                                                                <div className="input-wrapper-full">
                                                                    <label className="input-label" style={{ fontSize: '10px' }}>{t('amount')}</label>
                                                                    <input
                                                                        type="number"
                                                                        className="input-field"
                                                                        placeholder="0.00"
                                                                        value={entry.amount}
                                                                        onChange={(e) => {
                                                                            const newEntries = [...expenseEntries];
                                                                            newEntries[index].amount = e.target.value;
                                                                            setExpenseEntries(newEntries);
                                                                        }}
                                                                        style={{ padding: '10px', fontSize: '14px', height: '45px' }}
                                                                    />
                                                                </div>
                                                                {entry.type === 'fuel' && (
                                                                    <>
                                                                        <div className="input-wrapper-full">
                                                                            <label className="input-label" style={{ fontSize: '10px' }}>Rate (₹/L) - Optional</label>
                                                                            <input
                                                                                type="number"
                                                                                className="input-field"
                                                                                placeholder="₹/L"
                                                                                value={entry.rate || ''}
                                                                                onChange={(e) => {
                                                                                    const newEntries = [...expenseEntries];
                                                                                    newEntries[index].rate = e.target.value;

                                                                                    // Auto-calculate Liters if Amount and Rate are available
                                                                                    if (newEntries[index].amount && e.target.value) {
                                                                                        newEntries[index].quantity = (Number(newEntries[index].amount) / Number(e.target.value)).toFixed(2);
                                                                                    }
                                                                                    setExpenseEntries(newEntries);
                                                                                }}
                                                                                style={{ padding: '10px', fontSize: '14px', height: '45px' }}
                                                                            />
                                                                        </div>
                                                                        <div className="input-wrapper-full">
                                                                            <label className="input-label" style={{ fontSize: '10px' }}>Liters - Optional</label>
                                                                            <input
                                                                                type="number"
                                                                                className="input-field"
                                                                                placeholder="L"
                                                                                value={entry.quantity || ''}
                                                                                onChange={(e) => {
                                                                                    const newEntries = [...expenseEntries];
                                                                                    newEntries[index].quantity = e.target.value;

                                                                                    // Auto-calculate Rate if Amount and Liters are available
                                                                                    if (newEntries[index].amount && e.target.value) {
                                                                                        newEntries[index].rate = (Number(newEntries[index].amount) / Number(e.target.value)).toFixed(2);
                                                                                    }
                                                                                    setExpenseEntries(newEntries);
                                                                                }}
                                                                                style={{ padding: '10px', fontSize: '14px', height: '45px' }}
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}
                                                                {entry.type === 'fuel' && (
                                                                    <div className="input-wrapper-full">
                                                                        <label className="input-label" style={{ fontSize: '10px' }}>{t('meterKm')} (Opt)</label>
                                                                        <input
                                                                            type="number"
                                                                            className="input-field"
                                                                            placeholder="KM"
                                                                            value={entry.km}
                                                                            onChange={(e) => {
                                                                                const newEntries = [...expenseEntries];
                                                                                newEntries[index].km = e.target.value;
                                                                                setExpenseEntries(newEntries);
                                                                            }}
                                                                            style={{ padding: '10px', fontSize: '14px', height: '45px' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {entry.type === 'fuel' && (
                                                                <>
                                                                    <div className="input-wrapper-full" style={{ marginTop: '4px', marginBottom: '16px' }}>
                                                                        <label className="input-label" style={{ fontSize: '10px', marginBottom: '6px' }}>{t('fuelType')}</label>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                                            {['Diesel', 'Petrol', 'CNG'].map((type) => (
                                                                                <button
                                                                                    key={type}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const newEntries = [...expenseEntries];
                                                                                        newEntries[index].fuelType = type;
                                                                                        setExpenseEntries(newEntries);
                                                                                    }}
                                                                                    style={{
                                                                                        padding: '8px 4px',
                                                                                        borderRadius: '8px',
                                                                                        fontSize: '11px',
                                                                                        fontWeight: '800',
                                                                                        border: '1px solid',
                                                                                        borderColor: entry.fuelType === type ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                                                                        background: entry.fuelType === type ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.02)',
                                                                                        color: entry.fuelType === type ? 'var(--primary)' : 'var(--text-muted)',
                                                                                        transition: 'all 0.2s ease'
                                                                                    }}
                                                                                >
                                                                                    {t(type.toLowerCase())}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="input-wrapper-full" style={{ marginTop: '4px', marginBottom: '16px' }}>
                                                                        <label className="input-label" style={{ fontSize: '10px', marginBottom: '6px' }}>{t('paymentSource') || 'Payment Source'}</label>
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                                            {['Yatree Office', 'Guest'].map((source) => (
                                                                                <button
                                                                                    key={source}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const newEntries = [...expenseEntries];
                                                                                        newEntries[index].paymentSource = source;
                                                                                        setExpenseEntries(newEntries);
                                                                                    }}
                                                                                    style={{
                                                                                        padding: '8px 4px',
                                                                                        borderRadius: '8px',
                                                                                        fontSize: '11px',
                                                                                        fontWeight: '800',
                                                                                        border: '1px solid',
                                                                                        borderColor: (entry.paymentSource || 'Yatree Office') === source ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                                                                        background: (entry.paymentSource || 'Yatree Office') === source ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255,255,255,0.02)',
                                                                                        color: (entry.paymentSource || 'Yatree Office') === source ? 'var(--primary)' : 'var(--text-muted)',
                                                                                        transition: 'all 0.2s ease'
                                                                                    }}
                                                                                >
                                                                                    {source}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}

                                                            {entry.type === 'other' && (
                                                                <div className="input-wrapper-full" style={{ marginTop: '4px', marginBottom: '16px' }}>
                                                                    <label className="input-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Service Type</label>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                                        {['Puncture', 'Car Wash', 'Other'].map((type) => (
                                                                            <button
                                                                                key={type}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newEntries = [...expenseEntries];
                                                                                    newEntries[index].fuelType = type;
                                                                                    setExpenseEntries(newEntries);
                                                                                }}
                                                                                style={{
                                                                                    padding: '8px 4px',
                                                                                    borderRadius: '8px',
                                                                                    fontSize: '11px',
                                                                                    fontWeight: '800',
                                                                                    border: '1px solid',
                                                                                    borderColor: entry.fuelType === type ? '#f43f5e' : 'rgba(255,255,255,0.1)',
                                                                                    background: entry.fuelType === type ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255,255,255,0.02)',
                                                                                    color: entry.fuelType === type ? '#f43f5e' : 'var(--text-muted)',
                                                                                    transition: 'all 0.2s ease'
                                                                                }}
                                                                            >
                                                                                {type}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}


                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                                                                <label className="input-label" style={{ fontSize: '10px' }}>{t('receipt')} (Optional)</label>
                                                                {!entry.preview ? (
                                                                    <div
                                                                        onClick={() => {
                                                                            setActiveIndex(index);
                                                                            setActiveCamera('expense_slip');
                                                                        }}
                                                                        className="photo-capture-button"
                                                                        style={{ height: '80px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}
                                                                    >
                                                                        <Camera size={24} color="var(--primary)" />
                                                                        <span style={{ fontWeight: '700', color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px' }}>{t('captureSlip')}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="photo-preview-container" style={{ height: '80px', borderRadius: '10px' }}>
                                                                        <img src={entry.preview} alt="Receipt" className="photo-preview-image" />
                                                                        <button
                                                                            onClick={() => {
                                                                                const newEntries = [...expenseEntries];
                                                                                newEntries[index].slip = null;
                                                                                newEntries[index].preview = null;
                                                                                setExpenseEntries(newEntries);
                                                                            }}
                                                                            className="photo-delete-button"
                                                                            style={{ width: '24px', height: '24px', top: '5px', right: '5px' }}
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
                                                        {expenseModalType === 'fuel' && (
                                                            <button
                                                                onClick={() => setExpenseEntries([...expenseEntries, { type: 'fuel', amount: '', quantity: '', km: '', fuelType: 'Diesel', paymentSource: 'Yatree Office', slip: null, preview: null }])}
                                                                className="action-button glass-card-hover-effect"
                                                                style={{ border: '1px dashed rgba(14, 165, 233, 0.3)', color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.05)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', fontSize: '13px', fontWeight: '800' }}
                                                            >
                                                                <Droplets size={20} /> {t('logFuel')}
                                                            </button>
                                                        )}
                                                        {expenseModalType === 'parking' && (
                                                            <button
                                                                onClick={() => setExpenseEntries([...expenseEntries, { type: 'parking', amount: '', quantity: '', km: '', fuelType: '', slip: null, preview: null }])}
                                                                className="action-button glass-card-hover-effect"
                                                                style={{ border: '1px dashed rgba(245, 158, 11, 0.3)', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.05)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', fontSize: '13px', fontWeight: '800' }}
                                                            >
                                                                <Car size={20} /> {t('logParking')}
                                                            </button>
                                                        )}
                                                        {expenseModalType === 'other' && (
                                                            <button
                                                                onClick={() => setExpenseEntries([...expenseEntries, { type: 'other', amount: '', quantity: '', km: '', fuelType: 'Other', slip: null, preview: null }])}
                                                                className="action-button glass-card-hover-effect"
                                                                style={{ border: '1px dashed rgba(244, 63, 94, 0.3)', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.05)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', fontSize: '13px', fontWeight: '800' }}
                                                            >
                                                                <Wrench size={20} /> {t('driverSeva')}
                                                            </button>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={handleSubmitExpense}
                                                        disabled={isSubmitting}
                                                        className="btn-primary"
                                                        style={{ width: '100%', padding: '16px', fontWeight: '900', fontSize: '15px', borderRadius: '12px', marginTop: '10px', boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)' }}
                                                    >
                                                        {isSubmitting ? t('processing').toUpperCase() : t('submit').toUpperCase()}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Camera Modal - Moved to end to ensure it's always on top */}
                            {activeCamera && (
                                <CameraModal
                                    side={activeCamera === 'expense_slip' ? (expenseEntries[activeIndex]?.type === 'fuel' ? 'fuel' : (expenseEntries[activeIndex]?.type === 'parking' ? 'parking' : 'other')) : activeCamera}
                                    onCapture={(file, preview) => {
                                        if (activeCamera === 'selfie') {
                                            setSelfie(file);
                                            setSelfiePreview(preview);
                                        } else if (activeCamera === 'km') {
                                            setKmPhoto(file);
                                            setKmPreview(preview);
                                        } else if (activeCamera === 'car') {
                                            setCarSelfie(file);
                                            setCarPreview(preview);
                                        } else if (activeCamera === 'fuel') {
                                            const newEntries = [...fuelEntries];
                                            newEntries[activeIndex].slip = file;
                                            newEntries[activeIndex].preview = preview;
                                            setFuelEntries(newEntries);
                                        } else if (activeCamera === 'parking') {
                                            const newEntries = [...parkingEntries];
                                            newEntries[activeIndex].slip = file;
                                            newEntries[activeIndex].preview = preview;
                                            setParkingEntries(newEntries);
                                        } else if (activeCamera === 'expense_slip') {
                                            const newEntries = [...expenseEntries];
                                            newEntries[activeIndex].slip = file;
                                            newEntries[activeIndex].preview = preview;
                                            setExpenseEntries(newEntries);
                                        }
                                    }}
                                    onClose={() => setActiveCamera(null)}
                                />
                            )}
                        </>
                    )}

                    {activeTab === 'ledger' && (
                        <div className="ledger-section">
                            {ledgerLoading ? (
                                <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                                </div>
                            ) : (
                                <div className="ledger-content">
                                    {/* Summary Cards */}
                                    <div className="ledger-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                                        <div className="glass-card" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                            <p style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(16, 185, 129, 0.8)', marginBottom: '4px', textTransform: 'uppercase' }}>{t('totalEarned')}</p>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>₹{ledgerData?.summary?.totalEarned || 0}</h3>
                                        </div>
                                        <div className="glass-card" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                            <p style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(245, 158, 11, 0.8)', marginBottom: '4px', textTransform: 'uppercase' }}>{t('workingDays')}</p>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>{ledgerData?.summary?.workingDays || 0}</h3>
                                        </div>
                                        <div className="glass-card" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                            <p style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(99, 102, 241, 0.8)', marginBottom: '4px', textTransform: 'uppercase' }}>{t('pendingAdvance')}</p>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>₹{ledgerData?.summary?.pendingAdvance || 0}</h3>
                                        </div>
                                        <div className="glass-card" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                                            <p style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(14, 165, 233, 0.8)', marginBottom: '4px', textTransform: 'uppercase' }}>{t('netPayable')}</p>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>₹{ledgerData?.summary?.netPayable || 0}</h3>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleExportLedger}
                                        className="btn-primary"
                                        style={{ width: '100%', marginBottom: '24px', padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                    >
                                        <Download size={20} /> {t('downloadExcel')}
                                    </button>

                                    {/* Duty History */}
                                    <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '16px', fontWeight: '800' }}>{t('dutyHistory')}</h4>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {ledgerData?.history?.map(item => (
                                            <div key={item._id} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ color: 'white', fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>{item.date}</p>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.vehicle} • {item.totalKM} KM</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ color: '#10b981', fontWeight: '900', fontSize: '15px' }}>₹{item.dailyWage + item.bonuses}</p>
                                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Wage: {item.dailyWage} + Bonus: {item.bonuses}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Advance History */}
                                    <h4 style={{ color: 'white', marginTop: '32px', marginBottom: '16px', fontSize: '16px', fontWeight: '800' }}>{t('advanceHistory')}</h4>
                                    <div style={{ display: 'grid', gap: '12px', marginBottom: '40px' }}>
                                        {ledgerData?.advances?.map(item => (
                                            <div key={item._id} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #f43f5e' }}>
                                                <div>
                                                    <p style={{ color: 'white', fontWeight: '800', fontSize: '14px', marginBottom: '2px' }}>{new Date(item.date).toLocaleDateString()}</p>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.remark}</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ color: '#f43f5e', fontWeight: '900', fontSize: '15px' }}>₹{item.amount}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverPortal;