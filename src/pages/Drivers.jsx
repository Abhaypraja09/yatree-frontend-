import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Plus, Search, Filter, MoreVertical, Trash2, Edit2, ShieldAlert, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const Drivers = () => {
    const navigate = useNavigate();
    const { selectedCompany } = useCompany();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [dailyWage, setDailyWage] = useState('');
    const [isFreelancer, setIsFreelancer] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', mobile: '', username: '', password: '', licenseNumber: '', dailyWage: '' });
    const [driverTypeFilter, setDriverTypeFilter] = useState('Regular');

    // Manual Duty State
    const [showManualModal, setShowManualModal] = useState(false);
    const [selectedDriverForManual, setSelectedDriverForManual] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [manualDutyForm, setManualDutyForm] = useState({
        date: new Date().toISOString().split('T')[0],
        vehicleId: '',
        punchInKM: '',
        punchOutKM: '',
        punchInTime: '',
        punchOutTime: '',
        fuelAmount: '',
        parkingAmount: '',
        pickUpLocation: '',
        dropLocation: '',
        dailyWage: '',
        review: ''
    });

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (showManualModal) fetchVehicles();
    }, [showManualModal]);

    const handleManualDutySubmission = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/manual-duty', {
                ...manualDutyForm,
                driverId: selectedDriverForManual._id,
                companyId: selectedCompany._id
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowManualModal(false);
            setManualDutyForm({
                date: new Date().toISOString().split('T')[0],
                vehicleId: '',
                punchInKM: '',
                punchOutKM: '',
                punchInTime: '',
                punchOutTime: '',
                fuelAmount: '',
                parkingAmount: '',
                pickUpLocation: '',
                dropLocation: '',
                dailyWage: '',
                review: ''
            });
            alert('Manual duty entry added successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Error adding manual duty');
        } finally {
            setSubmitting(false);
        }
    };

    const openManualDutyModal = (driver) => {
        setSelectedDriverForManual(driver);
        setManualDutyForm(prev => ({
            ...prev,
            dailyWage: driver.dailyWage || '',
            date: new Date().toISOString().split('T')[0]
        }));
        setShowManualModal(true);
    };



    useEffect(() => {
        if (selectedCompany) {
            fetchDrivers();
        }
    }, [selectedCompany]);

    const fetchDrivers = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo) return;
            const { data } = await axios.get(`/api/admin/drivers/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setDrivers(data.drivers || []);
            console.log('Fetched Drivers:', data.drivers);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleCreateDriver = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/drivers', {
                name, mobile, username, password, licenseNumber, companyId: selectedCompany._id, isFreelancer, dailyWage
            }, {
                headers: {
                    Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}`
                }
            });
            setShowModal(false);
            setName(''); setMobile(''); setUsername(''); setPassword(''); setLicenseNumber(''); setIsFreelancer(false); setDailyWage('');
            fetchDrivers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating driver');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        try {
            await axios.patch(`/api/admin/drivers/${id}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` }
            });
            fetchDrivers();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this driver? All assignments will be cleared.')) return;
        try {
            await axios.delete(`/api/admin/drivers/${id}`, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` }
            });
            fetchDrivers();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting driver');
        }
    };

    const handleUpdateDriver = async (e) => {
        e.preventDefault();
        try {
            const updateData = {
                name: editForm.name,
                mobile: editForm.mobile,
                username: editForm.username,
                licenseNumber: editForm.licenseNumber,
                dailyWage: editForm.dailyWage,
                isFreelancer: editForm.isFreelancer
            };
            if (editForm.password) {
                updateData.password = editForm.password;
            }

            await axios.put(`/api/admin/drivers/${editingDriver._id}`, updateData, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` }
            });
            setShowEditModal(false);
            setEditingDriver(null);
            setEditForm({ name: '', mobile: '', username: '', password: '', licenseNumber: '', dailyWage: '', isFreelancer: false });
            fetchDrivers();
            alert('Driver updated successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating driver');
        }
    };

    const openEditModal = (driver) => {
        setEditingDriver(driver);
        setEditForm({
            name: driver.name,
            mobile: driver.mobile,
            username: driver.username || '',
            licenseNumber: driver.licenseNumber || '',
            dailyWage: driver.dailyWage || '',
            isFreelancer: driver.isFreelancer || false,
            password: ''
        });
        setShowEditModal(true);
    };


    const [searchTerm, setSearchTerm] = useState('');

    const filteredDrivers = drivers.filter(d => {
        const matchesSearch = d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.mobile?.includes(searchTerm) ||
            d.username?.toLowerCase().includes(searchTerm.toLowerCase());

        if (driverTypeFilter === 'All') return matchesSearch;
        if (driverTypeFilter === 'Freelancer') return d.isFreelancer && matchesSearch;
        return !d.isFreelancer && matchesSearch;
    });

    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.status === 'active').length;
    const blockedDrivers = drivers.filter(d => d.status === 'blocked').length;
    const freelancersCount = drivers.filter(d => d.isFreelancer).length;

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Manage Drivers" description="View and manage all registered drivers in your fleet management system." />

            {/* Header Section */}
            <header className="flex-resp" style={{
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
                padding: '30px 0',
                marginBottom: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: 'clamp(40px, 10vw, 50px)',
                        height: 'clamp(40px, 10vw, 50px)',
                        background: 'linear-gradient(135deg, white, #f8fafc)',
                        borderRadius: '16px',
                        padding: '8px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <img src="/logos/logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }}></div>
                            <span style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Personnel Hub</span>
                        </div>
                        <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
                            Fleet <span className="text-gradient-blue">Drivers</span>
                        </h1>
                    </div>
                </div>
                <div className="mobile-search-row" style={{ display: 'flex', gap: '10px', flex: '1', justifyContent: 'flex-end', flexWrap: 'wrap' }}>

                    <div style={{ position: 'relative', flex: '1', minWidth: '150px', maxWidth: '180px' }}>
                        <Filter size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                        <select
                            value={driverTypeFilter}
                            onChange={(e) => setDriverTypeFilter(e.target.value)}
                            className="input-field"
                            style={{
                                height: '52px',
                                paddingLeft: '44px',
                                marginBottom: 0,
                                fontSize: '13px',
                                appearance: 'auto',
                                background: 'rgba(255,255,255,0.03)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="Regular" style={{ color: '#1e293b' }}>Regular Only</option>
                            <option value="Freelancer" style={{ color: '#1e293b' }}>Freelancers Only</option>
                            <option value="All" style={{ color: '#1e293b' }}>All Types</option>
                        </select>
                    </div>
                    <div className="glass-card" style={{ padding: '0', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '380px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', flex: '1 1 auto' }}>
                        <Search size={18} style={{ margin: '0 15px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search drivers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                height: '52px',
                                width: '100%',
                                outline: 'none',
                                fontSize: '14px',
                                fontWeight: '500',
                                minWidth: 0
                            }}
                        />
                    </div>
                    <button
                        className="glass-card-hover-effect btn-primary"
                        onClick={() => setShowModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            height: '52px',
                            padding: '0 25px',
                            borderRadius: '14px',
                            fontWeight: '800',
                            fontSize: '14px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                        }}
                    >
                        <Plus size={20} /> <span className="hide-mobile">Register</span><span className="show-mobile">Add</span>
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: 'clamp(15px, 2.5vw, 20px)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', cursor: 'default' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><UserIcon size={22} /></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Total Workforce</p>
                        <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: '4px 0 0' }}>{totalDrivers}</h3>
                    </div>
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: 'clamp(15px, 2.5vw, 20px)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', cursor: 'default' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }}></div></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Active Logins</p>
                        <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: '4px 0 0' }}>{activeDrivers}</h3>
                    </div>
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: 'clamp(15px, 2.5vw, 20px)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', cursor: 'default' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><ShieldAlert size={22} /></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Blocked / Inactive</p>
                        <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: '4px 0 0' }}>{blockedDrivers}</h3>
                    </div>
                </motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card glass-card-hover-effect" style={{ padding: 'clamp(15px, 2.5vw, 20px)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }} onClick={() => navigate('/admin/freelancers')}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><div style={{ fontSize: '18px', fontWeight: '900' }}>F</div></div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Freelancers</p>
                        <h3 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: '4px 0 0' }}>{freelancersCount}</h3>
                    </div>
                </motion.div>
            </div>

            {/* Desktop Table */}
            <div className="glass-card hide-mobile" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', padding: '0 10px', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left' }}>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Personnel Profile</th>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact Info</th>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Credentials</th>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                            <th style={{ padding: '15px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AnimatePresence>
                            {filteredDrivers.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '80px 0' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}>
                                        <Search size={32} style={{ opacity: 0.3, color: 'white' }} />
                                    </div>
                                    <h3 style={{ color: 'white', fontWeight: '800', margin: '0 0 5px' }}>No Personnel Found</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Try adjusting your search criteria or add a new driver.</p>
                                </td></tr>
                            ) : (
                                filteredDrivers.map((driver, idx) => (
                                    <motion.tr
                                        key={driver._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="glass-card-hover-effect"
                                        style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px' }}
                                    >
                                        <td style={{ padding: '20px 25px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '10px',
                                                    background: driver.isFreelancer ? 'linear-gradient(135deg, #8b5cf6, #d8b4fe)' : 'linear-gradient(135deg, #3b82f6, #93c5fd)',
                                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                    color: 'white', fontWeight: '800', fontSize: '16px'
                                                }}>
                                                    {driver.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {driver.name}
                                                        {driver.isFreelancer && (
                                                            <span style={{ fontSize: '9px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.3)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Freelancer</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: '500' }}>@{driver.username || 'no-username'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{driver.mobile}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mobile Number</div>
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <div style={{ color: 'white', fontSize: '13px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>{driver.licenseNumber || 'NOT PROVIDED'}</div>
                                        </td>
                                        <td style={{ padding: '20px 25px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 14px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                background: driver.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                                color: driver.status === 'active' ? '#10b981' : '#f43f5e',
                                                border: driver.status === 'active' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)'
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 5px currentColor' }}></span>
                                                {driver.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 25px', textAlign: 'right', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => openEditModal(driver)}
                                                    className="glass-card-hover-effect"
                                                    style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                                    title="Edit Profile"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(driver._id, driver.status)}
                                                    className="glass-card-hover-effect"
                                                    style={{
                                                        background: driver.status === 'active' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                        color: driver.status === 'active' ? '#f59e0b' : '#10b981',
                                                        width: '36px', height: '36px',
                                                        borderRadius: '8px',
                                                        border: `1px solid ${driver.status === 'active' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                                        display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
                                                    }}
                                                    title={driver.status === 'active' ? 'Block Access' : 'Activate Access'}
                                                >
                                                    <ShieldAlert size={16} />
                                                </button>
                                                <button
                                                    onClick={() => openManualDutyModal(driver)}
                                                    className="glass-card-hover-effect"
                                                    style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                                    title="Insert Past Duty"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(driver._id)}
                                                    className="glass-card-hover-effect"
                                                    style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="show-mobile">
                <AnimatePresence>
                    {filteredDrivers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px' }}>
                                <Search size={24} style={{ opacity: 0.3, color: 'white' }} />
                            </div>
                            <h3 style={{ color: 'white', fontWeight: '800', margin: '0 0 5px', fontSize: '16px' }}>No Drivers Found</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Try adjusting your search criteria.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {filteredDrivers.map((driver, idx) => (
                                <motion.div
                                    key={driver._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card"
                                    style={{ padding: '15px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '10px',
                                                background: driver.isFreelancer ? 'linear-gradient(135deg, #8b5cf6, #d8b4fe)' : 'linear-gradient(135deg, #3b82f6, #93c5fd)',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                color: 'white', fontWeight: '800', fontSize: '16px'
                                            }}>
                                                {driver.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: '800', fontSize: '15px' }}>{driver.name}</div>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>@{driver.username || 'no-username'}</div>
                                            </div>
                                        </div>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '10px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            background: driver.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                            color: driver.status === 'active' ? '#10b981' : '#f43f5e',
                                            border: driver.status === 'active' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)'
                                        }}>
                                            {driver.status}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>MOBILE</div>
                                            <div style={{ color: 'white', fontWeight: '600', fontSize: '13px' }}>{driver.mobile}</div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>LICENSE</div>
                                            <div style={{ color: 'white', fontWeight: '600', fontSize: '13px', fontFamily: 'monospace' }}>{driver.licenseNumber || 'N/A'}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => openEditModal(driver)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(driver._id, driver.status)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: driver.status === 'active' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: driver.status === 'active' ? '#f59e0b' : '#10b981', border: `1px solid ${driver.status === 'active' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            {driver.status === 'active' ? 'Block' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => openManualDutyModal(driver)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.2)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Duty +
                                        </button>
                                        <button
                                            onClick={() => handleDelete(driver._id)}
                                            style={{ width: '40px', padding: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Driver Modal */}
            <AnimatePresence>

                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="glass-card"
                            style={{ padding: '0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a' }}
                        >
                            <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0 }}>Onboard New Driver</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0' }}>Enter personnel details to generate profile credential.</p>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', border: 'none' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>

                            <form onSubmit={handleCreateDriver} style={{ padding: '25px' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <p style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Identity & Access</p>
                                    <div className="form-grid-2" style={{ marginBottom: '15px' }}>
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>Full Name *</label>
                                            <input className="input-field" placeholder="e.g. Rahul Kumar" value={name} onChange={(e) => setName(e.target.value)} required style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>Mobile Number *</label>
                                            <input className="input-field" placeholder="10-digit number" value={mobile} onChange={(e) => setMobile(e.target.value)} required style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                    </div>
                                    <div className="form-grid-2">
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>System Username</label>
                                            <input className="input-field" placeholder="unique_username" value={username} onChange={(e) => setUsername(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>Password *</label>
                                            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required={!isFreelancer} style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '25px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Contract & Details</p>

                                    <div className="form-grid-2" style={{ marginBottom: '15px' }}>
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>Daily Wage (Salary)</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>₹</span>
                                                <input type="number" className="input-field" value={dailyWage} onChange={(e) => setDailyWage(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', paddingLeft: '28px' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%', paddingTop: '25px' }}>
                                            <input type="checkbox" id="freelancerCheck" checked={isFreelancer} onChange={(e) => setIsFreelancer(e.target.checked)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                            <label htmlFor="freelancerCheck" style={{ color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Set as Freelancer</label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="input-label" style={{ marginBottom: '6px' }}>Driving License</label>
                                        <input className="input-field" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="DL No. (Optional)" style={{ background: 'rgba(0,0,0,0.2)' }} />
                                    </div>

                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button
                                        type="button"
                                        className="glass-card-hover-effect"
                                        style={{ flex: '1', padding: '14px', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '700', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="glass-card-hover-effect"
                                        style={{
                                            flex: '2',
                                            padding: '14px',
                                            background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                            color: 'white',
                                            fontWeight: '800',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Create Profile
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Driver Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="glass-card"
                            style={{ padding: '0', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a' }}
                        >
                            <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0 }}>Update Profile</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0' }}>Editing details for <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{editingDriver?.name}</span></p>
                                </div>
                                <button onClick={() => { setShowEditModal(false); setEditingDriver(null); }} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', border: 'none' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>
                            <form onSubmit={handleUpdateDriver} style={{ padding: '25px' }}>
                                <div style={{ marginBottom: '20px' }}>
                                    <p style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Identity & Access</p>
                                    <div className="form-grid-2" style={{ marginBottom: '15px' }}>
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>Full Name *</label>
                                            <input className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>Mobile Number *</label>
                                            <input className="input-field" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} required style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                    </div>
                                    <div className="form-grid-2">
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>Username</label>
                                            <input className="input-field" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>New Password</label>
                                            <input type="password" className="input-field" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep" style={{ background: 'rgba(0,0,0,0.2)' }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '25px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Contract & Details</p>

                                    <div className="form-grid-2" style={{ marginBottom: '15px' }}>
                                        <div>
                                            <label className="input-label" style={{ marginBottom: '6px' }}>Daily Wage (Salary)</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>₹</span>
                                                <input type="number" className="input-field" value={editForm.dailyWage} onChange={(e) => setEditForm({ ...editForm, dailyWage: e.target.value })} style={{ background: 'rgba(0,0,0,0.2)', paddingLeft: '28px' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%', paddingTop: '25px' }}>
                                            <input type="checkbox" id="editFreelancerCheck" checked={editForm.isFreelancer} onChange={(e) => setEditForm({ ...editForm, isFreelancer: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                                            <label htmlFor="editFreelancerCheck" style={{ color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Freelancer Profile</label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="input-label" style={{ marginBottom: '6px' }}>Driving License</label>
                                        <input className="input-field" value={editForm.licenseNumber} onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })} placeholder="DL No. (Optional)" style={{ background: 'rgba(0,0,0,0.2)' }} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button
                                        type="button"
                                        className="glass-card-hover-effect"
                                        style={{ flex: '1', padding: '14px', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '700', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
                                        onClick={() => { setShowEditModal(false); setEditingDriver(null); }}
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        className="glass-card-hover-effect"
                                        style={{
                                            flex: '2',
                                            padding: '14px',
                                            background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                            color: 'white',
                                            fontWeight: '800',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Manual Duty Entry Modal */}
            <AnimatePresence>
                {showManualModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="glass-card"
                            style={{ padding: '0', width: '100%', maxWidth: '600px', maxHeight: '95vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a' }}
                        >
                            <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, rgba(139, 92, 246, 0.05), transparent)' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0 }}>Insert Past Duty Record</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0' }}>Manually adding duty for <span style={{ color: '#a78bfa', fontWeight: '700' }}>{selectedDriverForManual?.name}</span></p>
                                </div>
                                <button onClick={() => setShowManualModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', border: 'none' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>

                            <form onSubmit={handleManualDutySubmission} style={{ padding: '25px' }}>
                                <div className="form-grid-2" style={{ marginBottom: '20px' }}>
                                    <div>
                                        <label className="input-label">Duty Date *</label>
                                        <input type="date" className="input-field" value={manualDutyForm.date} onChange={(e) => setManualDutyForm({ ...manualDutyForm, date: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="input-label">Vehicle *</label>
                                        <select className="input-field" value={manualDutyForm.vehicleId} onChange={(e) => setManualDutyForm({ ...manualDutyForm, vehicleId: e.target.value })} required style={{ appearance: 'auto' }}>
                                            <option value="">Select Vehicle</option>
                                            {vehicles.map(v => (
                                                <option key={v._id} value={v._id} style={{ color: 'black' }}>{v.carNumber} ({v.model})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: '#a78bfa', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Kilometer & Time Tracking</p>
                                    <div className="form-grid-2" style={{ marginBottom: '15px' }}>
                                        <div>
                                            <label className="input-label">Punch-In KM</label>
                                            <input type="number" className="input-field" value={manualDutyForm.punchInKM} onChange={(e) => setManualDutyForm({ ...manualDutyForm, punchInKM: e.target.value })} placeholder="Opening KM" />
                                        </div>
                                        <div>
                                            <label className="input-label">Punch-Out KM</label>
                                            <input type="number" className="input-field" value={manualDutyForm.punchOutKM} onChange={(e) => setManualDutyForm({ ...manualDutyForm, punchOutKM: e.target.value })} placeholder="Closing KM" />
                                        </div>
                                    </div>
                                    <div className="form-grid-2">
                                        <div>
                                            <label className="input-label">Punch-In Time</label>
                                            <input type="datetime-local" className="input-field" value={manualDutyForm.punchInTime} onChange={(e) => setManualDutyForm({ ...manualDutyForm, punchInTime: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="input-label">Punch-Out Time</label>
                                            <input type="datetime-local" className="input-field" value={manualDutyForm.punchOutTime} onChange={(e) => setManualDutyForm({ ...manualDutyForm, punchOutTime: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ color: '#10b981', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Expenses & Financials</p>
                                    <div className="form-grid-2" style={{ marginBottom: '15px' }}>
                                        <div>
                                            <label className="input-label">Fuel Amount (₹)</label>
                                            <input type="number" className="input-field" value={manualDutyForm.fuelAmount} onChange={(e) => setManualDutyForm({ ...manualDutyForm, fuelAmount: e.target.value })} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="input-label">Parking Amount (₹)</label>
                                            <input type="number" className="input-field" value={manualDutyForm.parkingAmount} onChange={(e) => setManualDutyForm({ ...manualDutyForm, parkingAmount: e.target.value })} placeholder="0" />
                                        </div>
                                    </div>
                                    <div className="form-grid-2">
                                        <div>
                                            <label className="input-label">Daily Wage (Salary)</label>
                                            <input type="number" className="input-field" value={manualDutyForm.dailyWage} onChange={(e) => setManualDutyForm({ ...manualDutyForm, dailyWage: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="input-label">Duty Type / Remark</label>
                                            <input type="text" className="input-field" value={manualDutyForm.review} onChange={(e) => setManualDutyForm({ ...manualDutyForm, review: e.target.value })} placeholder="e.g. Local, Outstation" />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid-2" style={{ marginBottom: '25px' }}>
                                    <div>
                                        <label className="input-label">Pick-up Location</label>
                                        <input type="text" className="input-field" value={manualDutyForm.pickUpLocation} onChange={(e) => setManualDutyForm({ ...manualDutyForm, pickUpLocation: e.target.value })} placeholder="e.g. Office" />
                                    </div>
                                    <div>
                                        <label className="input-label">Drop Location</label>
                                        <input type="text" className="input-field" value={manualDutyForm.dropLocation} onChange={(e) => setManualDutyForm({ ...manualDutyForm, dropLocation: e.target.value })} placeholder="e.g. Office" />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button type="button" className="glass-card-hover-effect" style={{ flex: '1', padding: '14px', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '700', borderRadius: '12px', border: 'none', cursor: 'pointer' }} onClick={() => setShowManualModal(false)}>Cancel</button>
                                    <button type="submit" disabled={submitting} className="glass-card-hover-effect" style={{ flex: '2', padding: '14px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', fontWeight: '800', borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>{submitting ? 'Saving Record...' : 'Save Duty Record'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Drivers;
