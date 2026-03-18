import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Trash2, Shield, User as UserIcon, Lock, Phone, UserCheck, CheckSquare, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';

const Admins = () => {
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
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

    const handleCreateExecutive = async (e) => {
        e.preventDefault();
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.post('/api/admin/executives', {
                name, mobile, username, password, permissions
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowModal(false);
            setName(''); setMobile(''); setUsername(''); setPassword('');
            setPermissions({ driversService: false, buySell: false, vehiclesManagement: false, fleetOperations: false, reports: true });
            fetchExecutives();
            alert('Limited Admin (Executive) created successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating user');
        }
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

            <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>User Name</th>
                            <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>System ID</th>
                            <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>Modules Access</th>
                            <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {executives.length === 0 ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>No limited admins found.</td></tr>
                        ) : (
                            executives.map((admin) => (
                                <tr key={admin._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><UserIcon size={20} /></div>
                                            <div>
                                                <div style={{ color: 'white', fontWeight: '800' }}>{admin.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{admin.mobile}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px', color: 'white', fontWeight: '600' }}>@{admin.username}</td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {admin.permissions?.driversService && <span className="badge-drivers" style={{ fontSize: '10px', padding: '4px 8px' }}>Drivers</span>}
                                            {admin.permissions?.buySell && <span className="badge-blue" style={{ fontSize: '10px', padding: '4px 8px' }}>Buy/Sell</span>}
                                            {admin.permissions?.vehiclesManagement && <span className="badge-pending" style={{ fontSize: '10px', padding: '4px 8px' }}>Maintenance</span>}
                                            {admin.permissions?.fleetOperations && <span className="badge-completed" style={{ fontSize: '10px', padding: '4px 8px', background: '#ec489915', color: '#ec4899', border: '1px solid #ec489925' }}>Operations</span>}
                                            {!admin.permissions?.driversService && !admin.permissions?.buySell && !admin.permissions?.vehiclesManagement && !admin.permissions?.fleetOperations && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>No modules assigned</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDelete(admin._id)}
                                            style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card"
                            style={{ width: '100%', maxWidth: '500px', padding: '30px', background: '#0f172a', maxHeight: '90vh', overflowY: 'auto' }}
                        >
                            <h2 style={{ color: 'white', marginBottom: '20px', fontWeight: '900' }}>Create Limited Admin</h2>
                            <form onSubmit={handleCreateExecutive}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div>
                                        <label className="input-label">Full Name</label>
                                        <input className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Rahul Singh" />
                                    </div>
                                    <div>
                                        <label className="input-label">Mobile Number</label>
                                        <input className="input-field" value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="10-digit number" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                    <div>
                                        <label className="input-label">System Username</label>
                                        <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} required placeholder="e.g. rahul_admin" />
                                    </div>
                                    <div>
                                        <label className="input-label">Password</label>
                                        <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '800', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>Assign Modules Access</h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div 
                                            onClick={() => togglePermission('driversService')}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px', borderRadius: '10px', background: permissions.driversService ? 'rgba(56, 189, 248, 0.1)' : 'transparent', border: `1px solid ${permissions.driversService ? 'rgba(56, 189, 248, 0.2)' : 'transparent'}`, transition: 'all 0.2s' }}
                                        >
                                            {permissions.driversService ? <CheckSquare size={20} color="#38bdf8" /> : <Square size={20} color="rgba(255,255,255,0.2)" />}
                                            <div>
                                                <div style={{ color: permissions.driversService ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: '14px' }}>Drivers Services</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Drivers, Freelancers, Salaries</div>
                                            </div>
                                        </div>

                                        <div 
                                            onClick={() => togglePermission('buySell')}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px', borderRadius: '10px', background: permissions.buySell ? 'rgba(129, 140, 248, 0.1)' : 'transparent', border: `1px solid ${permissions.buySell ? 'rgba(129, 140, 248, 0.2)' : 'transparent'}`, transition: 'all 0.2s' }}
                                        >
                                            {permissions.buySell ? <CheckSquare size={20} color="#818cf8" /> : <Square size={20} color="rgba(255,255,255,0.2)" />}
                                            <div>
                                                <div style={{ color: permissions.buySell ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: '14px' }}>Buy/Sell</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Outside Cars, Event Management</div>
                                            </div>
                                        </div>

                                        <div 
                                            onClick={() => togglePermission('vehiclesManagement')}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px', borderRadius: '10px', background: permissions.vehiclesManagement ? 'rgba(245, 158, 11, 0.1)' : 'transparent', border: `1px solid ${permissions.vehiclesManagement ? 'rgba(245, 158, 11, 0.2)' : 'transparent'}`, transition: 'all 0.2s' }}
                                        >
                                            {permissions.vehiclesManagement ? <CheckSquare size={20} color="#f59e0b" /> : <Square size={20} color="rgba(255,255,255,0.2)" />}
                                            <div>
                                                <div style={{ color: permissions.vehiclesManagement ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: '14px' }}>Vehicles Maintenance</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Fuel, Parking, Logs</div>
                                            </div>
                                        </div>

                                        <div 
                                            onClick={() => togglePermission('fleetOperations')}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '10px', borderRadius: '10px', background: permissions.fleetOperations ? 'rgba(236, 72, 153, 0.1)' : 'transparent', border: `1px solid ${permissions.fleetOperations ? 'rgba(236, 72, 153, 0.2)' : 'transparent'}`, transition: 'all 0.2s' }}
                                        >
                                            {permissions.fleetOperations ? <CheckSquare size={20} color="#ec4899" /> : <Square size={20} color="rgba(255,255,255,0.2)" />}
                                            <div>
                                                <div style={{ color: permissions.fleetOperations ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: '14px' }}>Fleet Operations</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Vehicles, Border Tax, Fastag, Warranties</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer' }}>Create Account</button>
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
