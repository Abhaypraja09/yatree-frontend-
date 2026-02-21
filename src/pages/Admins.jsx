import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Trash2, Shield, User as UserIcon, Lock, Phone, UserCheck } from 'lucide-react';
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
                name, mobile, username, password
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowModal(false);
            setName(''); setMobile(''); setUsername(''); setPassword('');
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
                        height: '50px',
                        padding: '0 25px',
                        borderRadius: '12px',
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
                            <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>Role</th>
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
                                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '11px', fontWeight: '800' }}>EXECUTIVE (LIMITED)</span>
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
                            style={{ width: '100%', maxWidth: '450px', padding: '30px', background: '#0f172a' }}
                        >
                            <h2 style={{ color: 'white', marginBottom: '20px', fontWeight: '900' }}>Create Limited Admin</h2>
                            <form onSubmit={handleCreateExecutive}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label className="input-label">Full Name</label>
                                    <input className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Rahul Singh" />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label className="input-label">Mobile Number</label>
                                    <input className="input-field" value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="10-digit number" />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label className="input-label">System Username</label>
                                    <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} required placeholder="e.g. rahul_admin" />
                                </div>
                                <div style={{ marginBottom: '25px' }}>
                                    <label className="input-label">Password</label>
                                    <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                                </div>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '10px', border: 'none' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '800' }}>Create Account</button>
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
