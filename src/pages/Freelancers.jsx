import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Search, Trash2, User as UserIcon, X, CheckCircle, AlertCircle, LogIn, LogOut, Car, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const Freelancers = () => {
    const { selectedCompany } = useCompany();
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPunchInModal, setShowPunchInModal] = useState(false);
    const [showPunchOutModal, setShowPunchOutModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);

    // Form States
    const [formData, setFormData] = useState({ name: '', mobile: '', licenseNumber: '' });
    const [punchInData, setPunchInData] = useState({ vehicleId: '', km: '', time: new Date().toISOString().slice(0, 16) });
    const [punchOutData, setPunchOutData] = useState({ km: '', time: new Date().toISOString().slice(0, 16), fuelAmount: '0', parkingAmount: '0', review: '' });

    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (selectedCompany) {
            fetchFreelancers();
            fetchVehicles();
        }
    }, [selectedCompany]);

    const fetchFreelancers = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/drivers/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setDrivers(data.drivers?.filter(d => d.isFreelancer) || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
    };

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
                setFormData({ name: '', mobile: '', licenseNumber: '' });
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
            await axios.post('/api/admin/freelancers/punch-in', { ...punchInData, driverId: selectedDriver._id }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setShowPunchInModal(false);
            setPunchInData({ vehicleId: '', km: '', time: new Date().toISOString().slice(0, 16) });
            fetchFreelancers();
            fetchVehicles();
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
            setPunchOutData({ km: '', time: new Date().toISOString().slice(0, 16), fuelAmount: '0', parkingAmount: '0', review: '' });
            fetchFreelancers();
            fetchVehicles();
        } catch (err) { alert(err.response?.data?.message || 'Error'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this freelancer?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/drivers/${id}`, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            fetchFreelancers();
        } catch (err) { alert('Error deleting'); }
    };

    const onDutyDrivers = drivers.filter(d => d.tripStatus === 'active');
    const availableDrivers = drivers.filter(d => d.tripStatus !== 'active').filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.mobile?.includes(searchTerm) ||
        d.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Freelancer Fleet Network" description="Onboard and manage freelance drivers for temporary duties and peak demand management." />
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 0',
                gap: '15px',
                flexWrap: 'wrap'
            }}>
                <div style={{ minWidth: '200px' }}>
                    <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Freelancer Net</h1>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>External personnel management</p>
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
                    <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', padding: '0 16px', fontSize: '14px' }}>
                        <Plus size={18} /> <span>Add Freelancer</span>
                    </button>
                </div>
            </header>

            {/* ON DUTY SECTION */}
            {onDutyDrivers.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px #f43f5e' }} />
                        <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Currently On Duty ({onDutyDrivers.length})</h2>
                    </div>
                    <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(244, 63, 94, 0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Driver</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Contact</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Assigned Vehicle</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Start Odo</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {onDutyDrivers.map(d => (
                                    <tr key={d._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '18px 25px', fontWeight: '700', fontSize: '15px' }}>{d.name}</td>
                                        <td style={{ padding: '18px 25px', fontSize: '14px' }}>{d.mobile}</td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <div style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '14px' }}>{d.assignedVehicle?.carNumber}</div>
                                        </td>
                                        <td style={{ padding: '18px 25px', fontSize: '14px', color: 'var(--text-muted)' }}>{d.activeAttendance?.punchIn?.km || '-'} KM</td>
                                        <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => { setSelectedDriver(d); setShowPunchOutModal(true); }}
                                                className="btn-primary"
                                                style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.1)', padding: '8px 16px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
                                            >
                                                Punch Out
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* AVAILABLE SECTION */}
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                    <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Freelancers ({availableDrivers.length})</h2>
                </div>
                <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                                <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Name</th>
                                <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Mobile</th>
                                <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>License</th>
                                <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                        <div className="spinner"></div>
                                        <span>Syncing available records...</span>
                                    </div>
                                </td></tr>
                            ) : availableDrivers.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px' }}>
                                        <Search size={22} style={{ opacity: 0.3 }} />
                                    </div>
                                    <p style={{ fontSize: '14px', margin: 0 }}>No available freelancers found.</p>
                                </td></tr>
                            ) : availableDrivers.map(d => (
                                <tr key={d._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '18px 25px', fontWeight: '700', fontSize: '15px' }}>{d.name}</td>
                                    <td style={{ padding: '18px 25px', fontSize: '14px' }}>{d.mobile}</td>
                                    <td style={{ padding: '18px 25px', fontSize: '13px', color: 'var(--text-muted)' }}>{d.licenseNumber || 'Not Provided'}</td>
                                    <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => { setSelectedDriver(d); setShowPunchInModal(true); }}
                                                className="btn-primary"
                                                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '8px 16px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
                                            >
                                                Assign Duty
                                            </button>
                                            <button onClick={() => handleDelete(d._id)} style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.05)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals Implementation */}
            <AnimatePresence>
                {/* Add Freelancer Modal */}
                {showAddModal && (
                    <Modal title="Add New Freelancer" onClose={() => setShowAddModal(false)}>
                        <form onSubmit={handleCreate} style={{ display: 'grid', gap: '20px' }}>
                            <Field label="Full Name *" value={formData.name} onChange={v => setFormData({ ...formData, name: v })} required />
                            <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <Field label="Mobile Number *" value={formData.mobile} onChange={v => setFormData({ ...formData, mobile: v })} required />
                                <Field label="License Number" value={formData.licenseNumber} onChange={v => setFormData({ ...formData, licenseNumber: v })} />
                            </div>
                            <SubmitButton disabled={submitting} text="Register Freelancer" message={message} />
                        </form>
                    </Modal>
                )}

                {/* Punch In Modal */}
                {showPunchInModal && (
                    <Modal title={`Assign Duty: ${selectedDriver?.name}`} onClose={() => setShowPunchInModal(false)}>
                        <form onSubmit={handlePunchIn} style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Select Vehicle *</label>
                                <select className="input-field" required value={punchInData.vehicleId} onChange={e => setPunchInData({ ...punchInData, vehicleId: e.target.value })} style={{ height: '45px' }}>
                                    <option value="">Choose available vehicle...</option>
                                    {vehicles.filter(v => !v.currentDriver).map(v => <option key={v._id} value={v._id} style={{ background: '#0f172a' }}>{v.carNumber} - {v.model}</option>)}
                                </select>
                            </div>
                            <Field label="Starting KM *" type="number" value={punchInData.km} onChange={v => setPunchInData({ ...punchInData, km: v })} required />
                            <Field label="Assignment Time" type="datetime-local" value={punchInData.time} onChange={v => setPunchInData({ ...punchInData, time: v })} />
                            <SubmitButton disabled={submitting} text="Start Duty" />
                        </form>
                    </Modal>
                )}

                {/* Punch Out Modal */}
                {showPunchOutModal && (
                    <Modal title={`Duty Completion: ${selectedDriver?.name}`} onClose={() => setShowPunchOutModal(false)}>
                        <form onSubmit={handlePunchOut} style={{ display: 'grid', gap: '20px' }}>
                            <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <Field label="Closing KM *" type="number" value={punchOutData.km} onChange={v => setPunchOutData({ ...punchOutData, km: v })} required />
                                <Field label="Completion Time" type="datetime-local" value={punchOutData.time} onChange={v => setPunchOutData({ ...punchOutData, time: v })} />
                            </div>
                            <div className="modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <Field label="Fuel Spent (₹)" type="number" value={punchOutData.fuelAmount} onChange={v => setPunchOutData({ ...punchOutData, fuelAmount: v })} />
                                <Field label="Parking/Toll (₹)" type="number" value={punchOutData.parkingAmount} onChange={v => setPunchOutData({ ...punchOutData, parkingAmount: v })} />
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Admin Remarks / Performance Review</label>
                                <textarea
                                    className="input-field"
                                    style={{ height: '80px', paddingTop: '12px' }}
                                    placeholder="Note any issues or positive feedback..."
                                    value={punchOutData.review}
                                    onChange={e => setPunchOutData({ ...punchOutData, review: e.target.value })}
                                />
                            </div>
                            <SubmitButton disabled={submitting} text="Finish Duty & Release Vehicle" />
                        </form>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
};

// Sub-components for cleaner code
const Modal = ({ title, onClose, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card modal-content" style={{ width: '100%', maxWidth: '550px', padding: '25px', maxHeight: '95vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: 'white', fontSize: '20px', margin: 0, fontWeight: '800' }}>{title}</h2>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%' }}><X size={20} /></button>
            </div>
            {children}
        </motion.div>
    </div>
);

const Field = ({ label, value, onChange, type = "text", required = false }) => (
    <div>
        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>{label}</label>
        <input type={type} className="input-field" required={required} value={value} onChange={e => onChange(e.target.value)} />
    </div>
);

const SubmitButton = ({ disabled, text, message }) => (
    <div style={{ marginTop: '10px' }}>
        {message?.text && (
            <div style={{ padding: '12px', borderRadius: '12px', fontSize: '14px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: message.type === 'success' ? '#10b981' : '#f43f5e', border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)'}` }}>
                {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {message.text}
            </div>
        )}
        <button type="submit" disabled={disabled} className="btn-primary" style={{ width: '100%', padding: '15px', fontWeight: '800', textTransform: 'uppercase' }}>
            {disabled ? 'Processing...' : text}
        </button>
    </div>
);

export default Freelancers;
