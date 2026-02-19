import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { ShieldAlert, Upload, CheckCircle, AlertCircle, Calendar as CalendarIcon, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const BorderTax = () => {
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [formData, setFormData] = useState({
        vehicleId: '',
        borderName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        remarks: '',
        driverId: ''
    });
    const [receiptPhoto, setReceiptPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [vehicleSearch, setVehicleSearch] = useState('');

    useEffect(() => {
        if (selectedCompany) {
            fetchData();
            fetchEntries();
        }
    }, [selectedCompany]);

    const fetchData = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const vehRes = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const dvrRes = await axios.get(`/api/admin/drivers/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVehicles(vehRes.data.vehicles || []);
            setDrivers(dvrRes.data.drivers || []);
        } catch (err) {
            console.error('Error fetching data', err);
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const { data } = await axios.get(`/api/admin/border-tax/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEntries(data);
        } catch (err) {
            console.error('Error fetching border tax entries', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReceiptPhoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            data.append('companyId', selectedCompany._id);
            if (receiptPhoto) data.append('receiptPhoto', receiptPhoto);

            await axios.post('/api/admin/border-tax', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage({ type: 'success', text: 'Border Tax recorded successfully!' });
            setFormData({
                vehicleId: selectedVehicle?._id || '',
                borderName: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                remarks: '',
                driverId: ''
            });
            setReceiptPhoto(null);
            setPreview(null);
            fetchEntries();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to record entry' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            await axios.delete(`/api/admin/border-tax/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'Entry deleted successfully' });
            fetchEntries();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to delete entry' });
        }
    };

    const filteredVehicles = vehicles.filter(v =>
        v.carNumber.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.model?.toLowerCase().includes(vehicleSearch.toLowerCase())
    );

    const filteredEntries = entries.filter(e => {
        const matchesSearch = e.borderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.vehicle?.carNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesVehicle = selectedVehicle ? e.vehicle?._id === selectedVehicle._id : true;
        return matchesSearch && matchesVehicle;
    });

    const selectVehicle = (v) => {
        setSelectedVehicle(v);
        setFormData(prev => ({ ...prev, vehicleId: v._id }));
        setSearchTerm('');
    };

    if (!selectedVehicle) {
        return (
            <div className="container-fluid" style={{ paddingBottom: '40px' }}>
                <SEO title="Select Vehicle - Border Tax" description="Choose a vehicle to manage border tax records." />
                <header style={{ padding: '40px 0', textAlign: 'center' }}>
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-1px' }}>
                            Border Tax <span style={{ color: 'var(--primary)' }}>Hub</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: '16px' }}>Select a vehicle to manage its crossing records</p>
                    </motion.div>

                    <div style={{ position: 'relative', maxWidth: '500px', margin: '40px auto 0' }}>
                        <Search size={20} style={{ position: 'absolute', left: '20px', top: '16px', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Find vehicle by number or model..."
                            className="input-field"
                            value={vehicleSearch}
                            onChange={(e) => setVehicleSearch(e.target.value)}
                            style={{ paddingLeft: '55px', height: '54px', borderRadius: '16px', fontSize: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    {filteredVehicles.map((v, idx) => (
                        <motion.div
                            key={v._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ y: -5, borderColor: 'var(--primary)', boxShadow: '0 10px 30px rgba(14, 165, 233, 0.2)' }}
                            onClick={() => selectVehicle(v)}
                            className="glass-card"
                            style={{
                                padding: '24px',
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '80px', height: '80px', background: 'var(--primary)', filter: 'blur(40px)', opacity: 0.1 }}></div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', zIndex: 1 }}>
                                <div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <AlertCircle size={24} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>{v.carNumber}</h3>
                                    <p style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: '13px' }}>{v.model || 'Standard Model'}</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                                    {entries.filter(e => e.vehicle?._id === v._id).length} RECORDS
                                </div>
                                <div style={{ color: 'var(--primary)', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    MANAGE <Search size={12} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {filteredVehicles.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <p>No vehicles found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title={`${selectedVehicle.carNumber} - Border Tax`} description="Record and manage border tax entries for specific vehicles." />

            <header style={{
                padding: '30px 0',
                gap: '20px'
            }} className="flex-resp">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                    <button
                        onClick={() => setSelectedVehicle(null)}
                        className="glass-card-hover-effect"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <AlertCircle size={20} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Management Detail</span>
                        </div>
                        <h1 className="resp-title" style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>
                            {selectedVehicle.carNumber}
                        </h1>
                    </div>
                </div>

                <div className="flex-resp" style={{ gap: '15px' }}>
                    <div className="glass-card" style={{ padding: '12px 20px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '130px', flex: 1 }}>
                        <span style={{ fontSize: '9px', fontWeight: '800', color: '#10b981', letterSpacing: '1px' }}>TOTAL PAID</span>
                        <span style={{ color: 'white', fontSize: '18px', fontWeight: '900' }}>₹{filteredEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="glass-card" style={{ padding: '12px 20px', borderRadius: '14px', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '130px', flex: 1 }}>
                        <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '1px' }}>RECORDS</span>
                        <span style={{ color: 'white', fontSize: '18px', fontWeight: '900' }}>{filteredEntries.length} entries</span>
                    </div>
                </div>
            </header>

            <div className="responsive-split-layout" style={{ display: 'grid', gap: '30px', alignItems: 'start' }}>
                <style>{`
                    .responsive-split-layout { grid-template-columns: 1fr; }
                    @media (min-width: 1024px) { .responsive-split-layout { grid-template-columns: minmax(350px, 400px) 1fr; } }
                `}</style>
                {/* Left Side: Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card"
                    style={{ padding: '25px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(30, 41, 59, 0.4)' }}
                >
                    <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '800', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <ShieldAlert size={18} color="var(--primary)" />
                        Add New entry
                    </h2>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
                        <div>
                            <label className="input-label">Border Name *</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Ex: Delhi-Agra Toll"
                                required
                                value={formData.borderName}
                                onChange={(e) => setFormData({ ...formData, borderName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="input-label">Responsible Driver</label>
                            <select
                                className="input-field"
                                value={formData.driverId}
                                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                style={{ appearance: 'auto' }}
                            >
                                <option value="">Select Driver</option>
                                {drivers.map(d => (
                                    <option key={d._id} value={d._id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        <style>{`
                            .bt-form-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
                            @media (min-width: 640px) { .bt-form-grid { grid-template-columns: 1fr 1fr; } }
                        `}</style>

                        <div className="bt-form-grid">
                            <div>
                                <label className="input-label">Amount (₹) *</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="0.00"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="input-label">Entry Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Notes / Remarks</label>
                            <textarea
                                className="input-field"
                                style={{ height: '60px', paddingTop: '10px', resize: 'none' }}
                                placeholder="Additional details..."
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            />
                        </div>

                        <div style={{ marginTop: '5px' }}>
                            <label className="input-label">Upload Receipt Copy</label>
                            <label style={{ display: 'block', cursor: 'pointer' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <div style={{
                                    border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '12px', padding: '15px',
                                    textAlign: 'center', background: 'rgba(255,255,255,0.01)', transition: 'all 0.2s',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                                }}>
                                    {preview ? (
                                        <img src={preview} style={{ height: '80px', borderRadius: '8px' }} />
                                    ) : (
                                        <>
                                            <Upload size={20} color="var(--primary)" />
                                            <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>Choose Receipt Image</span>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>

                        {message.text && (
                            <div style={{
                                padding: '10px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                color: message.type === 'success' ? '#10b981' : '#f43f5e',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary"
                            style={{ width: '100%', height: '50px', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}
                        >
                            {submitting ? 'PROCESSING...' : 'SAVE RECORD'}
                        </button>
                    </form>
                </motion.div>

                {/* Right Side: List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                >
                    <div className="glass-card flex-resp" style={{ padding: '15px 20px', border: '1px solid rgba(255,255,255,0.05)', justifyContent: 'space-between', gap: '15px' }}>
                        <div>
                            <h2 style={{ color: 'white', fontSize: '17px', fontWeight: '800', margin: 0 }}>Recent Logs</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>History for {selectedVehicle.carNumber}</p>
                        </div>
                        <div style={{ position: 'relative', maxWidth: '280px', flex: 1, width: '100%' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search history..."
                                className="input-field"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '38px', height: '42px', fontSize: '13px', marginBottom: 0, borderRadius: '10px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {loading ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>
                                <div className="spinner" style={{ margin: '0 auto' }}></div>
                            </div>
                        ) : filteredEntries.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                                <ShieldAlert size={48} style={{ opacity: 0.1, margin: '0 auto 15px', color: 'var(--primary)' }} />
                                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>No History Available</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Start recording border taxes for this vehicle.</p>
                            </div>
                        ) : filteredEntries.map(entry => (
                            <motion.div
                                layout
                                key={entry._id}
                                whileHover={{ scale: 1.02 }}
                                className="glass-card"
                                style={{
                                    padding: '20px',
                                    background: 'rgba(30, 41, 59, 0.3)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '15px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ color: 'white', fontWeight: '800', fontSize: '15px', margin: 0 }}>{entry.borderName}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <CalendarIcon size={12} color="var(--primary)" />
                                            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700' }}>
                                                {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    {entry.receiptPhoto && (
                                        <a href={entry.receiptPhoto} target="_blank" rel="noreferrer">
                                            <img src={entry.receiptPhoto} style={{ width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                        </a>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                    <div style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '18px' }}>
                                        <span style={{ fontSize: '12px', marginRight: '2px' }}>₹</span>
                                        {entry.amount?.toLocaleString('en-IN')}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(entry._id)}
                                        style={{ background: 'none', color: '#f43f5e', fontSize: '11px', fontWeight: '800', cursor: 'pointer', opacity: 0.6 }}
                                        onMouseEnter={(e) => e.target.style.opacity = 1}
                                        onMouseLeave={(e) => e.target.style.opacity = 0.6}
                                    >
                                        DELETE
                                    </button>
                                </div>
                                {entry.remarks && (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, fontStyle: 'italic', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                                        "{entry.remarks}"
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BorderTax;
