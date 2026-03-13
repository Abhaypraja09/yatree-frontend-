import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import * as XLSX from 'xlsx';
import {
    Wrench,
    Plus,
    Search,
    Trash2,
    Calendar,
    FileText,
    Car,
    FileSpreadsheet,
    Droplets,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    PlusCircle,
    Upload,
    ImageIcon,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';
import { todayIST, formatDateIST, nowIST } from '../utils/istUtils';

const DriverServices = () => {
    const { selectedCompany } = useCompany();
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [selectedYear, setSelectedYear] = useState(nowIST().getUTCFullYear());
    const [filterMode, setFilterMode] = useState('month'); // 'month' or 'range'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedType, setSelectedType] = useState('All'); // 'All', 'Wash', 'Puncture'

    // Form State for Manual Entry
    const [formData, setFormData] = useState({
        vehicleId: '',
        driverId: '',
        maintenanceType: 'Car Service',
        category: 'Car Wash',
        description: '',
        garageName: 'Local Vendor',
        billDate: todayIST(),
        amount: '',
        paymentMode: 'Cash',
        status: 'Completed'
    });
    const [billPhoto, setBillPhoto] = useState(null);
    const [billPhotoPreview, setBillPhotoPreview] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null); // For viewing
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const serviceCategories = ['Car Wash', 'Puncture repair', 'Tissue Box', 'Water Bottle', 'Interior Cleaning', 'Wheel Alignment', 'Other'];

    useEffect(() => {
        if (selectedCompany) {
            fetchRecords();
            fetchVehicles();
            fetchDrivers();
        }
    }, [selectedCompany, selectedMonth, selectedYear, startDate, endDate, filterMode]);

    const fetchRecords = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            let url = `/api/admin/maintenance/${selectedCompany._id}?`;
            if (filterMode === 'range' && startDate && endDate) {
                url += `startDate=${startDate}&endDate=${endDate}`;
            } else {
                url += `month=${selectedMonth}&year=${selectedYear}`;
            }

            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            
            // Filter only service hub related data (wash, puncture, cleaning, etc.)
            const serviceRegex = /wash|puncture|puncher|tissue|water|cleaning/i;
            const serviceData = (data || []).filter(r => {
                return serviceRegex.test(r.category || '') || 
                       serviceRegex.test(r.description || '') || 
                       serviceRegex.test(r.maintenanceType || '') ||
                       serviceRegex.test(r.remark || '');
            });

            setRecords(serviceData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`);
            setVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
    };

    const fetchDrivers = async () => {
        if (!selectedCompany?._id) return;
        try {
            const { data } = await axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false`);
            setDrivers(data.drivers || []);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const fd = new FormData();
            Object.keys(formData).forEach(key => {
                fd.append(key, formData[key]);
            });
            fd.append('companyId', selectedCompany._id);
            if (billPhoto) fd.append('billPhoto', billPhoto);

            if (editingId) {
                await axios.put(`/api/admin/maintenance/${editingId}`, fd, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${userInfo.token}` 
                    }
                });
                alert('Service record updated');
            } else {
                await axios.post('/api/admin/maintenance', fd, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${userInfo.token}` 
                    }
                });
                alert('Service record added');
            }

            setShowModal(false);
            resetForm();
            fetchRecords();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving record');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this service record?')) return;
        try {
            await axios.delete(`/api/admin/maintenance/${id}`);
            fetchRecords();
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setFormData({
            vehicleId: '',
            driverId: '',
            maintenanceType: 'Car Service',
            category: 'Car Wash',
            description: '',
            garageName: 'Local Vendor',
            billDate: todayIST(),
            amount: '',
            paymentMode: 'Cash',
            status: 'Completed'
        });
        setBillPhoto(null);
        setBillPhotoPreview(null);
        setEditingId(null);
    };

    const filteredRecords = records.filter(r => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = (r.vehicle?.carNumber?.toLowerCase()?.includes(query) ||
                             r.category?.toLowerCase()?.includes(query) ||
                             r.description?.toLowerCase()?.includes(query) ||
                             r.driver?.name?.toLowerCase()?.includes(query));
        
        let matchesType = true;
        const textToSearch = `${r.category} ${r.description} ${r.maintenanceType}`.toLowerCase();

        if (selectedType === 'Wash') {
            matchesType = textToSearch.includes('wash');
        } else if (selectedType === 'Puncture') {
            matchesType = textToSearch.includes('puncture') || textToSearch.includes('puncher');
        } else if (selectedType === 'Interior/Other') {
            matchesType = textToSearch.includes('clean') || textToSearch.includes('tissue') || textToSearch.includes('water');
        }

        return matchesSearch && matchesType;
    });

    const totalCost = filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const punctureCount = records.filter(r => {
        const cat = (r.category || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const type = (r.maintenanceType || '').toLowerCase();
        
        return cat.includes('puncture') || cat.includes('puncher') || 
               desc.includes('puncture') || desc.includes('puncher') ||
               type.includes('puncture') || type.includes('puncher');
    }).length;

    const washCount = records.filter(r => {
        const cat = (r.category || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        const type = (r.maintenanceType || '').toLowerCase();
        
        const isWashKeyword = cat.includes('wash') || desc.includes('wash') || type.includes('wash');
        const isCarServiceGeneric = type === 'car service' || cat === 'car service (driver entry)';
        const isPuncture = cat.includes('puncture') || cat.includes('puncher') || 
                          desc.includes('puncture') || desc.includes('puncher');
        
        return (isWashKeyword || isCarServiceGeneric) && !isPuncture;
    }).length;

    const interiorOtherCount = records.filter(r => {
        const cat = (r.category || '').toLowerCase();
        const desc = (r.description || '').toLowerCase();
        return cat.includes('clean') || cat.includes('tissue') || cat.includes('water') || cat.includes('other') || 
               desc.includes('clean') || desc.includes('tissue') || desc.includes('water');
    }).length;

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Driver Services" description="Manage car wash, puncture repairs, and other driver-related services." />

            <header style={{ display: 'flex', justifyContent: 'space-between', padding: '30px 0', gap: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }}>
                        <Droplets size={28} color="white" />
                    </div>
                    <div>
                        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '900', margin: 0, letterSpacing: '-1.5px' }}>
                            Driver <span className="text-gradient-green">Services</span>
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600', margin: 0 }}>Wash, Puncture & Maintenance Hub</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="input-field"
                            style={{ height: '48px', width: '120px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        >
                            <option value="All">All Months</option>
                            {[
                                { n: 1, m: 'January' }, { n: 2, m: 'February' }, { n: 3, m: 'March' },
                                { n: 4, m: 'April' }, { n: 5, m: 'May' }, { n: 6, m: 'June' },
                                { n: 7, m: 'July' }, { n: 8, m: 'August' }, { n: 9, m: 'September' },
                                { n: 10, m: 'October' }, { n: 11, m: 'November' }, { n: 12, m: 'December' }
                            ].map(item => (
                                <option key={item.n} value={item.n}>{item.m}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="input-field"
                            style={{ height: '48px', width: '100px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="glass-card" style={{ padding: '0', display: 'flex', alignItems: 'center', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                        <Search size={16} style={{ margin: '0 12px', color: 'rgba(255,255,255,0.3)' }} />
                        <input
                            type="text"
                            placeholder="Search car..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', height: '48px', width: '150px', outline: 'none', fontSize: '13px' }}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        style={{ height: '48px', padding: '0 20px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 15px rgba(16,185,129,0.2)' }}
                    >
                        <PlusCircle size={20} /> ADD SERVICE
                    </button>
                </div>
            </header>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#10b981' }}>
                        <Droplets size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>Total Washes</p>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: 0 }}>{washCount}</h2>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '4px solid #f43f5e' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f43f5e' }}>
                        <AlertCircle size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>Punctures</p>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: 0 }}>{punctureCount}</h2>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '4px solid #6366f1' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6366f1' }}>
                        <Wrench size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>Interior/Other</p>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: 0 }}>{interiorOtherCount}</h2>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '4px solid #facc15' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(250, 204, 21, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#facc15' }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px' }}>Total Spending</p>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: 0 }}>₹{totalCost.toLocaleString()}</h2>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['All', 'Wash', 'Puncture', 'Interior/Other'].map(t => (
                    <button
                        key={t}
                        onClick={() => setSelectedType(t)}
                        style={{ padding: '8px 20px', borderRadius: '10px', background: selectedType === t ? '#10b981' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: selectedType === t ? '#10b981' : 'rgba(255,255,255,0.1)', color: selectedType === t ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}><div className="spinner"></div></div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800' }}>DATE & CAR</th>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800' }}>SERVICE</th>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800' }}>DRIVER</th>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800' }}>VENDOR</th>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800' }}>AMOUNT</th>
                                <th style={{ padding: '15px 20px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((r, idx) => (
                                <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div style={{ color: 'white', fontWeight: '800' }}>{formatDateIST(r.billDate)}</div>
                                        <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>{r.vehicle?.carNumber}</div>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <span style={{ padding: '4px 10px', borderRadius: '6px', background: r.category?.toLowerCase()?.includes('wash') ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: r.category?.toLowerCase()?.includes('wash') ? '#10b981' : '#f43f5e', fontSize: '11px', fontWeight: '900' }}>
                                            {r.category?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px 20px', color: 'white', fontSize: '13px' }}>{r.driver?.name || 'N/A'}</td>
                                    <td style={{ padding: '15px 20px', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{r.garageName || 'Local'}</td>
                                    <td style={{ padding: '15px 20px', color: 'white', fontWeight: '800' }}>₹{r.amount}</td>
                                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            {r.billPhoto && (
                                                <button 
                                                    onClick={() => setSelectedImage(r.billPhoto)}
                                                    style={{ background: 'rgba(14, 165, 233, 0.1)', border: 'none', color: '#0ea5e9', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                                                    title="View Receipt"
                                                >
                                                    <ImageIcon size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => { setEditingId(r._id); setFormData({ ...r, vehicleId: r.vehicle?._id, driverId: r.driver?._id }); setShowModal(true); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><Wrench size={16} /></button>
                                            <button onClick={() => handleDelete(r._id)} style={{ background: 'none', border: 'none', color: '#f43f5e', opacity: 0.5, cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal for Add/Edit */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '30px' }}>
                            <h2 style={{ color: 'white', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Wrench size={24} color="#10b981" /> {editingId ? 'Edit Service' : 'Add Driver Service'}
                            </h2>
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>SELECT VEHICLE</label>
                                        <select value={formData.vehicleId} onChange={e => setFormData({...formData, vehicleId: e.target.value})} className="input-field" required>
                                            <option value="">Choose Car</option>
                                            {vehicles.map(v => <option key={v._id} value={v._id}>{v.carNumber}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>SELECT DRIVER</label>
                                        <select value={formData.driverId} onChange={e => setFormData({...formData, driverId: e.target.value})} className="input-field">
                                            <option value="">Select Driver</option>
                                            {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>SERVICE CATEGORY</label>
                                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-field">
                                            {serviceCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>SERVICE DATE</label>
                                        <input type="date" value={formData.billDate} onChange={e => setFormData({...formData, billDate: e.target.value})} className="input-field" required />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>AMOUNT (₹)</label>
                                        <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="input-field" placeholder="0.00" required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>VENDOR/GARAGE</label>
                                        <input type="text" value={formData.garageName} onChange={e => setFormData({...formData, garageName: e.target.value})} className="input-field" />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', marginBottom: '6px' }}>DESCRIPTION / NOTES</label>
                                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input-field" rows="2" style={{ resize: 'none' }} placeholder="Notes about the service..."></textarea>
                                </div>

                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', marginBottom: '10px' }}>UPLOAD RECEIPT / BILL PHOTO (OPTIONAL)</label>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <label style={{ flex: 1, height: '80px', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }} className="hover-light">
                                            <Upload size={20} color="rgba(255,255,255,0.3)" />
                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginTop: '6px' }}>CLICK TO UPLOAD</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setBillPhoto(file);
                                                        setBillPhotoPreview(URL.createObjectURL(file));
                                                    }
                                                }} 
                                                style={{ display: 'none' }} 
                                            />
                                        </label>
                                        {(billPhotoPreview || formData.billPhoto) && (
                                            <div style={{ width: '80px', height: '80px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                                                <img src={billPhotoPreview || `/${formData.billPhoto}`} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => { setBillPhoto(null); setBillPhotoPreview(null); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}><X size={12} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer' }}>CANCEL</button>
                                    <button type="submit" disabled={submitting} style={{ flex: 2, padding: '14px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer' }}>
                                        {submitting ? 'SAVING...' : editingId ? 'UPDATE SERVICE' : 'SAVE SERVICE'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Lightbox for viewing receipts */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="modal-overlay" onClick={() => setSelectedImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
                            <img src={`/${selectedImage}`} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
                            <button onClick={() => setSelectedImage(null)} style={{ position: 'absolute', top: '-40px', right: '-40px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X size={24} /></button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverServices;
