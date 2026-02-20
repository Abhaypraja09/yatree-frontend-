import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { Plus, Search, Trash2, User as UserIcon, X, CheckCircle, AlertCircle, LogIn, LogOut, Car, Filter, Download, Phone, Edit2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCompany } from '../context/CompanyContext';
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
            value={value || ''}
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
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
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
    const [punchOutData, setPunchOutData] = useState({ km: '', time: new Date().toISOString().slice(0, 16), fuelAmount: '0', parkingAmount: '0', review: '', dailyWage: '', dropLocation: '' });
    const [advanceData, setAdvanceData] = useState({ amount: '', remark: '', date: new Date().toISOString().slice(0, 10), advanceType: 'Office', givenBy: 'Office' });

    const getOneEightyDaysAgo = () => {
        const d = new Date();
        d.setDate(d.getDate() - 180);
        return d.toISOString().split('T')[0];
    };

    const getToday = () => new Date().toISOString().split('T')[0];

    const [fromDate, setFromDate] = useState(getOneEightyDaysAgo());
    const [toDate, setToDate] = useState(getToday());

    const [submitting, setSubmitting] = useState(false);
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });


    const fetchAttendance = useCallback(async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/reports/${selectedCompany._id}?from=${fromDate}&to=${toDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setAttendance((data.attendance || []).filter(a => a.driver?.isFreelancer));
        } catch (err) { console.error('Logistic error:', err); }
    }, [selectedCompany, fromDate, toDate]);

    const fetchAdvances = useCallback(async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/advances/${selectedCompany._id}?isFreelancer=true`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setAdvances(data || []);
        } catch (err) { console.error('Logistic error:', err); }
    }, [selectedCompany]);

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

    useEffect(() => {
        const loadAllData = () => {
            if (selectedCompany) {
                fetchFreelancers();
                fetchVehicles();
                fetchAttendance();
                fetchAdvances();
            }
        };
        loadAllData();
    }, [selectedCompany, fromDate, toDate, fetchFreelancers, fetchVehicles, fetchAttendance, fetchAdvances]);


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
            setPunchOutData({ km: '', time: now, fuelAmount: '0', parkingAmount: '0', review: '', dailyWage: '', dropLocation: '' });
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

    const onDutyDrivers = baseDrivers.filter(d => d.tripStatus === 'active');
    const availableDrivers = baseDrivers.filter(d => d.tripStatus !== 'active').filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.mobile?.includes(searchTerm) ||
        d.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate total earnings/dues for the selected filter
    const filteredAttendance = attendance.filter(a =>
        driverFilter === 'All' || a.driver?._id === driverFilter || a.driver === driverFilter
    );

    const totalSettlement = filteredAttendance.reduce((sum, a) => sum + (Number(a.dailyWage) || 0), 0);
    const totalAdvances = advances.filter(adv =>
        driverFilter === 'All' ? true : (adv.driver?._id === driverFilter || adv.driver === driverFilter)
    ).reduce((sum, adv) => sum + adv.amount, 0);
    const netPayable = totalSettlement - totalAdvances;

    const filterDriverName = driverFilter === 'All' ? 'All Freelancers' : drivers.find(d => d._id === driverFilter)?.name;

    // Extract unique locations for suggestions
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                        <div style={{ width: '4px', height: '28px', background: '#6366f1', borderRadius: '10px' }}></div>
                        <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0, color: 'white', letterSpacing: '-1.5px' }}>
                            Fleet <span style={{ color: '#6366f1' }}>Elite</span>
                        </h1>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '14px', fontWeight: '600' }}>Manage on-demand professional drivers and logistics</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        <input
                            type="text"
                            placeholder="Find personnel..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                height: '50px',
                                width: '260px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '16px',
                                padding: '0 16px 0 46px',
                                color: 'white',
                                fontSize: '14px',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ height: '50px', padding: '0 28px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '800' }}>
                        <Plus size={20} /> ADD FREELANCER
                    </button>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="premium-glass" style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px' }}>
                    {[
                        { id: 'personnel', label: 'Drivers List', icon: <UserIcon size={16} /> },
                        { id: 'logistics', label: 'Duty History', icon: <Car size={16} /> },
                        { id: 'accounts', label: 'Financials', icon: <Download size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                border: 'none',
                                background: activeTab === tab.id ? '#6366f1' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '800',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {tab.icon} {tab.label.toUpperCase()}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase' }}>Filter:</span>
                        <select
                            value={driverFilter}
                            onChange={(e) => setDriverFilter(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.08)',
                                padding: '10px 18px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: '700',
                                outline: 'none',
                                height: '44px'
                            }}
                        >
                            <option value="All">All Drivers</option>
                            {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px' }}>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    fontWeight: '700'
                                }}
                            />
                            <span style={{ color: 'rgba(255,255,255,0.1)', alignSelf: 'center' }}>|</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    fontWeight: '700'
                                }}
                            />
                        </div>
                        <button onClick={handleDownloadExcel} style={{ height: '44px', width: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Export Reports">
                            <Download size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div style={{ position: 'relative', minHeight: '600px' }}>
                {/* PERSONNEL TAB */}
                {activeTab === 'personnel' && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        {/* Personnel Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px' }}>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Total Network</p>
                                <h3 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>{drivers.length}</h3>
                            </div>
                            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '20px', padding: '20px' }}>
                                <p style={{ color: 'rgba(16,185,129,0.7)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Available</p>
                                <h3 style={{ color: '#10b981', fontSize: '28px', fontWeight: '900', margin: 0 }}>{availableDrivers.length}</h3>
                            </div>
                            <div style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.1)', borderRadius: '20px', padding: '20px' }}>
                                <p style={{ color: '#f43f5e', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 6px 0' }}>On Duty</p>
                                <h3 style={{ color: '#f43f5e', fontSize: '28px', fontWeight: '900', margin: 0 }}>{onDutyDrivers.length}</h3>
                            </div>
                            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: '20px', padding: '20px' }}>
                                <p style={{ color: '#818cf8', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Company Docs</p>
                                <h3 style={{ color: '#818cf8', fontSize: '28px', fontWeight: '900', margin: 0 }}>{drivers.filter(d => d.documents?.length > 0).length}</h3>
                            </div>
                        </div>

                        {/* Driver Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {loading ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', gridColumn: '1/-1', padding: '60px' }}>Loading professional network...</p>
                            ) : drivers.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 40px', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                                    <UserIcon size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />
                                    <h3 style={{ color: 'white', fontWeight: '800' }}>No Freelancers Recorded</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '30px' }}>Expand your fleet by adding professional on-demand drivers.</p>
                                    <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '16px' }}>REGISTER FIRST DRIVER</button>
                                </div>
                            ) : [...onDutyDrivers, ...availableDrivers].map(d => {
                                const isOnDuty = d.tripStatus === 'active';
                                const dutyCount = attendance.filter(a => a.driver?._id === d._id || a.driver === d._id).length;
                                return (
                                    <div key={d._id} className="premium-glass" style={{
                                        borderRadius: '24px',
                                        border: d._id === driverFilter
                                            ? '2px solid #6366f1'
                                            : isOnDuty
                                                ? '1px solid rgba(244,63,94,0.25)'
                                                : '1px solid rgba(255,255,255,0.07)',
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '18px',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        {/* Header Row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{
                                                width: '60px', height: '60px', borderRadius: '18px', flexShrink: 0,
                                                background: isOnDuty ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.03)',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center'
                                            }}>
                                                <UserIcon size={26} style={{ color: isOnDuty ? '#f43f5e' : 'white' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                    <h4 style={{ color: 'white', margin: 0, fontSize: '17px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name.split(' (F)')[0]}</h4>
                                                    <span style={{
                                                        fontSize: '9px', padding: '4px 10px', borderRadius: '100px', fontWeight: '900',
                                                        background: isOnDuty ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
                                                        color: isOnDuty ? '#f43f5e' : '#10b981', flexShrink: 0
                                                    }}>
                                                        {isOnDuty ? '● ON MISSION' : '○ STANDBY'}
                                                    </span>
                                                </div>
                                                <a href={`tel:${d.mobile}`} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginTop: '4px' }}>
                                                    <Phone size={12} /> {d.mobile}
                                                </a>
                                            </div>
                                        </div>

                                        {/* Stats Row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Daily Pay</p>
                                                <p style={{ color: 'white', fontWeight: '900', fontSize: '16px', margin: 0 }}>₹{d.dailyWage || 0}</p>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <div>
                                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Duties</p>
                                                    <p style={{ color: '#818cf8', fontWeight: '900', fontSize: '16px', margin: 0 }}>{dutyCount}</p>
                                                </div>
                                                <button
                                                    onClick={() => { setDriverFilter(d._id); setActiveTab('logistics'); }}
                                                    style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer' }}
                                                >HISTORY</button>
                                            </div>
                                        </div>

                                        {/* Active Vehicle */}
                                        {isOnDuty && (
                                            <div style={{ background: 'rgba(14,165,233,0.08)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(14,165,233,0.15)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Car size={16} style={{ color: '#0ea5e9' }} />
                                                <div>
                                                    <p style={{ color: 'rgba(14,165,233,0.7)', fontSize: '9px', fontWeight: '800', margin: '0 0 2px 0' }}>CURRENT VEHICLE</p>
                                                    <p style={{ color: 'white', fontWeight: '800', fontSize: '13px', margin: 0 }}>{d.assignedVehicle?.carNumber?.split('#')[0] || '---'}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                            {isOnDuty ? (
                                                <button
                                                    onClick={() => { setSelectedDriver(d); setPunchOutData({ ...punchOutData, km: '', time: new Date().toISOString().slice(0, 16), dailyWage: d.dailyWage || '' }); setShowPunchOutModal(true); }}
                                                    className="btn-primary"
                                                    style={{ flex: 1, height: '44px', background: '#f43f5e', fontSize: '11px', fontWeight: '900', borderRadius: '12px' }}
                                                >FINISH DUTY</button>
                                            ) : (
                                                <button
                                                    onClick={() => { setSelectedDriver(d); setPunchInData({ ...punchInData, time: new Date().toISOString().slice(0, 16), date: new Date().toISOString().split('T')[0] }); setShowPunchInModal(true); }}
                                                    className="btn-primary"
                                                    style={{ flex: 1, height: '44px', fontSize: '11px', fontWeight: '900', borderRadius: '12px' }}
                                                >ASSIGN DUTY</button>
                                            )}
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button onClick={() => { setSelectedDriver(d); setShowAdvanceModal(true); }} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                                                    <Download size={18} style={{ transform: 'rotate(180deg)' }} />
                                                </button>
                                                <button onClick={() => openEditModal(d)} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(d._id)} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(244,63,94,0.05)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ACCOUNTS TAB */}
                {activeTab === 'accounts' && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', alignItems: 'start' }}>
                            {/* Transaction List */}
                            <div style={{ background: 'rgba(25, 28, 35, 0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                <div style={{ padding: '20px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '800' }}>Transaction Ledger</h3>
                                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Last 50 Records</span>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <th style={{ padding: '15px 20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', textAlign: 'left', fontWeight: '800' }}>Date</th>
                                                <th style={{ padding: '15px 20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', textAlign: 'left', fontWeight: '800' }}>Recipient</th>
                                                <th style={{ padding: '15px 20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', textAlign: 'left', fontWeight: '800' }}>Amount</th>
                                                <th style={{ padding: '15px 20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', textAlign: 'right', fontWeight: '800' }}>Type</th>
                                                <th style={{ padding: '15px 20px', textAlign: 'right' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {advances.filter(adv => driverFilter === 'All' || adv.driver?._id === driverFilter).slice(0, 50).map((adv) => (
                                                <tr key={adv._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '15px 20px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{new Date(adv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                                    <td style={{ padding: '15px 20px' }}>
                                                        <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{adv.driver?.name || '---'}</span>
                                                    </td>
                                                    <td style={{ padding: '15px 20px', color: '#f43f5e', fontWeight: '800', fontSize: '14px' }}>₹{adv.amount.toLocaleString()}</td>
                                                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                                        <span style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>{adv.advanceType?.toUpperCase() || 'OFFICE'}</span>
                                                    </td>
                                                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleDeleteAdvance(adv._id)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'rgba(255,255,255,0.3)',
                                                                cursor: 'pointer',
                                                                padding: '5px'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.color = '#f43f5e'}
                                                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary Sidebar */}
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                    <p style={{ color: '#34d399', fontSize: '11px', margin: '0 0 10px 0', fontWeight: '800', textTransform: 'uppercase' }}>Net Fleet Liability</p>
                                    <h2 style={{ color: 'white', fontSize: '36px', margin: 0, fontWeight: '800', letterSpacing: '-1px' }}>
                                        <span style={{ fontSize: '20px', opacity: 0.5, marginRight: '5px' }}>₹</span>
                                        {netPayable.toLocaleString()}
                                    </h2>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '15px 0 0 0', lineHeight: '1.5' }}>
                                        Total outstanding balance for <b>{baseDrivers.length}</b> professional assets in the current view.
                                    </p>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ color: 'white', fontSize: '13px', margin: '0 0 15px 0', fontWeight: '800' }}>Quick Metrics</h4>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Gross Earnings</span>
                                            <span style={{ fontSize: '13px', color: 'white', fontWeight: '700' }}>₹{totalSettlement.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Advances Paid</span>
                                            <span style={{ fontSize: '13px', color: '#f43f5e', fontWeight: '700' }}>₹{totalAdvances.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* LOGISTICS TAB */}
                {activeTab === 'logistics' && (
                    <div style={{ animation: 'fadeIn 0.5s ease' }}>
                        {/* Summary bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                            <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                                <p style={{ color: 'rgba(16,185,129,0.7)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Total Duties</p>
                                <h3 style={{ color: 'white', fontSize: '26px', fontWeight: '900', margin: 0 }}>{filteredAttendance.length}</h3>
                            </div>
                            <div style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                                <p style={{ color: 'rgba(14,165,233,0.7)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Total KM</p>
                                <h3 style={{ color: 'white', fontSize: '26px', fontWeight: '900', margin: 0 }}>
                                    {filteredAttendance.reduce((s, a) => s + (a.totalKM || (a.punchOut?.km - a.punchIn?.km) || 0), 0).toLocaleString()}
                                </h3>
                            </div>
                            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: '16px', padding: '18px 20px' }}>
                                <p style={{ color: 'rgba(245,158,11,0.7)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Total Earned</p>
                                <h3 style={{ color: 'white', fontSize: '26px', fontWeight: '900', margin: 0 }}>
                                    ₹{filteredAttendance.reduce((s, a) => s + (Number(a.dailyWage) || 0), 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>

                        {/* Duty Cards */}
                        {filteredAttendance.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px' }}>
                                <Car size={40} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '16px' }} />
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', fontWeight: '700' }}>No duty records found for selected period</p>
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px', marginTop: '6px' }}>Try changing the date range or driver filter</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '14px' }}>
                                {filteredAttendance.map((a) => {
                                    const punchInDate = a.date || (a.punchIn?.time ? new Date(a.punchIn.time).toISOString().split('T')[0] : null);
                                    const punchInTime = a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--';
                                    const punchOutTime = a.punchOut?.time ? new Date(a.punchOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
                                    const totalKM = a.totalKM || (a.punchOut?.km && a.punchIn?.km ? a.punchOut.km - a.punchIn.km : 0);
                                    const isCompleted = a.status === 'completed' || !!a.punchOut?.time;

                                    return (
                                        <div key={a._id} style={{
                                            background: 'rgba(25,28,35,0.7)',
                                            borderRadius: '18px',
                                            border: `1px solid ${isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.2)'}`,
                                            padding: '20px 24px',
                                            display: 'flex',
                                            gap: '20px',
                                            alignItems: 'flex-start',
                                            flexWrap: 'wrap'
                                        }}>
                                            {/* Date Block */}
                                            <div style={{
                                                background: 'rgba(99,102,241,0.1)',
                                                border: '1px solid rgba(99,102,241,0.2)',
                                                borderRadius: '14px',
                                                padding: '12px 16px',
                                                textAlign: 'center',
                                                minWidth: '70px',
                                                flexShrink: 0
                                            }}>
                                                <p style={{ color: '#818cf8', fontSize: '10px', fontWeight: '900', margin: '0 0 2px 0', textTransform: 'uppercase' }}>
                                                    {punchInDate ? new Date(punchInDate).toLocaleString('default', { month: 'short' }) : '---'}
                                                </p>
                                                <p style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: '0', lineHeight: 1 }}>
                                                    {punchInDate ? new Date(punchInDate + 'T00:00:00').getDate() : '--'}
                                                </p>
                                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '700', margin: '2px 0 0 0' }}>
                                                    {punchInDate ? new Date(punchInDate + 'T00:00:00').getFullYear() : ''}
                                                </p>
                                            </div>

                                            {/* Middle Info */}
                                            <div style={{ flex: 1, minWidth: '180px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                                    <h4 style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: '800' }}>{a.driver?.name || 'Unknown Driver'}</h4>
                                                    <span style={{
                                                        fontSize: '9px', padding: '3px 10px', borderRadius: '100px', fontWeight: '900',
                                                        background: isCompleted ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                                        color: isCompleted ? '#10b981' : '#f59e0b'
                                                    }}>
                                                        {isCompleted ? '✓ COMPLETED' : '⏳ ON DUTY'}
                                                    </span>
                                                </div>

                                                {/* Route */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                                        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} />
                                                    </div>
                                                    <div>
                                                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: '0 0 8px 0' }}>{a.pickUpLocation || 'Start Point'}</p>
                                                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>{a.dropLocation || (isCompleted ? 'N/A' : 'In Progress...')}</p>
                                                    </div>
                                                </div>

                                                {/* Times */}
                                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <LogIn size={13} style={{ color: '#10b981' }} />
                                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600' }}>{punchInTime}</span>
                                                    </div>
                                                    {punchOutTime && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <LogOut size={13} style={{ color: '#f43f5e' }} />
                                                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600' }}>{punchOutTime}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Stats */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
                                                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '8px 16px', borderRadius: '12px', textAlign: 'center' }}>
                                                    <p style={{ color: 'rgba(16,185,129,0.7)', fontSize: '9px', fontWeight: '800', margin: '0 0 2px 0' }}>SALARY</p>
                                                    <p style={{ color: '#10b981', fontSize: '18px', fontWeight: '900', margin: 0 }}>₹{a.dailyWage || 0}</p>
                                                </div>
                                                <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', padding: '6px 14px', borderRadius: '10px', textAlign: 'center' }}>
                                                    <p style={{ color: 'rgba(14,165,233,0.7)', fontSize: '9px', fontWeight: '800', margin: '0 0 1px 0' }}>VEHICLE</p>
                                                    <p style={{ color: '#0ea5e9', fontSize: '13px', fontWeight: '800', margin: 0 }}>{a.vehicle?.carNumber?.split('#')[0] || 'N/A'}</p>
                                                </div>
                                                {totalKM > 0 && (
                                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700', margin: 0 }}>{totalKM} KM</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals Implementation */}
            <div>
                {/* Add Freelancer Modal */}
                {showAddModal && (
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
                )}

                {/* Edit Freelancer Modal */}
                {showEditModal && (
                    <Modal title={`Edit Freelancer: ${editingDriver?.name}`} onClose={() => setShowEditModal(false)}>
                        <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '20px' }}>
                            <Field label="Full Name *" value={editForm.name} onChange={v => setEditForm({ ...editForm, name: v })} required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Field label="Mobile Number *" value={editForm.mobile} onChange={v => setEditForm({ ...editForm, mobile: v })} required />
                                <Field label="License Number" value={editForm.licenseNumber} onChange={v => setEditForm({ ...editForm, licenseNumber: v })} />
                            </div>
                            <Field label="Daily Wage (₹)" type="number" value={editForm.dailyWage} onChange={v => setEditForm({ ...editForm, dailyWage: v })} />
                            <SubmitButton disabled={submitting} text="Update Freelancer" message={message} />
                        </form>
                    </Modal>
                )}

                {/* Punch In Modal */}
                {showPunchInModal && (
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Field label="Duty Date *" type="date" value={punchInData.date} onChange={v => setPunchInData({ ...punchInData, date: v })} required />
                                <Field label="Punch-In Time *" type="datetime-local" value={punchInData.time} onChange={v => setPunchInData({ ...punchInData, time: v })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Field label="Starting KM *" type="number" value={punchInData.km} onChange={v => setPunchInData({ ...punchInData, km: v })} required />
                                <Field label="Pick-up Location" value={punchInData.pickUpLocation} onChange={v => setPunchInData({ ...punchInData, pickUpLocation: v })} />
                            </div>
                            <SubmitButton disabled={submitting} text="Start Duty" />
                        </form>
                    </Modal>
                )}

                {/* Punch Out Modal */}
                {showPunchOutModal && (
                    <Modal title={`Duty Completion: ${selectedDriver?.name}`} onClose={() => setShowPunchOutModal(false)}>
                        <form onSubmit={handlePunchOut} style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Field label="Closing KM *" type="number" value={punchOutData.km} onChange={v => setPunchOutData({ ...punchOutData, km: v })} required />
                                <Field label="Drop Location" value={punchOutData.dropLocation} onChange={v => setPunchOutData({ ...punchOutData, dropLocation: v })} />
                            </div>
                            <Field label="Punch-Out Time *" type="datetime-local" value={punchOutData.time} onChange={v => setPunchOutData({ ...punchOutData, time: v })} required />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Field label="Fuel Spent (₹)" type="number" value={punchOutData.fuelAmount} onChange={v => setPunchOutData({ ...punchOutData, fuelAmount: v })} />
                                <Field label="Parking/Toll (₹)" type="number" value={punchOutData.parkingAmount} onChange={v => setPunchOutData({ ...punchOutData, parkingAmount: v })} />
                            </div>
                            <Field label="Duty Salary (Wage) *" type="number" value={punchOutData.dailyWage} onChange={v => setPunchOutData({ ...punchOutData, dailyWage: v })} required />
                            <Field label="Remarks" value={punchOutData.review} onChange={v => setPunchOutData({ ...punchOutData, review: v })} />
                            <SubmitButton disabled={submitting} text="Finish Duty" />
                        </form>
                    </Modal>
                )}

                {/* Advance Payment Modal */}
                {showAdvanceModal && (
                    <Modal title={`Give Advance: ${selectedDriver?.name || '---'}`} onClose={() => setShowAdvanceModal(false)}>
                        <form onSubmit={handleAddAdvance} style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <Field label="Amount (₹) *" type="number" value={advanceData.amount} onChange={v => setAdvanceData({ ...advanceData, amount: v })} required />
                                <Field label="Date *" type="date" value={advanceData.date} onChange={v => setAdvanceData({ ...advanceData, date: v })} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Type *</label>
                                    <select className="input-field" value={advanceData.advanceType} onChange={e => setAdvanceData({ ...advanceData, advanceType: e.target.value })} style={{ height: '48px', background: 'rgba(255,255,255,0.03)', color: 'white' }}>
                                        <option value="Office">Office</option>
                                        <option value="Staff">Staff</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <Field label="Given By *" value={advanceData.givenBy} onChange={v => setAdvanceData({ ...advanceData, givenBy: v })} required />
                            </div>
                            <Field label="Remark" value={advanceData.remark} onChange={v => setAdvanceData({ ...advanceData, remark: v })} />
                            <SubmitButton disabled={submitting} text="Confirm Payment" message={message} />
                        </form>
                    </Modal>
                )}

                {/* Document Modal */}
                {showDocumentModal && (
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
                )}
            </div>
        </div>
    );
};

export default Freelancers;
