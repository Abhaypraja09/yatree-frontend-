import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Car, AlertCircle, Trash2, Calendar, ExternalLink, Search, Wallet, Shield, MapPin, Clock, CheckCircle2, XCircle, Info, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const Vehicles = () => {
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [carNumber, setCarNumber] = useState('');
    const [model, setModel] = useState('');
    const [permitType, setPermitType] = useState('All India');
    const [alerts, setAlerts] = useState([]);
    const [carType, setCarType] = useState('SUV');
    const [dutyAmount, setDutyAmount] = useState('');
    const [fastagNumber, setFastagNumber] = useState('');
    const [fastagBalance, setFastagBalance] = useState('');
    const [fastagBank, setFastagBank] = useState('');

    const [creating, setCreating] = useState(false);
    const [docs, setDocs] = useState({
        rc: null, insurance: null, puc: null, fitness: null, permit: null
    });
    const [docExpiries, setDocExpiries] = useState({
        rc: '', insurance: '', puc: '', fitness: '', permit: ''
    });
    const [showDocsModal, setShowDocsModal] = useState(null); // Vehicle ID for existing docs
    const [docToUpload, setDocToUpload] = useState({ type: '', file: null, expiry: '' });
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [editingId, setEditingId] = useState(null);



    useEffect(() => {
        if (selectedCompany) {
            fetchVehicles();
            fetchDrivers();
            fetchAlerts();
        }
    }, [selectedCompany]);

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo) return;
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchDrivers = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo) return;
            const { data } = await axios.get(`/api/admin/drivers/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setDrivers(data.drivers || []);
        } catch (err) { console.error(err); }
    };

    const fetchAlerts = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/dashboard/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setAlerts(data.expiringAlerts || []);
        } catch (err) { console.error(err); }
    };

    const handleCreateVehicle = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const formData = new FormData();
            formData.append('carNumber', carNumber);
            formData.append('model', model);
            formData.append('permitType', permitType);
            formData.append('companyId', selectedCompany._id);
            formData.append('carType', carType);
            formData.append('isOutsideCar', false);
            formData.append('dutyAmount', dutyAmount || 0);
            formData.append('fastagNumber', fastagNumber);
            formData.append('fastagBalance', fastagBalance || 0);
            formData.append('fastagBank', fastagBank);

            // Add Documents
            Object.keys(docs).forEach(type => {
                if (docs[type]) {
                    formData.append(type, docs[type]);
                    if (docExpiries[type]) {
                        formData.append(`expiry_${type}`, docExpiries[type]);
                    }
                }
            });

            if (editingId) {
                await axios.put(`/api/admin/vehicles/${editingId}`, formData, {
                    headers: {
                        Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}`
                    }
                });
                alert('Vehicle updated successfully');
            } else {
                await axios.post('/api/admin/vehicles', formData, {
                    headers: {
                        Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}`
                    }
                });
                alert('Vehicle created successfully');
            }

            setShowModal(false);
            setCarNumber(''); setModel('');
            setCarType('SUV'); setDutyAmount(''); setFastagNumber(''); setFastagBalance(''); setFastagBank('');
            setDocs({ rc: null, insurance: null, puc: null, fitness: null, permit: null });
            setDocExpiries({ rc: '', insurance: '', puc: '', fitness: '', permit: '' });
            setEditingId(null);
            fetchVehicles();
            fetchAlerts();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating vehicle');
        } finally {
            setCreating(false);
        }
    };

    const handleUploadSingleDoc = async (vehicleId) => {
        if (!docToUpload.type || !docToUpload.file) {
            return alert('Please select document type and file');
        }
        setUploadingDoc(true);
        try {
            const formData = new FormData();
            formData.append('documentType', docToUpload.type.toUpperCase());
            formData.append('expiryDate', docToUpload.expiry);
            formData.append('document', docToUpload.file);

            await axios.post(`/api/admin/vehicles/${vehicleId}/documents`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}`
                }
            });

            setDocToUpload({ type: '', file: null, expiry: '' });
            fetchVehicles();
            alert('Document uploaded successfully');
        } catch (err) {
            alert(err.response?.data?.message || 'Error uploading document');
        } finally {
            setUploadingDoc(false);
        }
    };



    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this vehicle? Driver assignments will be cleared.')) return;
        try {
            await axios.delete(`/api/admin/vehicles/${id}`, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` }
            });
            fetchVehicles();
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting vehicle');
        }
    };


    const [searchTerm, setSearchTerm] = useState('');

    const filteredVehicles = vehicles.filter(v =>
        !v.isOutsideCar && (
            v.carNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Ticker Component
    const VehicleTicker = ({ data }) => {
        if (!data || data.length === 0) return null;
        // Repeat data to ensure substantial width for the loop
        const displayData = [...data, ...data, ...data, ...data];

        return (
            <div className="vehicle-ticker-container"
                style={{
                    position: 'sticky',
                    top: '0px',
                    zIndex: 1000,
                    margin: '0 -20px 30px -20px',
                    padding: '0 20px'
                }}
            >
                <div className="vehicle-ticker-wrap"
                    style={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '12px 0',
                        overflow: 'hidden',
                        display: 'flex',
                        marginTop: '0px',
                        alignItems: 'center',
                        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
                        position: 'relative'
                    }}
                >
                    {/* Left "Live" Badge */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '140px',
                        background: 'linear-gradient(to right, #0f172a 80%, transparent)',
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '15px'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #ef4444, #b91c1c)', // Red for "Live" feel
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: '900',

                            padding: '4px 10px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%', animation: 'tickerPulse 0.8s infinite alternate' }}></div>
                            LIVE STATUS
                        </div>
                    </div>

                    <motion.div
                        style={{
                            display: 'flex',
                            whiteSpace: 'nowrap',
                            gap: '60px',
                            paddingLeft: '150px' // Start after the badge
                        }}
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: Math.max(40, data.length * 10), // Increased duration to slow it down (was * 5)
                                ease: "linear",
                            },
                        }}
                    >
                        {displayData.map((v, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: v.currentDriver ? '#10b981' : '#f59e0b',
                                        boxShadow: `0 0 10px ${v.currentDriver ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)'}`
                                    }}></div>
                                    <span style={{ color: 'white', fontWeight: '800', fontSize: '13px', letterSpacing: '0.5px' }}>{v.carNumber}</span>
                                </div>

                                <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '12px' }}>|</span>

                                <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
                                    {v.currentDriver ? (
                                        <>Duty: <span style={{ color: 'white', fontWeight: '800' }}>{v.currentDriver.name}</span></>
                                    ) : (
                                        <span style={{ color: '#f59e0b', fontWeight: '700' }}>STANDBY</span>
                                    )}
                                </span>

                                <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '12px' }}>|</span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Wallet size={12} style={{ color: 'var(--secondary)' }} />
                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '800' }}>₹{v.fastagBalance || 0}</span>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Right Gradient Fade */}
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '80px',
                        background: 'linear-gradient(to left, #0f172a 20%, transparent)',
                        zIndex: 10
                    }}></div>
                </div>

                <style>
                    {`
                        @keyframes tickerPulse {
                            from { transform: scale(1); opacity: 1; }
                            to { transform: scale(1.3); opacity: 0.6; }
                        }
                    `}
                </style>
            </div>
        );
    };

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Manage Vehicles" description="Track and manage all vehicles in your fleet, including document status and assignments." />

            <VehicleTicker data={vehicles} />
            {alerts.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '15px' }}>
                        <AlertCircle size={18} />
                        <h2 style={{ fontSize: '14px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>System Critical Alerts</h2>
                    </div>
                    <div className="scroll-x" style={{ display: 'flex', gap: '15px', paddingBottom: '10px' }}>
                        {alerts.map((alert, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-card"
                                style={{
                                    minWidth: '260px',
                                    padding: '16px',
                                    borderLeft: `4px solid ${alert.daysLeft < 0 ? '#f43f5e' : (alert.daysLeft === 0 ? '#0ea5e9' : '#f59e0b')}`,
                                    background: alert.daysLeft < 0 ? 'rgba(244, 63, 94, 0.05)' : 'rgba(245, 158, 11, 0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>{alert.identifier}</span>
                                    <span style={{
                                        fontSize: '10px',
                                        color: 'white',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: alert.daysLeft < 0 ? '#f43f5e' : (alert.daysLeft === 0 ? '#0ea5e9' : '#f59e0b'),
                                        fontWeight: '800',
                                        textTransform: 'uppercase'
                                    }}>
                                        {alert.daysLeft < 0 ? `${Math.abs(alert.daysLeft)} Days Ago` : (alert.daysLeft === 0 ? 'Today' : `${alert.daysLeft} Days Left`)}
                                    </span>
                                </div>
                                <p style={{ color: 'white', fontWeight: '800', margin: '0 0 4px 0', fontSize: '15px' }}>{alert.documentType}</p>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Expires on: <span style={{ color: 'white' }}>{new Date(alert.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            <header style={{ paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                <div className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
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
                            <Car size={28} color="#fbbf24" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                                <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Asset Management</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', margin: 0, letterSpacing: '-1.5px', cursor: 'pointer' }}>
                                Vehicle <span className="text-gradient-yellow">Fleet</span>
                            </h1>
                        </div>
                    </div>

                    <div className="mobile-stack" style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: '1', justifyContent: 'flex-end', maxWidth: '600px', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1', minWidth: '140px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field"
                                style={{ paddingLeft: '48px', marginBottom: 0, height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', width: '100%' }}
                            />
                        </div>
                        <button className="btn-primary" onClick={() => { setEditingId(null); setCarNumber(''); setModel(''); setCarType('SUV'); setDutyAmount(''); setFastagNumber(''); setFastagBalance(''); setFastagBank(''); setShowModal(true); }} style={{ height: '48px', padding: '0 15px', borderRadius: '12px', fontWeight: '800', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <Plus size={20} /> <span className="hide-mobile">Add Vehicle</span><span className="show-mobile">Add</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid-1-2-2-3" style={{ paddingBottom: '40px' }}>
                {filteredVehicles.length > 0 ? (
                    filteredVehicles.map((v, index) => (
                        <motion.div
                            key={v._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -8, boxShadow: '0 12px 24px rgba(0,0,0,0.2)' }}
                            className="glass-card"
                            style={{ padding: '24px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                            {/* Accent Background */}
                            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '120px', height: '120px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.1, zIndex: 0 }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                                <div style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', padding: '12px', borderRadius: '14px', color: 'var(--primary)', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.1)' }}>
                                    <Car size={24} />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{v.carType || 'SUV'}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setEditingId(v._id);
                                            setCarNumber(v.carNumber);
                                            setModel(v.model);
                                            setPermitType(v.permitType || 'All India');
                                            setCarType(v.carType || 'SUV');
                                            setDutyAmount(v.dutyAmount || '');
                                            setFastagNumber(v.fastagNumber || '');
                                            setFastagBalance(v.fastagBalance || '');
                                            setFastagBank(v.fastagBank || '');
                                            setShowModal(true);
                                        }}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', transition: '0.2s' }}
                                    >
                                        <Wrench size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v._id)}
                                        style={{ background: 'rgba(244, 63, 94, 0.05)', color: '#f43f5e', padding: '8px', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.1)', transition: '0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.05)'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                                <h3 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>{v.carNumber}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', fontWeight: '500' }}>{v.model}</p>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', flexWrap: 'wrap' }}>
                                    {['RC', 'PUC', 'INS'].map(type => {
                                        const doc = v.documents?.find(d => d.documentType === type) ||
                                            v.documents?.find(d => d.documentType === (type === 'INS' ? 'INSURANCE' : type));
                                        const isExpired = doc ? new Date(doc.expiryDate) < new Date() : true;
                                        return (
                                            <div key={type} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                fontSize: '10px',
                                                fontWeight: '800',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                background: !doc ? 'rgba(255,255,255,0.03)' : (isExpired ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                                                color: !doc ? 'var(--text-muted)' : (isExpired ? '#f43f5e' : '#10b981'),
                                                border: `1px solid ${!doc ? 'rgba(255,255,255,0.05)' : (isExpired ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)')}`
                                            }}>
                                                {!doc ? <Clock size={10} /> : (isExpired ? <XCircle size={10} /> : <CheckCircle2 size={10} />)}
                                                {type}
                                            </div>
                                        );
                                    })}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.05)', color: 'var(--primary)', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                                        <MapPin size={10} /> {v.permitType}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: v.currentDriver ? '#10b981' : '#f59e0b' }}></div>
                                                <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.4px', margin: 0 }}>Driver</p>
                                            </div>
                                            <p style={{ color: 'white', fontSize: '14px', fontWeight: '700', margin: 0 }}>
                                                {v.currentDriver?.name || 'Available / Yard'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowDocsModal(v)}
                                        style={{
                                            background: 'linear-gradient(135deg, var(--primary), #0284c7)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 18px',
                                            borderRadius: '10px',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)',
                                            transition: '0.3s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        Manage
                                    </button>
                                </div>
                                <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '12px', paddingTop: '12px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Wallet size={14} style={{ color: 'var(--text-muted)' }} />
                                        <div>
                                            <span style={{ fontSize: '12px', color: 'white', fontWeight: '800' }}>₹{v.fastagBalance || 0}</span>
                                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '4px' }}>Fastag</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Shield size={14} style={{ color: 'var(--text-muted)' }} />
                                        <div>
                                            <span style={{ fontSize: '12px', color: 'white', fontWeight: '800' }}>₹{v.dutyAmount || 0}</span>
                                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '4px' }}>Base Rate</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="glass-card" style={{ gridColumn: '1/-1', padding: '80px 20px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.05)', background: 'transparent' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', width: '90px', height: '90px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 25px' }}>
                            <Car size={36} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                        </div>
                        <h3 style={{ color: 'white', marginBottom: '10px', fontSize: '22px', fontWeight: '800' }}>No vehicles matched your search</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '30px', maxWidth: '400px', margin: '0 auto 30px', fontSize: '15px' }}>Check for typos or add a new vehicle if it's missing from the fleet.</p>
                        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '12px 30px' }}>Add New Fleet Vehicle</button>
                    </div>
                )}
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="premium-glass"
                        style={{
                            padding: 'clamp(24px, 5vw, 40px)',
                            width: '100%',
                            maxWidth: '800px',
                            background: 'linear-gradient(145deg, #0f172a, #1e293b)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            overflowY: 'auto',
                            maxHeight: '90vh',
                            borderRadius: '32px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', position: 'relative' }}>
                            <div>
                                <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
                                    {editingId ? 'Edit Vehicle' : 'Add New'} <span style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fleet Asset</span>
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', margin: '6px 0 0', letterSpacing: '1.5px' }}>Vehicle Information Management</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingId(null);
                                }}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                            {/* Section 1: Core Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1' }}></div>
                                    <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>Core Specifications</h3>
                                </div>
                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Car Number *</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}>
                                                <Car size={16} />
                                            </div>
                                            <input
                                                className="input-field"
                                                style={{ paddingLeft: '45px', height: '54px', fontSize: '15px', fontWeight: '700', textTransform: 'uppercase' }}
                                                placeholder="e.g. RJ-27-TA-XXXX"
                                                value={carNumber}
                                                onChange={(e) => setCarNumber(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Model Name *</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}>
                                                <Info size={16} />
                                            </div>
                                            <input
                                                className="input-field"
                                                style={{ paddingLeft: '45px', height: '54px', fontSize: '15px' }}
                                                placeholder="e.g. Maruti Ciaz"
                                                value={model}
                                                onChange={(e) => setModel(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Permit Category</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}>
                                                <MapPin size={16} />
                                            </div>
                                            <select
                                                className="input-field"
                                                style={{ paddingLeft: '45px', height: '54px', appearance: 'none', cursor: 'pointer' }}
                                                value={permitType}
                                                onChange={(e) => setPermitType(e.target.value)}
                                            >
                                                <option value="All India" style={{ background: '#0f172a' }}>All India (National)</option>
                                                <option value="State Only" style={{ background: '#0f172a' }}>State Only</option>
                                                <option value="Local" style={{ background: '#0f172a' }}>Local Trip</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Car Segment</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }}>
                                                <Car size={16} />
                                            </div>
                                            <select
                                                className="input-field"
                                                style={{ paddingLeft: '45px', height: '54px', appearance: 'none', cursor: 'pointer' }}
                                                value={carType}
                                                onChange={(e) => setCarType(e.target.value)}
                                            >
                                                <option value="SUV" style={{ background: '#0f172a' }}>SUV / MUV</option>
                                                <option value="Sedan" style={{ background: '#0f172a' }}>Sedan</option>
                                                <option value="Hatchback" style={{ background: '#0f172a' }}>Hatchback</option>
                                                <option value="Other" style={{ background: '#0f172a' }}>Luxury / Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Financials & Tracking */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                    <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>Financials & Tracking</h3>
                                </div>
                                <div className="form-grid-3">
                                    <div className="form-group">
                                        <label>Fastag ID</label>
                                        <input className="input-field" style={{ height: '50px' }} placeholder="ID Number" value={fastagNumber} onChange={(e) => setFastagNumber(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Fastag Bank</label>
                                        <input className="input-field" style={{ height: '50px' }} placeholder="e.g. ICICI" value={fastagBank} onChange={(e) => setFastagBank(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Fastag Balance (₹)</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: '900' }}>₹</div>
                                            <input type="number" className="input-field no-spinner" style={{ height: '50px', paddingLeft: '32px' }} placeholder="0.00" value={fastagBalance} onChange={(e) => setFastagBalance(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Daily Rental / Duty Amount</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: '900' }}>₹</div>
                                        <input type="number" className="input-field no-spinner" style={{ height: '54px', paddingLeft: '35px', fontSize: '16px', fontWeight: '800' }} placeholder="Fixed Daily Amount" value={dutyAmount} onChange={(e) => setDutyAmount(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Documents */}
                            <div style={{
                                padding: '25px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                        <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' }}>Fleet Documentation</h3>
                                    </div>
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>JPG/PNG/PDF • MAX 5MB</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {['rc', 'insurance', 'puc', 'fitness', 'permit'].map(type => (
                                        <div key={type} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '100px 1fr 180px',
                                            gap: '20px',
                                            alignItems: 'center',
                                            padding: '12px 15px',
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: '16px',
                                            border: docs[type] ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent'
                                        }}>
                                            <label style={{ color: 'white', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>{type}</label>

                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    id={`file-${type}`}
                                                    type="file"
                                                    onChange={(e) => setDocs({ ...docs, [type]: e.target.files[0] })}
                                                    style={{ display: 'none' }}
                                                />
                                                <label
                                                    htmlFor={`file-${type}`}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        padding: '10px 15px',
                                                        background: docs[type] ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                                        borderRadius: '10px',
                                                        border: '1px dashed rgba(255,255,255,0.1)',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        color: docs[type] ? '#10b981' : 'rgba(255,255,255,0.4)',
                                                        fontWeight: '700',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {docs[type] ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                                    {docs[type] ? docs[type].name.substring(0, 20) + (docs[type].name.length > 20 ? '...' : '') : 'Upload Scan'}
                                                </label>
                                            </div>

                                            <div style={{ position: 'relative' }}>
                                                <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                                <input
                                                    type="date"
                                                    className="input-field"
                                                    placeholder="Expiry"
                                                    style={{ marginBottom: 0, padding: '8px 12px 8px 35px', fontSize: '13px', height: '42px', colorScheme: 'dark' }}
                                                    value={docExpiries[type]}
                                                    onChange={(e) => setDocExpiries({ ...docExpiries, [type]: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', textAlign: 'center' }}>
                                    <Info size={10} style={{ marginRight: '5px' }} />
                                    Document upload is optional during creation, but required for duty assignments.
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '15px', padding: '10px 0' }}>
                                <button
                                    type="button"
                                    className="glass-card"
                                    style={{ flex: 1, padding: '16px', color: 'white', fontWeight: '800', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingId(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ flex: 2, padding: '16px', borderRadius: '18px', fontSize: '16px', fontWeight: '900', boxShadow: '0 20px 40px -10px rgba(14, 165, 233, 0.4)' }}
                                    disabled={creating}
                                >
                                    {creating ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                            <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                            {editingId ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                                            <span>{editingId ? 'Save Vehicle Updates' : 'Add Vehicle to Fleet'}</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {showDocsModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '15px' }}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card modal-content" style={{ padding: '25px', width: '100%', maxWidth: '850px', maxHeight: '95vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <div>
                                <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: 0 }}>Documents</h2>
                                <p style={{ color: 'var(--primary)', fontSize: '13px', margin: 0, fontWeight: '600' }}>{showDocsModal.carNumber}</p>
                            </div>
                            <button onClick={() => setShowDocsModal(null)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                        </div>

                        <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
                            {showDocsModal.documents?.map((doc, idx) => (
                                <div key={idx} className="glass-card" style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>{doc.documentType}</p>
                                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: new Date(doc.expiryDate) < new Date() ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: new Date(doc.expiryDate) < new Date() ? '#f43f5e' : '#10b981', fontWeight: '700' }}>
                                            {new Date(doc.expiryDate) < new Date() ? 'Expired' : 'Valid'}
                                        </span>
                                    </div>
                                    <div className="img-container" style={{ position: 'relative', height: '140px', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px', cursor: 'pointer' }} onClick={() => window.open(doc.imageUrl)}>
                                        <img src={doc.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div className="img-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0, transition: '0.3s' }}>
                                            <ExternalLink size={20} color="white" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {(() => {
                                                const isExpired = new Date(doc.expiryDate) < new Date();
                                                return (
                                                    <>
                                                        Expires: <span style={{ color: isExpired ? '#f43f5e' : 'white', fontWeight: '800' }}>{new Date(doc.expiryDate).toLocaleDateString('en-IN')}</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <a
                                            href={`https://wa.me/91${JSON.parse(localStorage.getItem('userInfo'))?.mobile || '9660953135'}?text=${encodeURIComponent(`ALERT: Vehicle ${showDocsModal.carNumber} document (${doc.documentType}) is expiring on ${new Date(doc.expiryDate).toLocaleDateString()}. Please take action.`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#25D366', background: 'rgba(37, 211, 102, 0.1)', padding: '6px', borderRadius: '8px', fontSize: '14px', textDecoration: 'none' }}
                                            title="Send WhatsApp Reminder"
                                        >
                                            WA
                                        </a>
                                    </div>
                                </div>
                            ))}
                            {(!showDocsModal.documents || showDocsModal.documents.length === 0) && (
                                <div style={{ gridColumn: '1/-1', padding: '40px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No documents uploaded for this vehicle.</p>
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '25px' }}>
                            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700', marginBottom: '15px' }}>Quick Upload</h3>
                            <div className="quick-upload-grid">
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>Type</label>
                                    <select className="input-field" value={docToUpload.type} onChange={(e) => setDocToUpload({ ...docToUpload, type: e.target.value })} style={{ marginBottom: 0, height: '42px', fontSize: '13px', fontWeight: '600' }}>
                                        <option value="">Select Type</option>
                                        <option value="RC">RC</option>
                                        <option value="INSURANCE">Insurance</option>
                                        <option value="PUC">PUC</option>
                                        <option value="FITNESS">Fitness</option>
                                        <option value="PERMIT">Permit</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>Expiry Date</label>
                                    <input type="date" className="input-field" value={docToUpload.expiry} onChange={(e) => setDocToUpload({ ...docToUpload, expiry: e.target.value })} style={{ marginBottom: 0, height: '42px', fontSize: '13px' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>File</label>
                                    <input type="file" onChange={(e) => setDocToUpload({ ...docToUpload, file: e.target.files[0] })} style={{ color: 'white', fontSize: '11px', marginBottom: 0, width: '100%' }} />
                                </div>
                                <button className="btn-primary" onClick={() => handleUploadSingleDoc(showDocsModal._id)} disabled={uploadingDoc} style={{ height: '42px', padding: '0 25px' }}>
                                    {uploadingDoc ? 'Saving...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Vehicles;



