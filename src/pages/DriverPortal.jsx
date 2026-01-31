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
    ZapOff,
    Disc,
    Wrench,
    Hammer,
    HelpCircle,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

const QUICK_ISSUES = [
    { id: 'wash', label: 'Car Wash', icon: Droplets, color: '#3cc7f5' },
    { id: 'light', label: 'Light Issue', icon: ZapOff, color: '#f59e0b' },
    { id: 'tyre', label: 'Puncture', icon: Disc, color: '#f43f5e' },
    { id: 'mechanic', label: 'Mechanical', icon: Wrench, color: '#10b981' },
    { id: 'dent', label: 'Accident/Dent', icon: Hammer, color: '#9f1239' },
    { id: 'other', label: 'Other', icon: HelpCircle, color: '#94a3b8' }
];

const CameraModal = ({ side, onCapture, onClose }) => {
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
            setError("Could not access camera. Please ensure you have given permission or are using HTTPS.");
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
                        {side === 'selfie' ? 'Take Selfie' : side === 'km' ? 'Capture KM Meter' : side === 'car' ? 'Take Car Selfie' : side === 'fuel' ? 'Refill Slip Photo' : side === 'parking' ? 'Parking Slip Photo' : 'Capture Photo'}
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
                        Capture
                    </button>
                )}
            </div>
        </div>
    );
};

