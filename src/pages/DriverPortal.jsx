import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

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
        <div style={{ position: 'fixed', inset: 0, background: 'black', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <h3>
                    {side === 'selfie' ? 'Take Selfie' :
                        side === 'km' ? 'Capture KM Meter' :
                            side === 'car' ? 'Take Car Selfie' :
                                side === 'fuel' ? 'Refill Slip Photo' :
                                    side === 'parking' ? 'Parking Slip Photo' : 'Capture Photo'}
                </h3>
                <button onClick={() => { stopCamera(); onClose(); }} style={{ background: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
            </div>

            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {error ? (
                    <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
                        <AlertTriangle size={48} color="#f43f5e" style={{ marginBottom: '10px' }} />
                        <p>{error}</p>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                )}
            </div>

            <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                {!error && (
                    <button
                        onClick={capture}
                        style={{
                            width: '70px', height: '70px', borderRadius: '50%', border: '5px solid white',
                            background: 'rgba(255,255,255,0.2)', cursor: 'pointer'
                        }}
                    />
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
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
    const [fuelAmount, setFuelAmount] = useState('');
    const [fuelSlip, setFuelSlip] = useState(null);
    const [fuelSlipPreview, setFuelSlipPreview] = useState(null);

    const [parkingPaid, setParkingPaid] = useState(false);
    const [parkingEntries, setParkingEntries] = useState([{ amount: '', slip: null, preview: null }]);

    const [outsideTripOccurred, setOutsideTripOccurred] = useState(false);
    const [outsideTripTypes, setOutsideTripTypes] = useState([]);

    // New Fields for Report
    const [tollParkingAmount, setTollParkingAmount] = useState('');
    const [allowanceTA, setAllowanceTA] = useState(false);
    const [nightStay, setNightStay] = useState(false);
    const [otherRemarks, setOtherRemarks] = useState('');

    const [remarks, setRemarks] = useState('');

    // Camera Modal states
    const [activeCamera, setActiveCamera] = useState(null); // 'selfie', 'km', 'car', 'fuel', 'parking'

    const [location, setLocation] = useState({ latitude: null, longitude: null, address: 'Detecting location...' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPunchOutForm, setShowPunchOutForm] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedVehicleId, setSelectedVehicleId] = useState('');

    useEffect(() => {
        fetchDashboard();
        detectLocation();
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

    const detectLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setLocation(prev => ({ ...prev, latitude, longitude, address: 'Precision Location Found ✅' }));

                    try {
                        const response = await fetch(`/api/utils/geocode?lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        setLocation(prev => ({ ...prev, address: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                    } catch (err) {
                        setLocation(prev => ({ ...prev, address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                    }
                },
                (err) => {
                    console.error("Location error:", err);
                    let msg = "Location Access Denied ❌. Please Allow Location in browser and reload.";
                    if (err.code === 3) msg = "Location Timeout. Please check internet/signal.";
                    setLocation(prev => ({ ...prev, address: msg }));
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocation(prev => ({ ...prev, address: 'Geolocation not supported' }));
        }
    };

    const handlePunch = async (type) => {
        if (!km || !selfie || !kmPhoto || !carSelfie) {
            setMessage({ type: 'error', text: 'KM, Selfie, KM Photo, and Car Selfie are mandatory' });
            return;
        }

        if (type === 'punch-out') {
            if (fuelFilled && (!fuelAmount || !fuelSlip)) {
                setMessage({ type: 'error', text: 'Fuel amount and slip photo are required' });
                return;
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
        formData.append('latitude', location.latitude || 0);
        formData.append('longitude', location.longitude || 0);
        formData.append('address', location.address);
        if (type === 'punch-in') {
            formData.append('vehicleId', selectedVehicleId);
        }

        if (type === 'punch-out') {
            // TRIP & REMARKS
            formData.append('remarks', remarks);
            formData.append('otherRemarks', otherRemarks);

            // FUEL
            formData.append('fuelFilled', fuelFilled);
            formData.append('fuelAmount', fuelFilled ? fuelAmount : 0);
            if (fuelFilled && fuelSlip) formData.append('fuelSlip', fuelSlip);

            // PARKING
            formData.append('parkingPaid', parkingPaid);
            if (parkingPaid) {
                parkingEntries.forEach((entry) => {
                    formData.append('parkingAmounts', entry.amount);
                    formData.append('parkingSlip', entry.slip);
                });
            }

            // OUTSIDE TRIP
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
            setKm('');
            setSelfie(null); setSelfiePreview(null);
            setKmPhoto(null); setKmPreview(null);
            setCarSelfie(null); setCarPreview(null);
            setFuelFilled(false); setFuelAmount(''); setFuelSlip(null); setFuelSlipPreview(null);
            setParkingPaid(false); setParkingEntries([{ amount: '', slip: null, preview: null }]);
            setOutsideTripOccurred(false);
            setRemarks('');
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

    if (loading) return <div style={{ color: 'white', padding: '40px' }}>Loading...</div>;

    const todayAttendance = dashboardData?.todayAttendance;
    const isPunchedIn = !!todayAttendance?.punchIn?.time;
    // local check for today's punch out (visuals only)
    const isPunchedOut = !!todayAttendance?.punchOut?.time;

    // Check global trip status
    const tripStatus = dashboardData?.driver?.tripStatus; // approved, active, completed, pending_approval

    // Determine current UI state
    // 1. If tripStatus is 'pending_approval', show WAITING screen.
    // 2. If tripStatus is 'completed', show START NEW TRIP button.
    // 3. If tripStatus is 'approved', show PUNCH IN form (if not already punched in today or if start new is allowed).
    // 4. If tripStatus is 'active', show PUNCH OUT form. (This matches isPunchedIn true).

    const showPunchIn = tripStatus === 'approved';
    const showPunchOut = tripStatus === 'active';

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <SEO title="Driver Attendance Portal" description="Mandatory morning punch-in and night punch-out portal for drivers. Track trip KM and expenses." />
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>{dashboardData?.driver?.company?.name}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Welcome, {user.name}</p>
                </div>
                <button
                    onClick={logout}
                    style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)', padding: '10px', borderRadius: '12px' }}
                >
                    <LogOut size={20} />
                </button>
            </header>

            {(!dashboardData?.vehicle && !showPunchIn && tripStatus !== 'completed' && tripStatus !== 'pending_approval') ? (
                <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
                    <AlertTriangle size={48} color="#f59e0b" style={{ marginBottom: '15px' }} />
                    <h3 style={{ color: 'white' }}>No Vehicle Active</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Please start your duty to select a vehicle.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {/* Vehicle Info */}
                    {dashboardData?.vehicle && (
                        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                                <Car color="white" />
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Assigned Vehicle</p>
                                <h3 style={{ color: 'white', fontWeight: '700' }}>{dashboardData.vehicle.carNumber}</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{dashboardData.vehicle.model}</p>
                            </div>
                        </div>
                    )}

                    {/* Status Tracker */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="glass-card" style={{ flex: 1, padding: '15px', textAlign: 'center', opacity: isPunchedIn ? 1 : 0.5 }}>
                            <div style={{ color: isPunchedIn ? '#10b981' : 'var(--text-muted)', marginBottom: '5px' }}>
                                <CheckCircle size={20} style={{ margin: '0 auto' }} />
                            </div>
                            <p style={{ fontSize: '12px', color: 'white' }}>Punch In</p>
                            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isPunchedIn ? new Date(todayAttendance.punchIn.time).toLocaleTimeString() : '--:--'}</p>
                        </div>
                        {isPunchedIn && (
                            <div className="glass-card" style={{ flex: 1, padding: '15px', textAlign: 'center', opacity: isPunchedOut ? 1 : 0.5 }}>
                                <div style={{ color: isPunchedOut ? '#10b981' : 'var(--text-muted)', marginBottom: '5px' }}>
                                    <CheckCircle size={20} style={{ margin: '0 auto' }} />
                                </div>
                                <p style={{ fontSize: '12px', color: 'white' }}>Punch Out</p>
                                <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{isPunchedOut ? new Date(todayAttendance.punchOut.time).toLocaleTimeString() : '--:--'}</p>
                            </div>
                        )}
                    </div>



                    {/* Working Closed Screen */}
                    {tripStatus === 'completed' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                            <div style={{ background: 'rgba(244, 63, 94, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <CheckCircle size={32} color="#10b981" />
                            </div>
                            <h2 style={{ color: 'white', marginBottom: '10px' }}>Working Closed</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Your duty reports have been submitted. You are off-duty for this trip.</p>
                            <button
                                onClick={handleRequestNewTrip}
                                className="btn-primary"
                                style={{ width: '100%' }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Processing...' : 'Start Duty Today'}
                            </button>
                        </motion.div>
                    )}

                    {/* Waiting for Approval Screen */}
                    {tripStatus === 'pending_approval' && (
                        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                            <RefreshCw className="spin" size={48} color="var(--primary)" style={{ marginBottom: '20px', margin: '0 auto' }} />
                            <h2 style={{ color: 'white', marginBottom: '10px' }}>Waiting for Approval</h2>
                            <p style={{ color: 'var(--text-muted)' }}>Admin is reviewing your request for a new trip.</p>
                        </div>
                    )}

                    {/* On Duty Screen (Intermediate) */}
                    {showPunchOut && !showPunchOutForm && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Car size={32} color="#10b981" />
                            </div>
                            <h2 style={{ color: 'white', marginBottom: '10px' }}>You are On Duty</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Drive safely! Click below to finish your trip and report expenses.</p>
                            <button
                                onClick={() => setShowPunchOutForm(true)}
                                className="btn-primary"
                                style={{ width: '100%', background: 'var(--accent)' }}
                            >
                                End Duty (Punch Out)
                            </button>
                        </motion.div>
                    )}

                    {(showPunchIn || (showPunchOut && showPunchOutForm)) && (
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {showPunchOut && (
                                        <button onClick={() => setShowPunchOutForm(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '5px', borderRadius: '8px' }}>
                                            <X size={18} />
                                        </button>
                                    )}
                                    <h2 style={{ color: 'white', fontSize: '20px' }}>{showPunchIn ? 'Start Duty (Punch In)' : 'End Duty (Punch Out)'}</h2>
                                </div>
                                <div style={{ padding: '5px 12px', borderRadius: '20px', background: showPunchIn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: showPunchIn ? '#10b981' : 'var(--accent)', fontSize: '12px' }}>
                                    {showPunchIn ? 'Ready to Start' : 'On Duty'}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>KM Meter Reading</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="Enter current KM"
                                    value={km}
                                    onChange={(e) => setKm(e.target.value)}
                                />
                            </div>

                            {showPunchIn && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Select Vehicle</label>
                                    <select
                                        className="input-field"
                                        value={selectedVehicleId}
                                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <option value="" style={{ background: '#1e293b', color: 'white' }}>-- Select Available Car --</option>
                                        {dashboardData?.availableVehicles?.map(v => (
                                            <option key={v._id} value={v._id} style={{ background: '#1e293b', color: 'white' }}>
                                                {v.carNumber} - {v.model}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                                {/* Selfie Capture */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>1. Driver Selfie</label>
                                    {!selfiePreview ? (
                                        <div
                                            onClick={() => setActiveCamera('selfie')}
                                            style={{
                                                padding: '20px', border: '2px dashed var(--border)',
                                                borderRadius: '12px', textAlign: 'center', cursor: 'pointer', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                                            }}
                                        >
                                            <UserIcon size={20} color="var(--primary)" style={{ margin: '0 auto 5px' }} />
                                            <p style={{ fontSize: '12px', color: 'white' }}>Take Selfie</p>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <img src={selfiePreview} alt="Selfie" style={{ width: '100%', borderRadius: '12px', height: '100px', objectFit: 'cover' }} />
                                            <button onClick={() => { setSelfie(null); setSelfiePreview(null); }} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(244,63,94,0.8)', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw size={12} /></button>
                                        </div>
                                    )}
                                </div>

                                {/* KM Photo Capture */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>2. KM Photo</label>
                                    {!kmPreview ? (
                                        <div
                                            onClick={() => setActiveCamera('km')}
                                            style={{
                                                padding: '20px', border: '2px dashed var(--border)',
                                                borderRadius: '12px', textAlign: 'center', cursor: 'pointer', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                                            }}
                                        >
                                            <Camera size={20} color="var(--primary)" style={{ margin: '0 auto 5px' }} />
                                            <p style={{ fontSize: '12px', color: 'white' }}>Take KM Photo</p>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <img src={kmPreview} alt="KM Meter" style={{ width: '100%', borderRadius: '12px', height: '100px', objectFit: 'cover' }} />
                                            <button onClick={() => { setKmPhoto(null); setKmPreview(null); }} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(244,63,94,0.8)', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw size={12} /></button>
                                        </div>
                                    )}
                                </div>

                                {/* Car Selfie Capture */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>3. Car Selfie</label>
                                    {!carPreview ? (
                                        <div
                                            onClick={() => setActiveCamera('car')}
                                            style={{
                                                padding: '20px', border: '2px dashed var(--border)',
                                                borderRadius: '12px', textAlign: 'center', cursor: 'pointer', height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center'
                                            }}
                                        >
                                            <Car size={20} color="var(--primary)" style={{ margin: '0 auto 5px' }} />
                                            <p style={{ fontSize: '12px', color: 'white' }}>Take Car Photo</p>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <img src={carPreview} alt="Car Selfie" style={{ width: '100%', borderRadius: '12px', height: '100px', objectFit: 'cover' }} />
                                            <button onClick={() => { setCarSelfie(null); setCarPreview(null); }} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(244,63,94,0.8)', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RefreshCw size={12} /></button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Punch-Out Questions */}
                            {showPunchOut && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '25px' }}>
                                    <h4 style={{ color: 'white', marginBottom: '15px' }}>Expenditure & Trip Details</h4>

                                    {/* Fuel Question */}
                                    <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                                        <p style={{ color: 'white', fontSize: '14px', marginBottom: '10px' }}>1. Did you refill Petrol/Diesel in the car?</p>
                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                                            <button onClick={() => setFuelFilled(true)} style={{ background: fuelFilled ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 25px', borderRadius: '8px' }}>Yes</button>
                                            <button onClick={() => { setFuelFilled(false); setFuelSlip(null); setFuelSlipPreview(null); setFuelAmount(''); }} style={{ background: !fuelFilled ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 25px', borderRadius: '8px' }}>No</button>
                                        </div>
                                        {fuelFilled && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' }}>
                                                <input type="number" placeholder="Enter amount" className="input-field" value={fuelAmount} onChange={(e) => setFuelAmount(e.target.value)} />
                                                <div onClick={() => setActiveCamera('fuel')} style={{ border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center', padding: '10px', cursor: 'pointer' }}>
                                                    {fuelSlipPreview ? <img src={fuelSlipPreview} style={{ width: '100%', height: '40px', objectFit: 'cover' }} /> : <p style={{ fontSize: '11px', color: 'white' }}>Upload Slip</p>}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Parking Question */}
                                    <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                                        <p style={{ color: 'white', fontSize: '14px', marginBottom: '10px' }}>2. Did you pay for parking?</p>
                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                                            <button onClick={() => setParkingPaid(true)} style={{ background: parkingPaid ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 25px', borderRadius: '8px' }}>Yes</button>
                                            <button onClick={() => { setParkingPaid(false); setParkingEntries([{ amount: '', slip: null, preview: null }]); }} style={{ background: !parkingPaid ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 25px', borderRadius: '8px' }}>No</button>
                                        </div>
                                        {parkingPaid && (
                                            <div style={{ display: 'grid', gap: '15px' }}>
                                                {parkingEntries.map((entry, index) => (
                                                    <motion.div key={index} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '5px' }}>Entry {index + 1}</p>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                                <input
                                                                    type="number"
                                                                    placeholder="Amount"
                                                                    className="input-field"
                                                                    value={entry.amount}
                                                                    style={{ padding: '8px' }}
                                                                    onChange={(e) => {
                                                                        const newEntries = [...parkingEntries];
                                                                        newEntries[index].amount = e.target.value;
                                                                        setParkingEntries(newEntries);
                                                                    }}
                                                                />
                                                                <div
                                                                    onClick={() => setActiveCamera(`parking-${index}`)}
                                                                    style={{ border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    {entry.preview ? <img src={entry.preview} style={{ width: '100%', height: '30px', objectFit: 'cover' }} /> : <p style={{ fontSize: '11px', color: 'white' }}>Take Receipt</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {parkingEntries.length > 1 && (
                                                            <button
                                                                onClick={() => setParkingEntries(parkingEntries.filter((_, i) => i !== index))}
                                                                style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                ))}
                                                <button
                                                    onClick={() => setParkingEntries([...parkingEntries, { amount: '', slip: null, preview: null }])}
                                                    style={{ border: '1px solid var(--primary)', color: 'var(--primary)', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', background: 'none' }}
                                                >
                                                    + Add Another Parking
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Outside Trip Question */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <p style={{ color: 'white', fontSize: '14px', marginBottom: '10px' }}>3. Did you take the car outside the city?</p>
                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                                            <button onClick={() => setOutsideTripOccurred(true)} style={{ background: outsideTripOccurred ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 25px', borderRadius: '8px' }}>Yes</button>
                                            <button onClick={() => setOutsideTripOccurred(false)} style={{ background: !outsideTripOccurred ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', padding: '8px 25px', borderRadius: '8px' }}>No</button>
                                        </div>
                                        {outsideTripOccurred && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '15px' }}>
                                                <div style={{ display: 'flex', gap: '15px' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', flex: 1 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={outsideTripTypes.includes('Same Day')}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setOutsideTripTypes([...outsideTripTypes, 'Same Day']);
                                                                else setOutsideTripTypes(outsideTripTypes.filter(t => t !== 'Same Day'));
                                                            }}
                                                            style={{ width: '18px', height: '18px' }}
                                                        />
                                                        <span>Same Day (Bonus 100)</span>
                                                    </label>

                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', flex: 1 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={outsideTripTypes.includes('Night Stay')}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setOutsideTripTypes([...outsideTripTypes, 'Night Stay']);
                                                                else setOutsideTripTypes(outsideTripTypes.filter(t => t !== 'Night Stay'));
                                                            }}
                                                            style={{ width: '18px', height: '18px' }}
                                                        />
                                                        <span>Night Stay (Bonus 500)</span>
                                                    </label>
                                                </div>
                                                <div style={{ height: '20px' }} />
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {showPunchOut && (
                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Trip Details / Remarks</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Where did the car go today? Enter route or trip details..."
                                        rows="3"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        style={{ resize: 'none', padding: '12px', marginBottom: '15px' }}
                                    ></textarea>

                                    {/* Other Remarks (Puncture etc) */}
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>Other Issues (Optional)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Tyre Puncture"
                                            value={otherRemarks}
                                            onChange={(e) => setOtherRemarks(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                marginBottom: '25px',
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                background: 'rgba(255,255,255,0.03)',
                                padding: '12px',
                                borderRadius: '8px'
                            }}>
                                <MapPin size={16} color={location.latitude ? '#10b981' : '#f43f5e'} style={{ marginTop: '2px' }} />
                                <span style={{ lineHeight: '1.4' }}>{location.address}</span>
                            </div>

                            {message.text && (
                                <div style={{
                                    padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
                                    background: message.type === 'error' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: message.type === 'error' ? 'var(--accent)' : '#10b981'
                                }}>
                                    {message.text}
                                </div>
                            )}

                            <button
                                className="btn-primary"
                                style={{ width: '100%' }}
                                onClick={() => {
                                    if (showPunchIn && !selectedVehicleId) {
                                        return setMessage({ type: 'error', text: 'Please select a vehicle first' });
                                    }
                                    handlePunch(showPunchOut ? 'punch-out' : 'punch-in');
                                }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Processing...' : (showPunchOut ? 'Submit Punch-Out' : 'Submit Punch-In')}
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            <AnimatePresence>
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
                                setFuelSlip(file);
                                setFuelSlipPreview(preview);
                            } else if (activeCamera.startsWith('parking')) {
                                const index = parseInt(activeCamera.split('-')[1]);
                                const newEntries = [...parkingEntries];
                                newEntries[index].slip = file;
                                newEntries[index].preview = preview;
                                setParkingEntries(newEntries);
                            }
                        }}
                        onClose={() => setActiveCamera(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverPortal;
