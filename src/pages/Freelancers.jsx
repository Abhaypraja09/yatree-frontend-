import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { Plus, Search, Trash2, User as UserIcon, Users, X, CheckCircle, AlertCircle, LogIn, LogOut, Car, Filter, Download, Phone, Edit2, IndianRupee, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCompany } from '../context/CompanyContext';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

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


const Freelancers = () => {
    const { selectedCompany } = useCompany();
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPunchInModal, setShowPunchInModal] = useState(false);
    const [showPunchOutModal, setShowPunchOutModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [editingDriver, setEditingDriver] = useState(null);
    const [driverFilter, setDriverFilter] = useState('All');
    const [attendance, setAttendance] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [vehicleFilter, setVehicleFilter] = useState('All');
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [documentForm, setDocumentForm] = useState({ documentType: 'Driving License', expiryDate: '' });
    const [documentFile, setDocumentFile] = useState(null);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'personnel');

    // Form States
    const [formData, setFormData] = useState({ name: '', mobile: '', licenseNumber: '', dailyWage: '' });
    const [editForm, setEditForm] = useState({ name: '', mobile: '', licenseNumber: '', dailyWage: '' });
    const [punchInData, setPunchInData] = useState({
        vehicleId: '',
        km: '',
        date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10),
        time: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16),
        pickUpLocation: ''
    });
    const [punchOutData, setPunchOutData] = useState({ km: '', time: '', fuelAmount: '0', parkingAmount: '0', parkingPaidBy: 'Self', review: '', dailyWage: '', dropLocation: '' });
    const [advanceData, setAdvanceData] = useState({ amount: '', remark: '', date: '', advanceType: 'Office', givenBy: 'Office' });
    const [manualData, setManualData] = useState({
        driverId: '',
        vehicleId: '',
        date: '',
        punchInKM: '',
        punchOutKM: '',
        punchInTime: '',
        punchOutTime: '',
        pickUpLocation: '',
        dropLocation: '',
        fuelAmount: '0',
        parkingAmount: '0',
        parkingPaidBy: 'Self',
        allowanceTA: false,
        nightStayAmount: false,
        otherBonus: '0',
        dailyWage: '',
        review: ''
    });

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

    const getLocalYYYYMMDD = (date = new Date()) => {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const getLocalYYYYMMDDHHMM = (date = new Date()) => {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${day}T${hh}:${min}`;
    };

    useEffect(() => {
        const dStr = getLocalYYYYMMDD();
        const dtStr = getLocalYYYYMMDDHHMM();

        setPunchInData(prev => ({
            ...prev,
            date: dStr,
            time: dtStr
        }));

        setPunchOutData(prev => ({
            ...prev,
            time: dtStr
        }));

        setAdvanceData(prev => ({
            ...prev,
            date: dStr
        }));

        setManualData(prev => ({
            ...prev,
            date: dStr,
            punchInTime: dStr + 'T08:00',
            punchOutTime: dStr + 'T20:00'
        }));
    }, []);

    const getOneEightyDaysAgo = () => {
        const d = new Date();
        d.setDate(d.getDate() - 180);
        return getLocalYYYYMMDD(d);
    };

    const getToday = () => getLocalYYYYMMDD();

    const [fromDate, setFromDate] = useState(getOneEightyDaysAgo());
    const [toDate, setToDate] = useState(getToday());

    const [submitting, setSubmitting] = useState(false);
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [dutySearch, setDutySearch] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });


    const fetchAttendance = useCallback(async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/reports/${selectedCompany._id}?from=${fromDate}&to=${toDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            // Filter attendance for freelancers
            const freelancerAttendance = (data.attendance || []).filter(a =>
                a.isFreelancer || a.driver?.isFreelancer || a.driver?.name?.includes('(F)')
            );
            setAttendance(freelancerAttendance);
        } catch (err) { console.error('Logistic error:', err); }
    }, [selectedCompany, fromDate, toDate]);

    const fetchAdvances = useCallback(async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            // Added from/to to ensure consistency even if called directly
            const { data } = await axios.get(`/api/admin/advances/${selectedCompany._id}?isFreelancer=true&from=${fromDate}&to=${toDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setAdvances(data || []);
        } catch (err) { console.error('Logistic error:', err); }
    }, [selectedCompany, fromDate, toDate]);

    const fetchFreelancers = useCallback(async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/drivers/${selectedCompany._id}?isFreelancer=true&usePagination=false`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setDrivers(data.drivers || []);
        } catch (err) { console.error('Logistic error:', err); }
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
        } catch (err) { console.error('Logistic error:', err); }
    }, [selectedCompany]);

    // Master Data Effect (Company change only)
    useEffect(() => {
        if (selectedCompany) {
            fetchFreelancers();
            fetchVehicles();
        }
    }, [selectedCompany, fetchFreelancers, fetchVehicles]);

    // Filtered Data Effect (Company or Date changes)
    useEffect(() => {
        if (selectedCompany) {
            fetchAttendance();
            fetchAdvances();
        }
    }, [selectedCompany, fromDate, toDate, fetchAttendance, fetchAdvances]);


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
                setFormData({ name: '', mobile: '', licenseNumber: '', dailyWage: '' });
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
            // Use provided time and date for flexible scheduling
            await axios.post('/api/admin/freelancers/punch-in', {
                ...punchInData,
                driverId: selectedDriver._id
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowPunchInModal(false);
            const localNow = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString();
            setPunchInData({
                vehicleId: '',
                km: '',
                date: localNow.slice(0, 10),
                time: localNow.slice(0, 16),
                pickUpLocation: ''
            });
            fetchFreelancers();
            fetchVehicles();
            fetchAttendance();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    const handlePunchOut = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/freelancers/punch-out', { ...punchOutData, driverId: selectedDriver._id }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowPunchOutModal(false);
            const now = new Date().toISOString().slice(0, 16);
            setPunchOutData({ km: '', time: now, fuelAmount: '0', parkingAmount: '0', parkingPaidBy: 'Self', review: '', dailyWage: '', dropLocation: '' });
            fetchFreelancers();
            fetchVehicles();
            fetchAttendance();
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
            setAdvanceData({ amount: '', remark: '', date: new Date().toISOString().slice(0, 10), advanceType: 'Office', givenBy: 'Office' });
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
                companyId: selectedCompany._id
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowManualModal(false);
            setManualData({
                driverId: '', vehicleId: '', date: new Date().toISOString().split('T')[0],
                punchInKM: '', punchOutKM: '', punchInTime: '', punchOutTime: '',
                pickUpLocation: '', dropLocation: '', fuelAmount: '0', parkingAmount: '0',
                parkingPaidBy: 'Self',
                allowanceTA: false, nightStayAmount: false, otherBonus: '0',
                dailyWage: '', review: ''
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

            if (editingDuty.isOutsideCar) {
                // Update Outside Car (Vehicle record)
                await axios.put(`/api/admin/vehicles/${editingDuty._id}`, {
                    dutyAmount: editDutyForm.dailyWage,
                    dutyType: editDutyForm.pickUpLocation, // Synced with Pick-up Location field
                    dropLocation: editDutyForm.dropLocation,
                    driverName: drivers.find(d => d._id === editDutyForm.driverId)?.name || editingDuty.driver?.name
                }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            } else {
                // Update Regular Attendance
                await axios.put(`/api/admin/attendance/${editingDuty._id}`, editDutyForm, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            }

            setShowEditDutyModal(false);
            setMessage({ type: 'success', text: 'Duty updated successfully' });
            fetchAttendance();
            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        } catch (err) {
            alert(err.response?.data?.message || 'Update failed');
        } finally { setSubmitting(false); }
    };

    const openEditDutyModal = (duty) => {
        setEditingDuty(duty);
        const fallbackWage = duty.isOutsideCar ? (duty.dutyAmount || 0) : (duty.driver?.dailyWage || 500);
        setEditDutyForm({
            date: duty.date,
            driverId: duty.driver?._id || duty.driver || '',
            vehicleId: duty.vehicle?._id || duty.vehicle || '',
            startKm: duty.punchIn?.km ?? '',
            endKm: duty.punchOut?.km ?? '',
            punchInTime: duty.punchIn?.time ? new Date(duty.punchIn.time).toISOString().slice(0, 16) : '',
            punchOutTime: duty.punchOut?.time ? new Date(duty.punchOut.time).toISOString().slice(0, 16) : '',
            pickUpLocation: duty.pickUpLocation || '',
            dropLocation: duty.dropLocation || '',
            fuelAmount: duty.fuel?.amount ?? '0',
            parkingAmount: duty.punchOut?.tollParkingAmount ?? '0',
            parkingPaidBy: duty.punchOut?.parkingPaidBy || 'Self',
            allowanceTA: duty.punchOut?.allowanceTA ?? 0,
            nightStayAmount: duty.punchOut?.nightStayAmount ?? 0,
            bonusAmount: duty.outsideTrip?.bonusAmount ?? '0',
            dailyWage: duty.dailyWage || fallbackWage,
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
            dailyWage: driver.dailyWage || ''
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

    const matchesSearch = (d) =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.mobile?.includes(searchTerm) ||
        d.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const onDutyDrivers = baseDrivers.filter(d => d.tripStatus === 'active' && matchesSearch(d));
    const availableDrivers = baseDrivers.filter(d => d.tripStatus !== 'active' && matchesSearch(d));

    const filteredAttendance = attendance.filter(a => {
        const matchesDriver = driverFilter === 'All' || a.driver?._id === driverFilter || a.driver === driverFilter;
        const matchesVehicle = vehicleFilter === 'All' || a.vehicle?._id === vehicleFilter || a.vehicle?.carNumber?.split('#')[0] === vehicleFilter;
        const matchesSearch = !dutySearch ||
            a.driver?.name?.toLowerCase().includes(dutySearch.toLowerCase()) ||
            a.vehicle?.carNumber?.toLowerCase().includes(dutySearch.toLowerCase()) ||
            a.pickUpLocation?.toLowerCase().includes(dutySearch.toLowerCase()) ||
            a.dropLocation?.toLowerCase().includes(dutySearch.toLowerCase());
        return matchesDriver && matchesVehicle && matchesSearch;
    });

    const totalSettlement = filteredAttendance.reduce((sum, a) => {
        const wage = Number(a.dailyWage) || 0;
        const parking = a.punchOut?.parkingPaidBy !== 'Office' ? (Number(a.punchOut?.tollParkingAmount) || 0) : 0;
        const bonus = (Number(a.punchOut?.allowanceTA) || 0) + (Number(a.punchOut?.nightStayAmount) || 0) + (Number(a.outsideTrip?.bonusAmount) || 0);
        return sum + wage + parking + bonus;
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
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Freelancer Fleet Network" description="Onboard and manage freelance drivers for temporary duties and peak demand management." />

            {/* Header with Search and Stats */}
            <header className="glass-card dashboard-header" style={{
                padding: 'clamp(20px, 3vw, 30px)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '25px',
                background: 'rgba(30, 41, 59, 0.4)'
            }}>
                <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '20px', alignItems: 'center' }}>
                    <div className="header-logo-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div className="header-logo-container" style={{
                                background: 'linear-gradient(135deg, white, #f8fafc)',
                                borderRadius: '16px',
                                padding: '8px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                flexShrink: 0
                            }}>
                                <Users size={28} color="#fbbf24" />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                                    <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>External Workforce</span>
                                </div>
                                <h1 className="header-title" style={{ color: 'white', fontWeight: '900', margin: 0, letterSpacing: '-1.5px', fontSize: 'clamp(20px, 5vw, 32px)' }}>
                                    Freelancers <span className="text-gradient-yellow">Hub</span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, width: '100%', maxWidth: '100%' }}>
                        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                            <div className="glass-card" style={{ padding: '0', display: 'flex', alignItems: 'center', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', flex: 1 }}>
                                <Search size={18} style={{ margin: '0 12px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                                <input
                                    type="text"
                                    placeholder={activeTab === 'logistics' ? "Search in duties..." : "Find personnel..."}
                                    value={activeTab === 'logistics' ? dutySearch : searchTerm}
                                    onChange={(e) => activeTab === 'logistics' ? setDutySearch(e.target.value) : setSearchTerm(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', height: '44px', width: '100%', outline: 'none', fontSize: '13px', paddingRight: '12px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                    className="glass-card-hover-effect"
                                    onClick={() => setShowManualModal(true)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                                    title="Manual Entry"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', border: 'none', color: 'black', boxShadow: '0 8px 15px rgba(251, 191, 36, 0.2)', cursor: 'pointer' }}
                                    title="Add Freelancer"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Premium Filter Hub */}
            <div className="glass-card" style={{
                padding: '20px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.05)',
                marginBottom: '30px',
                background: 'rgba(15, 23, 42, 0.4)'
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>

                    {/* Tabs */}
                    <div className="premium-scroll" style={{
                        display: 'flex',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '4px',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.03)',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        gap: '4px',
                        maxWidth: '100%'
                    }}>
                        {[
                            { id: 'personnel', label: 'Drivers', icon: <UserIcon size={14} /> },
                            { id: 'logistics', label: 'Duties', icon: <Car size={14} /> },
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
                                    background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    color: activeTab === tab.id ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    transition: 'all 0.3s',
                                    flexShrink: 0
                                }}
                            >
                                {tab.icon} <span style={{ letterSpacing: '0.5px' }}>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Filter Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, width: '100%', justifyContent: 'flex-start' }}>
                        <select
                            value={driverFilter}
                            onChange={(e) => setDriverFilter(e.target.value)}
                            className="input-field"
                            style={{
                                width: '100%',
                                maxWidth: '180px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                height: '42px',
                                fontSize: '13px',
                                fontWeight: '700',
                                outline: 'none'
                            }}
                        >
                            <option value="All">All Drivers</option>
                            {drivers.map(d => <option key={d._id} value={d._id}>{d.name.split(' (F)')[0]}</option>)}
                        </select>

                        <div className="date-selector-container" style={{ width: '100%', maxWidth: '280px' }}>
                            <div className="date-selector-inner" style={{ padding: '2px', height: '42px' }}>
                                <button
                                    onClick={() => {
                                        const d = new Date(toDate);
                                        d.setDate(d.getDate() - 1);
                                        setToDate(d.toISOString().split('T')[0]);
                                    }}
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                >
                                    <ChevronLeft size={16} />
                                </button>

                                <div
                                    onClick={() => document.getElementById('main-date-picker').showPicker()}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                                >
                                    <Calendar size={14} color="#fbbf24" />
                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '800' }}>
                                        {new Date(toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <input
                                        id="main-date-picker"
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        style={{ visibility: 'hidden', width: 0, position: 'absolute' }}
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        const d = new Date(toDate);
                                        d.setDate(d.getDate() + 1);
                                        setToDate(d.toISOString().split('T')[0]);
                                    }}
                                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div >
                        </div >

                        <button
                            onClick={handleDownloadExcel}
                            style={{
                                height: '42px',
                                padding: '0 15px',
                                borderRadius: '12px',
                                background: 'rgba(16,185,129,0.1)',
                                color: '#10b981',
                                border: '1px solid rgba(16,185,129,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '800'
                            }}
                            title="Export Reports"
                        >
                            <Download size={16} /> <span className="hide-mobile">Excel</span>
                        </button>
                    </div >
                </div >
            </div >


            {/* Content Tabs */}
            <div style={{ position: 'relative', minHeight: '600px' }}>
                {/* PERSONNEL TAB */}
                {activeTab === 'personnel' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ animation: 'fadeIn 0.5s ease' }}>
                        {/* Driver Table View */}
                        <div style={{ borderRadius: '24px', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="scroll-x">
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
                                            const isOnDuty = d.tripStatus === 'active';
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
                                                                <button
                                                                    onClick={() => { setSelectedDriver(d); setPunchOutData({ ...punchOutData, km: '', time: new Date().toISOString().slice(0, 16), dailyWage: d.dailyWage || '' }); setShowPunchOutModal(true); }}
                                                                    style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '8px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                                                                >FINISH</button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => { setSelectedDriver(d); setPunchInData({ ...punchInData, time: new Date().toISOString().slice(0, 16), date: new Date().toISOString().split('T')[0] }); setShowPunchInModal(true); }}
                                                                    style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '8px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                                                                >START</button>
                                                            )}
                                                            <button onClick={() => { setSelectedDriver(d); setShowAdvanceModal(true); }} title="Add Advance" style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                                                                <IndianRupee size={13} />
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
                )}

                {/* ACCOUNTS TAB */}
                {activeTab === 'accounts' && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <div style={{ width: '3px', height: '16px', background: '#6366f1', borderRadius: '4px' }}></div>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '800' }}>Driver Wise Settlement</h4>
                            </div>
                            <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="scroll-x">
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <th style={{ padding: '15px 20px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Driver Details</th>
                                                <th style={{ padding: '15px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Stats (Duties/KM)</th>
                                                <th style={{ padding: '15px 20px', textAlign: 'right', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Total Earned</th>
                                                <th style={{ padding: '15px 20px', textAlign: 'right', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Total Advances</th>
                                                <th style={{ padding: '15px 20px', textAlign: 'right', color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Net Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {drivers.map(driver => {
                                                const dAttendance = attendance.filter(a => a.driver?._id === driver._id || a.driver === driver._id);
                                                const dEarned = dAttendance.reduce((s, a) => {
                                                    const wage = Number(a.dailyWage) || 0;
                                                    const parking = a.punchOut?.parkingPaidBy !== 'Office' ? (Number(a.punchOut?.tollParkingAmount) || 0) : 0;
                                                    const bonus = (Number(a.punchOut?.allowanceTA) || 0) + (Number(a.punchOut?.nightStayAmount) || 0) + (Number(a.outsideTrip?.bonusAmount) || 0);
                                                    return s + wage + parking + bonus;
                                                }, 0);
                                                const dKM = dAttendance.reduce((s, a) => s + (a.totalKM || (a.punchOut?.km - a.punchIn?.km) || 0), 0);
                                                const dAdvances = advances.filter(adv => adv.driver?._id === driver._id || adv.driver === driver._id);
                                                const dAdvanced = dAdvances.reduce((s, adv) => s + adv.amount, 0);
                                                const breakdownText = dAdvances.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5).map(adv => `${new Date(adv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} (₹${adv.amount})`).join(', ') + (dAdvances.length > 5 ? '...' : '');

                                                const dBalance = dEarned - dAdvanced;
                                                if (dEarned === 0 && dAdvanced === 0) return null;

                                                return (
                                                    <tr key={driver._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }} className="ledger-row">
                                                        <td style={{ padding: '15px 20px' }}>
                                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '16px', marginBottom: '4px' }}>{driver.name}</div>
                                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Phone size={10} /> {driver.mobile}
                                                                </div>
                                                                {driver.licenseNumber && (
                                                                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <span style={{ fontSize: '9px', fontWeight: '900', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '4px' }}>DL</span> {driver.licenseNumber}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>{dAttendance.length} Trips</div>
                                                            <div style={{ color: '#818cf8', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px' }}>{dKM.toLocaleString()} KM Record</div>
                                                        </td>
                                                        <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                                            <div style={{ color: '#10b981', fontWeight: '900', fontSize: '16px' }}>₹{dEarned.toLocaleString()}</div>
                                                            <div style={{ color: 'rgba(16, 185, 129, 0.4)', fontSize: '9px', fontWeight: '800' }}>Wages + Parking + Bonus</div>
                                                        </td>
                                                        <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                                            <div style={{ color: '#f43f5e', fontWeight: '900', fontSize: '16px' }}>₹{dAdvanced.toLocaleString()}</div>
                                                            <div style={{ color: 'rgba(244, 63, 94, 0.4)', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px' }}>
                                                                {breakdownText || 'No Advances'}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                                            <div style={{
                                                                padding: '8px 16px', borderRadius: '12px',
                                                                background: dBalance >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                                                                color: dBalance >= 0 ? '#10b981' : '#f43f5e',
                                                                fontSize: '17px', fontWeight: '900',
                                                                display: 'inline-block',
                                                                border: `1px solid ${dBalance >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}`
                                                            }}>₹{dBalance.toLocaleString()}</div>
                                                        </td>
                                                    </tr>
                                                );
                                            }).filter(Boolean)}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* LOGISTICS TAB */}
                {activeTab === 'logistics' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ animation: 'fadeIn 0.5s ease' }}>
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
                                                <th style={{ padding: '18px 25px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Financials (+ Parking)</th>
                                                <th style={{ padding: '18px 25px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAttendance.map((a) => {
                                                const punchInDate = a.date || (a.punchIn?.time ? new Date(a.punchIn.time).toISOString().split('T')[0] : null);
                                                const punchInTime = a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';
                                                const punchOutTime = a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
                                                const totalKM = a.totalKM || (a.punchOut?.km && a.punchIn?.km ? a.punchOut.km - a.punchIn.km : 0);
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
                                                            <div style={{ color: '#10b981', fontSize: '16px', fontWeight: '900' }}>₹{a.dailyWage || a.driver?.dailyWage || 0}</div>
                                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                                                                {a.fuel?.amount > 0 && <span style={{ color: '#f59e0b', fontSize: '9px', fontWeight: '900' }}>F: ₹{a.fuel.amount}</span>}
                                                                {a.punchOut?.tollParkingAmount > 0 && (
                                                                    <span style={{
                                                                        color: a.punchOut?.parkingPaidBy === 'Office' ? 'rgba(255,255,255,0.4)' : '#8b5cf6',
                                                                        fontSize: '9px', fontWeight: '900',
                                                                        textDecoration: a.punchOut?.parkingPaidBy === 'Office' ? 'line-through' : 'none'
                                                                    }}>
                                                                        P: ₹{a.punchOut.tollParkingAmount}{a.punchOut?.parkingPaidBy === 'Office' ? ' (O)' : ' (S)'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '15px 25px', textAlign: 'center' }}>
                                                            <button
                                                                onClick={() => openEditDutyModal(a)}
                                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
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
                )}
            </div>

            {/* Modals Implementation */}
            < div >
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
                                <Field label="Daily Wage (₹)" type="number" value={formData.dailyWage} onChange={v => setFormData({ ...formData, dailyWage: v })} />
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
                                <Field label="Daily Wage (₹)" type="number" value={editForm.dailyWage} onChange={v => setEditForm({ ...editForm, dailyWage: v })} />
                                <SubmitButton disabled={submitting} text="Update Freelancer" message={message} />
                            </form>
                        </Modal>
                    )
                }

                {/* Punch In Modal */}
                {
                    showPunchInModal && (
                        <Modal title={`Assign Duty: ${selectedDriver?.name}`} onClose={() => setShowPunchInModal(false)}>
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
                                            if (found) setPunchInData({ ...punchInData, vehicleId: found._id });
                                        }}
                                    />
                                    <datalist id="vehicle-list">
                                        {vehicles.filter(v => !v.currentDriver).map(v => (
                                            <option key={v._id} value={v.carNumber?.split('#')[0]}>{v.model}</option>
                                        ))}
                                    </datalist>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Duty Date *" type="date" value={punchInData.date} onChange={v => setPunchInData({ ...punchInData, date: v })} required />
                                    <Field label="Punch-In Time *" type="datetime-local" value={punchInData.time} onChange={v => setPunchInData({ ...punchInData, time: v })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Starting KM *" type="number" value={punchInData.km} onChange={v => setPunchInData({ ...punchInData, km: v })} required />
                                    <Field label="Pick-up Location" value={punchInData.pickUpLocation} onChange={v => setPunchInData({ ...punchInData, pickUpLocation: v })} />
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
                                                    const d = drivers.find(drv => drv._id === e.target.value);
                                                    setManualData({ ...manualData, driverId: e.target.value, dailyWage: d?.dailyWage || '' });
                                                }}
                                                style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                            >
                                                <option value="" style={{ background: '#0f172a', color: 'white' }}>Select Driver</option>
                                                {drivers.map(d => <option key={d._id} value={d._id} style={{ background: '#0f172a', color: 'white' }}>{d.name.split(' (F)')[0]}</option>)}
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

                                    <Field label="Duty Date *" type="date" value={manualData.date} onChange={v => setManualData({ ...manualData, date: v })} required />

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

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                        <Field label="Fuel Spent (₹)" type="number" value={manualData.fuelAmount} onChange={v => setManualData({ ...manualData, fuelAmount: v })} />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
                                            <Field label="Parking/Toll (₹)" type="number" value={manualData.parkingAmount} onChange={v => setManualData({ ...manualData, parkingAmount: v })} />
                                            <div>
                                                <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Paid By</label>
                                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setManualData({ ...manualData, parkingPaidBy: 'Self' })}
                                                        style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: manualData.parkingPaidBy === 'Self' ? '#fbbf24' : 'transparent', color: manualData.parkingPaidBy === 'Self' ? 'black' : 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                                                    >Self</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setManualData({ ...manualData, parkingPaidBy: 'Office' })}
                                                        style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: manualData.parkingPaidBy === 'Office' ? '#fbbf24' : 'transparent', color: manualData.parkingPaidBy === 'Office' ? 'black' : 'white', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}
                                                    >Office</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', alignItems: 'end' }}>
                                        <Field label="Duty Salary (Wage) *" type="number" value={manualData.dailyWage} onChange={v => setManualData({ ...manualData, dailyWage: v })} required />
                                        <Field label="Extra Bonus (₹)" type="number" value={manualData.otherBonus} onChange={v => setManualData({ ...manualData, otherBonus: v })} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                                        <div
                                            style={{
                                                padding: '12px',
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                border: manualData.allowanceTA ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.05)'
                                            }}
                                            onClick={() => setManualData({ ...manualData, allowanceTA: !manualData.allowanceTA })}
                                        >
                                            <input type="checkbox" checked={manualData.allowanceTA} readOnly />
                                            <div style={{ fontSize: '12px' }}>
                                                <div style={{ color: 'white', fontWeight: '700' }}>Day Bonus</div>
                                                <div style={{ color: '#fbbf24', fontWeight: '800' }}>+ ₹100</div>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                padding: '12px',
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                border: manualData.nightStayAmount ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.05)'
                                            }}
                                            onClick={() => setManualData({ ...manualData, nightStayAmount: !manualData.nightStayAmount })}
                                        >
                                            <input type="checkbox" checked={manualData.nightStayAmount} readOnly />
                                            <div style={{ fontSize: '12px' }}>
                                                <div style={{ color: 'white', fontWeight: '700' }}>Night Bonus</div>
                                                <div style={{ color: '#fbbf24', fontWeight: '800' }}>+ ₹200</div>
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
                        <Modal title={`Duty Completion: ${selectedDriver?.name}`} onClose={() => setShowPunchOutModal(false)}>
                            <form onSubmit={handlePunchOut} style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Closing KM *" type="number" value={punchOutData.km} onChange={v => setPunchOutData({ ...punchOutData, km: v })} required />
                                    <Field label="Drop Location" value={punchOutData.dropLocation} onChange={v => setPunchOutData({ ...punchOutData, dropLocation: v })} />
                                </div>
                                <Field label="Punch-Out Time *" type="datetime-local" value={punchOutData.time} onChange={v => setPunchOutData({ ...punchOutData, time: v })} required />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <Field label="Fuel Spent (₹)" type="number" value={punchOutData.fuelAmount} onChange={v => setPunchOutData({ ...punchOutData, fuelAmount: v })} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '15px' }}>
                                        <Field label="Parking/Toll (₹)" type="number" value={punchOutData.parkingAmount} onChange={v => setPunchOutData({ ...punchOutData, parkingAmount: v })} />
                                        <div>
                                            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Paid By</label>
                                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setPunchOutData({ ...punchOutData, parkingPaidBy: 'Self' })}
                                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: punchOutData.parkingPaidBy === 'Self' ? '#6366f1' : 'transparent', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                                >Self</button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPunchOutData({ ...punchOutData, parkingPaidBy: 'Office' })}
                                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: punchOutData.parkingPaidBy === 'Office' ? '#6366f1' : 'transparent', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                                >Office</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Field label="Duty Salary (Wage) *" type="number" value={punchOutData.dailyWage} onChange={v => setPunchOutData({ ...punchOutData, dailyWage: v })} required />
                                <Field label="Remarks" value={punchOutData.review} onChange={v => setPunchOutData({ ...punchOutData, review: v })} />
                                <SubmitButton disabled={submitting} text="Finish Duty" />
                            </form>
                        </Modal>
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
                                    <Field label="Authorized By *" value={advanceData.givenBy} onChange={v => setAdvanceData({ ...advanceData, givenBy: v })} required />
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '15px' }}>Classification</p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {['Office', 'Staff', 'Other'].map(type => (
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

                {/* Edit Duty Modal */}
                {
                    showEditDutyModal && (
                        <Modal title={`Edit Duty Record`} onClose={() => setShowEditDutyModal(false)}>
                            <form onSubmit={handleUpdateDuty} style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Duty Date *" type="date" value={editDutyForm.date} onChange={v => setEditDutyForm({ ...editDutyForm, date: v })} required />
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px', display: 'block' }}>Vehicle *</label>
                                        <select
                                            className="input-field"
                                            required
                                            value={editDutyForm.vehicleId}
                                            onChange={e => setEditDutyForm({ ...editDutyForm, vehicleId: e.target.value })}
                                            style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                        >
                                            <option value="" style={{ background: '#0f172a', color: 'white' }}>Select Car</option>
                                            {vehicles.map(v => <option key={v._id} value={v._id} style={{ background: '#0f172a', color: 'white' }}>{v.carNumber?.split('#')[0]}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '10px', display: 'block' }}>Driver *</label>
                                    <select
                                        className="input-field"
                                        required
                                        value={editDutyForm.driverId}
                                        onChange={e => setEditDutyForm({ ...editDutyForm, driverId: e.target.value })}
                                        style={{ width: '100%', height: '52px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                                    >
                                        <option value="" style={{ background: '#0f172a', color: 'white' }}>Select Driver</option>
                                        {drivers.map(d => <option key={d._id} value={d._id} style={{ background: '#0f172a', color: 'white' }}>{d.name.split(' (F)')[0]}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Punch-In Time" type="datetime-local" value={editDutyForm.punchInTime} onChange={v => setEditDutyForm({ ...editDutyForm, punchInTime: v })} />
                                    <Field label="Punch-Out Time" type="datetime-local" value={editDutyForm.punchOutTime} onChange={v => setEditDutyForm({ ...editDutyForm, punchOutTime: v })} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Starting KM" type="number" value={editDutyForm.startKm} onChange={v => setEditDutyForm({ ...editDutyForm, startKm: v })} />
                                    <Field label="Closing KM" type="number" value={editDutyForm.endKm} onChange={v => setEditDutyForm({ ...editDutyForm, endKm: v })} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Pick-up Location" value={editDutyForm.pickUpLocation} onChange={v => setEditDutyForm({ ...editDutyForm, pickUpLocation: v })} />
                                    <Field label="Drop Location" value={editDutyForm.dropLocation} onChange={v => setEditDutyForm({ ...editDutyForm, dropLocation: v })} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Fuel Spent (₹)" type="number" value={editDutyForm.fuelAmount} onChange={v => setEditDutyForm({ ...editDutyForm, fuelAmount: v })} />
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '15px' }}>
                                        <Field label="Parking/Toll (₹)" type="number" value={editDutyForm.parkingAmount} onChange={v => setEditDutyForm({ ...editDutyForm, parkingAmount: v })} />
                                        <div>
                                            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Paid By</label>
                                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditDutyForm({ ...editDutyForm, parkingPaidBy: 'Self' })}
                                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: editDutyForm.parkingPaidBy === 'Self' ? '#6366f1' : 'transparent', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                                >Self</button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditDutyForm({ ...editDutyForm, parkingPaidBy: 'Office' })}
                                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: editDutyForm.parkingPaidBy === 'Office' ? '#6366f1' : 'transparent', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                                >Office</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                    <Field label="Daily Wage (₹) *" type="number" value={editDutyForm.dailyWage} onChange={v => setEditDutyForm({ ...editDutyForm, dailyWage: v })} required />
                                    <Field label="Bonus Amount (₹)" type="number" value={editDutyForm.bonusAmount} onChange={v => setEditDutyForm({ ...editDutyForm, bonusAmount: v })} />
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="checkbox" checked={editDutyForm.allowanceTA > 0} onChange={e => setEditDutyForm({ ...editDutyForm, allowanceTA: e.target.checked ? 100 : 0 })} />
                                        <span style={{ fontSize: '12px', color: 'white' }}>Day Bonus</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="checkbox" checked={editDutyForm.nightStayAmount > 0} onChange={e => setEditDutyForm({ ...editDutyForm, nightStayAmount: e.target.checked ? 200 : 0 })} />
                                        <span style={{ fontSize: '12px', color: 'white' }}>Night Bonus</span>
                                    </div>
                                </div>

                                <Field label="Remarks" value={editDutyForm.remarks} onChange={v => setEditDutyForm({ ...editDutyForm, remarks: v })} />
                                <SubmitButton disabled={submitting} text="Update Duty Record" message={message} />
                            </form>
                        </Modal>
                    )
                }
            </div >
        </div >
    );
};

export default Freelancers;
