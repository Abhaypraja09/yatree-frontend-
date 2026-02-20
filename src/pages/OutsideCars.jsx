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
    const [ownerFilter, setOwnerFilter] = useState('All');
    const [propertyFilter, setPropertyFilter] = useState('All');

    // Date Filtering - Default to 1st of current month to Today
    const getToday = () => new Date().toISOString().split('T')[0];
    const getOneEightyDaysAgo = () => {
        const d = new Date();
        d.setDate(d.getDate() - 180);
        return d.toISOString().split('T')[0];
    };

    const [fromDate, setFromDate] = useState(getOneEightyDaysAgo());
    const [toDate, setToDate] = useState(getToday());

    // Modal & Editing State
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        carNumber: '',
        model: '',
        property: '',
        dutyType: '',
        ownerName: '',
        dutyAmount: '',
        dropLocation: '',
        date: getToday()
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
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=outside`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles?.filter(v => v.isOutsideCar) || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleOwnerChange = (val) => {
        setOwnerFilter(val);
        setPropertyFilter('All'); // Reset property when owner changes
    };

    const handleOpenLogDuty = () => {
        setEditMode(false);
        setSelectedId(null);
        setFormData({
            carNumber: '',
            model: '',
            property: propertyFilter !== 'All' ? propertyFilter : '',
            dutyType: '',
            ownerName: ownerFilter !== 'All' ? ownerFilter : '',
            dutyAmount: '',
            dropLocation: '',
            date: getToday(),
            isDuplicateToday: false
        });
        setShowModal(true);
    };

    const handleCarNumberChange = (val) => {
        const upVal = val.toUpperCase();
        // Just find any existing vehicle with this number to auto-fill common fields
        const overallExisting = vehicles.find(v => v.carNumber?.split('#')[0] === upVal);

        if (overallExisting) {
            setFormData(prev => ({
                ...prev,
                carNumber: upVal,
                model: overallExisting.model || prev.model,
                ownerName: overallExisting.ownerName || prev.ownerName,
                isDuplicateToday: false // Never block duplicates now
            }));
        } else {
            setFormData(prev => ({ ...prev, carNumber: upVal, isDuplicateToday: false }));
        }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!selectedCompany?._id) return alert("Select a company first!");

            let internalCarNumber = `${formData.carNumber}#${formData.date}`;

            // Add a unique suffix for new entries or when carNumber/date changes in edit mode to avoid collisions
            if (!editMode) {
                internalCarNumber += `#${Math.random().toString(36).substring(2, 7)}`;
            } else if (selectedId) {
                const originalVehicle = vehicles.find(v => v._id === selectedId);
                const oldParts = originalVehicle?.carNumber?.split('#') || [];
                // If the plate and date are the same as before, keep the old unique suffix
                if (formData.carNumber === oldParts[0] && formData.date === oldParts[1] && oldParts[2]) {
                    internalCarNumber += `#${oldParts[2]}`;
                } else {
                    // Plate or date changed, generate new suffix to be safe
                    internalCarNumber += `#${Math.random().toString(36).substring(2, 7)}`;
                }
            }

            let payload = {
                carNumber: internalCarNumber,
                model: formData.model?.trim(),
                property: formData.property?.trim(),
                dutyType: formData.dutyType?.trim() || '',
                ownerName: formData.ownerName?.trim(),
                dutyAmount: Number(formData.dutyAmount) || 0,
                dropLocation: formData.dropLocation?.trim() || '',
                companyId: selectedCompany._id,
                isOutsideCar: true,
                status: 'active',
                createdAt: formData.date
            };

            if (editMode && selectedId) {
                await axios.put(`/api/admin/vehicles/${selectedId}`, payload, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            } else {
                // Always create a new entry for outside cars now (no merging)
                const data = new FormData();
                Object.keys(payload).forEach(key => data.append(key, payload[key]));
                data.append('permitType', 'Contract');
                data.append('carType', 'Other');
                await axios.post('/api/admin/vehicles', data, {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`
                    }
                });
            }

            setShowModal(false);
            setEditMode(false);
            setSelectedId(null);
            setFormData({ ...formData, carNumber: '', dutyAmount: '', dropLocation: '', dutyType: '' });
            fetchOutsideVehicles();
        } catch (err) {
            alert(err.response?.data?.message || 'Error processing duty');
        }
    };

    const handleEdit = (vehicle) => {
        setFormData({
            carNumber: vehicle.carNumber?.split('#')[0] || '',
            model: vehicle.model,
            property: vehicle.property || '',
            dutyType: vehicle.dutyType,
            ownerName: vehicle.ownerName,
            dutyAmount: vehicle.dutyAmount,
            dropLocation: vehicle.dropLocation,
            date: vehicle.carNumber?.split('#')[1] || new Date(vehicle.createdAt).toISOString().split('T')[0]
        });
        setSelectedId(vehicle._id);
        setEditMode(true);
        setShowModal(true);
    };

    const filtered = vehicles.filter(v => {
        const cleanCarNumber = v.carNumber?.split('#')[0] || '';
        const matchesSearch = cleanCarNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.property?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesOwner = ownerFilter === 'All' || v.ownerName?.trim() === ownerFilter?.trim();
        const currentProperty = v.property?.trim().toLowerCase().replace(/\s+/g, ' ');
        const filterProperty = propertyFilter === 'All' ? 'All' : propertyFilter.trim().toLowerCase().replace(/\s+/g, ' ');
        const matchesProperty = propertyFilter === 'All' || currentProperty === filterProperty;

        // Date Range Logic
        const dutyTagDateStr = v.carNumber?.split('#')[1];
        if (!dutyTagDateStr) return false;

        const matchesDate = dutyTagDateStr >= fromDate && dutyTagDateStr <= toDate;

        return matchesSearch && matchesOwner && matchesProperty && matchesDate;
    }).sort((a, b) => {
        const dateA = a.carNumber?.split('#')[1] || '';
        const dateB = b.carNumber?.split('#')[1] || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const totalPayable = filtered.reduce((sum, v) => sum + (v ? (Number(v.dutyAmount) || 0) : 0), 0);
    const totalDutiesCount = filtered.reduce((sum, v) => sum + (v?.dutyType ? v.dutyType.split(' + ').filter(Boolean).length : 0), 0);

    // Cascading unique drivers based on proprietor selection
    const uniqueOwners = [...new Set(vehicles.map(v => v.ownerName?.trim()).filter(Boolean))].sort();

    // Create unique properties list, normalizing to avoid duplicates in dropdown but keeping original casing for display
    const uniqueProperties = Object.values(vehicles
        .filter(v => ownerFilter === 'All' || v.ownerName?.trim() === ownerFilter?.trim())
        .reduce((acc, v) => {
            const prop = v.property?.trim();
            if (prop) {
                // Key is normalized (lowercase, single spaces) to dedup
                const key = prop.toLowerCase().replace(/\s+/g, ' ');
                // Value is the first occurrence's formatting (or arguably the most common, but first is simpler)
                if (!acc[key]) acc[key] = prop;
            }
            return acc;
        }, {})).sort();

    const carNumberSuggestions = [...new Set(vehicles.map(v => v.carNumber?.split('#')[0]).filter(Boolean))];
    const dutyTypeSuggestions = [...new Set(vehicles.map(v => v.dutyType).filter(Boolean))];
    const dropLocationSuggestions = [...new Set(vehicles.map(v => v.dropLocation).filter(Boolean))];

    const formatDateDisplay = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="container-fluid" style={{ paddingBottom: '60px' }}>
            <SEO title="Outside Fleet Command" description="Manage external vehicles and freelancer drivers for specific duties." />

            <header style={{ paddingBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                <div className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)', boxShadow: '0 0 10px var(--secondary)' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Logistics Monitor</span>
                        </div>
                        <h1 className="resp-title" style={{ margin: 0, fontWeight: '900', letterSpacing: '-1.5px' }}>
                            Outside <span style={{ color: 'var(--secondary)' }}>Fleet</span>
                        </h1>
                        <p className="resp-subtitle" style={{ marginTop: '4px', fontSize: '13px' }}>
                            External assets from <b>{formatDateDisplay(fromDate)}</b> to <b>{formatDateDisplay(toDate)}</b>
                        </p>
                    </div>

                    <div className="flex-resp" style={{ gap: '12px' }}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '12px 20px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '130px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#818cf8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Total Payable</span>
                            <span style={{ color: 'white', fontSize: '18px', fontWeight: '900' }}>₹{totalPayable.toLocaleString()}</span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '12px 20px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '130px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#34d399', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Duties Logged</span>
                            <span style={{ color: 'white', fontSize: '18px', fontWeight: '900' }}>{totalDutiesCount} Records</span>
                        </motion.div>
                    </div>
                </div>

                <div className="grid-1-2-2-4" style={{ marginTop: '30px', gap: '15px' }}>
                    <div className="input-field-group">
                        <label className="input-label">From Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            style={{ height: '48px', marginBottom: 0 }}
                        />
                    </div>
                    <div className="input-field-group">
                        <label className="input-label">To Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            style={{ height: '48px', marginBottom: 0 }}
                        />
                    </div>
                    <div className="input-field-group">
                        <label className="input-label">Owner Hub</label>
                        <select
                            value={ownerFilter}
                            onChange={(e) => handleOwnerChange(e.target.value)}
                            className="input-field"
                            style={{ height: '48px', marginBottom: 0, appearance: 'auto' }}
                        >
                            <option value="All">All Owners</option>
                            {uniqueOwners.map(owner => (
                                <option key={owner} value={owner} style={{ background: '#0f172a' }}>{owner}</option>
                            ))}
                        </select>
                    </div>
                    <div className="input-field-group">
                        <label className="input-label">Property Hub</label>
                        <select
                            value={propertyFilter}
                            onChange={(e) => setPropertyFilter(e.target.value)}
                            className="input-field"
                            style={{ height: '48px', marginBottom: 0, appearance: 'auto' }}
                        >
                            <option value="All">All Properties</option>
                            {uniqueProperties.map(p => (
                                <option key={p} value={p} style={{ background: '#0f172a' }}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                    <button
                        onClick={async () => {
                            const XLSX = await import('xlsx-js-style');
                            const reportData = filtered.map(v => ({
                                'Property': v.property || '',
                                'Owner': v.ownerName || '',
                                'Date': (() => {
                                    const rawDate = v.carNumber?.split('#')[1] || v.createdAt;
                                    if (!rawDate) return '';
                                    const d = new Date(rawDate);
                                    return d.toLocaleDateString('en-GB'); // dd/mm/yyyy
                                })(),
                                'Vehicle Details': `${v.model || ''} - ${v.carNumber?.split('#')[0] || ''}`,
                                'Drop Location': v.dropLocation?.replace(/ \| /g, ' ➜ ') || '',
                                'Service Type': v.dutyType || '',
                                'Amount': Number(v.dutyAmount) || 0
                            }));

                            // Add Total Row
                            const totalAmount = reportData.reduce((sum, row) => sum + row.Amount, 0);
                            reportData.push({
                                'Property': '',
                                'Owner': '',
                                'Date': '',
                                'Vehicle Details': '',
                                'Drop Location': '',
                                'Service Type': 'TOTAL PAYABLE',
                                'Amount': totalAmount
                            });

                            const ws = XLSX.utils.json_to_sheet(reportData);

                            // Styling
                            const range = XLSX.utils.decode_range(ws['!ref']);
                            for (let C = range.s.c; C <= range.e.c; ++C) {
                                let maxWidth = 10;
                                for (let R = range.s.r; R <= range.e.r; ++R) {
                                    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                                    if (!cell) continue;

                                    cell.s = { alignment: { horizontal: 'center', vertical: 'center' }, font: { name: 'Arial', sz: 10 } };

                                    // Header Styling
                                    if (R === 0) {
                                        cell.s.font.bold = true;
                                        cell.s.fill = { fgColor: { rgb: "4F46E5" } }; // Indigo-600
                                        cell.s.font.color = { rgb: "FFFFFF" };
                                    }

                                    // Data Alignment
                                    if (C === 6) cell.s.alignment.horizontal = 'right'; // Amount column

                                    // Total Row Styling
                                    if (R === range.e.r) {
                                        cell.s.font.bold = true;
                                        cell.s.fill = { fgColor: { rgb: "E0E7FF" } }; // Indigo-100
                                    }

                                    if (cell.v) maxWidth = Math.max(maxWidth, cell.v.toString().length + 5);
                                }
                                if (!ws['!cols']) ws['!cols'] = [];
                                ws['!cols'][C] = { wch: maxWidth };
                            }

                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Outside Fleet Log");
                            XLSX.writeFile(wb, `Outside_Fleet_Report_${fromDate}_to_${toDate}.xlsx`);
                        }}
                        className="glass-card-hover-effect"
                        style={{
                            height: '52px',
                            padding: '0 20px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderRadius: '12px'
                        }}
                    >
                        <Save size={20} /> Excel
                    </button>
                    <button
                        onClick={handleOpenLogDuty}
                        className="glass-card-hover-effect"
                        style={{
                            height: '52px',
                            padding: '0 25px',
                            background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                            fontWeight: '800',
                            fontSize: '14px',
                            letterSpacing: '0.5px'
                        }}
                    >
                        <Plus size={20} /> Add Entry
                    </button>
                </div>
            </header>

            <div className="glass-card hide-mobile" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', padding: '0 10px', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ textAlign: 'left' }}>
                            <th style={{ padding: '10px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Timeline</th>
                            <th style={{ padding: '10px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle Identification</th>
                            <th style={{ padding: '10px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Service Detail</th>
                            <th style={{ padding: '10px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Entities</th>
                            <th style={{ padding: '10px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Settlement</th>
                            <th style={{ padding: '10px 25px', color: 'var(--text-muted)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}>
                                <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                                <p style={{ color: 'var(--text-muted)', fontWeight: '700' }}>FETCHING LOGS...</p>
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '120px 0' }}>
                                <Car size={60} style={{ opacity: 0.1, color: 'var(--secondary)', marginBottom: '20px' }} />
                                <h3 style={{ color: 'white', fontWeight: '800' }}>No Duties Logged</h3>
                                <p style={{ color: 'var(--text-muted)' }}>The fleet is currently idle for the selected filters.</p>
                            </td></tr>
                        ) : filtered.map((v, idx) => (
                            <motion.tr
                                key={v._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="glass-card-hover-effect"
                                style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px' }}
                            >
                                <td style={{ padding: '20px 25px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                                    <div style={{ color: 'white', fontWeight: '900', fontSize: '16px', letterSpacing: '-0.5px' }}>
                                        {(() => {
                                            const parts = v.carNumber?.split('#');
                                            if (parts && parts[1]) {
                                                const [y, m, d] = parts[1].split('-');
                                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
                                            }
                                            return new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                        })()}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 25px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ fontWeight: '900', fontSize: '18px', color: 'white', letterSpacing: '0.5px' }}>{v.carNumber?.split('#')[0]}</div>
                                        {v.dutyType?.includes(' + ') && (
                                            <span style={{ fontSize: '9px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '3px 8px', borderRadius: '6px', fontWeight: '900', border: '1px solid rgba(165, 180, 252, 0.2)' }}>COMBINED</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{v.model}</div>
                                </td>
                                <td style={{ padding: '20px 25px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {v.dutyType?.split(' + ').map((type, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)' }}></div>
                                                <span style={{ fontSize: '12px', color: 'white', fontWeight: '700' }}>{type}</span>
                                                {v.dropLocation?.split(' | ')[i] && (
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>➜ {v.dropLocation.split(' | ')[i]}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 25px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>{v.property || 'N/A'}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>Owner: {v.ownerName}</div>
                                </td>
                                <td style={{ padding: '20px 25px' }}>
                                    <div style={{ display: 'inline-flex', padding: '10px 18px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                        <span style={{ color: '#10b981', fontWeight: '900', fontSize: '18px' }}>₹{v.dutyAmount?.toLocaleString()}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 25px', textAlign: 'right', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleEdit(v)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}><Search size={16} /></button>
                                        <button onClick={() => handleDelete(v._id)} style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '10px', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.1)' }}><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="show-mobile">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                        <div className="spinner"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '120px 20px', border: '2px dashed rgba(255,255,255,0.05)', background: 'transparent' }}>
                        <Car size={60} style={{ opacity: 0.1, color: 'var(--secondary)', marginBottom: '20px', margin: '0 auto' }} />
                        <h3 style={{ color: 'white', fontWeight: '800' }}>No Duties Logged</h3>
                        <p style={{ color: 'var(--text-muted)' }}>The fleet is currently idle for the selected filters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filtered.map((v, idx) => (
                            <motion.div
                                key={v._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-card"
                                style={{
                                    padding: '20px',
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    borderRadius: '18px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'var(--secondary)', filter: 'blur(60px)', opacity: 0.05 }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '18px', fontWeight: '900', color: 'white', letterSpacing: '0.5px' }}>{v.carNumber?.split('#')[0]}</span>
                                            {v.dutyType?.includes(' + ') && (
                                                <span style={{ fontSize: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '2px 6px', borderRadius: '4px', fontWeight: '900', textTransform: 'uppercase' }}>Combined</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{v.model}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#10b981', fontWeight: '900', fontSize: '20px' }}>₹{v.dutyAmount?.toLocaleString()}</div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase' }}>Payout</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '2px' }}>Client Property</div>
                                        <div style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{v.property || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '2px' }}>Owner</div>
                                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: '600' }}>{v.ownerName}</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '6px' }}>Duty Timeline</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {v.dutyType?.split(' + ').map((type, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                <div style={{ marginTop: '4px', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)' }}></div>
                                                <div>
                                                    <div style={{ fontSize: '13px', color: 'white', fontWeight: '700' }}>{type}</div>
                                                    {v.dropLocation?.split(' | ')[i] && (
                                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>➜ {v.dropLocation.split(' | ')[i]}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '11px', color: 'white', fontWeight: '700' }}>
                                            {(() => {
                                                const parts = v.carNumber?.split('#');
                                                if (parts && parts[1]) {
                                                    const [y, m, d] = parts[1].split('-');
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
                                                }
                                                return new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                                            })()}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                            Entry Time: {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEdit(v)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}><Search size={16} /></button>
                                        <button onClick={() => handleDelete(v._id)} style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '10px', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.1)' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Refactored */}
            <AnimatePresence>
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 1050, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '0', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', overflow: 'hidden' }}>
                            <div style={{ padding: '30px', background: 'linear-gradient(to right, #1e293b, #0f172a)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '20px', margin: 0, fontWeight: '800' }}>{editMode ? 'Update Voucher' : 'New Duty Entry'}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', margin: 0 }}>Log details for outside vehicle & driver</p>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '50%', padding: '10px', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                            </div>


                            <form onSubmit={handleSubmit} style={{ padding: '30px', display: 'grid', gap: '20px' }}>

                                {/* Section 1: Vehicle & Owner */}
                                <div className="form-grid-2">
                                    <div className="input-field-group">
                                        <label className="input-label" style={{ color: '#94a3b8' }}>Vehicle Number</label>
                                        <input type="text" list="carCodes" className="input-field" required disabled={editMode} value={formData.carNumber} onChange={(e) => handleCarNumberChange(e.target.value)} placeholder="DL-01..." style={{ background: 'rgba(255,255,255,0.02)' }} />
                                        <datalist id="carCodes">{carNumberSuggestions.map((opt, i) => <option key={i} value={opt} />)}</datalist>
                                    </div>
                                    <div className="input-field-group">
                                        <label className="input-label" style={{ color: '#94a3b8' }}>Model</label>
                                        <input type="text" className="input-field" required value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="e.g. Innova" style={{ background: 'rgba(255,255,255,0.02)' }} />
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="input-field-group">
                                        <label className="input-label" style={{ color: '#94a3b8' }}>Proprietor (Owner)</label>
                                        <input type="text" className="input-field" required value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} placeholder="Company Name" style={{ background: 'rgba(255,255,255,0.02)' }} />
                                    </div>
                                    <div className="input-field-group">
                                        <label className="input-label" style={{ color: '#94a3b8' }}>Property (Client)</label>
                                        <input type="text" className="input-field" required value={formData.property} onChange={(e) => setFormData({ ...formData, property: e.target.value })} placeholder="e.g. Hotel Taj" style={{ background: 'rgba(255,255,255,0.02)' }} />
                                    </div>
                                </div>
                                <div className="input-field-group">
                                    <label className="input-label" style={{ color: '#94a3b8' }}>Duty Date</label>
                                    <input type="date" className="input-field" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ background: 'rgba(255,255,255,0.02)' }} />
                                </div>

                                {/* Section 2: Trip Details */}
                                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)', display: 'grid', gap: '20px' }}>
                                    <div className="form-grid-2">
                                        <div className="input-field-group">
                                            <label className="input-label" style={{ color: '#94a3b8' }}>Service Type</label>
                                            <input type="text" list="serviceTypes" className="input-field" value={formData.dutyType} onChange={(e) => setFormData({ ...formData, dutyType: e.target.value })} placeholder="e.g. Airport Drop" />
                                            <datalist id="serviceTypes">{dutyTypeSuggestions.map((opt, i) => <option key={i} value={opt} />)}</datalist>
                                        </div>
                                        <div className="input-field-group">
                                            <label className="input-label" style={{ color: '#10b981', fontWeight: '700' }}>Settlement Amount (₹)</label>
                                            <input type="number" className="input-field" required value={formData.dutyAmount} onChange={(e) => setFormData({ ...formData, dutyAmount: e.target.value })} style={{ fontWeight: '800', color: 'var(--secondary)', fontSize: '18px' }} placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div className="input-field-group">
                                        <label className="input-label" style={{ color: '#94a3b8' }}>Drop Location / Terminal</label>
                                        <input type="text" list="points" className="input-field" value={formData.dropLocation} onChange={(e) => setFormData({ ...formData, dropLocation: e.target.value })} placeholder="Specific location detail..." />
                                        <datalist id="points">{dropLocationSuggestions.map((opt, i) => <option key={i} value={opt} />)}</datalist>
                                    </div>
                                </div>

                                <button type="submit" className="glass-card-hover-effect" style={{ marginTop: '10px', height: '60px', borderRadius: '16px', fontSize: '16px', fontWeight: '800', letterSpacing: '1px', background: 'linear-gradient(135deg, var(--primary), #4f46e5)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 10px 30px rgba(79, 70, 229, 0.3)' }}>
                                    {editMode ? 'UPDATE RECORD' : 'CONFIRM ENTRY'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default OutsideCars;