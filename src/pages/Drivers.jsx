import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Search, Filter, MoreVertical, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const Drivers = () => {
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
    const [dailyWage, setDailyWage] = useState(500);
    const [isFreelancer, setIsFreelancer] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', mobile: '', username: '', password: '', licenseNumber: '', dailyWage: 500 });


    const logoMap = {
        'YatreeDestination': '/logos/YD.Logo.webp',
        'GoGetGo': '/logos/gogetgo.webp'
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
            setName(''); setMobile(''); setUsername(''); setPassword(''); setLicenseNumber(''); setIsFreelancer(false); setDailyWage(500);
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
                dailyWage: editForm.dailyWage
            };
            if (editForm.password) {
                updateData.password = editForm.password;
            }

            await axios.put(`/api/admin/drivers/${editingDriver._id}`, updateData, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` }
            });
            setShowEditModal(false);
            setEditingDriver(null);
            setEditForm({ name: '', mobile: '', password: '', licenseNumber: '', dailyWage: 500 });
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
            dailyWage: driver.dailyWage || 500,
            password: '' // Don't show old password
        });
        setShowEditModal(true);
    };


    const [searchTerm, setSearchTerm] = useState('');

    const filteredDrivers = drivers.filter(d =>
        !d.isFreelancer && (
            d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.mobile?.includes(searchTerm) ||
            d.username?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Manage Drivers" description="View and manage all registered drivers in your fleet management system." />
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '30px 0',
                gap: '20px',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        background: 'white',
                        borderRadius: '12px',
                        padding: '6px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}>
                        <img src={logoMap[selectedCompany?.name]} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Fleet Drivers</h1>
                        <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '13px' }}>Managing personnel for {selectedCompany?.name || '...'}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '15px', flex: '1', justifyContent: 'flex-end', flexWrap: 'wrap', minWidth: '300px' }}>
                    <div style={{ position: 'relative', flex: '1', maxWidth: '350px', minWidth: '200px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search name or mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '40px', marginBottom: 0, height: '48px', fontSize: '14px' }}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '48px', padding: '0 25px', borderRadius: '12px' }}>
                        <Plus size={20} /> <span className="mobile-hide">Register Driver</span><span className="mobile-only">Add</span>
                    </button>
                </div>
            </header>

            <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '700px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Personnel</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Contact</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>License No</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Account Status</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDrivers.map(driver => (
                            <tr key={driver._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover-row">
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ fontWeight: '700', fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {driver.name}
                                        {driver.isFreelancer && (
                                            <span style={{ fontSize: '9px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(99, 102, 241, 0.2)', fontWeight: '800', textTransform: 'uppercase' }}>Freelancer</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', opacity: 0.8 }}>@{driver.username || 'no-username'}</div>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{driver.mobile}</div>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ color: 'white', fontSize: '13px', opacity: 0.8 }}>{driver.licenseNumber || 'Not Provided'}</div>
                                </td>

                                <td style={{ padding: '18px 25px' }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        background: driver.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                        color: driver.status === 'active' ? '#10b981' : '#f43f5e'
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: driver.status === 'active' ? '#10b981' : '#f43f5e' }}></span>
                                        {driver.status}
                                    </span>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => openEditModal(driver)}
                                            style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.1)' }}
                                            title="Edit Info"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(driver._id, driver.status)}
                                            style={{
                                                background: driver.status === 'active' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: driver.status === 'active' ? '#f59e0b' : '#10b981',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                border: `1px solid ${driver.status === 'active' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`,
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {driver.status === 'active' ? 'Block' : 'Unblock'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(driver._id)}
                                            style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '8px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.1)' }}
                                            title="Remove Driver"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredDrivers.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px' }}>
                                        <Search size={24} style={{ opacity: 0.3 }} />
                                    </div>
                                    <p style={{ fontSize: '14px', margin: 0 }}>No drivers matching your search.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Driver Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card modal-content" style={{ padding: '25px', width: '100%', maxWidth: '550px', maxHeight: '95vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '800' }}>Add New Driver</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>
                        <form onSubmit={handleCreateDriver}>
                            <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Full Name *</label>
                                    <input className="input-field" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Mobile Number *</label>
                                    <input className="input-field" placeholder="10 Digit Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Login Username</label>
                                    <input className="input-field" placeholder="unique_username (optional)" value={username} onChange={(e) => setUsername(e.target.value)} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Login Password *</label>
                                <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Driving License No</label>
                                <input className="input-field" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="DL-XXX-XXXX" />
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Daily Salary (Rate)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                    {[300, 400, 500].map(val => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setDailyWage(val)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '10px',
                                                border: '1px solid ' + (dailyWage === val ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
                                                background: dailyWage === val ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                                color: 'white',
                                                fontWeight: '800'
                                            }}
                                        >
                                            ₹{val}
                                        </button>
                                    ))}
                                    <input
                                        type="number"
                                        placeholder="Custom"
                                        className="input-field"
                                        style={{ marginBottom: 0, padding: '10px', height: 'auto', textAlign: 'center' }}
                                        value={![300, 400, 500].includes(dailyWage) ? dailyWage : ''}
                                        onChange={(e) => setDailyWage(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" className="glass-card" style={{ flex: 1, padding: '14px', color: 'white', fontWeight: '700' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px' }}>Register Driver</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Edit Driver Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card modal-content" style={{ padding: '25px', width: '100%', maxWidth: '550px', maxHeight: '95vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: 0 }}>Edit Driver</h2>
                                    <p style={{ color: 'var(--primary)', fontSize: '13px', margin: 0, fontWeight: '600' }}>{editingDriver?.name}</p>
                                </div>
                                <button onClick={() => { setShowEditModal(false); setEditingDriver(null); }} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>
                            <form onSubmit={handleUpdateDriver}>
                                <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Full Name *</label>
                                        <input className="input-field" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Mobile Number *</label>
                                        <input className="input-field" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Login Username</label>
                                        <input className="input-field" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>New Password</label>
                                    <input type="password" className="input-field" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep current" />
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>License Number</label>
                                    <input className="input-field" value={editForm.licenseNumber} onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })} placeholder="DL-XXX-XXXX" />
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Daily Salary (Rate)</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                        {[300, 400, 500].map(val => (
                                            <button
                                                key={val}
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, dailyWage: val })}
                                                style={{
                                                    padding: '10px',
                                                    borderRadius: '10px',
                                                    border: '1px solid ' + (editForm.dailyWage === val ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
                                                    background: editForm.dailyWage === val ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                                                    color: 'white',
                                                    fontWeight: '800'
                                                }}
                                            >
                                                ₹{val}
                                            </button>
                                        ))}
                                        <input
                                            type="number"
                                            placeholder="Custom"
                                            className="input-field"
                                            style={{ marginBottom: 0, padding: '10px', height: 'auto', textAlign: 'center' }}
                                            value={![300, 400, 500].includes(editForm.dailyWage) ? editForm.dailyWage : ''}
                                            onChange={(e) => setEditForm({ ...editForm, dailyWage: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button type="button" className="glass-card" style={{ flex: 1, padding: '14px', color: 'white', fontWeight: '700' }} onClick={() => { setShowEditModal(false); setEditingDriver(null); }}>Discard</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px' }}>Save Changes</button>
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
