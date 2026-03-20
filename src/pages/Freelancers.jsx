import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import { Plus, Search, Trash2, User as UserIcon, Users, X, CheckCircle, AlertCircle, LogIn, LogOut, Car, Filter, Download, Phone, Edit2, IndianRupee, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Camera, Image as ImageIcon, Eye, TrendingUp, History, Fuel, MapPin, FileText, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import AttendanceModal from '../components/reports/AttendanceModal';
import { todayIST, toISTDateString, formatDateIST, nowISTDateTimeString, toISTDateTimeString, firstDayOfMonthIST, nowIST } from '../utils/istUtils';

// Sub-components for cleaner code
const Modal = ({ title, onClose, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 15, 0.9)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(12px)' }}>
        <div
            className="premium-glass"
            style={{ width: '100%', maxWidth: '580px', padding: '35px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '32px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: 'white', fontSize: '24px', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>{title}</h2>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', height: '40px', width: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                    <X size={22} />
                </button>
            </div>
            {children}
        </div>
    </div>
);

const Field = ({ label, value, onChange, type = "text", required = false, autoComplete = "off", placeholder = "", inputMode = "text" }) => (
    <div style={{ marginBottom: '20px' }}>
        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px', display: 'block' }}>{label}</label>
        <input
            type={type}
            className="input-field"
            required={required}
            value={(value === 0 || value) ? value : ''}
            onChange={e => onChange(e.target.value)}
            autoComplete={autoComplete}
            placeholder={placeholder}
            inputMode={inputMode}
            style={{
                height: '52px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '14px',
                fontSize: '15px'
            }}
        />
    </div>
);

const SubmitButton = ({ disabled, text, message }) => (
    <div style={{ marginTop: '25px' }}>
        {message?.text && (
            <div
                style={{ padding: '15px', borderRadius: '16px', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: message.type === 'success' ? '#10b981' : '#f43f5e', border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}` }}
            >
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span style={{ fontWeight: '600' }}>{message.text}</span>
            </div>
        )}
        <button
            type="submit"
            disabled={disabled}
            className="btn-primary"
            style={{
                width: '100%',
                height: '58px',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
            }}
        >
            {disabled ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }}></div> : text}
        </button>
    </div>
);

const PhotoUpload = ({ label, icon: Icon, onFileSelect, previewFile }) => {
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (previewFile) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(previewFile);
        } else {
            setPreview(null);
        }
    }, [previewFile]);

    return (
        <div style={{ position: 'relative' }}>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{label}</label>
            <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.1)',
                borderRadius: '16px',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.3s'
            }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#fbbf24'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
                {preview ? (
                    <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <>
                        <Icon size={24} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '8px' }} />
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>CLICK TO UPLOAD</span>
                    </>
                )}
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                        const file = e.target.files[0];
                        if (file) onFileSelect(file);
                    }}
                />
            </label>
        </div>
    );
};


const Freelancers = () => {
    const { selectedCompany } = useCompany();
    const [drivers, setDrivers] = useState([]);
    const [allDrivers, setAllDrivers] = useState([]); // Includes both regular and freelancers
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vehicleSearch, setVehicleSearch] = useState('');

    // Modals State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPunchInModal, setShowPunchInModal] = useState(false);
    const [showPunchOutModal, setShowPunchOutModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [editingDriver, setEditingDriver] = useState(null);
    const [driverFilter, setDriverFilter] = useState('All');
    const [attendance, setAttendance] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [advances, setAdvances] = useState([]);
    const [vehicleFilter, setVehicleFilter] = useState('All');
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false);
    const [quickExpenseType, setQuickExpenseType] = useState('fuel'); // 'fuel' or 'parking'
    const [settlementDriverFilter, setSettlementDriverFilter] = useState('All');
    const [quickExpenseData, setQuickExpenseData] = useState({
        amount: '',
        date: todayIST(),
        vehicleId: '',
        location: '',
        remark: '',
        slipPhoto: '',
        fuelType: 'Diesel',
        quantity: '',
        rate: '',
        odometer: '',
        stationName: '',
        paymentMode: 'Cash',
        paymentSource: 'Yatree Office'
    });
    const [documentForm, setDocumentForm] = useState({ documentType: 'Driving License', expiryDate: '' });
    const [documentFile, setDocumentFile] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTabState] = useState(() => {
        const urlTab = searchParams.get('tab');
        if (urlTab) return urlTab;
        return localStorage.getItem('freelancerActiveTab') || 'personnel';
    });

    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', tab);
            return newParams;
        });
        localStorage.setItem('freelancerActiveTab', tab);
    };
    const [expandedLedger, setExpandedLedger] = useState(null);

    // Form States
    const [formData, setFormData] = useState({ name: '', mobile: '', licenseNumber: '', dailyWage: '', nightStayBonus: '500', sameDayReturnBonus: '100' });
    const [editForm, setEditForm] = useState({ name: '', mobile: '', licenseNumber: '', dailyWage: '', nightStayBonus: '500', sameDayReturnBonus: '100' });
    const [punchInData, setPunchInData] = useState({
        vehicleId: '',
        km: '',
        date: todayIST(),
        time: nowISTDateTimeString(),
        pickUpLocation: ''
    });
    const [punchOutData, setPunchOutData] = useState({ km: '', time: nowISTDateTimeString(), fuelAmount: '0', parkingAmount: '0', allowanceTA: '0', nightStayAmount: '0', parkingPaidBy: 'Self', review: '', dailyWage: '', dropLocation: '', parkingSlipPhoto: null });
    const [advanceData, setAdvanceData] = useState({ amount: '', remark: '', date: todayIST(), advanceType: 'Office', givenBy: 'Office' });
    const [manualData, setManualData] = useState({
        driverId: '',
        vehicleId: '',
        date: todayIST(),
        punchInKM: '',
        punchOutKM: '',
        punchInTime: todayIST() + 'T08:00',
        punchOutTime: todayIST() + 'T20:00',
        pickUpLocation: '',
        dropLocation: '',
        fuelAmount: '0',
        parkingAmount: '0',
        allowanceTA: '0',
        nightStayAmount: '0',
        otherBonus: '0',
        dailyWage: '',
        review: '',
        eventId: ''
    });

    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'range'
    const [monthlySummaries, setMonthlySummaries] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(false);

    const [events, setEvents] = useState([]);
    const [punchInPhotos, setPunchInPhotos] = useState({ kmPhoto: null });
    const [punchOutPhotos, setPunchOutPhotos] = useState({ kmPhoto: null });

    const [showEditDutyModal, setShowEditDutyModal] = useState(false);
    const [editingDuty, setEditingDuty] = useState(null);
    const [editDutyForm, setEditDutyForm] = useState({
        date: '',
        driverId: '',
        vehicleId: '',
        startKm: '',
        endKm: '',
        punchInTime: '',
        punchOutTime: '',
        pickUpLocation: '',
        dropLocation: '',
        fuelAmount: '0',
        parkingAmount: '0',
        parkingPaidBy: 'Self',
        allowanceTA: 0,
        nightStayAmount: 0,
        bonusAmount: '0',
        dailyWage: '',
        remarks: '',
        dutyType: ''
    });

    // Date utility helpers removed in favor of istUtils.js


    // Unified date defaults handled in initial state.
    useEffect(() => {
    }, []);

    useEffect(() => {
        if (quickExpenseData.amount && quickExpenseData.quantity) {
            const calculatedRate = (Number(quickExpenseData.amount) / Number(quickExpenseData.quantity)).toFixed(2);
            if (quickExpenseData.rate !== calculatedRate) {
                setQuickExpenseData(prev => ({ ...prev, rate: calculatedRate }));
            }
        }
    }, [quickExpenseData.amount, quickExpenseData.quantity]);

    const getOneEightyDaysAgo = () => {
        const d = nowIST();
        d.setUTCDate(d.getUTCDate() - 180);
        return toISTDateString(d);
    };

    const getToday = () => todayIST();

    const [isRange, setIsRange] = useState(() => {
        if (location.state?.from) return location.state.from !== location.state.to;
        return false;
    });
    const [fromDate, setFromDate] = useState(() => {
        if (location.state?.from) return location.state.from;
        return todayIST();
    });
    const [toDate, setToDate] = useState(() => {
        if (location.state?.to) return location.state.to;
        return todayIST();
    });

    // Reset dates when navigating to this page via Sidebar (location state will be null)
    useEffect(() => {
        if (!location.state?.from) {
            setFromDate(todayIST());
            setToDate(todayIST());
            setIsRange(false);
        }
    }, [location.state]);

    /* navigate dates */
    const shiftDays = (n) => {
        // Use toDate for single mode, fromDate for range mode as reference
        const referenceDate = isRange ? fromDate : toDate;
        const f = nowIST(referenceDate);
        f.setUTCDate(f.getUTCDate() + n);
        const fStr = f.toISOString().split('T')[0];

        if (isRange) {
            setFromDate(fStr);
            // In range mode, optional: move both or just from?
            // Usually common to move both for "Next/Prev Period"
            const t = nowIST(toDate);
            t.setUTCDate(t.getUTCDate() + n);
            setToDate(t.toISOString().split('T')[0]);
        } else {
            setFromDate(fStr);
            setToDate(fStr);
        }
    };

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });


    const fetchAttendance = useCallback(async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/reports/${selectedCompany._id}?from=${fromDate}&to=${toDate}&bypassCache=true&_t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            // Filter attendance for freelancers
            const freelancerAttendance = (data.attendance || []).filter(a =>
                a.isFreelancer || a.driver?.isFreelancer || a.driver?.name?.includes('(F)')
            );
            setAttendance(freelancerAttendance);
        } catch (err) { console.error('fetchAttendance error:', err?.response?.status, err?.response?.config?.url || err.message); }
    }, [selectedCompany, fromDate, toDate]);

    const fetchAdvances = useCallback(async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            // Added from/to to ensure consistency even if called directly
            const { data } = await axios.get(`/api/admin/advances/${selectedCompany._id}?isFreelancer=true&from=${fromDate}&to=${toDate}&bypassCache=true&_t=${Date.now()}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setAdvances(data || []);
        } catch (err) { console.error('fetchAdvances error:', err?.response?.status, err?.response?.config?.url || err.message); }
    }, [selectedCompany, fromDate, toDate]);

    const fetchMonthlySummaries = useCallback(async () => {
        if (!selectedCompany?._id || activeTab !== 'accounts') return;
        setSummaryLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/salary-summary/${selectedCompany._id}?month=${month}&year=${year}&isFreelancer=true`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setMonthlySummaries(data || []);
        } catch (err) {
            console.error('fetchMonthlySummaries error:', err);
        } finally {
            setSummaryLoading(false);
        }
    }, [selectedCompany, month, year, activeTab]);

    useEffect(() => {
        if (activeTab === 'accounts' && viewMode === 'monthly') {
            fetchMonthlySummaries();
        }
    }, [fetchMonthlySummaries, activeTab, viewMode]);

    const handleDeleteDuty = async (duty) => {
        if (!window.confirm('Are you sure you want to delete this duty record?')) return;

        try {
            setSubmitting(true);
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const id = duty._id;

            // Check if it's a regular attendance or an outside car voucher
            const isVoucher = duty.entryType === 'voucher' || duty.isOutsideCar;
            const endpoint = isVoucher ? `/api/admin/vehicles/${id}` : `/api/admin/attendance/${id}`;

            console.log(`[DEBUG] Deleting duty: ${id}, isVoucher: ${isVoucher}, endpoint: ${endpoint}`);

            await axios.delete(endpoint, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });

            // forced delay for DB propagation
            await new Promise(r => setTimeout(r, 300));

            // Refresh all relevant data
            await Promise.all([
                fetchAttendance(),
                fetchFreelancers(),
                fetchVehicles(),
                fetchAdvances()
            ]);

            setMessage({ type: 'success', text: 'Duty record deleted successfully' });
            setTimeout(() => setMessage({ type: '', text: '' }), 1500);
        } catch (error) {
            console.error('[DELETE_ERROR]', error);
            alert(error.response?.data?.message || 'Error deleting duty record');
        } finally {
            setSubmitting(false);
        }
    };

    const fetchFreelancers = useCallback(async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            // Fetch Freelancers
            const resF = await axios.get(`/api/admin/drivers/${selectedCompany._id}?isFreelancer=true&usePagination=false`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setDrivers(resF.data.drivers || []);

            // Fetch All Drivers (for manual entry)
            const resA = await axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setAllDrivers(resA.data.drivers || []);
        } catch (err) { console.error('fetchFreelancers error:', err?.response?.status, err?.response?.config?.url || err.message); }
        finally { setLoading(false); }
    }, [selectedCompany]);

    const fetchVehicles = useCallback(async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles || []);
        } catch (err) { console.error('fetchVehicles error:', err?.response?.status, err?.response?.config?.url || err.message); }
    }, [selectedCompany]);

    const fetchEvents = useCallback(async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/events/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setEvents(data || []);
        } catch (err) { console.error('Fetch events error:', err); }
    }, [selectedCompany]);

    // Master Data Effect (Company change only)
    useEffect(() => {
        if (selectedCompany) {
            fetchFreelancers();
            fetchVehicles();
            fetchEvents();
        }
    }, [selectedCompany, fetchFreelancers, fetchVehicles, fetchEvents]);

    // Filtered Data Effect (Company or Date changes)
    useEffect(() => {
        if (selectedCompany) {
            fetchAttendance();
            fetchAdvances();
        }
    }, [selectedCompany, fromDate, toDate, fetchAttendance, fetchAdvances, activeTab]);


    const handleQuickExpenseSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            let uploadedImageUrl = '';

            if (quickExpenseData.slipPhoto && typeof quickExpenseData.slipPhoto !== 'string') {
                const uploadData = new FormData();
                uploadData.append('file', quickExpenseData.slipPhoto);
                const uploadRes = await axios.post('/api/admin/upload', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo.token}` }
                });
                uploadedImageUrl = uploadRes.data.url;
            } else if (typeof quickExpenseData.slipPhoto === 'string') {
                uploadedImageUrl = quickExpenseData.slipPhoto;
            }

            const payload = {
                driverId: selectedDriver._id,
                driver: selectedDriver.name,
                amount: quickExpenseData.amount,
                date: quickExpenseData.date,
                companyId: selectedCompany._id,
                vehicleId: quickExpenseData.vehicleId,
                remark: quickExpenseData.remark || '',
                type: quickExpenseType,
                slipPhoto: uploadedImageUrl
            };

            if (quickExpenseType === 'fuel') {
                payload.fuelType = quickExpenseData.fuelType;
                payload.quantity = quickExpenseData.quantity;
                payload.rate = quickExpenseData.rate;
                payload.odometer = quickExpenseData.odometer;
                payload.stationName = quickExpenseData.stationName;
                payload.paymentMode = quickExpenseData.paymentMode;
                payload.paymentSource = quickExpenseData.paymentSource;
            }

            if (quickExpenseData.location) payload.location = quickExpenseData.location;

            const endpoint = '/api/admin/expenses/pending';
            await axios.post(endpoint, payload, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            });

            setMessage({ type: 'success', text: `${quickExpenseType.toUpperCase()} sent for approval!` });
            setTimeout(() => {
                setShowQuickExpenseModal(false);
                setQuickExpenseData({
                    amount: '',
                    date: todayIST(),
                    vehicleId: '',
                    location: '',
                    remark: '',
                    slipPhoto: '',
                    fuelType: 'Diesel',
                    quantity: '',
                    rate: '',
                    odometer: '',
                    stationName: '',
                    paymentMode: 'Cash',
                    paymentSource: 'Yatree Office'
                });
                setMessage({ type: '', text: '' });
                fetchAttendance(); // Refresh to show if needed
            }, 1000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save' });
        } finally { setSubmitting(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/drivers', { ...formData, companyId: selectedCompany._id, isFreelancer: true }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setMessage({ type: 'success', text: 'Freelancer added successfully!' });
            setTimeout(() => {
                setShowAddModal(false);
                setFormData({ name: '', mobile: '', licenseNumber: '', dailyWage: '', nightStayBonus: '500', sameDayReturnBonus: '100' });
                setMessage({ type: '', text: '' });
                fetchFreelancers();
            }, 1000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
        } finally { setSubmitting(false); }
    };

    const handlePunchIn = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const fd = new FormData();
            Object.keys(punchInData).forEach(key => {
                let val = punchInData[key];
                if (key === 'time' && val && !val.includes('+')) {
                    val = `${val}:00+05:30`;
                }
                fd.append(key, val);
            });
            fd.append('driverId', selectedDriver._id);
            if (selectedCompany?._id) fd.append('companyId', selectedCompany._id);
            if (punchInPhotos.kmPhoto) fd.append('kmPhoto', punchInPhotos.kmPhoto);

            await axios.post('/api/admin/freelancers/punch-in', fd, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowPunchInModal(false);
            setVehicleSearch('');
            setPunchInPhotos({ kmPhoto: null });
            setPunchInData({
                vehicleId: '',
                km: '',
                date: todayIST(),
                time: nowISTDateTimeString(),
                pickUpLocation: ''
            });
            await Promise.all([
                fetchFreelancers(),
                fetchVehicles(),
                fetchAttendance()
            ]);
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    const handlePunchOut = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const fd = new FormData();
            Object.keys(punchOutData).forEach(key => {
                let val = punchOutData[key];
                if (key === 'time' && val && !val.includes('+')) {
                    val = `${val}:00+05:30`;
                }
                if (key !== 'parkingSlipPhoto') fd.append(key, val);
            });
            fd.append('driverId', selectedDriver._id);
            if (punchOutPhotos.kmPhoto) fd.append('kmPhoto', punchOutPhotos.kmPhoto);
            if (punchOutData.parkingSlipPhoto) fd.append('parkingPhoto', punchOutData.parkingSlipPhoto);

            await axios.post('/api/admin/freelancers/punch-out', fd, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowPunchOutModal(false);
            setPunchOutPhotos({ kmPhoto: null });
            setPunchOutData({ km: '', time: nowISTDateTimeString(), fuelAmount: '0', parkingAmount: '0', allowanceTA: '0', nightStayAmount: '0', parkingPaidBy: 'Self', review: '', dailyWage: '', dropLocation: '', parkingSlipPhoto: null });
            await Promise.all([
                fetchFreelancers(),
                fetchVehicles(),
                fetchAttendance()
            ]);
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    const handleUploadDocument = async (e) => {
        e.preventDefault();
        if (!documentFile) return alert('Please select a file');
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const formData = new FormData();
            formData.append('document', documentFile);
            formData.append('documentType', documentForm.documentType);
            if (documentForm.expiryDate) formData.append('expiryDate', documentForm.expiryDate);

            await axios.post(`/api/admin/drivers/${selectedDriver._id}/documents`, formData, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage({ type: 'success', text: 'Document uploaded!' });
            fetchFreelancers();
            setDocumentForm({ documentType: 'Driving License', expiryDate: '' });
            setDocumentFile(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
        } finally { setSubmitting(false); }
    };

    const handleDeleteAdvance = async (id) => {
        if (!window.confirm('Are you sure you want to delete this transaction record?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/advances/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchAdvances();
            setMessage({ type: 'success', text: 'Transaction deleted successfully' });
            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting transaction');
        }
    };

    const handleAddAdvance = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/advances', {
                ...advanceData,
                driverId: selectedDriver._id,
                companyId: selectedCompany._id
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowAdvanceModal(false);
            setAdvanceData({ amount: '', remark: '', date: todayIST(), advanceType: 'Office', givenBy: 'Office' });
            fetchAdvances();
            setMessage({ type: 'success', text: 'Advance payment recorded!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add advance');
        } finally { setSubmitting(false); }
    };

    const handleManualEntry = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/manual-duty', {
                ...manualData,
                punchInTime: manualData.punchInTime ? `${manualData.punchInTime}:00+05:30` : undefined,
                punchOutTime: manualData.punchOutTime ? `${manualData.punchOutTime}:00+05:30` : undefined,
                companyId: selectedCompany._id
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowManualModal(false);
            setManualData({
                driverId: '', vehicleId: '', date: todayIST(),
                punchInKM: '', punchOutKM: '', punchInTime: todayIST() + 'T08:00', punchOutTime: todayIST() + 'T20:00',
                pickUpLocation: '', dropLocation: '', fuelAmount: '0', parkingAmount: '0',
                allowanceTA: '0', nightStayAmount: '0', otherBonus: '0',
                dailyWage: '', review: '', eventId: ''
            });
            fetchAttendance();
            fetchFreelancers();
            setMessage({ type: 'success', text: 'Duty recorded successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to record manual duty');
        } finally { setSubmitting(false); }
    };

    const handleUpdateDuty = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const isVoucher = editingDuty.entryType === 'voucher';

            // Prepare payload
            const payload = {
                ...editDutyForm,
                punchInTime: editDutyForm.punchInTime ? `${editDutyForm.punchInTime}:00+05:30` : undefined,
                punchOutTime: editDutyForm.punchOutTime ? `${editDutyForm.punchOutTime}:00+05:30` : undefined,
                startKm: Number(editDutyForm.startKm) || 0,
                endKm: Number(editDutyForm.endKm) || 0,
                parkingAmount: Number(editDutyForm.parkingAmount) || 0,
                allowanceTA: Number(editDutyForm.allowanceTA) || 0,
                nightStayAmount: Number(editDutyForm.nightStayAmount) || 0,
                dailyWage: Number(editDutyForm.dailyWage) || 0,
                bonusAmount: Number(editDutyForm.bonusAmount) || 0,
                fuelAmount: Number(editDutyForm.fuelAmount) || 0
            };

            if (isVoucher) {
                await axios.put(`/api/admin/vehicles/${editingDuty._id}`, {
                    dutyAmount: payload.dailyWage,
                    dutyType: payload.pickUpLocation,
                    dropLocation: payload.dropLocation,
                    driverName: drivers.find(d => d._id === payload.driverId)?.name || editingDuty.driverName || editingDuty.driver?.name,
                    tollParkingAmount: payload.parkingAmount
                }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            } else {
                await axios.put(`/api/admin/attendance/${editingDuty._id}`, payload, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            }

            setShowEditDutyModal(false);
            setMessage({ type: 'success', text: 'Duty record updated successfully' });
            fetchAttendance();
            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        } catch (err) {
            console.error('[UPDATE_ERROR]', err);
            alert(err.response?.data?.message || 'Update failed');
        } finally { setSubmitting(false); }
    };

    const openEditDutyModal = (duty) => {
        setEditingDuty(duty);
        const fallbackWage = duty.isOutsideCar ? (Number(duty.dutyAmount) || 0) : (Number(duty.driver?.dailyWage) || 0);

        // Debug log to trace what data we are loading into the modal
        console.log('[DEBUG] Opening Edit Modal for Duty:', {
            id: duty._id,
            wage: duty.dailyWage,
            parking: duty.punchOut?.tollParkingAmount,
            paidBy: duty.punchOut?.parkingPaidBy
        });

        setEditDutyForm({
            date: duty.date,
            driverId: duty.driver?._id || duty.driver || '',
            vehicleId: duty.vehicle?._id || duty.vehicle || '',
            startKm: duty.punchIn?.km ?? 0,
            endKm: duty.punchOut?.km ?? 0,
            punchInTime: duty.punchIn?.time ? toISTDateTimeString(duty.punchIn.time) : '',
            punchOutTime: duty.punchOut?.time ? toISTDateTimeString(duty.punchOut.time) : '',
            pickUpLocation: duty.pickUpLocation || '',
            dropLocation: duty.dropLocation || '',
            fuelAmount: duty.fuel?.amount ?? 0,
            parkingAmount: duty.punchOut?.tollParkingAmount ?? 0,
            parkingPaidBy: duty.punchOut?.parkingPaidBy || 'Self',
            allowanceTA: duty.punchOut?.allowanceTA ?? 0,
            nightStayAmount: duty.punchOut?.nightStayAmount ?? 0,
            bonusAmount: duty.outsideTrip?.bonusAmount ?? 0,
            dailyWage: (duty.dailyWage !== undefined && duty.dailyWage !== null) ? duty.dailyWage : fallbackWage,
            remarks: duty.punchOut?.remarks || duty.punchOut?.otherRemarks || '',
            dutyType: duty.pickUpLocation || ''
        });
        setShowEditDutyModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.put(`/api/admin/drivers/${editingDriver._id}`, editForm, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setMessage({ type: 'success', text: 'Freelancer updated successfully!' });
            setTimeout(() => {
                setShowEditModal(false);
                setEditingDriver(null);
                setMessage({ type: '', text: '' });
                fetchFreelancers();
            }, 1000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally { setSubmitting(false); }
    };

    const openEditModal = (driver) => {
        setEditingDriver(driver);
        setEditForm({
            name: driver.name,
            mobile: driver.mobile,
            licenseNumber: driver.licenseNumber || '',
            dailyWage: driver.dailyWage || '',
            nightStayBonus: driver.nightStayBonus !== undefined && driver.nightStayBonus !== null ? String(driver.nightStayBonus) : '500',
            sameDayReturnBonus: driver.sameDayReturnBonus !== undefined && driver.sameDayReturnBonus !== null ? String(driver.sameDayReturnBonus) : '100'
        });
        setShowEditModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this freelancer?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/drivers/${id}`, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            fetchFreelancers();
        } catch (error) {
            console.error(error);
            alert('Error deleting');
        }
    };

    const baseDrivers = drivers.filter(d => driverFilter === 'All' || d._id === driverFilter);

    const onDutyDrivers = baseDrivers.filter(d => d.tripStatus === 'active');
    const availableDrivers = baseDrivers.filter(d => d.tripStatus !== 'active');

    const filteredAttendance = attendance.filter(a => {
        const matchesDriver = driverFilter === 'All' || a.driver?._id === driverFilter || a.driver === driverFilter;
        const matchesVehicle = vehicleFilter === 'All' || a.vehicle?._id === vehicleFilter || a.vehicle?.carNumber?.split('#')[0] === vehicleFilter;
        return matchesDriver && matchesVehicle;
    });

    const totalLogisticsAmount = filteredAttendance.reduce((sum, a) => {
        const rowTotal = (Number(a.dailyWage) || Number(a.driver?.dailyWage) || 0) +
            (Number(a.punchOut?.tollParkingAmount) || 0) +
            (Number(a.outsideTrip?.bonusAmount) || 0) +
            (Number(a.punchOut?.allowanceTA) || 0) +
            (Number(a.punchOut?.nightStayAmount) || 0);
        return sum + rowTotal;
    }, 0);

    const settlementByDriverDate = filteredAttendance.reduce((acc, a) => {
        if (a.status !== 'completed' && !a.punchOut?.time) return acc;

        const driverId = a.driver?._id || a.driver;
        const date = a.date || (a.punchIn?.time ? toISTDateString(a.punchIn.time) : 'Unknown');
        const key = `${driverId}_${date}`;

        if (!acc[key]) {
            acc[key] = { wage: 0, parking: 0, bonus: 0 };
        }

        const wage = Number(a.dailyWage) || 0;
        acc[key].wage = Math.max(acc[key].wage, wage);

        const parking = a.punchOut?.parkingPaidBy !== 'Office' ? (Number(a.punchOut?.tollParkingAmount) || 0) : 0;
        const bonus = (Number(a.punchOut?.allowanceTA) || 0) + (Number(a.punchOut?.nightStayAmount) || 0) + (Number(a.outsideTrip?.bonusAmount) || 0);

        acc[key].parking += parking;
        acc[key].bonus += bonus;

        return acc;
    }, {});

    const totalSettlement = Object.values(settlementByDriverDate).reduce((sum, item) => {
        return sum + item.wage + item.parking + item.bonus;
    }, 0);

    const totalAdvances = advances.filter(adv =>
        driverFilter === 'All' ? true : (adv.driver?._id === driverFilter || adv.driver === driverFilter)
    ).reduce((sum, adv) => sum + adv.amount, 0);
    const netPayable = totalSettlement - totalAdvances;

    const filterDriverName = driverFilter === 'All' ? 'All Freelancers' : drivers.find(d => d._id === driverFilter)?.name;

    // Extract unique locations and vehicles for suggestions
    const uniquePickups = [...new Set(attendance.map(a => a.pickUpLocation).filter(Boolean))].sort();
    const uniqueDrops = [...new Set(attendance.map(a => a.dropLocation).filter(Boolean))].sort();


    const handleDownloadExcel = () => {
        if (filteredAttendance.length === 0) return alert('No data to download');

        const data = filteredAttendance.map(a => ({
            'Date': a.date,
            'Driver Name': a.driver?.name || 'N/A',
            'Car': a.vehicle?.carNumber ? a.vehicle.carNumber.slice(-4) : 'N/A',
            'In Time': a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
            'Out Time': a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
            'Total KM': (a.punchOut?.km - a.punchIn?.km) || 0,
            'Pick-up': a.pickUpLocation || '-',
            'Drop': a.dropLocation || '-',
            'Salary': a.dailyWage || 0,
            'Fuel': a.fuel?.amount || 0,
            'Parking/Toll': a.punchOut?.tollParkingAmount || 0,
            'Remarks': a.punchOut?.remarks || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Freelancer Duties");
        XLSX.writeFile(wb, `Freelancer_Report_${new Date().toLocaleDateString()}.xlsx`);
    };

    return (
        <div className="container-fluid freelancer-root" style={{ paddingBottom: '40px' }}>
            <SEO title="Freelancer Fleet Network" description="Onboard and manage freelance drivers for temporary duties and peak demand management." />

            {/* Header with Search and Stats */}
            <header className="glass-card dashboard-header" style={{
                padding: 'clamp(20px, 4vw, 30px)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '20px',
                background: 'rgba(30, 41, 59, 0.4)'
            }}>
                <div className="flex-resp" style={{ justifyContent: 'space-between', width: '100%', gap: '20px', alignItems: 'center' }}>
                    <div className="header-logo-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 3vw, 15px)' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, white, #f8fafc)',
                                borderRadius: '16px',
                                padding: 'clamp(6px, 1.5vw, 8px)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                flexShrink: 0
                            }}>
                                <Users size={24} color="#fbbf24" />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                                    <span style={{ fontSize: '9px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>External Workforce</span>
                                </div>
                                <h1 style={{ color: 'white', fontWeight: '900', margin: 0, letterSpacing: '-1.5px', fontSize: 'clamp(20px, 5vw, 32px)' }}>
                                    Freelancers <span className="text-gradient-yellow">Hub</span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex-resp" style={{
                        gap: '12px',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        flex: 1,
                        maxWidth: '500px'
                    }}>
                        {/* Improved Filter Hub */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.25)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            padding: '4px 6px',
                            flex: 1,
                            minWidth: '220px',
                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '12px',
                                background: 'rgba(251, 191, 36, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid rgba(251, 191, 36, 0.15)',
                                flexShrink: 0
                            }}>
                                <Filter size={14} color="#fbbf24" strokeWidth={3} />
                            </div>

                            <select
                                value={activeTab === 'accounts' ? settlementDriverFilter : driverFilter}
                                onChange={(e) => activeTab === 'accounts' ? setSettlementDriverFilter(e.target.value) : setDriverFilter(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    height: '40px',
                                    fontSize: '12px',
                                    fontWeight: '900',
                                    outline: 'none',
                                    flex: 1,
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    paddingRight: '10px',
                                    paddingLeft: '10px',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                <option value="All" style={{ background: '#0f172a', fontWeight: '900', color: '#fbbf24' }}>● ALL FREELANCERS</option>
                                <option disabled style={{ background: '#0f172a', opacity: 0.5 }}>────────────────</option>
                                {drivers.map(d => (
                                    <option key={d._id} value={d._id} style={{ background: '#0f172a' }}>
                                        {d.name.split(' (F)')[0].toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {activeTab !== 'accounts' && (
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                    className="glass-card-hover-effect"
                                    onClick={() => setShowManualModal(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '42px', height: '42px', borderRadius: '14px',
                                        background: 'rgba(255,255,255,0.04)', color: 'white',
                                        border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
                                        transition: '0.3s'
                                    }}
                                    title="Manual Entry"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        padding: '0 20px', height: '42px', borderRadius: '14px',
                                        background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                                        border: 'none', color: 'black',
                                        boxShadow: '0 8px 15px rgba(251, 191, 36, 0.25)',
                                        cursor: 'pointer', fontWeight: '950', fontSize: '12px',
                                        textTransform: 'uppercase', letterSpacing: '0.5px'
                                    }}
                                >
                                    <Plus size={16} style={{ marginRight: '8px', strokeWidth: 3 }} />
                                    <span className="hide-mobile">Quick Add</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Premium Filter Hub */}
            <div className="glass-card" style={{
                padding: '12px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '20px',
                background: 'rgba(15, 23, 42, 0.4)'
            }}>
                <div className="flex-resp" style={{ gap: '15px', alignItems: 'center', justifyContent: 'space-between' }}>

                    {/* Tabs */}
                    <div className="premium-scroll" style={{
                        display: 'flex',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '4px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.03)',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        gap: '4px',
                        maxWidth: '100%'
                    }}>
                        {[
                            { id: 'personnel', label: 'Drivers', icon: <UserIcon size={14} /> },
                            { id: 'logistics', label: 'Dutys', icon: <Car size={14} /> },
                            { id: 'accounts', label: 'Settlement', icon: <IndianRupee size={14} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: activeTab === tab.id ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                                    color: activeTab === tab.id ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    transition: '0.3s',
                                    flexShrink: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                {tab.icon} <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Filter Controls */}
                    {activeTab !== 'personnel' && (
                        <div className="flex-resp" style={{ alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>

                            {activeTab === 'accounts' ? (
                                /* Settlement: always show Month + Year pickers */
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                                        style={{ padding: '0 12px', height: '40px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}>
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m} style={{ background: '#0f172a' }}>{new Date(0, m - 1).toLocaleString('default', { month: 'short' }).toUpperCase()}</option>
                                        ))}
                                    </select>
                                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                                        style={{ padding: '0 12px', height: '40px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}>
                                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} style={{ background: '#0f172a' }}>{y}</option>)}
                                    </select>
                                </div>
                            ) : (
                                /* Duties: date navigator */
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        background: 'rgba(0,0,0,0.25)', padding: '4px',
                                        borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <button onClick={() => shiftDays(-1)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ChevronLeft size={16} />
                                        </button>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {isRange && (
                                                <div style={{ padding: '0 12px', height: '32px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '10px', position: 'relative', overflow: 'hidden' }}>
                                                    <span style={{ color: '#fbbf24', fontSize: '9px', fontWeight: '900' }}>FROM</span>
                                                    <span style={{ color: 'white', fontSize: '11px', fontWeight: '950' }}>{new Date(fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                                                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} onClick={(e) => e.target.showPicker?.()} style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} />
                                                </div>
                                            )}
                                            <div style={{ padding: '0 12px', height: '32px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: isRange ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.05)', borderRadius: '10px', position: 'relative', overflow: 'hidden' }}>
                                                {isRange ? <span style={{ color: '#fbbf24', fontSize: '9px', fontWeight: '900' }}>TO</span> : <Calendar size={12} color="#fbbf24" />}
                                                <span style={{ color: 'white', fontSize: '11px', fontWeight: '950' }}>{new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                                                <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); if (!isRange) setFromDate(e.target.value); }} onClick={(e) => e.target.showPicker?.()} style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} />
                                            </div>
                                        </div>
                                        <button onClick={() => shiftDays(1)} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                    <button onClick={() => { const next = !isRange; setIsRange(next); if (!next) setFromDate(toDate); }}
                                        style={{ padding: '0 12px', height: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', background: isRange ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.03)', color: isRange ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>
                                        {isRange ? 'Range' : 'Single'}
                                    </button>
                                </div>
                            )}

                            <button onClick={() => { fetchAttendance(); fetchAdvances(); fetchFreelancers(); }}
                                style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                title="Refresh Data">
                                <RefreshCw size={18} className={loading || summaryLoading ? 'animate-spin' : ''} />
                            </button>
                            <button onClick={handleDownloadExcel}
                                style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                title="Export Excel">
                                <Download size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            <div style={{ position: 'relative', minHeight: '600px' }}>
                {/* PERSONNEL TAB */}
                {
                    activeTab === 'personnel' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ animation: 'fadeIn 0.5s ease' }}>
                            {/* Driver Table View */}
                            <div style={{ borderRadius: '24px', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="staff-attendance-table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <th style={{ padding: '18px 25px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Freelancer</th>
                                                <th style={{ padding: '18px 25px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Status</th>
                                                <th style={{ padding: '18px 25px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Wage</th>
                                                <th style={{ padding: '18px 25px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Duties</th>
                                                <th style={{ padding: '18px 25px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>Loading drivers...</td></tr>
                                            ) : availableDrivers.length === 0 && onDutyDrivers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: '80px 40px', textAlign: 'center' }}>
                                                        <UserIcon size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />
                                                        <h3 style={{ color: 'white', fontWeight: '800' }}>No Freelancers Found</h3>
                                                        <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '30px' }}>Add drivers to your network to see them here.</p>
                                                    </td>
                                                </tr>
                                            ) : [...onDutyDrivers.sort((a, b) => a.name.localeCompare(b.name)), ...availableDrivers.sort((a, b) => a.name.localeCompare(b.name))].map(d => {
                                                const dayAttendance = attendance.filter(a => a.driver?._id === d._id || a.driver === d._id);
                                                const isOnDuty = d.tripStatus === 'active' || dayAttendance.some(a => a.status === 'incomplete');
                                                const dutyCount = attendance.filter(a => a.driver?._id === d._id || a.driver === d._id).length;
                                                return (
                                                    <tr key={d._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.3s' }} className="ledger-row">
                                                        <td style={{ padding: '15px 25px' }}>
                                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                                <div style={{
                                                                    width: '40px', height: '40px', borderRadius: '12px',
                                                                    background: isOnDuty ? 'rgba(244, 63, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                                                                }}>
                                                                    <UserIcon size={18} style={{ color: isOnDuty ? '#f43f5e' : '#818cf8' }} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>{d.name.split(' (F)')[0]}</div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                                                        <a href={`tel:${d.mobile}`} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                            <Phone size={10} /> {d.mobile}
                                                                        </a>
                                                                        {d.licenseNumber && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>• {d.licenseNumber}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '15px 25px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnDuty ? '#f43f5e' : '#10b981' }}></div>
                                                                <span style={{ fontSize: '11px', color: isOnDuty ? '#f43f5e' : '#10b981', fontWeight: '900', textTransform: 'uppercase' }}>
                                                                    {isOnDuty ? 'ON DUTY' : 'AVAILABLE'}
                                                                </span>
                                                            </div>
                                                            {isOnDuty && d.assignedVehicle && (
                                                                <div style={{ color: 'rgba(14,165,233,0.7)', fontSize: '10px', fontWeight: '800', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                                    <Car size={10} /> {d.assignedVehicle?.carNumber?.split('#')[0]}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '15px 25px' }}>
                                                            <div style={{ color: 'white', fontWeight: '900', fontSize: '15px' }}>₹{d.dailyWage || 0}</div>
                                                            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '9px', fontWeight: '900', marginTop: '2px' }}>BASE RATE</div>
                                                        </td>
                                                        <td style={{ padding: '15px 25px', textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-block', background: 'rgba(99, 102, 241, 0.1)', padding: '4px 12px', borderRadius: '100px', border: '1px solid rgba(99,102,241,0.1)' }}>
                                                                <span style={{ color: '#818cf8', fontWeight: '900', fontSize: '13px' }}>{dutyCount}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                                {isOnDuty ? (
                                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedDriver(d);
                                                                                const viewTime = nowISTDateTimeString();
                                                                                setPunchOutData({
                                                                                    ...punchOutData,
                                                                                    km: '',
                                                                                    time: viewTime,
                                                                                    dailyWage: d.dailyWage || ''
                                                                                });
                                                                                setShowPunchOutModal(true);
                                                                            }}
                                                                            style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                                                                        >FINISH</button>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedDriver(d);
                                                                                const yesterday = new Date();
                                                                                yesterday.setDate(yesterday.getDate() - 1);
                                                                                const viewDate = toISTDateString(yesterday);
                                                                                const viewTime = viewDate + 'T09:00';
                                                                                setPunchInData({
                                                                                    ...punchInData,
                                                                                    time: viewTime,
                                                                                    date: viewDate
                                                                                });
                                                                                setShowPunchInModal(true);
                                                                            }}
                                                                            title="Add Past Duty"
                                                                            style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                                                        >
                                                                            <History size={14} />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedDriver(d);
                                                                            const viewDate = toDate || getToday();
                                                                            const viewTime = viewDate + 'T' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                                                            setPunchInData({
                                                                                ...punchInData,
                                                                                time: viewTime,
                                                                                date: viewDate
                                                                            });
                                                                            setShowPunchInModal(true);
                                                                        }}
                                                                        style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '8px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                                                                    >START</button>
                                                                )}
                                                                {/* Fuel option removed as per request */}
                                                                <button
                                                                    onClick={() => { setSelectedDriver(d); setQuickExpenseType('parking'); setShowQuickExpenseModal(true); }}
                                                                    title="Add Parking"
                                                                    style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                                                >
                                                                    <MapPin size={13} />
                                                                </button>
                                                                <button onClick={() => openEditModal(d)} title="Edit" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                                                                    <Edit2 size={13} />
                                                                </button>
                                                                <button onClick={() => handleDelete(d._id)} title="Delete" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(244,63,94,0.05)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )
                }

                {/* ACCOUNTS TAB */}
                {
                    activeTab === 'accounts' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ animation: 'fadeIn 0.5s ease' }}>
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <div style={{ width: '4px', height: '24px', background: 'linear-gradient(to bottom, #6366f1, #a855f7)', borderRadius: '4px' }}></div>
                                    <h4 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '900', letterSpacing: '-0.5px' }}>{viewMode === 'monthly' ? 'Monthly Settlement Summary' : 'Date Range Settlement'}</h4>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {!summaryLoading && (
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '15px',
                                            marginBottom: '10px'
                                        }}>
                                            {(() => {
                                                const stats = { earned: 0, advance: 0, payable: 0 };
                                                if (viewMode === 'monthly') {
                                                    monthlySummaries
                                                        .filter(s => settlementDriverFilter === 'All' || s.driverId?.toString() === settlementDriverFilter)
                                                        .forEach(s => {
                                                            stats.earned += (Number(s.totalEarned) || 0);
                                                            stats.advance += (Number(s.totalAdvances) || 0);
                                                            stats.payable += (Number(s.netPayable) || 0);
                                                        });
                                                } else {
                                                    baseDrivers
                                                        .filter(d => settlementDriverFilter === 'All' || d._id === settlementDriverFilter)
                                                        .forEach(driver => {
                                                            const dAttendance = attendance.filter(a => a.driver?._id === driver._id || a.driver === driver._id);
                                                            const dAdvances = advances.filter(adv => adv.driver?._id === driver._id || adv.driver === driver._id);

                                                            const dEarnedByDate = dAttendance.reduce((acc, a) => {
                                                                if (a.status !== 'completed' && !a.punchOut?.time) return acc;
                                                                const date = a.date || (a.punchIn?.time ? new Date(a.punchIn.time).toISOString().split('T')[0] : 'Unknown');
                                                                if (!acc[date]) acc[date] = { wage: 0, extra: 0, bonus: 0 };
                                                                if (acc[date].wage === 0) acc[date].wage = Number(a.dailyWage) || 0;
                                                                const parking = a.punchOut?.parkingPaidBy !== 'Office' ? (Number(a.punchOut?.tollParkingAmount) || 0) : 0;
                                                                const bonuses = (Number(a.punchOut?.allowanceTA) || 0) +
                                                                    (Number(a.punchOut?.nightStayAmount) || 0) +
                                                                    (Number(a.outsideTrip?.bonusAmount) || 0);
                                                                acc[date].extra += parking;
                                                                acc[date].bonus += bonuses;
                                                                return acc;
                                                            }, {});
                                                            const dEarned = Object.values(dEarnedByDate).reduce((sum, d) => sum + d.wage + d.extra + d.bonus, 0);
                                                            const dAdvanced = dAdvances.reduce((s, adv) => s + adv.amount, 0);
                                                            stats.earned += dEarned;
                                                            stats.advance += dAdvanced;
                                                            stats.payable += (dEarned - dAdvanced);
                                                        });
                                                }

                                                return (
                                                    <>
                                                        <div className="premium-glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(16, 185, 129, 0.05)' }}>
                                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Total Earned</div>
                                                            <div style={{ color: '#10b981', fontSize: '24px', fontWeight: '900' }}>₹{stats.earned.toLocaleString()}</div>
                                                        </div>
                                                        <div className="premium-glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(244, 63, 94, 0.05)' }}>
                                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Total Advance</div>
                                                            <div style={{ color: '#f43f5e', fontSize: '24px', fontWeight: '900' }}>₹{stats.advance.toLocaleString()}</div>
                                                        </div>
                                                        <div className="premium-glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(251, 191, 36, 0.1)' }}>
                                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Net Company Owed</div>
                                                            <div style={{ color: '#fbbf24', fontSize: '24px', fontWeight: '900' }}>₹{stats.payable.toLocaleString()}</div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                    {summaryLoading ? (
                                        <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner"></div></div>
                                    ) : viewMode === 'monthly' ? (
                                        monthlySummaries
                                            .filter(s => settlementDriverFilter === 'All' || s.driverId?.toString() === settlementDriverFilter)
                                            .map(summary => (
                                                <div
                                                    key={summary.driverId}
                                                    onClick={() => navigate(`/admin/freelancers/${summary.driverId}?month=${month}&year=${year}`)}
                                                    style={{
                                                        background: 'rgba(15,23,42,0.6)',
                                                        border: '1px solid rgba(255,255,255,0.07)',
                                                        borderRadius: '16px',
                                                        padding: '14px 18px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '14px',
                                                        cursor: 'pointer',
                                                        transition: 'border-color 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                                                >
                                                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <UserIcon size={16} color="#818cf8" />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ color: 'white', fontWeight: '800', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{summary.name}</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '1px' }}>{summary.workingDays} days worked</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Bonus</div>
                                                            <div style={{ color: '#a855f7', fontWeight: '900', fontSize: '14px' }}>₹{(summary.totalBonus || 0).toLocaleString()}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Earned</div>
                                                            <div style={{ color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹{summary.totalEarned.toLocaleString()}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Advance</div>
                                                            <div style={{ color: '#f87171', fontWeight: '900', fontSize: '14px' }}>₹{summary.totalAdvances.toLocaleString()}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Net Payable</div>
                                                            <div style={{ color: summary.netPayable >= 0 ? '#fbbf24' : '#34d399', fontWeight: '900', fontSize: '16px' }}>₹{Math.abs(summary.netPayable).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={15} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                                                </div>
                                            ))
                                    ) : (
                                        baseDrivers
                                            .filter(d => settlementDriverFilter === 'All' || d._id === settlementDriverFilter)
                                            .map(driver => {
                                                const dAttendance = attendance.filter(a => a.driver?._id === driver._id || a.driver === driver._id);
                                                const dAdvances = advances.filter(adv => adv.driver?._id === driver._id || adv.driver === driver._id);

                                                const dEarnedByDate = dAttendance.reduce((acc, a) => {
                                                    if (a.status !== 'completed' && !a.punchOut?.time) return acc;
                                                    const date = a.date || (a.punchIn?.time ? new Date(a.punchIn.time).toISOString().split('T')[0] : 'Unknown');
                                                    if (!acc[date]) acc[date] = { wage: 0, extra: 0, bonus: 0 };
                                                    if (acc[date].wage === 0) acc[date].wage = Number(a.dailyWage) || 0;
                                                    const parking = a.punchOut?.parkingPaidBy !== 'Office' ? (Number(a.punchOut?.tollParkingAmount) || 0) : 0;
                                                    const bonuses = (Number(a.punchOut?.allowanceTA) || 0) +
                                                        (Number(a.punchOut?.nightStayAmount) || 0) +
                                                        (Number(a.outsideTrip?.bonusAmount) || 0);
                                                    acc[date].extra += parking;
                                                    acc[date].bonus += bonuses;
                                                    return acc;
                                                }, {});
                                                const dEarned = Object.values(dEarnedByDate).reduce((sum, d) => sum + d.wage + d.extra + d.bonus, 0);
                                                const dAdvanced = dAdvances.reduce((s, adv) => s + adv.amount, 0);
                                                const dBalance = dEarned - dAdvanced;

                                                if (dEarned === 0 && dAdvanced === 0) return null;

                                                return (
                                                    <div
                                                        key={driver._id}
                                                        onClick={() => navigate(`/admin/freelancers/${driver._id}?from=${fromDate}&to=${toDate}`)}
                                                        style={{
                                                            background: 'rgba(15,23,42,0.6)',
                                                            border: '1px solid rgba(255,255,255,0.07)',
                                                            borderRadius: '16px',
                                                            padding: '14px 18px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '14px',
                                                            cursor: 'pointer',
                                                            transition: 'border-color 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
                                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                                                    >
                                                        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <UserIcon size={16} color="#818cf8" />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{driver.name.split(' (F)')[0]}</div>
                                                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '1px' }}>{dAttendance.length} duties</div>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Bonus</div>
                                                                <div style={{ color: '#a855f7', fontWeight: '900', fontSize: '14px' }}>₹{Object.values(dEarnedByDate).reduce((sum, d) => sum + d.bonus, 0).toLocaleString()}</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Earned</div>
                                                                <div style={{ color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹{dEarned.toLocaleString()}</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Advance</div>
                                                                <div style={{ color: '#f87171', fontWeight: '900', fontSize: '14px' }}>₹{dAdvanced.toLocaleString()}</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Net Payable</div>
                                                                <div style={{ color: dBalance >= 0 ? '#fbbf24' : '#34d399', fontWeight: '900', fontSize: '16px' }}>₹{Math.abs(dBalance).toLocaleString()}</div>
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={15} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                                                    </div>
                                                );
                                            }).filter(Boolean)
                                    )}

                                    {((viewMode === 'monthly' && monthlySummaries.length === 0) || (viewMode === 'range' && baseDrivers.filter(d => {
                                        const dAtt = attendance.filter(a => a.driver?._id === d._id || a.driver === d._id);
                                        const dAdv = advances.filter(a => a.driver?._id === d._id || a.driver === d._id);
                                        return dAtt.length > 0 || dAdv.length > 0;
                                    }).length === 0)) && !summaryLoading && (
                                            <div style={{ textAlign: 'center', padding: '50px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No settlement data found for selected filters.</div>
                                        )}
                                </div>
                            </div>
                        </motion.div>
                    )
                }

                {/* LOGISTICS TAB */}
                {
                    activeTab === 'logistics' && (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ animation: 'fadeIn 0.5s ease' }}>
                            {/* Duties Summary Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                <div className="premium-glass" style={{ padding: '18px 24px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.1)', background: 'rgba(16, 185, 129, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total Duties</div>
                                        <div style={{ color: 'white', fontSize: '24px', fontWeight: '950' }}>{filteredAttendance.length}</div>
                                    </div>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Car size={20} color="#10b981" />
                                    </div>
                                </div>
                                <div className="premium-glass" style={{ padding: '18px 24px', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.15)', background: 'rgba(251, 191, 36, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total Payout</div>
                                        <div style={{ color: '#fbbf24', fontSize: '24px', fontWeight: '950' }}>₹{totalLogisticsAmount.toLocaleString()}</div>
                                    </div>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <IndianRupee size={20} color="#fbbf24" />
                                    </div>
                                </div>
                            </div>

                            {/* Duty Table View */}
                            {filteredAttendance.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px' }}>
                                    <Car size={40} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '16px' }} />
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', fontWeight: '700' }}>No duty records found for selected period</p>
                                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginTop: '6px' }}>Try changing the date range, driver filter, or search term</p>
                                </div>
                            ) : (
                                <div style={{ borderRadius: '24px', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="scroll-x">
                                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <th style={{ padding: '18px 25px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Date</th>
                                                    <th style={{ padding: '18px 25px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Driver</th>
                                                    <th style={{ padding: '18px 25px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle</th>
                                                    <th style={{ padding: '18px 25px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Route Details</th>
                                                    <th style={{ padding: '18px 25px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Timing & KM</th>
                                                    <th style={{ padding: '18px 25px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Bonus</th>
                                                    <th style={{ padding: '18px 25px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Financials (+ Parking)</th>
                                                    <th style={{ padding: '18px 25px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredAttendance.map((a) => {
                                                    const punchInDate = a.date || (a.punchIn?.time ? new Date(a.punchIn.time).toISOString().split('T')[0] : null);
                                                    const punchInTime = a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';
                                                    const punchOutTime = a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
                                                    const totalKM = Math.max(0, a.totalKM || (a.punchOut?.km && a.punchIn?.km ? a.punchOut.km - a.punchIn.km : 0));
                                                    const isCompleted = a.status === 'completed' || !!a.punchOut?.time;

                                                    return (
                                                        <tr key={a._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.3s' }} className="ledger-row">
                                                            <td style={{ padding: '15px 25px' }}>
                                                                <div style={{ color: 'white', fontWeight: '800', fontSize: '13px' }}>{punchInDate ? new Date(punchInDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '---'}</div>
                                                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '700', marginTop: '2px' }}>{punchInDate ? new Date(punchInDate).getFullYear() : ''}</div>
                                                            </td>
                                                            <td style={{ padding: '15px 25px' }}>
                                                                <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>{a.driver?.name || '---'}</div>
                                                                <span style={{
                                                                    fontSize: '8px', padding: '2px 8px', borderRadius: '100px', fontWeight: '900', marginTop: '4px', display: 'inline-block',
                                                                    background: isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                                                    color: isCompleted ? '#10b981' : '#f59e0b',
                                                                    border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}`
                                                                }}>
                                                                    {isCompleted ? 'COMPLETED' : 'ON DUTY'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '15px 25px' }}>
                                                                <div style={{ background: 'rgba(14,165,233,0.1)', padding: '5px 12px', borderRadius: '8px', display: 'inline-block' }}>
                                                                    <span style={{ color: '#0ea5e9', fontSize: '12px', fontWeight: '900' }}>{a.vehicle?.carNumber?.split('#')[0] || 'N/A'}</span>
                                                                </div>
                                                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '700', marginTop: '4px' }}>{a.vehicle?.model?.split(' ').slice(0, 2).join(' ') || ''}</div>
                                                            </td>
                                                            <td style={{ padding: '15px 25px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                                                                        <div style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)' }} />
                                                                        <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f43f5e' }} />
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: '600' }}>{a.pickUpLocation || 'Start'}</div>
                                                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', marginTop: '4px' }}>{a.dropLocation || 'Pending'}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '15px 25px' }}>
                                                                <div style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>{punchInTime} - {punchOutTime || 'Active'}</div>
                                                                <div style={{ color: '#818cf8', fontSize: '11px', fontWeight: '900', marginTop: '4px' }}>{totalKM} KM Run</div>
                                                            </td>
                                                            <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                                                <div style={{ color: '#a855f7', fontSize: '15px', fontWeight: '900' }}>
                                                                    ₹{((Number(a.outsideTrip?.bonusAmount) || 0) + (Number(a.punchOut?.allowanceTA) || 0) + (Number(a.punchOut?.nightStayAmount) || 0)).toLocaleString()}
                                                                </div>
                                                                <div style={{ fontSize: '9px', color: 'rgba(168,85,247,0.4)', fontWeight: '700', marginTop: '2px' }}>
                                                                    {((Number(a.punchOut?.allowanceTA) || 0) > 0) && `TA: ₹${a.punchOut.allowanceTA}`}
                                                                    {((Number(a.punchOut?.nightStayAmount) || 0) > 0) && ` | N: ₹${a.punchOut.nightStayAmount}`}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                                                                <div style={{ color: '#10b981', fontSize: '16px', fontWeight: '900', marginBottom: '4px' }}>
                                                                    ₹{((Number(a.dailyWage) || Number(a.driver?.dailyWage) || 0) + (Number(a.punchOut?.tollParkingAmount) || 0) + (Number(a.outsideTrip?.bonusAmount) || 0) + (Number(a.punchOut?.allowanceTA) || 0) + (Number(a.punchOut?.nightStayAmount) || 0)).toLocaleString()}
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                                                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: '700' }}>
                                                                        W: ₹{a.dailyWage || a.driver?.dailyWage || 0}
                                                                        {((Number(a.outsideTrip?.bonusAmount) || 0) + (Number(a.punchOut?.allowanceTA) || 0) + (Number(a.punchOut?.nightStayAmount) || 0)) > 0 && ` + B: ₹${(Number(a.outsideTrip?.bonusAmount) || 0) + (Number(a.punchOut?.allowanceTA) || 0) + (Number(a.punchOut?.nightStayAmount) || 0)}`}
                                                                    </div>
                                                                    {a.punchOut?.tollParkingAmount > 0 && (
                                                                        <span style={{
                                                                            color: a.punchOut?.parkingPaidBy === 'Office' ? 'rgba(255,255,255,0.3)' : '#8b5cf6',
                                                                            fontSize: '9px', fontWeight: '900',
                                                                            textDecoration: a.punchOut?.parkingPaidBy === 'Office' ? 'line-through' : 'none'
                                                                        }}>
                                                                            P: ₹{a.punchOut.tollParkingAmount}{a.punchOut?.parkingPaidBy === 'Office' ? ' (O)' : ' (S)'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '15px 25px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                    <button
                                                                        onClick={() => setSelectedItem({ ...a, entryType: 'attendance' })}
                                                                        style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', color: '#0ea5e9', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        title="View Proof"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openEditDutyModal(a)}
                                                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteDuty(a)}
                                                                        disabled={submitting}
                                                                        style={{
                                                                            background: 'rgba(244, 63, 94, 0.05)',
                                                                            border: '1px solid rgba(244, 63, 94, 0.1)',
                                                                            color: '#f43f5e',
                                                                            borderRadius: '8px',
                                                                            padding: '6px',
                                                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            opacity: submitting ? 0.5 : 1
                                                                        }}
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )
                }
            </div>

            {/* Modals Implementation */}
            <div>
                {/* Add Freelancer Modal */}
                {
                    showAddModal && (
                        <Modal title="Add New Freelancer" onClose={() => setShowAddModal(false)}>
                            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '20px' }}>
                                <Field label="Full Name *" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <Field label="Mobile Number *" value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} required />
                                    <Field label="License Number" value={formData.licenseNumber} onChange={v => setFormData({ ...formData, licenseNumber: v })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <Field label="Daily Wage (₹)" type="number" value={formData.dailyWage} onChange={v => setFormData({ ...formData, dailyWage: v })} />
                                    <Field label="Night Stay (₹)" type="number" value={formData.nightStayBonus} onChange={v => setFormData({ ...formData, nightStayBonus: v })} />
                                </div>
                                <Field label="Same Day Return (₹)" type="number" value={formData.sameDayReturnBonus} onChange={v => setFormData({ ...formData, sameDayReturnBonus: v })} />
                                <SubmitButton disabled={submitting} text="Register Freelancer" message={message} />
                            </form>
                        </Modal>
                    )
                }

                {/* Edit Freelancer Modal */}
                {
                    showEditModal && (
                        <Modal title={`Edit Freelancer: ${editingDriver?.name}`} onClose={() => setShowEditModal(false)}>
                            <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '20px' }}>
                                <Field label="Full Name *" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} required />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Mobile Number *" value={editForm.mobile} onChange={v => setEditForm({ ...editForm, mobile: v })} required />
                                    <Field label="License Number" value={editForm.licenseNumber} onChange={v => setEditForm({ ...editForm, licenseNumber: v })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <Field label="Daily Wage (₹)" type="number" value={editForm.dailyWage} onChange={v => setEditForm({ ...editForm, dailyWage: v })} />
                                    <Field label="Night Stay (₹)" type="number" value={editForm.nightStayBonus} onChange={v => setEditForm({ ...editForm, nightStayBonus: v })} />
                                </div>
                                <Field label="Same Day Return (₹)" type="number" value={editForm.sameDayReturnBonus} onChange={v => setEditForm({ ...editForm, sameDayReturnBonus: v })} />
                                <SubmitButton disabled={submitting} text="Update Freelancer" message={message} />
                            </form>
                        </Modal>
                    )
                }

                {/* Punch In Modal */}
                {showPunchInModal && (
                    <Modal title={`Assign Duty: ${selectedDriver?.name}`} onClose={() => { setShowPunchInModal(false); setVehicleSearch(''); }}>
                        <form onSubmit={handlePunchIn} style={{ display: 'grid', gap: '25px' }}>
                            <div>
                                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Select Vehicle *</label>
                                <input
                                    type="text"
                                    list="vehicle-list"
                                    className="input-field"
                                    placeholder="Type car number..."
                                    required
                                    value={vehicleSearch}
                                    onChange={e => {
                                        setVehicleSearch(e.target.value);
                                        const found = vehicles.find(v => v.carNumber?.split('#')[0]?.toUpperCase() === e.target.value.toUpperCase());
                                        if (found) {
                                            setPunchInData({
                                                ...punchInData,
                                                vehicleId: found._id,
                                                km: found.lastOdometer || ''
                                            });
                                        }
                                    }}
                                />
                                <datalist id="vehicle-list">
                                    {vehicles.filter(v => punchInData.date !== getToday() || !v.currentDriver).map(v => (
                                        <option key={v._id} value={v.carNumber?.split('#')[0]}>
                                            {v.model} (Last KM: {v.lastOdometer || 0})
                                        </option>
                                    ))}
                                </datalist>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                <Field label="Duty Date *" type="date" value={punchInData.date} onChange={v => setPunchInData({ ...punchInData, date: v })} required />
                                <Field label="Punch-In Time *" type="datetime-local" value={punchInData.time} onChange={v => setPunchInData({ ...punchInData, time: v })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                <div style={{ position: 'relative' }}>
                                    <Field label="Starting KM *" type="number" value={punchInData.km} onChange={v => setPunchInData({ ...punchInData, km: v })} required />
                                    {punchInData.vehicleId && (
                                        <div style={{ position: 'absolute', top: '0', right: '0', fontSize: '10px', color: '#fbbf24', fontWeight: '800' }}>
                                            LAST: {vehicles.find(v => v._id === punchInData.vehicleId)?.lastOdometer || 0}
                                        </div>
                                    )}
                                </div>
                                <Field label="Pick-up Location" value={punchInData.pickUpLocation} onChange={v => setPunchInData({ ...punchInData, pickUpLocation: v })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                <PhotoUpload
                                    label="KM Reading Photo"
                                    icon={Camera}
                                    onFileSelect={(file) => setPunchInPhotos({ ...punchInPhotos, kmPhoto: file })}
                                    previewFile={punchInPhotos.kmPhoto}
                                />
                            </div>
                            <SubmitButton disabled={submitting} text="Start Duty" />
                        </form>
                    </Modal>
                )
                }

                {/* Manual Duty Entry Modal */}
                <AnimatePresence>
                    {showManualModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '15px', overflowY: 'auto' }}>
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className="premium-glass"
                                style={{ width: '100%', maxWidth: '600px', padding: '0', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', overflow: 'visible', margin: 'auto', borderRadius: '24px' }}
                            >
                                <div style={{ padding: '24px 30px', background: 'linear-gradient(to right, #1e293b, #0f172a)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}>
                                    <div>
                                        <h2 style={{ color: 'white', fontSize: '20px', margin: 0, fontWeight: '800' }}>Manual Duty Entry</h2>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', margin: '4px 0 0' }}>Record Past Trip</p>
                                    </div>
                                    <button onClick={() => setShowManualModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '50%', padding: '10px', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                                </div>

                                <form onSubmit={handleManualEntry} style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                        <div>
                                            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Freelancer *</label>
                                            <select
                                                className="input-field"
                                                required
                                                value={manualData.driverId}
                                                onChange={e => {
                                                    const d = allDrivers.find(drv => drv._id === e.target.value);
                                                    setManualData({ ...manualData, driverId: e.target.value, dailyWage: d?.dailyWage || d?.salary || '' });
                                                }}
                                                style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                            >
                                                <option value="" style={{ background: '#0f172a', color: 'white' }}>Select Driver</option>
                                                {allDrivers
                                                    .sort((a, b) => a.name.localeCompare(b.name))
                                                    .map(d => (
                                                        <option key={d._id} value={d._id} style={{ background: '#0f172a', color: 'white' }}>
                                                            {d.name.split(' (F)')[0]} {d.isFreelancer ? '(F)' : '(C)'}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Vehicle *</label>
                                            <select
                                                className="input-field"
                                                required
                                                value={manualData.vehicleId}
                                                onChange={e => setManualData({ ...manualData, vehicleId: e.target.value })}
                                                style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                            >
                                                <option value="" style={{ background: '#0f172a', color: 'white' }}>Select Car</option>
                                                {vehicles.map(v => <option key={v._id} value={v._id} style={{ background: '#0f172a', color: 'white' }}>{v.carNumber?.split('#')[0]} - {v.model}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                        <Field label="Duty Date *" type="date" value={manualData.date} onChange={v => setManualData({ ...manualData, date: v })} required />
                                        <div>
                                            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Event Assignment (Optional)</label>
                                            <select
                                                className="input-field"
                                                value={manualData.eventId}
                                                onChange={e => setManualData({ ...manualData, eventId: e.target.value })}
                                                style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                            >
                                                <option value="" style={{ background: '#0f172a', color: 'white' }}>Independent Duty</option>
                                                {/* Note: This assumes 'events' array is available or fetched in Freelancers.jsx */}
                                                {typeof events !== 'undefined' && events.map(e => <option key={e._id} value={e._id} style={{ background: '#0f172a', color: 'white' }}>{e.name} ({e.client})</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                        <Field label="Punch-In Time *" type="datetime-local" value={manualData.punchInTime} onChange={v => setManualData({ ...manualData, punchInTime: v })} required />
                                        <Field label="Punch-Out Time *" type="datetime-local" value={manualData.punchOutTime} onChange={v => setManualData({ ...manualData, punchOutTime: v })} required />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                        <Field label="Starting KM *" type="number" value={manualData.punchInKM} onChange={v => setManualData({ ...manualData, punchInKM: v })} required />
                                        <Field label="Closing KM *" type="number" value={manualData.punchOutKM} onChange={v => setManualData({ ...manualData, punchOutKM: v })} required />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                        <Field label="Pick-up Location" value={manualData.pickUpLocation} onChange={v => setManualData({ ...manualData, pickUpLocation: v })} />
                                        <Field label="Drop Location" value={manualData.dropLocation} onChange={v => setManualData({ ...manualData, dropLocation: v })} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                        <Field label="Parking/Toll (₹)" type="text" inputMode="decimal" value={manualData.parkingAmount} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setManualData({ ...manualData, parkingAmount: cleaned });
                                        }} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                                        <Field label="Duty Salary (Wage) *" type="text" inputMode="decimal" value={manualData.dailyWage} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setManualData({ ...manualData, dailyWage: cleaned });
                                        }} required />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <Field label="T/A (₹)" type="text" inputMode="decimal" value={manualData.allowanceTA} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setManualData({ ...manualData, allowanceTA: cleaned });
                                        }} />
                                        <Field label="Night Charges (₹)" type="text" inputMode="decimal" value={manualData.nightStayAmount} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setManualData({ ...manualData, nightStayAmount: cleaned });
                                        }} />
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
                                            letterSpacing: '1px',
                                            marginTop: '10px'
                                        }}
                                    >
                                        {submitting ? 'Saving...' : 'Record Duty'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Punch Out Modal */}
                {
                    showPunchOutModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,15,0.92)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(16px)' }}>
                            <div className="premium-glass" style={{ width: '100%', maxWidth: '520px', borderRadius: '28px', overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto' }}>
                                {/* Header Banner */}
                                <div style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(239,68,68,0.05) 100%)', padding: '24px 28px', borderBottom: '1px solid rgba(244,63,94,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <LogOut size={20} color="#f43f5e" />
                                        </div>
                                        <div>
                                            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Duty Completion</div>
                                            <div style={{ color: 'white', fontSize: '18px', fontWeight: '900', marginTop: '1px' }}>{selectedDriver?.name?.split(' (F)')[0]}</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowPunchOutModal(false)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <X size={18} />
                                    </button>
                                </div>

                                {(() => {
                                    const activeRecord = attendance.find(a => a.driver?._id === selectedDriver?._id && a.status === 'incomplete');
                                    const startKm = activeRecord?.punchIn?.km || 0;
                                    const tripKm = punchOutData.km ? (Number(punchOutData.km) - startKm) : 0;
                                    const totalPayable = (Number(punchOutData.dailyWage) || 0) + (Number(punchOutData.parkingAmount) || 0);

                                    return (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '16px 28px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.04)', gap: '1px' }}>
                                                <div style={{ textAlign: 'center', padding: '8px' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Start KM</div>
                                                    <div style={{ color: 'white', fontSize: '20px', fontWeight: '900' }}>{startKm.toLocaleString()}</div>
                                                </div>
                                                <div style={{ textAlign: 'center', padding: '8px', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Trip KM</div>
                                                    <div style={{ color: tripKm > 0 ? '#fbbf24' : 'rgba(255,255,255,0.3)', fontSize: '20px', fontWeight: '900' }}>{tripKm > 0 ? tripKm.toLocaleString() : '—'}</div>
                                                </div>
                                                <div style={{ textAlign: 'center', padding: '8px' }}>
                                                    <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Punch-In</div>
                                                    <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '800' }}>
                                                        {activeRecord?.punchIn?.time ? new Date(activeRecord.punchIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(16,185,129,0.08)', padding: '12px 28px', borderBottom: '1px solid rgba(16,185,129,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'rgba(16,185,129,0.8)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>Total Payable (Daily + Parking + Bonus)</span>
                                                <span style={{ color: '#10b981', fontSize: '20px', fontWeight: '950' }}>₹{((Number(punchOutData.dailyWage) || 0) + (Number(punchOutData.parkingAmount) || 0) + (Number(punchOutData.allowanceTA) || 0) + (Number(punchOutData.nightStayAmount) || 0)).toLocaleString()}</span>
                                            </div>
                                        </>
                                    );
                                })()}

                                {/* Form */}
                                <form onSubmit={handlePunchOut} style={{ padding: '24px 28px', display: 'grid', gap: '18px' }}>
                                    {/* Row 1: End KM + Punch-Out Time */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        <Field label="Closing KM *" type="number" value={punchOutData.km} onChange={v => setPunchOutData({ ...punchOutData, km: v })} required />
                                        <Field label="Punch-Out Time *" type="datetime-local" value={punchOutData.time} onChange={v => setPunchOutData({ ...punchOutData, time: v })} required />
                                    </div>

                                    {/* Row 2: Drop Location + Duty Salary */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        <Field label="Drop Location" value={punchOutData.dropLocation} onChange={v => setPunchOutData({ ...punchOutData, dropLocation: v })} />
                                        <Field label="Duty Salary (₹) *" type="text" inputMode="decimal" value={punchOutData.dailyWage} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setPunchOutData({ ...punchOutData, dailyWage: cleaned });
                                        }} required />
                                    </div>

                                    {/* Row 3: Parking + Parking Slip */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        <Field label="Parking / Toll (₹)" type="text" inputMode="decimal" value={punchOutData.parkingAmount} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setPunchOutData({ ...punchOutData, parkingAmount: cleaned });
                                        }} />
                                        <PhotoUpload label="Parking Slip" icon={ImageIcon || Camera} onFileSelect={f => setPunchOutData({ ...punchOutData, parkingSlipPhoto: f })} previewFile={punchOutData.parkingSlipPhoto} />
                                    </div>

                                    {/* Row 3.5: T/A + Night Charges */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                        <Field label="T/A (₹)" type="text" inputMode="decimal" value={punchOutData.allowanceTA} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setPunchOutData({ ...punchOutData, allowanceTA: cleaned });
                                        }} />
                                        <Field label="Night Charges (₹)" type="text" inputMode="decimal" value={punchOutData.nightStayAmount} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setPunchOutData({ ...punchOutData, nightStayAmount: cleaned });
                                        }} />
                                    </div>

                                    {/* Row 4: KM Photo */}
                                    <PhotoUpload label="Closing KM Photo" icon={Camera} onFileSelect={f => setPunchOutPhotos({ ...punchOutPhotos, kmPhoto: f })} previewFile={punchOutPhotos.kmPhoto} />

                                    {/* Remarks */}
                                    <Field label="Remarks" value={punchOutData.review} onChange={v => setPunchOutData({ ...punchOutData, review: v })} />

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                            height: '58px', background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                                            border: 'none', borderRadius: '16px', color: 'white',
                                            fontSize: '15px', fontWeight: '900', textTransform: 'uppercase',
                                            letterSpacing: '1px', cursor: submitting ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 8px 24px -6px rgba(244,63,94,0.45)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        {submitting ? <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white' }}></div> : <><LogOut size={18} /> FINISH DUTY</>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Enhanced Advance Payment Modal */}
                {
                    showAdvanceModal && (
                        <Modal title="Financial Disbursement" onClose={() => setShowAdvanceModal(false)}>
                            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                <div style={{
                                    width: '70px', height: '70px', borderRadius: '24px', background: 'rgba(16, 185, 129, 0.1)',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                }}>
                                    <Download size={32} style={{ color: '#10b981', transform: 'rotate(180deg)' }} />
                                </div>
                                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: '0 0 5px 0' }}>Disburse Advance</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>Processing payment for <span style={{ color: '#6366f1', fontWeight: '800' }}>{selectedDriver?.name?.split(' (F)')[0]}</span></p>
                            </div>

                            <form onSubmit={handleAddAdvance} style={{ display: 'grid', gap: '25px' }}>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Payment Amount (₹) *</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontSize: '20px', fontWeight: '900' }}>₹</span>
                                        <input
                                            type="number"
                                            className="input-field"
                                            required
                                            value={advanceData.amount}
                                            onChange={v => setAdvanceData({ ...advanceData, amount: v.target.value })}
                                            placeholder="0.00"
                                            style={{
                                                paddingLeft: '45px', fontSize: '24px', fontWeight: '900', height: '70px',
                                                background: 'rgba(5, 8, 15, 0.4)', border: '1px solid rgba(255,255,255,0.1)',
                                                color: 'white', borderRadius: '20px'
                                            }}
                                        />
                                    </div>

                                    {/* Quick Amounts */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                                        {[500, 1000, 2000, 5000].map(amt => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setAdvanceData({ ...advanceData, amount: amt.toString() })}
                                                style={{
                                                    flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                                    background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)',
                                                    fontSize: '11px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.3s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)'}
                                                onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)'}
                                            >
                                                +₹{amt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Value Date *" type="date" value={advanceData.date} onChange={v => setAdvanceData({ ...advanceData, date: v })} required />
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px' }}>Classification</p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {['Office', 'Staff'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setAdvanceData({ ...advanceData, advanceType: type })}
                                                style={{
                                                    flex: 1, padding: '12px', borderRadius: '14px',
                                                    background: advanceData.advanceType === type ? 'rgba(99, 102, 241, 0.15)' : 'rgba(5, 8, 15, 0.3)',
                                                    color: advanceData.advanceType === type ? '#818cf8' : 'rgba(255,255,255,0.3)',
                                                    fontWeight: '900', fontSize: '12px', cursor: 'pointer',
                                                    border: advanceData.advanceType === type ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(255,255,255,0.02)'
                                                }}
                                            >
                                                {type.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Field label="Transaction Reference / Remark" placeholder="e.g. Fuel Advance, Emergency..." value={advanceData.remark} onChange={v => setAdvanceData({ ...advanceData, remark: v })} />

                                <SubmitButton disabled={submitting} text="DISBURSE FUNDS" message={message} />
                            </form>
                        </Modal>
                    )
                }

                {/* Document Modal */}
                {
                    showDocumentModal && (
                        <Modal title={`Documents: ${selectedDriver?.name}`} onClose={() => setShowDocumentModal(false)}>
                            <div style={{ display: 'grid', gap: '25px' }}>
                                {selectedDriver?.documents?.map((doc, i) => (
                                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ color: 'white', fontWeight: '700', margin: 0 }}>{doc.documentType}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>{doc.expiryDate ? `Expires: ${new Date(doc.expiryDate).toLocaleDateString()}` : 'Lifetime'}</p>
                                        </div>
                                        <a href={doc.imageUrl} target="_blank" rel="noreferrer" style={{ color: '#6366f1', fontSize: '11px', fontWeight: '800' }}>VIEW</a>
                                    </div>
                                ))}
                                <form onSubmit={handleUploadDocument} style={{ display: 'grid', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <Field label="Type" value={documentForm.documentType} onChange={v => setDocumentForm({ ...documentForm, documentType: v })} />
                                        <Field label="Expiry" type="date" value={documentForm.expiryDate} onChange={v => setDocumentForm({ ...documentForm, expiryDate: v })} />
                                    </div>
                                    <input type="file" onChange={e => setDocumentFile(e.target.files[0])} className="input-field" style={{ height: '48px', paddingTop: '10px' }} />
                                    <SubmitButton disabled={submitting} text="Upload" message={message} />
                                </form>
                            </div>
                        </Modal>
                    )
                }

                {showEditDutyModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,8,15,0.95)', zIndex: 11000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(16px)' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="premium-glass"
                            style={{ width: '100%', maxWidth: '600px', borderRadius: '32px', overflow: 'hidden', maxHeight: '95vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            {/* Modal Header */}
                            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.05))', padding: '24px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '15px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Edit2 size={20} color="#818cf8" />
                                    </div>
                                    <div>
                                        <h2 style={{ color: 'white', fontSize: '20px', margin: 0, fontWeight: '900' }}>Edit Duty Record</h2>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modify trip details & expenses</div>
                                    </div>
                                </div>
                                <button onClick={() => setShowEditDutyModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '12px', padding: '10px', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleUpdateDuty} style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                                {/* Basic Info Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <Field label="Duty Date *" type="date" value={editDutyForm.date} onChange={v => setEditDutyForm({ ...editDutyForm, date: v })} required />
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Vehicle *</label>
                                        <select
                                            className="input-field"
                                            required
                                            value={editDutyForm.vehicleId}
                                            onChange={e => setEditDutyForm({ ...editDutyForm, vehicleId: e.target.value })}
                                            style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                        >
                                            {vehicles.map(v => <option key={v._id} value={v._id} style={{ background: '#0f172a' }}>{v.carNumber?.split('#')[0]}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Freelancer *</label>
                                    <select
                                        className="input-field"
                                        required
                                        value={editDutyForm.driverId}
                                        onChange={e => setEditDutyForm({ ...editDutyForm, driverId: e.target.value })}
                                        style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                    >
                                        {drivers.map(d => <option key={d._id} value={d._id} style={{ background: '#0f172a' }}>{d.name.split(' (F)')[0]}</option>)}
                                    </select>
                                </div>

                                {/* Timing Section */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px' }}>Trip Duration & Timing</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <Field label="Punch-In Time" type="datetime-local" value={editDutyForm.punchInTime} onChange={v => setEditDutyForm({ ...editDutyForm, punchInTime: v })} />
                                        <Field label="Punch-Out Time" type="datetime-local" value={editDutyForm.punchOutTime} onChange={v => setEditDutyForm({ ...editDutyForm, punchOutTime: v })} />
                                    </div>
                                </div>

                                {/* Distance Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <Field label="Starting KM" type="number" value={editDutyForm.startKm} onChange={v => setEditDutyForm({ ...editDutyForm, startKm: v })} />
                                    <Field label="Closing KM" type="number" value={editDutyForm.endKm} onChange={v => setEditDutyForm({ ...editDutyForm, endKm: v })} />
                                </div>

                                {/* Location Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <Field label="Pick-up Location" value={editDutyForm.pickUpLocation} onChange={v => setEditDutyForm({ ...editDutyForm, pickUpLocation: v })} />
                                    <Field label="Drop Location" value={editDutyForm.dropLocation} onChange={v => setEditDutyForm({ ...editDutyForm, dropLocation: v })} />
                                </div>

                                {/* Financials Section */}
                                <div style={{ background: 'rgba(16,185,129,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.1)' }}>
                                    <p style={{ color: '#10b981', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px' }}>Billing & Salary</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <Field label="Daily Wage (₹) *" type="text" inputMode="decimal" value={editDutyForm.dailyWage} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setEditDutyForm({ ...editDutyForm, dailyWage: cleaned });
                                        }} required />
                                        <Field label="Parking/Toll (₹)" type="text" inputMode="decimal" value={editDutyForm.parkingAmount} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setEditDutyForm({ ...editDutyForm, parkingAmount: cleaned });
                                        }} />
                                        <Field label="T/A (₹)" type="text" inputMode="decimal" value={editDutyForm.allowanceTA} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setEditDutyForm({ ...editDutyForm, allowanceTA: cleaned });
                                        }} />
                                        <Field label="Night Charges (₹)" type="text" inputMode="decimal" value={editDutyForm.nightStayAmount} onChange={v => {
                                            const cleaned = v.replace(/[^0-9.]/g, '');
                                            setEditDutyForm({ ...editDutyForm, nightStayAmount: cleaned });
                                        }} />
                                    </div>
                                </div>

                                <Field label="Admin Remarks" placeholder="Any special notes about this duty..." value={editDutyForm.remarks} onChange={v => setEditDutyForm({ ...editDutyForm, remarks: v })} />

                                <div style={{ marginTop: '10px' }}>
                                    <SubmitButton disabled={submitting} text="Update Duty Record" message={message} />
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                <AnimatePresence>
                    {selectedItem && (
                        <AttendanceModal
                            item={selectedItem}
                            onClose={() => setSelectedItem(null)}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showQuickExpenseModal && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 15, 0.9)', zIndex: 11000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(12px)' }}>
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className="premium-glass"
                                style={{ width: '100%', maxWidth: '600px', padding: '35px', maxHeight: '95vh', overflowY: 'auto', borderRadius: '32px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                    <div>
                                        <h2 style={{ color: 'white', fontSize: '24px', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>
                                            Add {quickExpenseType === 'fuel' ? 'Fuel' : 'Parking'}
                                        </h2>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase' }}>
                                            FOR {selectedDriver?.name.split(' (F)')[0]}
                                        </p>
                                    </div>
                                    <button onClick={() => setShowQuickExpenseModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', height: '40px', width: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                                </div>

                                <form onSubmit={handleQuickExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {quickExpenseType === 'fuel' ? (
                                        <>
                                            <motion.div
                                                className="livefeed-cards-grid"
                                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '20px' }}
                                            >
                                                <div>
                                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Vehicle Number *</label>
                                                    <select
                                                        className="input-field"
                                                        value={quickExpenseData.vehicleId}
                                                        required
                                                        onChange={(e) => setQuickExpenseData({ ...quickExpenseData, vehicleId: e.target.value })}
                                                        style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                                    >
                                                        <option value="" style={{ background: '#0f172a' }}>-- Select Car --</option>
                                                        {vehicles.map(v => <option key={v._id} value={v._id} style={{ background: '#0f172a' }}>{v.carNumber} ({v.model})</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Fuel Type</label>
                                                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '5px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', height: '52px' }}>
                                                        {['Diesel', 'Petrol', 'CNG'].map((t) => (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                onClick={() => setQuickExpenseData({ ...quickExpenseData, fuelType: t })}
                                                                style={{
                                                                    flex: 1,
                                                                    border: 'none',
                                                                    borderRadius: '10px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '800',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.3s',
                                                                    background: quickExpenseData.fuelType === t ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                                                                    color: quickExpenseData.fuelType === t ? 'white' : 'rgba(255,255,255,0.4)',
                                                                    boxShadow: quickExpenseData.fuelType === t ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none'
                                                                }}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <Field label="Amount (₹) *" value={quickExpenseData.amount} onChange={v => setQuickExpenseData({ ...quickExpenseData, amount: v })} type="number" required placeholder="e.g. 5000" />
                                                <Field label="Quantity (L) *" value={quickExpenseData.quantity} onChange={v => setQuickExpenseData({ ...quickExpenseData, quantity: v })} type="number" required placeholder="e.g. 50" />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <Field label="Rate (₹/L)" value={quickExpenseData.rate} onChange={v => setQuickExpenseData({ ...quickExpenseData, rate: v })} placeholder="Auto-calculated" readOnly />
                                                <Field label="Date *" value={quickExpenseData.date} onChange={v => setQuickExpenseData({ ...quickExpenseData, date: v })} type="date" required />
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <Field label="Odometer (KM) *" value={quickExpenseData.odometer} onChange={v => setQuickExpenseData({ ...quickExpenseData, odometer: v })} type="number" required placeholder="Current Reading" />
                                                <div>
                                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Payment Source</label>
                                                    <select
                                                        className="input-field"
                                                        value={quickExpenseData.paymentSource}
                                                        onChange={(e) => setQuickExpenseData({ ...quickExpenseData, paymentSource: e.target.value })}
                                                        style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                                    >
                                                        <option value="Yatree Office" style={{ background: '#0f172a' }}>Yatree Office (Default)</option>
                                                        <option value="Driver App" style={{ background: '#0f172a' }}>Personal Pay / Driver</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <Field label="Fuel Station Name" value={quickExpenseData.stationName} onChange={v => setQuickExpenseData({ ...quickExpenseData, stationName: v })} placeholder="e.g. HP Petrol Pump" />
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <Field label="Amount (₹) *" value={quickExpenseData.amount} onChange={v => setQuickExpenseData({ ...quickExpenseData, amount: v })} type="number" required />
                                                <Field label="Date *" value={quickExpenseData.date} onChange={v => setQuickExpenseData({ ...quickExpenseData, date: v })} type="date" required />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Vehicle *</label>
                                                <select
                                                    className="input-field"
                                                    required
                                                    value={quickExpenseData.vehicleId}
                                                    onChange={e => setQuickExpenseData({ ...quickExpenseData, vehicleId: e.target.value })}
                                                    style={{ height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '0 15px', color: 'white' }}
                                                >
                                                    <option value="" style={{ background: '#0f172a' }}>Select Vehicle</option>
                                                    {vehicles.map(v => <option key={v._id} value={v._id} style={{ background: '#0f172a' }}>{v.carNumber}</option>)}
                                                </select>
                                            </div>
                                            <Field label="Location" value={quickExpenseData.location} onChange={v => setQuickExpenseData({ ...quickExpenseData, location: v })} placeholder="Enter location" />
                                        </>
                                    )}

                                    <Field label="Remarks" value={quickExpenseData.remark} onChange={v => setQuickExpenseData({ ...quickExpenseData, remark: v })} placeholder="Optional remarks" />

                                    <div style={{ padding: '25px', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px' }}>
                                            {quickExpenseType === 'fuel' ? 'FUEL SLIP / RECEIPT PHOTO' : 'PARKING RECEIPT PHOTO'}
                                        </p>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            {quickExpenseData.slipPhoto ? (
                                                <div style={{ position: 'relative' }}>
                                                    <img src={URL.createObjectURL(quickExpenseData.slipPhoto)} alt="Slip" style={{ width: '100px', height: '100px', borderRadius: '16px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                                                    <button type="button" onClick={() => setQuickExpenseData({ ...quickExpenseData, slipPhoto: '' })} style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#f43f5e', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>×</button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '15px' }}>
                                                    <label style={{ width: '90px', height: '90px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                                                        <Camera size={24} color="rgba(255,255,255,0.2)" />
                                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', marginTop: '8px' }}>CAMERA</span>
                                                        <input type="file" hidden accept="image/*" capture="environment" onChange={e => { if (e.target.files[0]) setQuickExpenseData({ ...quickExpenseData, slipPhoto: e.target.files[0] }) }} />
                                                    </label>
                                                    <label style={{ width: '90px', height: '90px', borderRadius: '20px', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
                                                        <Plus size={24} color="rgba(255,255,255,0.2)" />
                                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', marginTop: '8px' }}>UPLOAD</span>
                                                        <input type="file" hidden accept="image/*" onChange={e => { if (e.target.files[0]) setQuickExpenseData({ ...quickExpenseData, slipPhoto: e.target.files[0] }) }} />
                                                    </label>
                                                </div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0, fontWeight: '600', lineHeight: '1.4' }}>
                                                    Snap a photo or upload fuel bill.<br />
                                                    <span style={{ fontSize: '10px' }}>Max size: 5MB (JPG, PNG)</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <SubmitButton disabled={submitting} text={`SAVE ${quickExpenseType.toUpperCase()} ENTRY`} message={message} />
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .hide-mobile {
                        display: none !important;
                    }
                    .show-mobile {
                        display: grid !important; /* or block, flex, etc., depending on desired layout */
                    }
                    .settlement-row-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        text-align: left !important;
                    }
                    .settlement-stats-grid {
                        width: 100% !important;
                        justify-content: space-between !important;
                        gap: 15px !important;
                        margin: 10px 0 !important;
                        padding: 15px 0 !important;
                        border-top: 1px solid rgba(255,255,255,0.05) !important;
                        border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                    }
                    .settlement-stats-grid > div {
                        flex: 1 !important;
                        text-align: left !important;
                    }
                    .header-actions {
                        width: 100% !important;
                        justify-content: space-between !important;
                        margin-top: 15px !important;
                    }
                    .header-actions > div {
                        flex: 1 !important;
                    }
                    .mobile-stack {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }
                }
                .premium-row:hover {
                    background: rgba(30, 41, 59, 0.7) !important;
                    border-color: rgba(99, 102, 241, 0.2) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 30px rgba(0,0,0,0.3);
                }
                .premium-row {
                    transition: all 0.3s ease !important;
                }
            `}</style>
        </div >
    );
};

export default Freelancers;
