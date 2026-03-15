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
    MapPin,
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
    const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('All');

    // Form State for Manual Entry
    const [formData, setFormData] = useState({
        vehicleId: '',
        driverId: '',
        maintenanceType: 'Car Service',
        category: 'Car Wash',
        description: '',
        garageName: '',
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
    const [message, setMessage] = useState({ text: '', type: '' });

    const serviceCategories = ['Car Wash', 'Puncture repair'];

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

            let url = `/api/admin/maintenance/${selectedCompany._id}?type=driver_services&`;
            if (filterMode === 'range' && startDate && endDate) {
                url += `startDate=${startDate}&endDate=${endDate}`;
            } else {
                url += `month=${selectedMonth}&year=${selectedYear}`;
            }

            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            
            const filteredData = (data || []).filter(r => {
                const text = `${r.category} ${r.description} ${r.maintenanceType}`.toLowerCase();
                const isTarget = text.includes('wash') || text.includes('puncture') || text.includes('puncher');
                const isExcluded = text.includes('interior');
                return isTarget && !isExcluded;
            });
            setRecords(filteredData);
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
                setMessage({ text: 'Service record updated successfully!', type: 'success' });
            } else {
                await axios.post('/api/admin/maintenance', fd, {
                    headers: { 
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${userInfo.token}` 
                    }
                });
                setMessage({ text: 'New service record added!', type: 'success' });
            }

            setTimeout(() => {
                setShowModal(false);
                resetForm();
                fetchRecords();
                setMessage({ text: '', type: '' });
            }, 1500);
        } catch (err) {
            console.error(err);
            setMessage({ text: err.response?.data?.message || 'Error saving record', type: 'error' });
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
        
        // Search Filter
        const matchesSearch = !searchTerm || (
            r.vehicle?.carNumber?.toLowerCase()?.includes(query) ||
            r.category?.toLowerCase()?.includes(query) ||
            r.description?.toLowerCase()?.includes(query) ||
            r.driver?.name?.toLowerCase()?.includes(query)
        );
        
        // Vehicle Select Filter
        const rVehicleId = r.vehicle?._id || r.vehicle;
        const matchesVehicle = selectedVehicleFilter === 'All' || rVehicleId === selectedVehicleFilter;
        
        // Category Tab Filter
        let matchesType = true;
        const textToSearch = `${r.category} ${r.description} ${r.maintenanceType}`.toLowerCase();

        if (selectedType === 'Wash') {
            matchesType = textToSearch.includes('wash');
        } else if (selectedType === 'Puncture') {
            matchesType = textToSearch.includes('puncture') || textToSearch.includes('puncher');
        }

        return matchesSearch && matchesVehicle && matchesType;
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
        const isInterior = cat.includes('interior') || desc.includes('interior');
        
        return (isWashKeyword || isCarServiceGeneric) && !isPuncture && !isInterior;
    }).length;

    const recordsFilteredForStats = records.filter(r => {
        const text = `${r.category} ${r.description} ${r.maintenanceType}`.toLowerCase();
        return text.includes('wash') || text.includes('puncture') || text.includes('puncher');
    });

    const recentVendors = Array.from(new Set(records.map(r => r.garageName).filter(Boolean)));

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Driver Services" description="Manage car wash, puncture repairs, and other driver-related services." />

            <header style={{ display: 'flex', justifyContent: 'space-between', padding: '40px 0', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 15px 35px rgba(16,185,129,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Droplets size={32} color="white" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
                    </div>
                    <div>
                        <h1 style={{ color: 'white', fontSize: '38px', fontWeight: '950', margin: 0, letterSpacing: '-2px', lineHeight: '1' }}>
                            Driver <span style={{ color: '#10b981' }}>Services</span>
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: '700', margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Wash, Puncture & Maintenance Hub</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <select 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ height: '42px', width: '130px', borderRadius: '12px', background: 'transparent', border: 'none', color: 'white', fontWeight: '800', fontSize: '13px', outline: 'none', cursor: 'pointer', padding: '0 10px' }}
                        >
                            <option value="All" style={{ background: '#0a0a0c' }}>All Months</option>
                            {[
                                { n: 1, m: 'January' }, { n: 2, m: 'February' }, { n: 3, m: 'March' },
                                { n: 4, m: 'April' }, { n: 5, m: 'May' }, { n: 6, m: 'June' },
                                { n: 7, m: 'July' }, { n: 8, m: 'August' }, { n: 9, m: 'September' },
                                { n: 10, m: 'October' }, { n: 11, m: 'November' }, { n: 12, m: 'December' }
                            ].map(item => (
                                <option key={item.n} value={item.n} style={{ background: '#0a0a0c' }}>{item.m}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedYear} 
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{ height: '42px', width: '90px', borderRadius: '12px', background: 'transparent', border: 'none', color: 'white', fontWeight: '800', fontSize: '13px', outline: 'none', cursor: 'pointer', padding: '0 10px' }}
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y} style={{ background: '#0a0a0c' }}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <select 
                            value={selectedVehicleFilter} 
                            onChange={(e) => setSelectedVehicleFilter(e.target.value)}
                            style={{ height: '42px', width: '160px', borderRadius: '12px', background: 'transparent', border: 'none', color: '#10b981', fontWeight: '900', fontSize: '13px', outline: 'none', cursor: 'pointer', padding: '0 10px' }}
                        >
                            <option value="All" style={{ background: '#0a0a0c' }}>All Vehicles</option>
                            {vehicles.map(v => (
                                <option key={v._id} value={v._id} style={{ background: '#0a0a0c' }}>{v.carNumber}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '0 15px' }}>
                        <Search size={18} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', height: '54px', width: '180px', outline: 'none', fontSize: '14px', fontWeight: '600', paddingLeft: '12px' }}
                        />
                    </div>

                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        style={{ height: '54px', padding: '0 25px', borderRadius: '18px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', color: 'white', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(16,185,129,0.3)', transition: 'all 0.3s ease' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <Plus size={20} /> NEW ENTRY
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

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {['All', 'Wash', 'Puncture'].map(t => (
                    <button
                        key={t}
                        onClick={() => setSelectedType(t)}
                        style={{ padding: '8px 20px', borderRadius: '10px', background: selectedType === t ? '#10b981' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: selectedType === t ? '#10b981' : 'rgba(255,255,255,0.1)', color: selectedType === t ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Premium Table Design */}
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)' }}>
                {loading ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto', width: '40px', height: '40px', border: '4px solid rgba(16, 185, 129, 0.1)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        <p style={{ color: 'rgba(255,255,255,0.2)', marginTop: '20px', fontWeight: '700', letterSpacing: '1px' }}>SYNCING RECORDS...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div style={{ padding: '100px 40px', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Search size={32} color="rgba(255,255,255,0.1)" />
                        </div>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '800' }}>No matches found</h3>
                        <p style={{ color: 'rgba(255,255,255,0.3)', margin: '10px 0 0', fontSize: '14px' }}>Try adjusting your filters or search terms.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '25px 30px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'left' }}>Date & Vehicle</th>
                                <th style={{ padding: '25px 30px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'left' }}>Category</th>
                                <th style={{ padding: '25px 30px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'left' }}>Driver & Vendor</th>
                                <th style={{ padding: '25px 30px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'left' }}>Expense</th>
                                <th style={{ padding: '25px 30px', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((r, idx) => (
                                <tr key={r._id} style={{ transition: 'all 0.2s' }} className="table-row-hover">
                                    <td style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>{formatDateIST(r.billDate)}</div>
                                        <div style={{ color: 'white', fontSize: '16px', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Car size={14} color="#10b981" /> {r.vehicle?.carNumber}
                                        </div>
                                    </td>
                                    <td style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: '10px', background: r.category?.toLowerCase()?.includes('wash') ? 'rgba(16,185,129,0.1)' : r.category?.toLowerCase()?.includes('punc') ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)', color: r.category?.toLowerCase()?.includes('wash') ? '#10b981' : r.category?.toLowerCase()?.includes('punc') ? '#f43f5e' : '#6366f1', fontSize: '11px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {r.category || 'Maintenance'}
                                        </div>
                                        {r.description && <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.description}</p>}
                                    </td>
                                    <td style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ color: 'white', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <User size={14} color="rgba(255,255,255,0.2)" /> {r.driver?.name || 'Manual Admin Entry'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ color: '#10b981', fontSize: '18px', fontWeight: '950' }}>₹{r.amount}</div>
                                        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase' }}>{r.paymentMode}</div>
                                    </td>
                                    <td style={{ padding: '25px 30px', borderBottom: '1px solid rgba(255,255,255,0.03)', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            {r.billPhoto && (
                                                <button 
                                                    onClick={() => setSelectedImage(r.billPhoto)}
                                                    style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}
                                                >
                                                    VIEW SLIP
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => { setEditingId(r._id); setFormData({ ...r, vehicleId: r.vehicle?._id, driverId: r.driver?._id }); setShowModal(true); }}
                                                style={{ background: 'rgba(255,255,255,0.03)', border: 'none', color: 'rgba(255,255,255,0.3)', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                                            >
                                                <Wrench size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(r._id)}
                                                style={{ background: 'rgba(244, 63, 94, 0.05)', border: 'none', color: 'rgba(244, 63, 94, 0.4)', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(244, 63, 94, 0.4)'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="text" 
                                                value={formData.garageName} 
                                                onChange={e => setFormData({...formData, garageName: e.target.value})} 
                                                className="input-field" 
                                                placeholder="e.g. Kalyan Tyre Works"
                                                list="recent-vendors"
                                            />
                                            <datalist id="recent-vendors">
                                                {recentVendors.map(v => <option key={v} value={v} />)}
                                            </datalist>
                                        </div>
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

            {/* Premium In-App Receipt Viewer */}
            <AnimatePresence>
                {selectedImage && (
                    <div className="modal-overlay" onClick={() => setSelectedImage(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)' }}
                        >
                            <img 
                                src={selectedImage.startsWith('http') ? selectedImage : `/${selectedImage}`} 
                                alt="Service Receipt" 
                                style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '24px', border: '4px solid rgba(255,255,255,0.1)' }} 
                            />
                            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => setSelectedImage(null)} 
                                    style={{ background: '#f43f5e', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div style={{ position: 'absolute', bottom: '-40px', left: '0', right: '0', textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>CLICK OUTSIDE TO CLOSE</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DriverServices;
