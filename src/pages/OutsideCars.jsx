import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Search, Trash2, Car, X, Save, ChevronLeft, ChevronRight, Calendar, Edit, MapPin, Briefcase, Layers, ShoppingCart, TrendingUp } from 'lucide-react';
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
    const [transactionFilter, setTransactionFilter] = useState('All');

    const [isRange, setIsRange] = useState(false);
    const [fromDate, setFromDate] = useState(firstDayOfMonthIST());
    const [toDate, setToDate] = useState(todayIST());

    /* navigate dates */
    const shiftDays = (n) => {
        const t = nowIST(toDate);
        t.setUTCDate(t.getUTCDate() + n);
        const tStr = toISTDateString(t);

        if (isRange) {
            const f = nowIST(fromDate);
            f.setUTCDate(f.getUTCDate() + n);
            setFromDate(toISTDateString(f));
            setToDate(tStr);
        } else {
            setFromDate(tStr);
            setToDate(tStr);
        }
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
        transactionType: 'Duty',
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
            transactionType: 'Duty',
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
                transactionType: formData.transactionType || 'Duty',
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
            transactionType: vehicle.transactionType || 'Duty',
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
        const matchesTransaction = transactionFilter === 'All' || 
            (v.transactionType || 'Duty') === transactionFilter;
        
        return matchesSearch && matchesOwner && matchesProperty && matchesDate && matchesTransaction;
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
            
            <style>{`
                .bg-buy { 
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(20, 83, 45, 0.2) 100%) !important; 
                    color: #4ade80 !important; 
                    border: 1px solid rgba(34, 197, 94, 0.25) !important;
                    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
                }
                .bg-sell { 
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.2) 100%) !important; 
                    color: #f87171 !important; 
                    border: 1px solid rgba(239, 68, 68, 0.25) !important;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
                }
                .badge-ext { 
                    padding: 3px 10px; 
                    border-radius: 8px; 
                    font-size: 9px; 
                    font-weight: 950; 
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .stat-circle-svg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    transform: rotate(-90deg);
                }
                .stat-circle-bg {
                    fill: none;
                    stroke: rgba(255, 255, 255, 0.03);
                    stroke-width: 4;
                }
                .stat-circle-progress {
                    fill: none;
                    stroke-width: 4;
                    stroke-linecap: round;
                    transition: stroke-dashoffset 1s ease-out;
                }
                .payout-glow { filter: drop-shadow(0 0 4px #fbbf24); }
                .logs-glow { filter: drop-shadow(0 0 4px #10b981); }
            `}</style>

            {/* ═══ PREMIUM DYNAMIC HEADER ═══ */}
            <header style={{ 
                padding: 'clamp(20px, 4vw, 40px) 0',
                position: 'relative'
            }}>
                <div className="flex-resp" style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '24px',
                    marginBottom: 'clamp(20px, 4vw, 32px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 20px)' }}>
                        <div style={{
                            width: 'clamp(48px, 10vw, 64px)',
                            height: 'clamp(48px, 10vw, 64px)',
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            borderRadius: 'clamp(12px, 3vw, 20px)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            flexShrink: 0
                        }}>
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: 'radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.2), transparent 70%)' }}></div>
                            <Car size={28} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.4))' }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }}></motion.div>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Vendor Command</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: '950', margin: 0, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                                Outside <span className="text-gradient-yellow">Fleet</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex-resp" style={{ gap: '24px', alignItems: 'center', flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                        {/* CIRCULAR STATS */}
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ 
                                width: 'clamp(80px, 15vw, 110px)', height: 'clamp(80px, 15vw, 110px)', borderRadius: '50%',
                                background: 'rgba(15, 23, 42, 0.6)', 
                                border: '1px solid rgba(251, 191, 36, 0.1)', 
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                position: 'relative'
                            }}>
                                <svg className="stat-circle-svg" viewBox="0 0 100 100">
                                    <circle className="stat-circle-bg" cx="50" cy="50" r="45" />
                                    <motion.circle 
                                        className="stat-circle-progress payout-glow" 
                                        cx="50" cy="50" r="45" 
                                        stroke="#fbbf24"
                                        initial={{ strokeDasharray: "283 283", strokeDashoffset: 283 }}
                                        animate={{ strokeDashoffset: 0 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </svg>
                                <span style={{ fontSize: '7px', fontWeight: '950', color: '#fbbf24', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px', position: 'relative', zIndex: 1 }}>Payout</span>
                                <span style={{ color: 'white', fontSize: 'clamp(12px, 3vw, 15px)', fontWeight: '950', position: 'relative', zIndex: 1 }}>{totalPayable > 99999 ? (totalPayable/1000).toFixed(1) + 'k' : '₹' + totalPayable.toLocaleString()}</span>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} style={{ 
                                width: 'clamp(80px, 15vw, 110px)', height: 'clamp(80px, 15vw, 110px)', borderRadius: '50%',
                                background: 'rgba(15, 23, 42, 0.6)', 
                                border: '1px solid rgba(16, 185, 129, 0.1)', 
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                position: 'relative'
                            }}>
                                <svg className="stat-circle-svg" viewBox="0 0 100 100">
                                    <circle className="stat-circle-bg" cx="50" cy="50" r="45" />
                                    <motion.circle 
                                        className="stat-circle-progress logs-glow" 
                                        cx="50" cy="50" r="45" 
                                        stroke="#10b981"
                                        initial={{ strokeDasharray: "283 283", strokeDashoffset: 283 }}
                                        animate={{ strokeDashoffset: -200 }} 
                                        transition={{ duration: 1.8, ease: "easeOut" }}
                                    />
                                </svg>
                                <span style={{ fontSize: '7px', fontWeight: '950', color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px', position: 'relative', zIndex: 1 }}>Logs</span>
                                <span style={{ color: 'white', fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: '950', position: 'relative', zIndex: 1 }}>{totalDutiesCount}</span>
                            </motion.div>
                        </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                        {/* CIRCULAR STATS */}
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ 
                                width: '120px', height: '120px', borderRadius: '50%',
                                background: 'rgba(15, 23, 42, 0.6)', 
                                border: '1px solid rgba(251, 191, 36, 0.1)', 
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(251, 191, 36, 0.05)', 
                                position: 'relative'
                            }}>
                                <svg className="stat-circle-svg" viewBox="0 0 100 100">
                                    <circle className="stat-circle-bg" cx="50" cy="50" r="45" />
                                    <motion.circle 
                                        className="stat-circle-progress payout-glow" 
                                        cx="50" cy="50" r="45" 
                                        stroke="#fbbf24"
                                        initial={{ strokeDasharray: "283 283", strokeDashoffset: 283 }}
                                        animate={{ strokeDashoffset: 0 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </svg>
                                <span style={{ fontSize: '9px', fontWeight: '950', color: '#fbbf24', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', position: 'relative', zIndex: 1 }}>Payout</span>
                                <span style={{ color: 'white', fontSize: '16px', fontWeight: '950', position: 'relative', zIndex: 1 }}>{totalPayable > 99999 ? (totalPayable/1000).toFixed(1) + 'k' : '₹' + totalPayable.toLocaleString()}</span>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} style={{ 
                                width: '120px', height: '120px', borderRadius: '50%',
                                background: 'rgba(15, 23, 42, 0.6)', 
                                border: '1px solid rgba(16, 185, 129, 0.1)', 
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(16, 185, 129, 0.05)', 
                                position: 'relative'
                            }}>
                                <svg className="stat-circle-svg" viewBox="0 0 100 100">
                                    <circle className="stat-circle-bg" cx="50" cy="50" r="45" />
                                    <motion.circle 
                                        className="stat-circle-progress logs-glow" 
                                        cx="50" cy="50" r="45" 
                                        stroke="#10b981"
                                        initial={{ strokeDasharray: "283 283", strokeDashoffset: 283 }}
                                        animate={{ strokeDashoffset: -200 }} // Static visual progress
                                        transition={{ duration: 1.8, ease: "easeOut" }}
                                    />
                                </svg>
                                <span style={{ fontSize: '9px', fontWeight: '950', color: '#10b981', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '4px', position: 'relative', zIndex: 1 }}>Logs</span>
                                <span style={{ color: 'white', fontSize: '20px', fontWeight: '950', position: 'relative', zIndex: 1 }}>{totalDutiesCount}</span>
                            </motion.div>
                        </div>

                        {/* TOP RIGHT BUTTONS */}
                        <div className="flex-resp" style={{ gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleOpenLogDuty}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: '10px', 
                                    height: '50px', 
                                    padding: '0 24px', 
                                    borderRadius: '14px', 
                                    fontWeight: '900', 
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', 
                                    color: 'black', 
                                    border: 'none', 
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    flex: 1,
                                    maxWidth: '240px'
                                }}
                            >
                                <Plus size={18} strokeWidth={3} /> Add Duty Entry
                            </button>
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
                                    const totalAmount = reportData.reduce((sum, row) => sum + row.Amount, 0);
                                    reportData.push({
                                        'Property': '', 'Owner': '', 'Date': '', 'Vehicle Details': '', 'Drop Location': '', 'Service Type': 'TOTAL PAYABLE', 'Amount': totalAmount
                                    });
                                    const ws = XLSX.utils.json_to_sheet(reportData);
                                    const range = XLSX.utils.decode_range(ws['!ref']);
                                    for (let C = range.s.c; C <= range.e.c; ++C) {
                                        let maxWidth = 10;
                                        for (let R = range.s.r; R <= range.e.r; ++R) {
                                            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                                            if (!cell) continue;
                                            cell.s = { alignment: { horizontal: 'center', vertical: 'center' }, font: { name: 'Arial', sz: 10 } };
                                            if (R === 0) { cell.s.font.bold = true; cell.s.fill = { fgColor: { rgb: "4F46E5" } }; cell.s.font.color = { rgb: "FFFFFF" }; }
                                            if (C === 6) cell.s.alignment.horizontal = 'right';
                                            if (R === range.e.r) { cell.s.font.bold = true; cell.s.fill = { fgColor: { rgb: "E0E7FF" } }; }
                                            if (cell.v) maxWidth = Math.max(maxWidth, cell.v.toString().length + 5);
                                        }
                                        if (!ws['!cols']) ws['!cols'] = [];
                                        ws['!cols'][C] = { wch: maxWidth };
                                    }
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "Outside Fleet Log");
                                    XLSX.writeFile(wb, `Outside_Fleet_Report_${fromDate}_to_${toDate}.xlsx`);
                                }}
                                style={{
                                    height: '50px',
                                    padding: '0 16px',
                                    background: 'rgba(16, 185, 129, 0.08)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    color: '#34d399',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    borderRadius: '14px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Save size={16} /> <span className="hide-mobile">Export Excel</span>
                            </button>
                        </div>
                    </div>
                </div>
                </div>

            {/* ═══ DYNAMIC INTEGRATED CONTROL BAR ═══ */}
            <div className="glass-card" style={{ 
                padding: 'clamp(10px, 2vw, 12px)', 
                marginBottom: 'clamp(24px, 4vw, 32px)', 
                display: 'flex', 
                flexDirection: 'column',
                gap: '12px', 
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: '24px'
            }}>
                <div className="flex-resp" style={{ gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1.5', minWidth: '0' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(251, 191, 36, 0.4)', zIndex: 1 }} />
                        <input
                            type="text"
                            placeholder="Universal Search..."
                            className="premium-compact-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '48px', height: '52px' }}
                        />
                    </div>

                    <div className="flex-resp" style={{ gap: '8px', flex: '2', minWidth: '0' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <select value={ownerFilter} onChange={e => handleOwnerChange(e.target.value)} className="premium-compact-input" style={{ height: '52px', appearance: 'none' }}>
                                <option value="All">All Vendors</option>
                                {uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <ChevronRight size={14} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="premium-compact-input" style={{ height: '52px', appearance: 'none' }}>
                                <option value="All">All Properties</option>
                                {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <ChevronRight size={14} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                        </div>
                    </div>
                </div>

                <div className="flex-resp" style={{ gap: '12px', alignItems: 'center' }}>
                    {/* TRANSACTION FILTERS SCROLLABLE */}
                    <div className="premium-scroll" style={{
                        display: 'flex',
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '6px',
                        borderRadius: '18px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        gap: '6px',
                        overflowX: 'auto',
                        flex: '1.5'
                    }}>
                        {[
                            { id: 'All', label: 'All', icon: Layers, color: '#94a3b8' },
                            { id: 'Duty', label: 'Duties', icon: Briefcase, color: '#fbbf24' },
                            { id: 'Buy', label: 'Buy', icon: ShoppingCart, color: '#22c55e' },
                            { id: 'Sell', label: 'Sell', icon: TrendingUp, color: '#ef4444' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setTransactionFilter(type.id)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '14px',
                                    border: '1px solid ' + (transactionFilter === type.id ? type.color + '40' : 'transparent'),
                                    fontSize: '11px',
                                    fontWeight: '950',
                                    cursor: 'pointer',
                                    background: transactionFilter === type.id ? type.color + '15' : 'transparent',
                                    color: transactionFilter === type.id ? type.color : 'rgba(255,255,255,0.3)',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <type.icon size={14} />
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-resp" style={{
                        flex: '1',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '6px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button onClick={() => shiftDays(-1)} style={{
                                width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}> <ChevronLeft size={16} /> </button>

                            <div 
                                onClick={(e) => { const i = e.currentTarget.querySelector('input'); if (i.showPicker) i.showPicker(); else i.click(); }}
                                style={{ height: '36px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '10px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}
                            >
                                <span style={{ fontSize: '11px', fontWeight: '800', color: 'white', whiteSpace: 'nowrap' }}>
                                    {isRange ? `${formatDateIST(fromDate)} - ${formatDateIST(toDate)}` : formatDateIST(toDate)}
                                </span>
                                <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); if(!isRange) setFromDate(e.target.value); }} style={{ position: 'absolute', inset: 0, opacity: 0 }} />
                            </div>

                            <button onClick={() => shiftDays(1)} style={{
                                width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}> <ChevronRight size={16} /> </button>
                        </div>
                        
                        <button onClick={() => { setIsRange(!isRange); if(isRange) setFromDate(toDate); }} style={{
                            height: '36px', padding: '0 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: isRange ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255,255,255,0.03)',
                            color: isRange ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase'
                        }}> {isRange ? 'Range' : 'Day'} </button>
                    </div>
                </div>
            </div>


            </header>

            {/* ═══ CLEAN PREMIUM DESKTOP TABLE ═══ */}
            <div className="glass-card hide-mobile scroll-x" style={{ 
                padding: 0, 
                border: '1px solid rgba(255,255,255,0.08)', 
                background: 'rgba(8, 14, 26, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ minWidth: '1000px' }}>
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
                                                <span className={`badge-ext ${v.transactionType === 'Buy' ? 'bg-buy' : v.transactionType === 'Sell' ? 'bg-sell' : ''}`}>
                                                    {v.transactionType || 'EXTERNAL'}
                                                </span>
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '32px', height: '32px', border: '3px solid rgba(251, 191, 36, 0.1)', borderTopColor: '#fbbf24', borderRadius: '50%' }}></motion.div>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '900', letterSpacing: '2px' }}>LOADING FLEET...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent' }}>
                        <Car size={32} style={{ opacity: 0.2, color: '#fbbf24', marginBottom: '16px' }} />
                        <h3 style={{ color: 'white', fontWeight: '800', fontSize: '15px' }}>No Data Available</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filtered.map((v, idx) => (
                            <motion.div
                                key={v._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    padding: '20px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Car size={18} color="#38bdf8" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: '950', color: 'white', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {v.carNumber?.split('#')[0]}
                                                <span className={`badge-ext ${v.transactionType === 'Buy' ? 'bg-buy' : v.transactionType === 'Sell' ? 'bg-sell' : ''}`} style={{ fontSize: '7px', padding: '2px 6px' }}>
                                                    {v.transactionType || 'EXT'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase' }}>{v.model}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '16px', fontWeight: '950', color: '#10b981' }}>₹{v.dutyAmount?.toLocaleString()}</div>
                                        <div style={{ fontSize: '8px', color: 'rgba(16, 185, 129, 0.5)', fontWeight: '900', textTransform: 'uppercase' }}>Payout</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '2px' }}>Log Date</label>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#fbbf24' }}>
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
                                    <div>
                                        <label style={{ display: 'block', fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '2px' }}>Property</label>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{v.property || 'Direct'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <Briefcase size={12} color="#38bdf8" style={{ opacity: 0.6 }} />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>{v.dutyType || 'Standard Duty'}</span>
                                    {v.dropLocation && (
                                        <>
                                            <ChevronRight size={10} style={{ opacity: 0.3 }} />
                                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{v.dropLocation}</span>
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                                        Vendor: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{v.ownerName}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEdit(v)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={14} /></button>
                                        <button onClick={() => handleDelete(v._id)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
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
                            <div style={{ 
                                padding: 'clamp(20px, 4vw, 24px) clamp(20px, 5vw, 32px)', 
                                background: 'linear-gradient(to right, rgba(251, 191, 36, 0.08), transparent)', 
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: 'clamp(40px, 8vw, 48px)', height: 'clamp(40px, 8vw, 48px)', borderRadius: '14px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Edit size={20} color="#fbbf24" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: 'clamp(17px, 4vw, 20px)', fontWeight: '900', color: 'white', margin: 0 }}>{editMode ? 'Update Log' : 'External Log'}</h3>
                                        <p className="hide-mobile" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 0' }}>Registry Entry System</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="close-btn" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', width: '36px', height: '36px' }}><X size={18} /></button>
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: 'clamp(20px, 5vw, 32px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                {/* Section: Logistics */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <Calendar size={14} color="#fbbf24" style={{ opacity: 0.7 }} />
                                        <span style={{ fontSize: '10px', fontWeight: '950', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Operational Context</span>
                                    </div>
                                    <div className="form-grid-2">
                                            <div 
                                                className="premium-input-group"
                                                onClick={(e) => { const i = e.currentTarget.querySelector('input'); if (i.showPicker) i.showPicker(); else i.click(); }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <label className="premium-label">Duty Timeline *</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Calendar size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                                                    <input type="date" className="premium-compact-input" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} onClick={e => { e.stopPropagation(); if (e.target.showPicker) e.target.showPicker(); }} style={{ paddingLeft: '48px', height: '52px' }} />
                                                </div>
                                            </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Client Property *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Plus size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                                <input type="text" className="premium-compact-input" required value={formData.property} onChange={e => setFormData({...formData, property: e.target.value})} placeholder="e.g. Radisson" style={{ paddingLeft: '48px', height: '52px' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Resource */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <Car size={14} color="#38bdf8" style={{ opacity: 0.7 }} />
                                        <span style={{ fontSize: '10px', fontWeight: '950', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Resource Identification</span>
                                    </div>
                                    <div className="form-grid-2" style={{ marginBottom: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Full Vehicle Plate *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Car size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                                <input type="text" list="carCodes" className="premium-compact-input" required disabled={editMode} value={formData.carNumber} onChange={e => handleCarNumberChange(e.target.value)} placeholder="RJ-27-PA-1000" style={{ paddingLeft: '48px', textTransform: 'uppercase', height: '52px' }} />
                                                <datalist id="carCodes">
                                                    {carNumberSuggestions.map(s => <option key={s} value={s} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Asset Model *</label>
                                            <input type="text" className="premium-compact-input" required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="e.g. Crysta" style={{ height: '52px' }} />
                                        </div>
                                    </div>
                                    <div className="form-grid-2">
                                        <div className="premium-input-group">
                                            <label className="premium-label">Vendor (Proprietor) *</label>
                                            <input type="text" className="premium-compact-input" required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} placeholder="Provider Name" style={{ height: '52px' }} />
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Transaction Type *</label>
                                            <div style={{
                                                display: 'flex',
                                                background: 'rgba(0,0,0,0.3)',
                                                padding: '4px',
                                                borderRadius: '16px',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                gap: '6px'
                                            }}>
                                                {[
                                                    { id: 'Duty', label: 'Duty', icon: Briefcase, color: '#fbbf24' },
                                                    { id: 'Buy', label: 'Buy', icon: ShoppingCart, color: '#22c55e' },
                                                    { id: 'Sell', label: 'Sell', icon: TrendingUp, color: '#ef4444' }
                                                ].map(t => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setFormData({...formData, transactionType: t.id})}
                                                        style={{
                                                            flex: 1,
                                                            padding: '10px 4px',
                                                            borderRadius: '12px',
                                                            border: '1px solid ' + (formData.transactionType === t.id ? t.color + '50' : 'transparent'),
                                                            background: formData.transactionType === t.id ? t.color + '15' : 'rgba(255,255,255,0.02)',
                                                            color: formData.transactionType === t.id ? t.color : 'rgba(255,255,255,0.3)',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            transition: '0.2s'
                                                        }}
                                                    >
                                                        <t.icon size={16} />
                                                        <span style={{ fontSize: '9px', fontWeight: '950', textTransform: 'uppercase' }}>{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Service & Settlement */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'clamp(15px, 4vw, 24px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                        <Save size={14} color="#10b981" style={{ opacity: 0.7 }} />
                                        <span style={{ fontSize: '10px', fontWeight: '950', color: 'white', textTransform: 'uppercase', letterSpacing: '1px' }}>Service Settlement</span>
                                    </div>
                                    <div className="form-grid-2" style={{ marginBottom: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Service Category</label>
                                            <div style={{ position: 'relative' }}>
                                                <Briefcase size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24', opacity: 0.6 }} />
                                                <input type="text" list="serviceTypes" className="premium-compact-input" value={formData.dutyType} onChange={e => setFormData({...formData, dutyType: e.target.value})} placeholder="e.g. Airport Drop" style={{ paddingLeft: '48px', height: '52px' }} />
                                                <datalist id="serviceTypes">
                                                    {dutyTypeSuggestions.map(s => <option key={s} value={s} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label" style={{ color: '#10b981' }}>Payout Amount (₹) *</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹</span>
                                                <input type="number" className="premium-compact-input" required value={formData.dutyAmount} onChange={e => setFormData({...formData, dutyAmount: e.target.value})} placeholder="0.00" style={{ paddingLeft: '40px', color: '#10b981', height: '52px' }} />
                                            </div>
                                        </div>
                                    </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">Operational Destination</label>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8', opacity: 0.6 }} />
                                                <input type="text" list="points" className="premium-compact-input" value={formData.dropLocation} onChange={e => setFormData({...formData, dropLocation: e.target.value})} placeholder="Destination Details" style={{ paddingLeft: '48px', height: '52px' }} />
                                                <datalist id="points">
                                                    {dropLocationSuggestions.map(item => <option key={item} value={item} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: 'clamp(20px, 4vw, 24px) clamp(20px, 5vw, 32px)', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px' }}>
                                <button onClick={() => setShowModal(false)} style={{ flex: 1, height: '52px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: '13px' }}>Cancel</button>
                                <button onClick={handleSubmit} style={{ flex: 2, height: '52px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: 'black', fontWeight: '950', fontSize: '14px', textTransform: 'uppercase' }}>
                                    {editMode ? 'Save' : 'Log'}
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