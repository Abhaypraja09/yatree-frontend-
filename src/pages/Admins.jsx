import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Trash2, Shield, User as UserIcon, Lock, Phone, UserCheck, CheckSquare, Square, Settings, Activity, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

const Admins = () => {
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [editingAdmin, setEditingAdmin] = useState(null);
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [permissions, setPermissions] = useState({
        driversService: false,
        buySell: false,
        vehiclesManagement: false,
        fleetOperations: false,
        reports: true
    });

    useEffect(() => {
        fetchExecutives();
    }, []);

    const fetchExecutives = async () => {
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get('/api/admin/executives', {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setExecutives(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (editingAdmin) {
                await axios.put(`/api/admin/executives/${editingAdmin._id}`, {
                    name, mobile, username, password: password || undefined, permissions
                }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                alert('Admin updated successfully');
            } else {
                await axios.post('/api/admin/executives', {
                    name, mobile, username, password, permissions
                }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                alert('Admin created successfully');
            }
            closeModal();
            fetchExecutives();
        } catch (err) {
            alert(err.response?.data?.message || 'Error processing request');
        }
    };

    const handleEdit = (admin) => {
        setEditingAdmin(admin);
        setName(admin.name);
        setMobile(admin.mobile);
        setUsername(admin.username);
        setPassword('');
        setPermissions(admin.permissions || {
            driversService: false,
            buySell: false,
            vehiclesManagement: false,
            fleetOperations: false,
            reports: true
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAdmin(null);
        setName(''); setMobile(''); setUsername(''); setPassword('');
        setPermissions({ driversService: false, buySell: false, vehiclesManagement: false, fleetOperations: false, reports: true });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this admin access?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/executives/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchExecutives();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting user');
        }
    };

    const togglePermission = (key) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Manage Admins" description="Manage limited admin (Executive) access." />

            <header className="flex-resp" style={{
                justifyContent: 'space-between',
                padding: '30px 0',
                marginBottom: '10px'
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
                        <UserIcon size={28} color="#fbbf24" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                            <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>System Access</span>
                        </div>
                        <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', margin: 0, letterSpacing: '-1px', cursor: 'pointer' }}>
                            Admin <span className="text-gradient-yellow">Console</span>
                        </h1>
                    </div>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowModal(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        height: '52px',
                        padding: '0 25px',
                        borderRadius: '14px',
                        fontWeight: '800',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={20} /> Create New Access
                </button>
            </header>

            <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15, 23, 42, 0.3)' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>User Details</th>
                            <th style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Login Identity</th>
                            <th style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Modules Access</th>
                            <th style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'right', letterSpacing: '1px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {executives.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', opacity: 0.3 }}>
                                    <Shield size={48} />
                                    <div style={{ fontSize: '16px', fontWeight: '700' }}>No admin accounts found</div>
                                </div>
                            </td></tr>
                        ) : (
                            executives.map((admin) => (
                                <tr key={admin._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s ease' }} className="hover-row">
                                    <td style={{ padding: '18px 25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.05))', color: '#0ea5e9', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                                                <UserIcon size={20} />
                                            </div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: '900', fontSize: '15px' }}>{admin.name}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', fontWeight: '700' }}>📞 {admin.mobile}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '18px 25px' }}>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block' }}>
                                            <span style={{ color: '#fbbf24', fontWeight: '900', fontSize: '13px' }}>@{admin.username}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '18px 25px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {admin.permissions?.driversService && <span style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '9px', fontWeight: '900', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.15)', textTransform: 'uppercase' }}>Drivers</span>}
                                            {admin.permissions?.buySell && <span style={{ background: 'rgba(129, 140, 248, 0.1)', color: '#818cf8', fontSize: '9px', fontWeight: '900', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(129, 140, 248, 0.15)', textTransform: 'uppercase' }}>Buy/Sell</span>}
                                            {admin.permissions?.vehiclesManagement && <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24', fontSize: '9px', fontWeight: '900', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.15)', textTransform: 'uppercase' }}>Maintenance</span>}
                                            {admin.permissions?.fleetOperations && <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', fontSize: '9px', fontWeight: '900', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(236, 72, 153, 0.15)', textTransform: 'uppercase' }}>Operations</span>}
                                            {!admin.permissions?.driversService && !admin.permissions?.buySell && !admin.permissions?.vehiclesManagement && !admin.permissions?.fleetOperations && (
                                                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', fontStyle: 'italic' }}>No modules assigned</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleEdit(admin)}
                                                style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '10px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.1)', cursor: 'pointer', transition: '0.2s' }}
                                                className="btn-hover-scale"
                                            >
                                                <Lock size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(admin._id)}
                                                style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '10px', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.1)', cursor: 'pointer', transition: '0.2s' }}
                                                className="btn-hover-scale"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="premium-glass"
                            style={{ width: '100%', maxWidth: '580px', padding: '0', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '25px 35px', background: 'linear-gradient(to right, #1e293b, #0f172a)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '22px', margin: 0, fontWeight: '900' }}>{editingAdmin ? 'Update Admin Access' : 'Create New Access'}</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: '4px 0 0', letterSpacing: '1px' }}>Permissions & Credentials</p>
                                </div>
                                <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ padding: '35px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Full Name</label>
                                        <input className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="Admin Name" style={{ borderRadius: '12px', height: '48px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>Mobile Number</label>
                                        <input className="input-field" value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="10-digit #" style={{ borderRadius: '12px', height: '48px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>System Username</label>
                                        <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Unique ID" style={{ borderRadius: '12px', height: '48px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', color: '#fbbf24', fontWeight: '800' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px', display: 'block', letterSpacing: '0.5px' }}>{editingAdmin ? 'New Password (Optional)' : 'Access Password'}</label>
                                        <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required={!editingAdmin} placeholder="••••••••" style={{ borderRadius: '12px', height: '48px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)' }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '30px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                        <div style={{ width: '20px', height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                                        <h3 style={{ color: 'white', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Assign Modules Access</h3>
                                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        {[
                                            { id: 'driversService', label: 'Drivers Services', desc: 'Drivers, Freelancers, Salaries', icon: Users, color: '#38bdf8' },
                                            { id: 'buySell', label: 'Buy/Sell', desc: 'Outside Cars, Event MGT', icon: Shield, color: '#818cf8' },
                                            { id: 'vehiclesManagement', label: 'Vehicles Maintenance', desc: 'Maintenance, Car Logs, Vehicles, Warranty', icon: Settings, color: '#f59e0b' },
                                            { id: 'fleetOperations', label: 'Fleet Operations', desc: 'Fuel, Border Tax, Fastag, Parking', icon: Activity, color: '#ec4899' }
                                        ].map(mod => (
                                            <div 
                                                key={mod.id}
                                                onClick={() => togglePermission(mod.id)}
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'flex-start', 
                                                    gap: '12px', 
                                                    cursor: 'pointer', 
                                                    padding: '16px', 
                                                    borderRadius: '16px', 
                                                    background: permissions[mod.id] ? `${mod.color}15` : 'rgba(255,255,255,0.02)', 
                                                    border: `1px solid ${permissions[mod.id] ? `${mod.color}40` : 'rgba(255,255,255,0.05)'}`, 
                                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <div style={{ 
                                                    width: '32px', 
                                                    height: '32px', 
                                                    borderRadius: '10px', 
                                                    background: permissions[mod.id] ? mod.color : 'rgba(255,255,255,0.05)', 
                                                    color: permissions[mod.id] ? 'black' : 'rgba(255,255,255,0.3)',
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    transition: '0.3s'
                                                }}>
                                                    {permissions[mod.id] ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: permissions[mod.id] ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: '13px' }}>{mod.label}</div>
                                                    <div style={{ fontSize: '10px', color: permissions[mod.id] ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)', marginTop: '2px', fontWeight: '600' }}>{mod.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button type="button" onClick={closeModal} style={{ flex: 1, padding: '15px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', fontWeight: '800', cursor: 'pointer', height: '54px' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1.5, padding: '15px', borderRadius: '14px', border: 'none', fontWeight: '900', cursor: 'pointer', height: '54px', fontSize: '15px', boxShadow: '0 8px 20px -6px rgba(14, 165, 233, 0.5)' }}>{editingAdmin ? 'Update Account' : 'Create Access'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Admins;
