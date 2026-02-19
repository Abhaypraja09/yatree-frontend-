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
            <header style={{ paddingBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '40px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ padding: '8px 16px', borderRadius: '100px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                <span style={{ fontSize: '11px', fontWeight: '900', color: '#818cf8', letterSpacing: '2px', textTransform: 'uppercase' }}>Professional Network</span>
                            </div>
                        </div>
                        <h1 className="resp-title text-gradient" style={{ margin: 0, fontWeight: '900', letterSpacing: '-2px', fontSize: 'clamp(32px, 6vw, 56px)', lineHeight: '1' }}>
                            Fleet <span style={{ color: 'var(--primary)' }}>Elite</span>
                        </h1>

                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'flex-end', flex: 1, maxWidth: '900px' }}>
                        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(16, 15, 15, 0.3)', zIndex: 1 }} />
                            <select
                                value={driverFilter}
                                onChange={(e) => setDriverFilter(e.target.value)}
                                className="input-field"
                                style={{ height: '56px', paddingLeft: '50px', fontSize: '14px', fontWeight: '700', borderRadius: '18px', background: 'rgba(6, 4, 4, 0.63)' }}
                            >
                                <option value="All">All Assets</option>
                                {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', zIndex: 1 }} />
                            <input
                                type="text"
                                placeholder="Locate specific personnel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field"
                                style={{ height: '56px', paddingLeft: '50px', fontSize: '14px', fontWeight: '700', borderRadius: '18px', background: 'rgba(255,255,255,0.03)' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', gap: '40px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', gap: '35px', flex: '1', minWidth: '320px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '6px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            {['personnel', 'accounts', 'logistics'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        background: activeTab === tab ? '#6366f1' : 'transparent',
                                        color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.4)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', paddingLeft: '5px' }}>FROM</span>
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-field" style={{ height: '42px', width: '140px', marginBottom: 0, fontSize: '13px', borderRadius: '12px' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', paddingLeft: '5px' }}>TO</span>
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-field" style={{ height: '42px', width: '140px', marginBottom: 0, fontSize: '13px', borderRadius: '12px' }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button onClick={handleDownloadExcel} style={{ height: '42px', padding: '0 20px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: '700', fontSize: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={18} /> <span>REPORTS</span>
                        </button>
                        <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ height: '42px', padding: '0 25px', fontWeight: '800', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '12px' }}>
                            <Plus size={20} /> <span>Add</span>
                        </button>
                    </div>
                </div>
            </header>


            {activeTab === 'personnel' && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>


                    {/* Settlement Detail (if filtered) */}
                    {driverFilter !== 'All' && (
                        <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '30px', borderRadius: '20px', marginBottom: '40px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '20px' }}>
                                <div>
                                    <p style={{ color: '#818cf8', fontSize: '12px', margin: '0 0 5px 0', fontWeight: '700' }}>OPERATIONAL LEDGER</p>
                                    <h2 style={{ color: 'white', fontSize: '24px', margin: 0, fontWeight: '800' }}>{filterDriverName}</h2>
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', margin: 0 }}>PAYABLE BALANCE</p>
                                        <h3 style={{ color: '#10b981', fontSize: '24px', margin: 0, fontWeight: '800' }}>₹{netPayable.toLocaleString('en-IN')}</h3>
                                    </div>
                                    <button onClick={() => { const d = drivers.find(drv => drv._id === driverFilter); if (d) { setSelectedDriver(d); setShowAdvanceModal(true); } else { alert('Select a driver'); } }} className="btn-primary" style={{ padding: '0 20px', height: '45px', borderRadius: '10px', fontSize: '13px' }}>PAY ADVANCE</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Driver Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                        {loading ? (
                            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', gridColumn: '1/-1' }}>Loading professional network...</p>
                        ) : drivers.length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', gridColumn: '1/-1' }}>No drivers registered yet.</p>
                        ) : [...onDutyDrivers, ...availableDrivers].map(d => {
                            const isOnDuty = d.tripStatus === 'active';
                            return (
                                <div key={d._id} style={{
                                    background: 'rgba(25, 28, 35, 0.6)',
                                    borderRadius: '16px',
                                    border: d._id === driverFilter ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '15px',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <UserIcon size={24} style={{ color: isOnDuty ? '#f43f5e' : 'white' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <h4 style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: '700' }}>{d.name}</h4>
                                                <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '5px', background: isOnDuty ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: isOnDuty ? '#f43f5e' : '#10b981', fontWeight: '800' }}>
                                                    {isOnDuty ? 'ENGAGED' : 'STANDBY'}
                                                </span>
                                            </div>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0', fontSize: '12px' }}>{d.mobile}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', display: 'block' }}>DAILY PAY</span>
                                            <span style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>₹{d.dailyWage || 0}</span>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px' }}>
                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', display: 'block' }}>VERIFICATION</span>
                                            <span style={{ color: 'white', fontWeight: '700', fontSize: '13px' }}>{d.licenseNumber ? (d.licenseNumber.length > 8 ? d.licenseNumber.slice(0, 8) + '...' : d.licenseNumber) : 'FLEET-ELITE'}</span>
                                        </div>
                                    </div>

                                    {isOnDuty && (
                                        <div style={{ background: 'rgba(14, 165, 233, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: '700' }}>MISSION ASSET</span>
                                            <span style={{ color: 'white', fontWeight: '800', fontSize: '12px' }}>{d.assignedVehicle?.carNumber?.split('#')[0]}</span>
                                        </div>
                                    )}

                                    {d.freelancerReview && (
                                        <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Latest Review</p>
                                            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '12px', fontStyle: 'italic', margin: 0 }}>"{d.freelancerReview}"</p>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        {isOnDuty ? (
                                            <button onClick={() => { setSelectedDriver(d); setPunchOutData({ ...punchOutData, km: '', time: new Date().toISOString().slice(0, 16), dailyWage: d.dailyWage || '' }); setShowPunchOutModal(true); }} className="btn-primary" style={{ flex: 1, height: '40px', background: '#f43f5e', fontSize: '12px', borderRadius: '8px' }}>FINISH DUTY</button>
                                        ) : (
                                            <button onClick={() => { setSelectedDriver(d); setPunchInData({ ...punchInData, time: new Date().toISOString().slice(0, 16), date: new Date().toISOString().split('T')[0] }); setShowPunchInModal(true); }} className="btn-primary" style={{ flex: 1, height: '40px', fontSize: '12px', borderRadius: '8px' }}>ASSIGN DUTY</button>
                                        )}
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button onClick={() => { setSelectedDriver(d); setShowAdvanceModal(true); }} style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Download size={16} style={{ transform: 'rotate(180deg)' }} /></button>
                                            <button onClick={() => { setSelectedDriver(d); setShowDocumentModal(true); }} style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div style={{ fontSize: '10px', fontWeight: '900' }}>DOC</div></button>
                                            <button onClick={() => openEditModal(d)} style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(d._id)} style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.05)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
                                    {(attendance.reduce((s, a) => s + (Number(a.dailyWage) || 0), 0) - advances.reduce((s, a) => s + a.amount, 0)).toLocaleString()}
                                </h2>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: '15px 0 0 0', lineHeight: '1.5' }}>
                                    Total outstanding balance for <b>{drivers.length}</b> professional assets in the current view.
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


            {activeTab === 'logistics' && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                        {filteredAttendance.map((a) => (
                            <div
                                key={a._id}
                                style={{
                                    background: 'rgba(25, 28, 35, 0.6)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '15px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: '800' }}>{a.driver?.name || 'Unidentified'}</h4>
                                        <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700' }}>
                                            {a.punchIn?.time ? new Date(a.punchIn.time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'} • {a.punchIn?.time ? new Date(a.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </p>
                                    </div>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '5px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: '800' }}>
                                        ₹{a.dailyWage || 0}
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                        <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>{a.pickUpLocation || 'HQ Depot'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} />
                                        <span style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>{a.dropLocation || 'Pending...'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        <div>
                                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', margin: '0 0 2px 0', textTransform: 'uppercase' }}>ASSET</p>
                                            <p style={{ color: '#0ea5e9', fontSize: '13px', margin: 0, fontWeight: '800' }}>{a.vehicle?.carNumber?.split('#')[0]}</p>
                                        </div>
                                        <div>
                                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', margin: '0 0 2px 0', textTransform: 'uppercase' }}>DISTANCE</p>
                                            <p style={{ color: 'white', fontSize: '13px', margin: 0, fontWeight: '800' }}>{a.totalKM || (a.punchOut?.km - a.punchIn?.km) || 0} KM</p>
                                        </div>
                                    </div>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <Car size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Modals Implementation */}
            <div>

                {/* Add Freelancer Modal */}
                {
                    showAddModal && (
                        <Modal title="Add New Freelancer" onClose={() => setShowAddModal(false)}>
                            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '20px' }}>
                                <Field label="Full Name *" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
                                <div className="freelancer-modal-grid">
                                    <Field label="Mobile Number *" value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} required />
                                    <Field label="License Number" value={formData.licenseNumber} onChange={v => setFormData({ ...formData, licenseNumber: v })} />
                                    <Field label="Daily Wage (₹)" type="number" value={formData.dailyWage} onChange={v => setFormData({ ...formData, dailyWage: v })} />
                                </div>
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
                                <div className="form-grid-2">
                                    <Field label="Mobile Number *" value={editForm.mobile} onChange={v => setEditForm({ ...editForm, mobile: v })} required />
                                    <Field label="License Number" value={editForm.licenseNumber} onChange={v => setEditForm({ ...editForm, licenseNumber: v })} />
                                    <Field label="Daily Wage (₹)" type="number" value={editForm.dailyWage} onChange={v => setEditForm({ ...editForm, dailyWage: v })} />
                                </div>
                                <SubmitButton disabled={submitting} text="Update Freelancer" message={message} />
                            </form>
                        </Modal>
                    )
                }

                {/* Punch In Modal */}
                {
                    showPunchInModal && (
                        <Modal title={`Assign Duty: ${selectedDriver?.name}`} onClose={() => setShowPunchInModal(false)}>
                            <form onSubmit={handlePunchIn} style={{ display: 'grid', gap: '30px' }}>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Select Vehicle *</label>
                                    <input
                                        type="text"
                                        list="vehicle-list"
                                        className="input-field"
                                        placeholder="Type car number to find..."
                                        required
                                        autoComplete="off"
                                        value={vehicleSearch}
                                        onChange={e => {
                                            setVehicleSearch(e.target.value);
                                            const found = vehicles.find(v => v.carNumber?.split('#')[0]?.toUpperCase() === e.target.value.toUpperCase());
                                            if (found) setPunchInData({ ...punchInData, vehicleId: found._id });
                                            else setPunchInData({ ...punchInData, vehicleId: '' });
                                        }}
                                        style={{ height: '45px' }}
                                    />
                                    <datalist id="vehicle-list">
                                        {vehicles.filter(v => !v.currentDriver).map(v => (
                                            <option key={v._id} value={v.carNumber?.split('#')[0]}>
                                                {v.model}
                                            </option>
                                        ))}
                                    </datalist>
                                </div>
                                <div className="form-grid-2">
                                    <Field label="Duty Date *" type="date" value={punchInData.date} onChange={v => setPunchInData({ ...punchInData, date: v })} required />
                                    <Field label="Punch-In Time *" type="datetime-local" value={punchInData.time} onChange={v => setPunchInData({ ...punchInData, time: v })} required />
                                </div>
                                <div className="form-grid-2">
                                    <Field label="Starting KM *" type="number" value={punchInData.km} onChange={v => setPunchInData({ ...punchInData, km: v })} required autoComplete="off" />
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Pick-up Location</label>
                                        <input
                                            type="text"
                                            list="pickup-list"
                                            className="input-field"
                                            placeholder="Type or select..."
                                            autoComplete="off"
                                            value={punchInData.pickUpLocation}
                                            onChange={e => setPunchInData({ ...punchInData, pickUpLocation: e.target.value })}
                                        />
                                        <datalist id="pickup-list">
                                            {uniquePickups.map(loc => <option key={loc} value={loc} />)}
                                        </datalist>
                                    </div>
                                </div>
                                <SubmitButton disabled={submitting} text="Start Duty" />
                            </form>
                        </Modal>
                    )
                }

                {/* Punch Out Modal */}
                {
                    showPunchOutModal && (
                        <Modal title={`Duty Completion: ${selectedDriver?.name}`} onClose={() => setShowPunchOutModal(false)}>
                            <form onSubmit={handlePunchOut} style={{ display: 'grid', gap: '20px' }}>
                                <div className="form-grid-2">
                                    <Field label="Closing KM *" type="number" value={punchOutData.km} onChange={v => setPunchOutData({ ...punchOutData, km: v })} required />
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Drop Location</label>
                                        <input
                                            type="text"
                                            list="drop-list"
                                            className="input-field"
                                            placeholder="Type or select..."
                                            value={punchOutData.dropLocation}
                                            onChange={e => setPunchOutData({ ...punchOutData, dropLocation: e.target.value })}
                                        />
                                        <datalist id="drop-list">
                                            {uniqueDrops.map(loc => <option key={loc} value={loc} />)}
                                        </datalist>
                                    </div>
                                </div>
                                <div className="form-grid-2">
                                    <Field label="Punch-Out Time *" type="datetime-local" value={punchOutData.time} onChange={v => setPunchOutData({ ...punchOutData, time: v })} required />
                                    <div style={{ opacity: 0.5 }}>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Duty Date Range</label>
                                        <p style={{ fontSize: '12px', color: 'white', margin: 0, paddingTop: '10px' }}>Started: {selectedDriver?.activeAttendance?.punchIn?.time ? new Date(selectedDriver.activeAttendance.punchIn.time).toLocaleString() : 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <Field label="Fuel Spent (₹)" type="number" value={punchOutData.fuelAmount} onChange={v => setPunchOutData({ ...punchOutData, fuelAmount: v })} />
                                    <Field label="Parking/Toll (₹)" type="number" value={punchOutData.parkingAmount} onChange={v => setPunchOutData({ ...punchOutData, parkingAmount: v })} />
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>Duty Salary (Wage) *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '10px' }}>
                                        {[300, 400, 500].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setPunchOutData({ ...punchOutData, dailyWage: val })}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: '10px',
                                                    border: '1px solid ' + (punchOutData.dailyWage === val ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
                                                    background: punchOutData.dailyWage === val ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                                    color: 'white',
                                                    fontWeight: '800'
                                                }}
                                            >
                                                ₹{val}
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            placeholder="Other"
                                            className="input-field"
                                            style={{ marginBottom: 0, padding: '10px', height: 'auto', textAlign: 'center' }}
                                            value={![300, 400, 500].includes(punchOutData.dailyWage) ? punchOutData.dailyWage : ''}
                                            onChange={(e) => setPunchOutData({ ...punchOutData, dailyWage: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Review / Remarks</label>
                                    <textarea
                                        className="input-field"
                                        style={{ height: '80px', paddingTop: '12px' }}
                                        placeholder=""
                                        value={punchOutData.review}
                                        onChange={e => setPunchOutData({ ...punchOutData, review: e.target.value })}
                                    />
                                </div>
                                <SubmitButton disabled={submitting} text="Finish Duty & Release Vehicle" />
                            </form>
                        </Modal>
                    )
                }
                {/* Advance Payment Modal */}
                {
                    showAdvanceModal && (
                        <Modal title={`Give Advance: ${selectedDriver?.name || '---'}`} onClose={() => setShowAdvanceModal(false)}>
                            <form onSubmit={handleAddAdvance} style={{ display: 'grid', gap: '20px' }}>
                                <div className="form-grid-2">
                                    <Field
                                        label="Advance Amount (₹) *"
                                        type="number"
                                        inputMode="numeric"
                                        value={advanceData.amount}
                                        onChange={v => setAdvanceData(prev => ({ ...prev, amount: v }))}
                                        required
                                        placeholder="0.00"
                                    />
                                    <Field
                                        label="Payment Date *"
                                        type="date"
                                        value={advanceData.date}
                                        onChange={v => setAdvanceData(prev => ({ ...prev, date: v }))}
                                        required
                                    />
                                </div>
                                <div className="form-grid-2">
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Advance Type *</label>
                                        <select
                                            className="input-field"
                                            value={advanceData.advanceType}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setAdvanceData(prev => ({ ...prev, advanceType: val }));
                                            }}
                                            style={{ height: '48px', appearance: 'auto', background: 'rgba(255,255,255,0.03)', color: 'white' }}
                                            required
                                        >
                                            <option value="Office" style={{ color: '#1e293b' }}>Office</option>
                                            <option value="Staff" style={{ color: '#1e293b' }}>Staff</option>
                                            <option value="Other" style={{ color: '#1e293b' }}>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Given By / Through *</label>
                                        <input
                                            type="text"
                                            list="given-by-list"
                                            className="input-field"
                                            required
                                            value={advanceData.givenBy}
                                            onChange={e => {
                                                const val = e.target.value;
                                                setAdvanceData(prev => ({ ...prev, givenBy: val }));
                                            }}
                                            placeholder="Name of person"
                                            style={{ height: '48px', color: 'white' }}
                                        />
                                        <datalist id="given-by-list">
                                            {[...new Set(advances.map(a => a.givenBy))].filter(Boolean).map(name => (
                                                <option key={name} value={name} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Payment Remark / Note</label>
                                    <textarea
                                        className="input-field"
                                        style={{ height: '80px', paddingTop: '12px', color: 'white' }}
                                        placeholder="e.g. For fuel, Cash advance, etc."
                                        value={advanceData.remark}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setAdvanceData(prev => ({ ...prev, remark: val }));
                                        }}
                                    />
                                </div>
                                <SubmitButton disabled={submitting} text="Confirm Advance Payment" message={message} />
                            </form>
                        </Modal>
                    )
                }

                {/* Document Management Modal */}
                {
                    showDocumentModal && (
                        <Modal title={`Documents: ${selectedDriver?.name}`} onClose={() => setShowDocumentModal(false)}>
                            <div style={{ display: 'grid', gap: '30px' }}>
                                {/* Existing Documents */}
                                <div>
                                    <h4 style={{ color: 'white', fontSize: '14px', marginBottom: '15px' }}>Uploaded Documents</h4>
                                    {selectedDriver?.documents?.length > 0 ? (
                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {selectedDriver.documents.map((doc, idx) => (
                                                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <p style={{ color: 'white', fontSize: '13px', fontWeight: '700', margin: 0 }}>{doc.documentType}</p>
                                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '2px 0 0 0' }}>
                                                            {doc.expiryDate ? `Expires: ${new Date(doc.expiryDate).toLocaleDateString()}` : 'No Expiry'}
                                                        </p>
                                                    </div>
                                                    <a href={doc.imageUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', fontSize: '11px', textDecoration: 'none', fontWeight: '800' }}>VIEW</a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontStyle: 'italic' }}>No documents uploaded yet.</p>
                                    )}
                                </div>

                                {/* Upload New */}
                                <form onSubmit={handleUploadDocument} style={{ display: 'grid', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '25px' }}>
                                    <h4 style={{ color: 'white', fontSize: '14px', margin: 0 }}>Upload New Document</h4>
                                    <div className="form-grid-2">
                                        <div>
                                            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Document Type</label>
                                            <select
                                                className="input-field"
                                                value={documentForm.documentType}
                                                onChange={e => setDocumentForm({ ...documentForm, documentType: e.target.value })}
                                                style={{ height: '48px', appearance: 'auto', background: 'rgba(255,255,255,0.03)', color: 'white' }}
                                            >
                                                {['Aadhaar Front', 'Aadhaar Back', 'Driving License', 'Address Proof', 'Offer Letter'].map(t => (
                                                    <option key={t} value={t} style={{ color: 'black' }}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Field
                                            label="Expiry Date (Optional)"
                                            type="date"
                                            value={documentForm.expiryDate}
                                            onChange={v => setDocumentForm({ ...documentForm, expiryDate: v })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '700', marginBottom: '8px', display: 'block' }}>File Attachment</label>
                                        <input
                                            type="file"
                                            onChange={e => setDocumentFile(e.target.files[0])}
                                            className="input-field"
                                            style={{ paddingTop: '10px', height: '48px' }}
                                            accept="image/*,.pdf"
                                        />
                                    </div>
                                    <SubmitButton disabled={submitting} text="Upload Document" message={message} />
                                </form>
                            </div>
                        </Modal>
                    )
                }
            </div>
        </div >
    );
};

export default Freelancers;
