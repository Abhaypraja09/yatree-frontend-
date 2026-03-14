import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Search, Trash2, Car, X, Save, ChevronLeft, ChevronRight, Calendar, Edit, MapPin, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';
import { todayIST, toISTDateString, firstDayOfMonthIST, formatDateIST, nowIST } from '../utils/istUtils';

const OutsideCars = () => {
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('All');
    const [propertyFilter, setPropertyFilter] = useState('All');

    const [isRange, setIsRange] = useState(false);
    const [fromDate, setFromDate] = useState(firstDayOfMonthIST());
    const [toDate, setToDate] = useState(todayIST());

    /* navigate dates */
    const shiftDays = (n) => {
        const f = nowIST(fromDate);
        f.setUTCDate(f.getUTCDate() + n);
        const fStr = f.toISOString().split('T')[0];
        setFromDate(fStr);
        if (!isRange) setToDate(fStr);
    };

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
        date: todayIST()
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
            setVehicles(data.vehicles?.filter(v => v.isOutsideCar && !v.eventId) || []);
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
            date: todayIST(),
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
            date: vehicle.carNumber?.split('#')[1] || toISTDateString(vehicle.createdAt)
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
        return formatDateIST(dateStr);
    };

    return (
        <div className="container-fluid" style={{ paddingBottom: '60px' }}>
            <SEO title="Outside Fleet Command" description="Manage external vehicles and freelancer drivers for specific duties." />

            {/* ═══ PREMIUM DYNAMIC HEADER ═══ */}
            <header style={{ 
                padding: 'clamp(24px, 5vw, 48px) 0',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '32px',
                    position: 'relative',
                    zIndex: 2
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            borderRadius: '20px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative'
                        }}>
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.2), transparent 70%)' }}></div>
                            <Car size={32} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.4))' }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }}></motion.div>
                                <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Vendor Command Center</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: '950', margin: 0, letterSpacing: '-1.5px', lineHeight: 1 }}>
                                Outside <span className="text-gradient-yellow">Fleet</span>
                            </h1>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ 
                            padding: '16px 24px', 
                            background: 'rgba(15, 23, 42, 0.6)', 
                            border: '1px solid rgba(251, 191, 36, 0.15)', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            minWidth: '160px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            borderRadius: '20px'
                        }}>
                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#fbbf24', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>Total Payout</span>
                            <span style={{ color: 'white', fontSize: '24px', fontWeight: '950', letterSpacing: '-0.5px' }}>₹{totalPayable.toLocaleString()}</span>
                            <div style={{ width: '100%', height: '2px', background: 'rgba(251, 191, 36, 0.1)', marginTop: '8px', borderRadius: '1px' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1 }} style={{ height: '100%', background: '#fbbf24', borderRadius: '1px' }}></motion.div>
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card" style={{ 
                            padding: '16px 24px', 
                            background: 'rgba(15, 23, 42, 0.6)', 
                            border: '1px solid rgba(16, 185, 129, 0.15)', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            minWidth: '160px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                            borderRadius: '20px'
                        }}>
                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#34d399', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>Active Logs</span>
                            <span style={{ color: 'white', fontSize: '24px', fontWeight: '950', letterSpacing: '-0.5px' }}>{totalDutiesCount}</span>
                            <div style={{ width: '100%', height: '2px', background: 'rgba(16, 185, 129, 0.1)', marginTop: '8px', borderRadius: '1px' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1, delay: 0.2 }} style={{ height: '100%', background: '#10b981', borderRadius: '1px' }}></motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* ═══ DYNAMIC INTEGRATED CONTROL BAR ═══ */}
                <div className="glass-card" style={{ 
                    padding: '12px', 
                    marginBottom: '32px', 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '12px', 
                    alignItems: 'center', 
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '24px',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ position: 'relative', flex: '1.5', minWidth: '240px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(251, 191, 36, 0.4)' }} />
                        <input
                            type="text"
                            placeholder="Universal Search (Plate, Owner, Property...)"
                            className="premium-compact-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '48px', height: '52px', border: '1px solid rgba(255,255,255,0.06)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '300px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <select value={ownerFilter} onChange={e => handleOwnerChange(e.target.value)} className="premium-compact-input" style={{ height: '52px', paddingLeft: '16px', appearance: 'none', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <option value="All">All Vendors</option>
                                {uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <ChevronRight size={14} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="premium-compact-input" style={{ height: '52px', paddingLeft: '16px', appearance: 'none', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <option value="All">All Properties</option>
                                {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <ChevronRight size={14} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '6px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <button onClick={() => shiftDays(-1)} className="action-btn-hover" style={{
                            width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}> <ChevronLeft size={18} /> </button>

                        <div style={{ display: 'flex', gap: '6px' }}>
                            {isRange && (
                                <div style={{ position: 'relative', overflow: 'hidden', height: '40px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '12px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '900', color: '#38bdf8' }}>FROM</span>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'white' }}>{formatDateIST(fromDate)}</span>
                                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                </div>
                            )}
                            <div style={{ position: 'relative', overflow: 'hidden', height: '40px', background: isRange ? 'rgba(251, 191, 36, 0.1)' : 'rgba(56, 189, 248, 0.1)', border: `1px solid ${isRange ? 'rgba(251, 191, 36, 0.2)' : 'rgba(56, 189, 248, 0.2)'}`, borderRadius: '12px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: isRange ? '#fbbf24' : '#38bdf8' }}>{isRange ? 'TO' : 'DATE'}</span>
                                <span style={{ fontSize: '12px', fontWeight: '800', color: 'white' }}>{formatDateIST(toDate)}</span>
                                <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); if(!isRange) setFromDate(e.target.value); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                            </div>
                        </div>

                        <button onClick={() => shiftDays(1)} className="action-btn-hover" style={{
                            width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}> <ChevronRight size={18} /> </button>
                        
                        <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>

                        <button onClick={() => { setIsRange(!isRange); if(isRange) setFromDate(toDate); }} style={{
                            height: '40px', padding: '0 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: isRange ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.03)',
                            color: isRange ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}> {isRange ? 'Range Mode' : 'Single'} </button>
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
                                    return formatDateIST(rawDate);
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
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '52px', padding: '0 25px', borderRadius: '14px', fontWeight: '800', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: 'black', border: 'none', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 8px 15px rgba(251, 191, 36, 0.2)' }}
                    >
                        <Plus size={20} /> <span className="hide-mobile">Add Duty Entry</span><span className="show-mobile">Add</span>
                    </button>
                </div>
            </header>

            {/* ═══ CLEAN PREMIUM DESKTOP TABLE ═══ */}
            <div className="glass-card hide-mobile" style={{ 
                padding: 0, 
                overflow: 'hidden', 
                border: '1px solid rgba(255,255,255,0.08)', 
                background: 'rgba(8, 14, 26, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ width: '120px', padding: '18px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Timeline</th>
                                <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Resource Identification</th>
                                <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Service Detail</th>
                                <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Entities</th>
                                <th style={{ padding: '18px 24px', textAlign: 'right', width: '160px', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Duty Settlement</th>
                                <th style={{ padding: '18px 24px', textAlign: 'right', width: '120px', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid rgba(251, 191, 36, 0.1)', borderTopColor: '#fbbf24', borderRadius: '50%', margin: '0 auto 16px' }}></motion.div>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>SYNCHRONIZING FLEET DATA...</p>
                            </td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '120px 0' }}>
                                <Car size={48} style={{ opacity: 0.1, color: '#fbbf24', marginBottom: '24px' }} />
                                <h3 style={{ color: 'white', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px' }}>Registry Empty</h3>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No external duties match the current filter selection.</p>
                            </td></tr>
                        ) : filtered.map((v, idx) => (
                            <motion.tr
                                key={v._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="table-row-hover"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                            >
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#fbbf24', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                            {(() => {
                                                const parts = v.carNumber?.split('#');
                                                if (parts && parts[1]) {
                                                    const date = new Date(parts[1]);
                                                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                                                }
                                                return 'DUTY';
                                            })()}
                                        </span>
                                        <span style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>
                                            {(() => {
                                                const parts = v.carNumber?.split('#');
                                                if (parts && parts[1]) {
                                                    const [y, m, d] = parts[1].split('-');
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
                                                }
                                                return 'Manual';
                                            })()}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Car size={20} color="#818cf8" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '16px', color: 'white', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {v.carNumber?.split('#')[0]}
                                                <span className="badge-ext">EXTERNAL</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase' }}>{v.model}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                        <span className="badge-duty">{v.dutyType || 'Standard Duty'}</span>
                                        {v.dropLocation && (
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ChevronRight size={14} style={{ opacity: 0.3 }} />
                                                {v.dropLocation}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{v.property || 'Direct Order'}</span>
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>Vendor: {v.ownerName}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'inline-block', padding: '10px 18px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                                        <span style={{ color: '#10b981', fontWeight: '950', fontSize: '17px', letterSpacing: '-0.5px' }}>₹{v.dutyAmount?.toLocaleString()}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleEdit(v)} className="action-btn-hover" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Log"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(v._id)} className="action-btn-hover-del" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.1)', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Log"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            {/* ═══ PREMIUM MOBILE DUTY CARDS ═══ */}
            <div className="show-mobile">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '100px 0', gap: '16px' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid rgba(251, 191, 36, 0.1)', borderTopColor: '#fbbf24', borderRadius: '50%' }}></motion.div>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '900', letterSpacing: '2px' }}>LOADING FLEET...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '80px 20px', border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent' }}>
                        <Car size={40} style={{ opacity: 0.2, color: '#fbbf24', marginBottom: '16px' }} />
                        <h3 style={{ color: 'white', fontWeight: '800', fontSize: '16px' }}>No Data Available</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Try adjusting your filters or date range.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {filtered.map((v, idx) => (
                            <motion.div
                                key={v._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.04 }}
                                className="mobile-duty-card"
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Car size={20} color="#38bdf8" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '17px', fontWeight: '950', color: 'white', letterSpacing: '0.5px' }}>{v.carNumber?.split('#')[0]}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase' }}>{v.model}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '18px', fontWeight: '950', color: '#10b981' }}>₹{v.dutyAmount?.toLocaleString()}</div>
                                        <div style={{ fontSize: '9px', color: 'rgba(16, 185, 129, 0.5)', fontWeight: '900', textTransform: 'uppercase' }}>Payout</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px', marginBottom: '16px', padding: '14px', background: 'rgba(0,0,0,0.25)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '4px' }}>Timeline</label>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#fbbf24' }}>
                                            {(() => {
                                                const parts = v.carNumber?.split('#');
                                                if (parts && parts[1]) {
                                                    const [y, m, d] = parts[1].split('-');
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
                                                }
                                                return 'N/A';
                                            })()}
                                        </span>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '4px' }}>Property / Client</label>
                                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>{v.property || 'Direct'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }}></div>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>{v.dutyType || 'General Duty'}</span>
                                    {v.dropLocation && (
                                        <>
                                            <ChevronRight size={12} style={{ opacity: 0.3 }} />
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{v.dropLocation}</span>
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                                        Vendor: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{v.ownerName}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button onClick={() => handleEdit(v)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(v._id)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ PREMIUM OUTSIDE FLEET LOG MODAL ═══ */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="modal-container"
                            style={{ 
                                background: '#080d18',
                                border: '1px solid rgba(255,255,255,0.12)',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                                borderRadius: '28px',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: '90vh',
                                width: '100%',
                                maxWidth: '640px',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Modal Header */}
                            <div className="modal-header" style={{ padding: '24px 32px', background: 'linear-gradient(to right, rgba(251, 191, 36, 0.08), transparent)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Edit size={24} color="#fbbf24" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white', margin: 0 }}>{editMode ? 'Update Duty Log' : 'External Duty Log'}</h3>
                                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 0' }}>Registry Entry System</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="close-btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', width: '40px', height: '40px' }}><X size={20} /></button>
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                
                                {/* Section: Logistics */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <Calendar size={14} color="#fbbf24" />
                                        <span style={{ fontSize: '10px', fontWeight: '950', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Operational Context</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Duty Timeline *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Calendar size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                                <input type="date" className="premium-compact-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ paddingLeft: '48px' }} />
                                            </div>
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Client Property *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Plus size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                                <input type="text" className="premium-compact-input" required value={formData.property} onChange={e => setFormData({...formData, property: e.target.value})} placeholder="e.g. Radisson" style={{ paddingLeft: '48px' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Resource */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <Car size={14} color="#38bdf8" />
                                        <span style={{ fontSize: '10px', fontWeight: '950', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Resource Identification</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Vehicle Plate *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Car size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                                <input type="text" list="carCodes" className="premium-compact-input" required disabled={editMode} value={formData.carNumber} onChange={e => handleCarNumberChange(e.target.value)} placeholder="RJ-27-..." style={{ paddingLeft: '48px', textTransform: 'uppercase' }} />
                                                <datalist id="carCodes">
                                                    {carNumberSuggestions.map(s => <option key={s} value={s} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Asset Model *</label>
                                            <input type="text" className="premium-compact-input" required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="e.g. Crysta" />
                                        </div>
                                    </div>
                                    <div className="premium-input-group">
                                        <label className="premium-label">Vendor (Proprietor) *</label>
                                        <input type="text" className="premium-compact-input" required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} placeholder="Provider Name" />
                                    </div>
                                </div>

                                {/* Section: Service & Settlement */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <Save size={14} color="#10b981" />
                                        <span style={{ fontSize: '10px', fontWeight: '950', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Service Settlement</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Service Category</label>
                                            <div style={{ position: 'relative' }}>
                                                <Briefcase size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24', opacity: 0.6 }} />
                                                <input type="text" list="serviceTypes" className="premium-compact-input" value={formData.dutyType} onChange={e => setFormData({...formData, dutyType: e.target.value})} placeholder="e.g. Airport Drop" style={{ paddingLeft: '48px' }} />
                                                <datalist id="serviceTypes">
                                                    {dutyTypeSuggestions.map(s => <option key={s} value={s} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label" style={{ color: '#10b981' }}>Payout Amount (₹) *</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹</span>
                                                <input type="number" className="premium-compact-input" required value={formData.dutyAmount} onChange={e => setFormData({...formData, dutyAmount: e.target.value})} placeholder="0.00" style={{ paddingLeft: '40px', color: '#10b981' }} />
                                            </div>
                                        </div>
                                    </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Operational Destination</label>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8', opacity: 0.6 }} />
                                                <input type="text" list="points" className="premium-compact-input" value={formData.dropLocation} onChange={e => setFormData({...formData, dropLocation: e.target.value})} placeholder="Destination Details" style={{ paddingLeft: '48px' }} />
                                                <datalist id="points">
                                                    {dropLocationSuggestions.map(item => <option key={item} value={item} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: '20px 32px', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button onClick={() => setShowModal(false)} style={{ height: '52px', padding: '0 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>Cancel Operation</button>
                                <button onClick={handleSubmit} style={{ height: '52px', padding: '0 32px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: 'black', fontWeight: '950', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 10px 20px rgba(251, 191, 36, 0.2)', cursor: 'pointer' }}>
                                    {editMode ? 'Commit Changes' : 'Execute Log'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default OutsideCars;