const DriverPortal = () => {
    const { user, logout } = useAuth();
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
    const [fuelEntries, setFuelEntries] = useState([{ amount: '', km: '', slip: null, preview: null }]);
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

    useEffect(() => {
        fetchDashboard();
    }, []);

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
            setMessage({ type: 'error', text: 'KM, Selfie, KM Photo, and Car Selfie are mandatory' });
            return;
        }

        if (type === 'punch-out') {
            if (fuelFilled) {
                const invalid = fuelEntries.some(e => !e.amount || !e.slip || !e.km);
                if (invalid) {
                    setMessage({ type: 'error', text: 'All fuel entries must have amount, KM and slip photo' });
                    return;
                }
            }
            if (parkingPaid) {
                const invalid = parkingEntries.some(e => !e.amount || !e.slip);
                if (invalid) {
                    setMessage({ type: 'error', text: 'All parking entries must have amount and receipt' });
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

            setMessage({ type: 'success', text: `Successfully ${type === 'punch-in' ? 'Punched In' : 'Punched Out'}!` });

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
            setMessage({ type: 'success', text: 'Request sent to Admin. Waiting for approval.' });
            fetchDashboard();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to send request' });
        } finally {
            setIsSubmitting(false);
        }
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
                    <header className="dashboard-header" style={{ marginBottom: '24px' }}>
                        <div className="header-logo-section">
                            <div className="header-logo-container">
                                <Car size={24} color="#0f172a" />
                            </div>
                            <div>
                                <h1 className="header-title">{dashboardData?.driver?.company?.name}</h1>
                                <p className="header-subtitle">{user.name}</p>
                            </div>
                        </div>
                        <button onClick={logout} style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </header>

                    {(!dashboardData?.vehicle && !showPunchIn && tripStatus !== 'completed' && tripStatus !== 'pending_approval') ? (
                        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                            <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
                            <h2 style={{ color: 'white', marginBottom: '8px' }}>No Vehicle Active</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Please start your duty to select a vehicle.</p>
                        </div>
                    ) : (
                        <div className="form-section-wrapper">
                            {/* Vehicle Info */}
                            {dashboardData?.vehicle && (
                                <div className="glass-card" style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <p className="section-subtitle">YOUR ASSIGNED VEHICLE</p>
                                        <h2 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', color: 'white', fontWeight: '800', marginBottom: '6px' }}>{dashboardData.vehicle.carNumber}</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(12px, 3vw, 14px)' }}>{dashboardData.vehicle.model}</p>
                                    </div>
                                </div>
                            )}

                            {/* Status Tracker */}
                            <div className="glass-card" style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
                                <div className="modal-grid-2">
                                    <div>
                                        <p className="section-subtitle">PUNCH IN</p>
                                        <p style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: '800', color: isPunchedIn ? '#10b981' : 'var(--text-muted)' }}>
                                            {isPunchedIn ? new Date(todayAttendance.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="section-subtitle">PUNCH OUT</p>
                                        <p style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: '800', color: isPunchedOut ? '#f43f5e' : 'var(--text-muted)' }}>
                                            {isPunchedOut ? new Date(todayAttendance.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Working Closed Screen */}
                            {tripStatus === 'completed' && (
                                <div className="glass-card" style={{ padding: 'clamp(24px, 6vw, 40px)', textAlign: 'center' }}>
                                    <CheckCircle size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
                                    <h2 style={{ color: 'white', fontSize: 'clamp(18px, 4.5vw, 22px)', marginBottom: '8px', fontWeight: '800' }}>Duty Completed</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: 'clamp(13px, 3.2vw, 14px)' }}>Your reports are submitted. You are now off-duty.</p>
                                    <button onClick={handleRequestNewTrip} disabled={isSubmitting} className="btn-primary" style={{ width: '100%', maxWidth: '300px', margin: '0 auto', display: 'block' }}>
                                        {isSubmitting ? 'Processing...' : 'Start New Duty'}
                                    </button>
                                </div>
                            )}

                            {/* Waiting for Approval Screen */}
                            {tripStatus === 'pending_approval' && (
                                <div className="glass-card" style={{ padding: 'clamp(24px, 6vw, 40px)', textAlign: 'center' }}>
                                    <RefreshCw size={56} color="#0ea5e9" style={{ margin: '0 auto 16px' }} className="spinner" />
                                    <h2 style={{ color: 'white', fontSize: 'clamp(18px, 4.5vw, 22px)', marginBottom: '8px', fontWeight: '800' }}>Waiting for Admin</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(13px, 3.2vw, 14px)' }}>Your request is under review. Please wait.</p>
                                </div>
                            )}

                            {/* On Duty Screen */}
                            {showPunchOut && !showPunchOutForm && (
                                <div className="glass-card" style={{ padding: 'clamp(24px, 6vw, 40px)', textAlign: 'center' }}>
                                    <Car size={56} color="#10b981" style={{ margin: '0 auto 16px' }} />
                                    <h2 style={{ color: 'white', fontSize: 'clamp(18px, 4.5vw, 22px)', marginBottom: '8px', fontWeight: '800' }}>You are On Duty</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: 'clamp(13px, 3.2vw, 14px)' }}>Drive safely! Close duty only after reaching parking.</p>
                                    <button
                                        onClick={() => setShowPunchOutForm(true)}
                                        className="btn-primary"
                                        style={{ width: '100%', background: 'var(--accent)', padding: '14px', boxShadow: '0 8px 20px rgba(244, 63, 94, 0.2)' }}
                                    >
                                        Submit Reports & End Duty
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
                                            <h2 className="modal-title">{showPunchIn ? 'Duty Punch-In' : 'Duty Punch-Out'}</h2>
                                            <p className="section-subtitle">{showPunchIn ? 'START' : 'END'}</p>
                                        </div>
                                    </div>


                                    {/* KM Reading */}
                                    <div className="input-wrapper-full" style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                                        <label className="input-label">CURRENT KM METER READING</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="Enter KM"
                                            value={km}
                                            onChange={(e) => setKm(e.target.value)}
                                        />
                                    </div>

                                    {/* Vehicle Selection (Punch-In only) */}
                                    {showPunchIn && (
                                        <div className="input-wrapper-full" style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                                            <label className="input-label">Select Assigned Vehicle</label>
                                            <select
                                                className="input-field"
                                                value={selectedVehicleId}
                                                onChange={(e) => setSelectedVehicleId(e.target.value)}
                                                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '14px', padding: '12px' }}
                                            >
                                                <option value="">-- Select Available Car --</option>
                                                {dashboardData?.availableVehicles?.map(v => (
                                                    <option key={v._id} value={v._id}>
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
                                            <p className="input-label" style={{ marginBottom: '8px' }}>1. DRIVER SELFIE</p>
                                            {!selfiePreview ? (
                                                <div
                                                    onClick={() => setActiveCamera('selfie')}
                                                    className="photo-capture-button"
                                                >
                                                    <Camera size={24} color="var(--primary)" />
                                                    <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--text-muted)', fontWeight: '700' }}>Take Selfie</span>
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
                                            <p className="input-label" style={{ marginBottom: '8px' }}>2. KM PHOTO</p>
                                            {!kmPreview ? (
                                                <div
                                                    onClick={() => setActiveCamera('km')}
                                                    className="photo-capture-button"
                                                >
                                                    <Camera size={24} color="var(--primary)" />
                                                    <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--text-muted)', fontWeight: '700' }}>Take KM Photo</span>
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
                                            <p className="input-label" style={{ marginBottom: '8px' }}>3. CAR SELFIE</p>
                                            {!carPreview ? (
                                                <div
                                                    onClick={() => setActiveCamera('car')}
                                                    className="photo-capture-button"
                                                >
                                                    <Camera size={24} color="var(--primary)" />
                                                    <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--text-muted)', fontWeight: '700' }}>Take Car Photo</span>
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
                                            <h3 className="section-title">EXPENDITURE & TRIP DETAILS</h3>

                                            {/* Fuel Question */}
                                            <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                                                <p className="input-label" style={{ marginBottom: '10px' }}>1. Did you refill Petrol/Diesel?</p>
                                                <div className="yes-no-button-group">
                                                    <button
                                                        onClick={() => setFuelFilled(true)}
                                                        className="yes-no-button"
                                                        style={{ background: fuelFilled ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white' }}
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setFuelFilled(false);
                                                            setFuelEntries([{ amount: '', km: '', slip: null, preview: null }]);
                                                        }}
                                                        className="yes-no-button"
                                                        style={{ background: !fuelFilled ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white' }}
                                                    >
                                                        No
                                                    </button>
                                                </div>

                                                {fuelFilled && (
                                                    <div style={{ marginTop: '16px', display: 'grid', gap: 'clamp(12px, 3vw, 16px)' }}>
                                                        {fuelEntries.map((entry, index) => (
                                                            <div key={index} className="entry-card">
                                                                <div className="entry-card-header">
                                                                    <p className="entry-card-title">REFILL NO. {index + 1}</p>
                                                                    {index > 0 && (
                                                                        <button
                                                                            onClick={() => setFuelEntries(fuelEntries.filter((_, i) => i !== index))}
                                                                            style={{ color: '#f43f5e', background: 'none', padding: '4px' }}
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="input-grid-2">
                                                                    <div className="input-wrapper-full">
                                                                        <label className="input-label">Amount (₹)</label>
                                                                        <input
                                                                            type="number"
                                                                            className="input-field"
                                                                            placeholder="₹"
                                                                            value={entry.amount}
                                                                            onChange={(e) => {
                                                                                const news = [...fuelEntries];
                                                                                news[index].amount = e.target.value;
                                                                                setFuelEntries(news);
                                                                            }}
                                                                            style={{ marginBottom: 0, fontSize: '13px', padding: '10px' }}
                                                                        />
                                                                    </div>

                                                                    <div className="input-wrapper-full">
                                                                        <label className="input-label">Meter KM</label>
                                                                        <input
                                                                            type="number"
                                                                            className="input-field"
                                                                            placeholder="KM"
                                                                            value={entry.km}
                                                                            onChange={(e) => {
                                                                                const news = [...fuelEntries];
                                                                                news[index].km = e.target.value;
                                                                                setFuelEntries(news);
                                                                            }}
                                                                            style={{ marginBottom: 0, fontSize: '13px', padding: '10px' }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div
                                                                    onClick={() => {
                                                                        setActiveIndex(index);
                                                                        setActiveCamera('fuel');
                                                                    }}
                                                                    className="photo-capture-button"
                                                                    style={{ minHeight: '70px' }}
                                                                >
                                                                    {entry.preview ? (
                                                                        <img src={entry.preview} alt="Fuel Slip" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                                                    ) : (
                                                                        <>
                                                                            <Camera size={20} color="var(--primary)" />
                                                                            <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--text-muted)', fontWeight: '700' }}>Capture Slip</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <button
                                                            onClick={() => setFuelEntries([...fuelEntries, { amount: '', km: '', slip: null, preview: null }])}
                                                            className="add-another-button"
                                                        >
                                                            <Plus size={16} /> Add Another Bill
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Parking Question */}
                                            <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                                                <p className="input-label" style={{ marginBottom: '10px' }}>2. Did you pay for parking?</p>
                                                <div className="yes-no-button-group">
                                                    <button
                                                        onClick={() => setParkingPaid(true)}
                                                        className="yes-no-button"
                                                        style={{ background: parkingPaid ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white' }}
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setParkingPaid(false);
                                                            setParkingEntries([{ amount: '', slip: null, preview: null }]);
                                                        }}
                                                        className="yes-no-button"
                                                        style={{ background: !parkingPaid ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white' }}
                                                    >
                                                        No
                                                    </button>
                                                </div>

                                                {parkingPaid && (
                                                    <div style={{ marginTop: '16px', display: 'grid', gap: 'clamp(12px, 3vw, 16px)' }}>
                                                        {parkingEntries.map((entry, index) => (
                                                            <div key={index} className="entry-card">
                                                                <div className="modal-grid-2" style={{ alignItems: 'end' }}>
                                                                    <div className="input-wrapper-full">
                                                                        <label className="input-label">AMOUNT (₹)</label>
                                                                        <input
                                                                            type="number"
                                                                            className="input-field"
                                                                            placeholder="₹"
                                                                            value={entry.amount}
                                                                            onChange={(e) => {
                                                                                const newEntries = [...parkingEntries];
                                                                                newEntries[index].amount = e.target.value;
                                                                                setParkingEntries(newEntries);
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    <div
                                                                        onClick={() => {
                                                                            setActiveIndex(index);
                                                                            setActiveCamera('parking');
                                                                        }}
                                                                        className="photo-capture-button"
                                                                        style={{ width: '100%', minHeight: '50px' }}
                                                                    >
                                                                        {entry.preview ? (
                                                                            <img src={entry.preview} alt="Parking" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                                                                        ) : (
                                                                            <>
                                                                                <Camera size={18} color="var(--primary)" />
                                                                                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '700' }}>Receipt</span>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {parkingEntries.length > 1 && (
                                                                        <button
                                                                            onClick={() => setParkingEntries(parkingEntries.filter((_, i) => i !== index))}
                                                                            style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <button
                                                            onClick={() => setParkingEntries([...parkingEntries, { amount: '', slip: null, preview: null }])}
                                                            className="add-another-button"
                                                        >
                                                            <Plus size={16} /> Add Another Parking
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Outside Trip Question */}
                                            <div style={{ marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                                                <p className="input-label" style={{ marginBottom: '10px' }}>3. Did you go outside city?</p>
                                                <div className="yes-no-button-group">
                                                    <button
                                                        onClick={() => setOutsideTripOccurred(true)}
                                                        className="yes-no-button"
                                                        style={{ background: outsideTripOccurred ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white' }}
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        onClick={() => setOutsideTripOccurred(false)}
                                                        className="yes-no-button"
                                                        style={{ background: !outsideTripOccurred ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white' }}
                                                    >
                                                        No
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
                                                            <label className="checkbox-label">SAME DAY (+100)</label>
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
                                                            <label className="checkbox-label">NIGHT STAY (+500)</label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Maintenance Issues (Punch-Out only) */}
                                    {showPunchOut && (
                                        <div style={{ marginBottom: 'clamp(20px, 5vw, 28px)' }}>
                                            <h3 className="section-title">MAINTENANCE ISSUES (OPTIONAL)</h3>

                                            <div className="quick-issues-grid">
                                                {QUICK_ISSUES.map((issue) => {
                                                    const isActive = otherRemarks.split(',').map(s => s.trim()).includes(issue.label);
                                                    const Icon = issue.icon;
                                                    return (
                                                        <div
                                                            key={issue.id}
                                                            onClick={() => {
                                                                setOtherRemarks(prev => {
                                                                    const currentIssues = prev ? prev.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                                    if (currentIssues.includes(issue.label)) {
                                                                        return currentIssues.filter(item => item !== issue.label).join(', ');
                                                                    } else {
                                                                        return [...currentIssues, issue.label].join(', ');
                                                                    }
                                                                });
                                                            }}
                                                            className="quick-issue-button"
                                                            style={{
                                                                background: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                                                                border: isActive ? `1.5px solid ${issue.color}` : '1px solid rgba(255,255,255,0.05)'
                                                            }}
                                                        >
                                                            <Icon className="quick-issue-icon" color={issue.color} />
                                                            <span>{issue.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Route Details (Moved here) */}
                                            <div className="input-wrapper-full" style={{ marginTop: '16px' }}>
                                                <label className="input-label">ROUTE DETAILS (e.g. Local/Outstation)</label>
                                                <textarea
                                                    className="input-field"
                                                    placeholder="Enter route details..."
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                    style={{ marginBottom: '15px', resize: 'vertical', minHeight: '60px' }}
                                                />
                                            </div>

                                            <div className="input-wrapper-full" style={{ marginTop: '4px' }}>
                                                <label className="input-label">OTHER REMARKS / MAINTENANCE</label>
                                                <textarea
                                                    className="input-field"
                                                    placeholder="Describe any other issues..."
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
                                        {isSubmitting ? 'PROCESSING...' : (showPunchOut ? 'SUBMIT DAILY REPORT' : 'START MY DUTY')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Camera Modal */}
            {activeCamera && (
                <CameraModal
                    side={activeCamera}
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
                        }
                    }}
                    onClose={() => setActiveCamera(null)}
                />
            )}
        </div>
    );
};

export default DriverPortal;