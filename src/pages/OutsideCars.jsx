import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Search, Trash2, Car, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const OutsideCars = () => {
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        carNumber: '',
        model: '', // Car Name
        driverName: '', // Replaces manufacturer
        dutyType: '', // New field
        ownerName: '',
        dutyAmount: ''
    });

    useEffect(() => {
        if (selectedCompany) {
            fetchOutsideVehicles();
        }
    }, [selectedCompany]);

    const fetchOutsideVehicles = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles?.filter(v => v.isOutsideCar) || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this outside car?')) return;
        try {
            await axios.delete(`/api/admin/vehicles/${id}`, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` }
            });
            fetchOutsideVehicles();
        } catch (err) { alert('Error deleting'); }
    };



    // Correct handleAdd with FormData
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const data = new FormData();
            data.append('carNumber', formData.carNumber);
            data.append('model', formData.model);
            data.append('driverName', formData.driverName);
            data.append('dutyType', formData.dutyType);
            data.append('ownerName', formData.ownerName);
            data.append('dutyAmount', formData.dutyAmount);
            data.append('companyId', selectedCompany._id);
            data.append('isOutsideCar', 'true');
            data.append('permitType', 'Contract'); // Default
            data.append('carType', 'Other'); // Default

            await axios.post('/api/admin/vehicles', data, {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setShowModal(false);
            setFormData({ carNumber: '', model: '', driverName: '', dutyType: '', ownerName: '', dutyAmount: '' });
            fetchOutsideVehicles();
        } catch (err) {
            alert(err.response?.data?.message || 'Error adding vehicle');
        }
    };

    const filtered = vehicles.filter(v =>
        v.carNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Outside Fleet Management" description="Manage external vehicles and freelancer drivers for specific duties and trips." />
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 0',
                gap: '15px',
                flexWrap: 'wrap'
            }}>
                <div style={{ minWidth: '200px' }}>
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Outside Fleet</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>External vehicle management</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flex: '1', justifyContent: 'flex-end', flexWrap: 'wrap', width: '100%', minWidth: '300px' }}>
                    <div style={{ position: 'relative', flex: '1', maxWidth: '300px', minWidth: '180px' }}>
                        <input
                            type="text"
                            placeholder="Quick find..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '40px', marginBottom: 0, height: '42px', fontSize: '14px' }}
                        />
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 16px', fontSize: '14px' }}
                    >
                        <Plus size={18} /> <span>Add Car</span>
                    </button>
                </div>
            </header>

            <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '850px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Vehicle No</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Model / Type</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Driver Details</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Assignment</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Proprietor</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Net Pay</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '60px' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                    <div className="spinner"></div>
                                    <span>Syncing external fleet...</span>
                                </div>
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '80px', textAlign: 'center' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px' }}>
                                        <Car size={30} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                                    </div>
                                    <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '18px' }}>No outside cars listed</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '350px', margin: '0 auto' }}>External vehicles managed for specific duties will appear here once added.</p>
                                </td>
                            </tr>
                        ) : filtered.map(v => (
                            <tr key={v._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="hover-row">
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ fontWeight: '800', fontSize: '15px', color: 'white' }}>{v.carNumber}</div>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{v.model}</div>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{v.driverName || 'N/A'}</div>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <span style={{ fontSize: '11px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
                                        {v.dutyType || 'Standard'}
                                    </span>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{v.ownerName || 'Unknown'}</div>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ fontWeight: '800', color: '#10b981', fontSize: '15px' }}>₹{v.dutyAmount?.toLocaleString('en-IN') || '0'}</div>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <button
                                        onClick={() => handleDelete(v._id)}
                                        style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '8px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.1)' }}
                                        title="Remove Record"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                        zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px'
                    }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass-card modal-content"
                            style={{ width: '100%', maxWidth: '550px', padding: '25px', maxHeight: '95vh', overflowY: 'auto' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h2 style={{ color: 'white', fontSize: '20px', margin: 0, fontWeight: '800' }}>Register Outside Car</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%' }}><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                                <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Vehicle Number *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="DL XX XX XXXX"
                                            required
                                            value={formData.carNumber}
                                            onChange={(e) => setFormData({ ...formData, carNumber: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Car Name / Model *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Innova / Dzire"
                                            required
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Operator / Driver *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Driver's Full Name"
                                            required
                                            value={formData.driverName}
                                            onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Service Category *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="e.g. Local / Airport / Rental"
                                            required
                                            value={formData.dutyType}
                                            onChange={(e) => setFormData({ ...formData, dutyType: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Owner / Agency Name *</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Name of Proprietor or Fleet Provider"
                                        required
                                        value={formData.ownerName}
                                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Settlement Amount (Rate)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="Punctuation-free amount"
                                        value={formData.dutyAmount}
                                        onChange={(e) => setFormData({ ...formData, dutyAmount: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <button type="button" className="glass-card" style={{ flex: 1, padding: '14px', color: 'white', fontWeight: '700' }} onClick={() => setShowModal(false)}>Discard</button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '14px' }}
                                    >
                                        Confirm Registration
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OutsideCars;