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
    MapPin,
    Clock,
    CreditCard,
    AlertCircle,
    CheckCircle2,
    History,
    Car,
    Filter,
    ChevronDown,
    Upload,
    FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const Maintenance = () => {
    const { selectedCompany } = useCompany();
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [alerts, setAlerts] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        vehicleId: '',
        maintenanceType: 'Regular Service',
        category: '',
        partsChanged: [],
        description: '',
        garageName: '',
        billNumber: '',
        billDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMode: 'Cash',
        currentKm: '',
        nextServiceKm: '',
        status: 'Completed'
    });
    const [billPhoto, setBillPhoto] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showNextService, setShowNextService] = useState(false);

    const maintenanceTypes = [
        'Regular Service',
        'Engine & Mechanical',
        'Tyres & Wheels',
        'Brake System',
        'Electrical & Battery',
        'AC & Cooling',
        'Body & Interior',
        'Other'
    ];

    const subCategories = {
        'Regular Service': ['Engine oil change', 'Oil filter', 'Air filter', 'Fuel filter', 'General servicing'],
        'Engine & Mechanical': ['Clutch plate', 'Gearbox repair', 'Engine overhaul', 'Timing belt', 'Mountings'],
        'Tyres & Wheels': ['New tyre purchase', 'Tyre rotation', 'Alignment & Balancing', 'Puncture repair'],
        'Brake System': ['Brake pads', 'Brake shoe', 'Disc/Drum', 'Brake oil'],
        'Electrical & Battery': ['Battery replacement', 'Alternator', 'Starter motor', 'Wiring', 'Lights'],
        'AC & Cooling': ['AC gas refill', 'Compressor repair', 'Radiator service', 'Coolant top-up'],
        'Body & Interior': ['Denting painting', 'Seat covers', 'Dashboard repair', 'Mirror/Glass', 'Wipers']
    };

    useEffect(() => {
        if (selectedCompany) {
            fetchRecords();
            fetchVehicles();
            fetchAlerts();
        }
    }, [selectedCompany, selectedMonth, selectedYear]);

    const fetchAlerts = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/dashboard/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            // We only care about Service alerts
            const serviceAlerts = (data.expiringAlerts || []).filter(a => a.type === 'Service');
            setAlerts(serviceAlerts);
        } catch (err) {
            console.error('Error fetching alerts', err);
        }
    };

    const fetchRecords = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/maintenance/${selectedCompany._id}?month=${selectedMonth}&year=${selectedYear}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setRecords(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'partsChanged') {
                    fd.append(key, JSON.stringify(formData[key]));
                } else if (key === 'nextServiceKm' && (!showNextService || !formData[key])) {
                    // Skip if hidden or empty
                } else {
                    fd.append(key, formData[key]);
                }
            });
            fd.append('companyId', selectedCompany._id);
            if (billPhoto) fd.append('billPhoto', billPhoto);

            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.post('/api/admin/maintenance', fd, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`
                }
            });

            setShowModal(false);
            setShowNextService(false);
            resetForm();
            fetchRecords();
            alert('Maintenance record added successfully');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving record');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this record?')) return;
        try {
            const userInfoStr = localStorage.getItem('userInfo');
            const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
            if (!userInfo?.token) return;

            await axios.delete(`/api/admin/maintenance/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchRecords();
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setFormData({
            vehicleId: '',
            maintenanceType: 'Regular Service',
            category: '',
            partsChanged: [],
            description: '',
            garageName: '',
            billNumber: '',
            billDate: new Date().toISOString().split('T')[0],
            amount: '',
            paymentMode: 'Cash',
            currentKm: '',
            nextServiceKm: '',
            status: 'Completed'
        });
        setBillPhoto(null);
        setShowNextService(false);
    };

    const downloadExcel = () => {
        const dataToExport = filteredRecords.map(r => ({
            'Bill Date': r.billDate ? new Date(r.billDate).toLocaleDateString('en-IN') : 'N/A',
            'Vehicle': r.vehicle?.carNumber || 'N/A',
            'Maintenance Type': r.maintenanceType,
            'Sub-Category': r.category || 'N/A',
            'Garage Name': r.garageName || r.vendorName || 'N/A',
            'Bill Number': r.billNumber || 'N/A',
            'Amount (₹)': r.amount || 0,
            'KM Reading': r.currentKm || 'N/A',
            'Payment Mode': r.paymentMode,
            'Description': r.description || 'N/A',
            'Next Service KM': r.nextServiceKm || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Maintenance Logs');
        XLSX.writeFile(wb, `Maintenance_Report_${selectedCompany?.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const filteredRecords = (records || []).filter(r => {
        const matchesSearch = (r.vehicle?.carNumber?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            r.maintenanceType?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            r.garageName?.toLowerCase()?.includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'All' || r.maintenanceType === filterType;
        return matchesSearch && matchesType;
    });

    const totalMaintenanceCost = filteredRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Vehicle Maintenance" description="Track and manage your fleet's maintenance schedules and repair histories." />

            {/* Header Section */}
            <header className="flex-resp" style={{
                justifyContent: 'space-between',
                padding: '30px 0',
                gap: '20px',
                flexWrap: 'wrap'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 10px #0ea5e9' }}></div>
                        <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Asset Care</span>
                    </div>
                    <h1 className="resp-title" style={{ color: 'white', margin: 0, letterSpacing: '-1px', fontSize: 'clamp(24px, 5vw, 32px)' }}>
                        Vehicle <span className="text-gradient-blue">Maintenance</span>
                    </h1>
                </div>

                <div className="flex-resp mobile-search-row" style={{ gap: '15px', flex: '1', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="input-field"
                            style={{ height: '50px', width: '130px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px' }}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1} style={{ background: '#0f172a' }}>
                                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="input-field"
                            style={{ height: '50px', width: '100px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px' }}
                        >
                            {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - 2 + i;
                                return <option key={year} value={year} style={{ background: '#0f172a' }}>{year}</option>;
                            })}
                        </select>
                    </div>
                    <div className="glass-card" style={{ padding: '0', display: 'flex', alignItems: 'center', width: '100%', maxWidth: '300px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', flex: 1 }}>
                        <Search size={18} style={{ margin: '0 15px', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Search by car, type, garage..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: 'transparent', border: 'none', color: 'white', height: '50px', width: '100%', outline: 'none', fontSize: '14px'
                            }}
                        />
                    </div>
                    <button
                        className="btn-primary"
                        onClick={downloadExcel}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '52px', padding: '0 20px', borderRadius: '14px', fontWeight: '800', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        <FileSpreadsheet size={18} /> <span className="hide-mobile">Export Excel</span><span className="show-mobile">Excel</span>
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => setShowModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '52px', padding: '0 25px', borderRadius: '14px', fontWeight: '800', whiteSpace: 'nowrap' }}
                    >
                        <Plus size={20} /> <span className="hide-mobile">Add Record</span><span className="show-mobile">Add</span>
                    </button>
                </div>
            </header>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                        <AlertCircle color="#f43f5e" size={20} />
                        <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Critical Service Alerts
                        </h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                        {alerts.map((alert, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card"
                                style={{
                                    padding: '15px',
                                    border: `1px solid ${alert.daysLeft < 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                    background: `linear-gradient(145deg, ${alert.daysLeft < 0 ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'}, rgba(15, 23, 42, 0.2))`,
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: 'white', fontWeight: '800', fontSize: '15px' }}>{alert.identifier}</span>
                                    <span style={{
                                        fontSize: '10px',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        background: alert.daysLeft < 0 ? '#f43f5e' : '#f59e0b',
                                        color: 'white',
                                        fontWeight: '800'
                                    }}>
                                        {alert.expiryDate ? (
                                            alert.daysLeft < 0 ? `${Math.abs(alert.daysLeft)}d Overdue` : `${alert.daysLeft}d Left`
                                        ) : (
                                            alert.daysLeft <= 0 ? `${Math.abs(alert.daysLeft)} KM Over` : `${alert.daysLeft} KM Left`
                                        )}
                                    </span>
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
                                    {alert.documentType}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                        {alert.expiryDate ? (
                                            <>Due Date: <span style={{ color: 'white' }}>{new Date(alert.expiryDate).toLocaleDateString('en-IN')}</span></>
                                        ) : (
                                            <>Current: <span style={{ color: 'white' }}>{alert.currentKm} KM</span></>
                                        )}
                                    </div>
                                    <a
                                        href={`https://wa.me/916367466426?text=${encodeURIComponent(
                                            alert.expiryDate
                                                ? `REMINDER: Vehicle ${alert.identifier} is due for ${alert.documentType} on ${new Date(alert.expiryDate).toLocaleDateString()}.`
                                                : `REMINDER: Vehicle ${alert.identifier} is due for ${alert.documentType}. Current KM: ${alert.currentKm}, Target KM: ${alert.targetKm}.`
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            background: 'rgba(37, 211, 102, 0.1)',
                                            color: '#25D366',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            textDecoration: 'none',
                                            border: '1px solid rgba(37, 211, 102, 0.2)'
                                        }}
                                    >
                                        REMIND
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#0ea5e9' }}>
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Total Spend (Filtered)</p>
                        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>₹{totalMaintenanceCost.toLocaleString()}</h2>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#10b981' }}>
                        <History size={20} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Total Records</p>
                        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '900', margin: 0 }}>{filteredRecords.length}</h2>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f59e0b' }}>
                        <Filter size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Category Filter</p>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: '700', fontSize: '14px', width: '100%', outline: 'none', cursor: 'pointer', textOverflow: 'ellipsis' }}
                        >
                            <option value="All" style={{ background: '#1e293b', color: 'white' }}>All Categories</option>
                            {maintenanceTypes.map(t => <option key={t} value={t} style={{ background: '#1e293b', color: 'white' }}>{t}</option>)}
                        </select>
                    </div>
                </motion.div>
            </div>

            {/* Desktop Table */}
            <div className="glass-card hide-mobile" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
                {loading ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                        <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Loading service history...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div style={{ padding: '100px', textAlign: 'center' }}>
                        <Wrench size={48} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '20px' }} />
                        <h3 style={{ color: 'white' }}>No maintenance records found</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Start by adding a new service or repair record.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Date & Vehicle</th>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Service Details</th>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Garage / Vendor</th>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Cost & Pay</th>
                                <th style={{ padding: '20px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((record, idx) => (
                                <motion.tr
                                    key={record._id || idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                >
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>
                                            {record.billDate ? new Date(record.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                            <Car size={12} style={{ color: 'var(--primary)' }} />
                                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>{record.vehicle?.carNumber || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: '#818cf8',
                                                fontWeight: '800',
                                                textTransform: 'uppercase'
                                            }}>{record.maintenanceType}</span>
                                        </div>
                                        <div style={{ color: 'white', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>
                                            {record.category || 'General Repair'}
                                        </div>
                                        {record.currentKm && (
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                                At {Number(record.currentKm).toLocaleString()} KM
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>{record.garageName || record.vendorName || 'Self/Local'}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                            Bill: {record.billNumber || 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px' }}>
                                        <div style={{ color: '#10b981', fontWeight: '800', fontSize: '16px' }}>₹{Number(record.amount || 0).toLocaleString()}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                            via {record.paymentMode}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 25px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {record.billPhoto && (
                                                <button
                                                    onClick={() => window.open(record.billPhoto)}
                                                    className="glass-card-hover-effect"
                                                    style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                    title="View Bill"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(record._id)}
                                                className="glass-card-hover-effect"
                                                style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                                title="Delete Entry"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="show-mobile">
                <AnimatePresence>
                    {loading ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <div className="spinner" style={{ margin: '0 auto' }}></div>
                            <p style={{ color: 'var(--text-muted)', marginTop: '15px' }}>Loading...</p>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                            <Wrench size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '15px' }} />
                            <h3 style={{ color: 'white', fontSize: '16px' }}>No records found</h3>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {filteredRecords.map((record, idx) => (
                                <motion.div
                                    key={record._id || idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card"
                                    style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '14px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: '800', fontSize: '14px' }}>
                                                {record.billDate ? new Date(record.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <Car size={12} style={{ color: 'var(--primary)' }} />
                                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>{record.vehicle?.carNumber || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#10b981', fontWeight: '800', fontSize: '16px' }}>₹{Number(record.amount || 0).toLocaleString()}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{record.paymentMode}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: '#818cf8',
                                                fontWeight: '800',
                                                textTransform: 'uppercase'
                                            }}>{record.maintenanceType}</span>
                                            {record.currentKm && (
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {Number(record.currentKm).toLocaleString()} KM
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{record.category || 'General Repair'}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                            Garage: <span style={{ color: 'white' }}>{record.garageName || record.vendorName || 'Self'}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {record.billPhoto && (
                                            <button
                                                onClick={() => window.open(record.billPhoto)}
                                                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                            >
                                                <FileText size={14} /> View Bill
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(record._id)}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Add Record Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-card"
                            style={{
                                padding: '0',
                                width: '100%',
                                maxWidth: '800px',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                background: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: 0 }}>Add Maintenance Record</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>Log repairs, services, and part replacements.</p>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', border: 'none' }}><Plus size={20} style={{ transform: 'rotate(45deg)' }} /></button>
                            </div>


                            <form onSubmit={handleCreate} style={{ padding: '30px' }}>
                                <div className="form-grid-2">
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Select Vehicle *</label>
                                        <select
                                            className="input-field"
                                            value={formData.vehicleId}
                                            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                                            required
                                        >
                                            <option value="" style={{ background: '#1e293b', color: 'white' }}>-- Choose Car --</option>
                                            {(vehicles || []).map(v => <option key={v._id} value={v._id} style={{ background: '#1e293b', color: 'white' }}>{v.carNumber} ({v.model})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Maintenance Type *</label>
                                        <select
                                            className="input-field"
                                            value={formData.maintenanceType}
                                            onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value, category: '' })}
                                            required
                                        >
                                            {maintenanceTypes.map(t => <option key={t} value={t} style={{ background: '#1e293b', color: 'white' }}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Sub-Category</label>
                                        <select
                                            className="input-field"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="" style={{ background: '#1e293b', color: 'white' }}>Select Category</option>
                                            {(subCategories[formData.maintenanceType] || []).map(c => <option key={c} value={c} style={{ background: '#1e293b', color: 'white' }}>{c}</option>)}
                                            <option value="Other" style={{ background: '#1e293b', color: 'white' }}>Other / Custom</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Current KM Reading</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="e.g. 45000"
                                            value={formData.currentKm}
                                            onChange={(e) => setFormData({ ...formData, currentKm: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '25px' }}>
                                    <label style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Maintenance Description</label>
                                    <textarea
                                        className="input-field"
                                        style={{ height: '80px', paddingTop: '12px' }}
                                        placeholder="Detailed notes about the work done..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    ></textarea>
                                </div>

                                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                                    <p style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Workshop & Billing</p>
                                    <div className="form-grid-3">
                                        <div>
                                            <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Garage Name</label>
                                            <input className="input-field" placeholder="e.g. Bosch Service" value={formData.garageName} onChange={(e) => setFormData({ ...formData, garageName: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Bill Number</label>
                                            <input className="input-field" placeholder="INV-001" value={formData.billNumber} onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Bill Date</label>
                                            <input type="date" className="input-field" value={formData.billDate} onChange={(e) => setFormData({ ...formData, billDate: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-grid-3">
                                        <div>
                                            <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Amount *</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>₹</span>
                                                <input type="number" className="input-field" style={{ paddingLeft: '30px' }} placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Payment Mode</label>
                                            <select className="input-field" value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}>
                                                <option value="Cash" style={{ background: '#1e293b', color: 'white' }}>Cash</option>
                                                <option value="UPI" style={{ background: '#1e293b', color: 'white' }}>UPI / GPay</option>
                                                <option value="Bank Transfer" style={{ background: '#1e293b', color: 'white' }}>Bank Transfer</option>
                                                <option value="Credit Card" style={{ background: '#1e293b', color: 'white' }}>Credit Card</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ color: 'white', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Bill Photo</label>
                                            <input type="file" onChange={(e) => setBillPhoto(e.target.files[0])} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div style={{ padding: '20px', background: showNextService ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)', borderRadius: '16px', border: showNextService ? '1px solid rgba(16, 185, 129, 0.1)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s ease' }}>
                                        <div
                                            onClick={() => setShowNextService(!showNextService)}
                                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: showNextService ? '15px' : '0' }}
                                        >
                                            <p style={{ color: showNextService ? '#10b981' : 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>Next Service Reminder</p>
                                            <div style={{ width: '40px', height: '20px', background: showNextService ? '#10b981' : 'rgba(255,255,255,0.1)', borderRadius: '20px', position: 'relative', transition: 'all 0.3s ease' }}>
                                                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: showNextService ? '22px' : '2px', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}></div>
                                            </div>
                                        </div>

                                        {showNextService && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ display: 'grid', gap: '15px' }}>
                                                <input type="number" className="input-field" placeholder="Next Service KM" value={formData.nextServiceKm} onChange={(e) => setFormData({ ...formData, nextServiceKm: e.target.value })} />
                                            </motion.div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="btn-primary"
                                            style={{ height: '60px', borderRadius: '16px', fontSize: '16px', fontWeight: '900' }}
                                        >
                                            {submitting ? 'Saving Record...' : 'Save Maintenance Entry'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            style={{ height: '50px', background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', cursor: 'pointer' }}
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Maintenance;
