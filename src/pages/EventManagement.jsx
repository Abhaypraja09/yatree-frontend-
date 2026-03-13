import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    Calendar, Plus, Search, Trash2, Edit, ChevronLeft, ChevronRight, Car,
    User, MapPin, Target, Briefcase, X, Save, FileSpreadsheet, Users, Building2, TruckIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';
import * as XLSX from 'xlsx-js-style';
import {
    todayIST,
    toISTDateString,
    firstDayOfMonthIST,
    formatDateIST,
    nowIST,
    formatTimeIST,
    currentTimeIST
} from '../utils/istUtils';

const EventManagement = () => {
    const { selectedCompany } = useCompany();
    const [events, setEvents] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [allVehiclesMaster, setAllVehiclesMaster] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('All');
    const [eventFilter, setEventFilter] = useState('All');
    const [sourceFilter, setSourceFilter] = useState('All');

    const getToday = () => todayIST();
    const [isRange, setIsRange] = useState(false);
    const [fromDate, setFromDate] = useState(firstDayOfMonthIST());
    const [toDate, setToDate] = useState(todayIST());

    // Removed auto-sync to allow initial month range in Single UI mode

    const [monthlyTarget, setMonthlyTarget] = useState(0);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showDutyModal, setShowDutyModal] = useState(false);
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [isEditingDuty, setIsEditingDuty] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [eventFormData, setEventFormData] = useState({ name: '', client: '', date: getToday(), location: '', description: '' });
    const [dutyFormData, setDutyFormData] = useState({
        carNumber: '', model: '', dropLocation: '', date: getToday(),
        eventId: '', dutyAmount: '', driverName: '', vehicleSource: 'Fleet', // 'Fleet' | 'External'
        dutyType: '', dutyTime: ''
    });

    useEffect(() => {
        if (selectedCompany?._id) {
            const savedTarget = localStorage.getItem(`eventTarget_${selectedCompany._id}`);
            if (savedTarget) setMonthlyTarget(Number(savedTarget));
            fetchEvents();
            fetchVehicles();
            fetchMasterVehicles();
        }
    }, [selectedCompany, fromDate, toDate]);

    const fetchEvents = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/events/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setEvents(data || []);
        } catch (err) { console.error(err); }
    };

    const fetchVehicles = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=outside`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles?.filter(v => v.eventId) || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchMasterVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=fleet`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setAllVehiclesMaster(data.vehicles || []);
        } catch (err) { console.error(err); }
    };

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
            // If in Month view (fromDate != toDate), shift by month
            if (fromDate !== toDate) {
                const current = nowIST(toDate);
                const nextMonth = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + n, 1));
                const firstDay = toISTDateString(nextMonth);
                const lastDay = toISTDateString(new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)));
                setFromDate(firstDay);
                setToDate(lastDay);
            } else {
                // If in Day view, shift by day
                setFromDate(tStr);
                setToDate(tStr);
            }
        }
    };

    const handleCarNumberChange = (val) => {
        const upVal = val.toUpperCase();
        const normVal = upVal.replace(/[^A-Z0-9]/g, '');

        const existingFleet = allVehiclesMaster.find(v => (v.carNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === normVal);
        if (existingFleet) {
            setDutyFormData(prev => ({ ...prev, carNumber: upVal, model: existingFleet.model || prev.model, vehicleSource: 'Fleet' }));
            return;
        }

        const existingDuty = vehicles.find(v => (v.carNumber || '').split('#')[0].toUpperCase().replace(/[^A-Z0-9]/g, '') === normVal);
        if (existingDuty) {
            setDutyFormData(prev => ({ ...prev, carNumber: upVal, model: existingDuty.model || prev.model, vehicleSource: existingDuty.vehicleSource || 'External' }));
        } else {
            setDutyFormData(prev => ({ ...prev, carNumber: upVal }));
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (isEditingEvent) {
                await axios.put(`/api/admin/events/${selectedId}`, eventFormData, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            } else {
                await axios.post('/api/admin/events', { ...eventFormData, companyId: selectedCompany._id }, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            }
            setShowEventModal(false);
            fetchEvents();
            alert('Event saved successfully');
        } catch (err) { alert('Error saving event'); }
    };

    const handleSubmitDuty = async (e) => {
        e.preventDefault();
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            let internalCarNumber = `${dutyFormData.carNumber}#${dutyFormData.date}`;
            if (!isEditingDuty) {
                internalCarNumber += `#${Math.random().toString(36).substring(2, 7)}`;
            } else {
                const original = vehicles.find(v => v._id === selectedId);
                const parts = original?.carNumber?.split('#') || [];
                if (dutyFormData.carNumber === parts[0] && dutyFormData.date === parts[1] && parts[2]) {
                    internalCarNumber += `#${parts[2]}`;
                } else {
                    internalCarNumber += `#${Math.random().toString(36).substring(2, 7)}`;
                }
            }
            const payload = {
                carNumber: internalCarNumber,
                model: dutyFormData.model?.trim(),
                dropLocation: dutyFormData.dropLocation?.trim() || '',
                dutyAmount: Number(dutyFormData.dutyAmount) || 0,
                eventId: dutyFormData.eventId,
                companyId: selectedCompany._id,
                isOutsideCar: true,
                createdAt: dutyFormData.date,
                driverName: dutyFormData.driverName?.trim() || '',
                vehicleSource: dutyFormData.vehicleSource,
                dutyType: dutyFormData.dutyType,
                dutyTime: dutyFormData.dutyTime
            };

            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

            if (isEditingDuty && selectedId) {
                // For updates, we usually don't need FormData unless changing files
                // Using plain JSON for better reliability with PUT
                await axios.put(`/api/admin/vehicles/${selectedId}`, payload, config);
            } else {
                const data = new FormData();
                Object.keys(payload).forEach(key => data.append(key, payload[key]));
                // Add defaults for new duty entries
                data.append('permitType', 'Contract');
                data.append('carType', 'Other');
                await axios.post('/api/admin/vehicles', data, config);
            }
            setShowDutyModal(false);
            fetchVehicles();
            setDutyFormData({ carNumber: '', model: '', dropLocation: '', date: getToday(), eventId: '', dutyAmount: '', driverName: '', vehicleSource: 'Fleet', dutyType: '', dutyTime: '' });
        } catch (err) {
            console.error('Save Error:', err.response?.data || err.message);
            alert('Error saving duty entry: ' + (err.response?.data?.message || 'Check connection'));
        }
    };

    const handleDeleteDuty = async (id) => {
        if (!window.confirm('Remove this vehicle duty?')) return;
        try {
            await axios.delete(`/api/admin/vehicles/${id}`, { headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` } });
            fetchVehicles();
        } catch (err) { alert('Error deleting'); }
    };

    const handleEditDuty = (v) => {
        setDutyFormData({
            carNumber: v.carNumber?.split('#')[0] || '',
            model: v.model,
            dropLocation: v.dropLocation || '',
            date: v.carNumber?.split('#')[1] || getToday(),
            eventId: v.eventId || '',
            dutyAmount: v.dutyAmount || '',
            driverName: v.driverName || '',
            vehicleSource: v.vehicleSource || 'External',
            dutyType: v.dutyType || '',
            dutyTime: v.dutyTime || ''
        });
        setSelectedId(v._id);
        setIsEditingDuty(true);
        setShowDutyModal(true);
    };

    const handleTargetChange = (val) => {
        const num = Number(val);
        setMonthlyTarget(num);
        if (selectedCompany?._id) localStorage.setItem(`eventTarget_${selectedCompany._id}`, num.toString());
    };

    // OPTIMIZATION: Memoize filtered results to prevent "hanging" during re-renders (Search/Typing)
    const filtered = React.useMemo(() => {
        return vehicles.filter(v => {
            const plate = v.carNumber?.split('#')[0] || '';
            const event = events.find(e => e._id === v.eventId);
            const eventName = event?.name || '';
            const clientName = event?.client || '';
            const matchesSearch = plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (v.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (v.dropLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (v.dutyType || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesClient = clientFilter === 'All' || clientName === clientFilter;
            const matchesEvent = eventFilter === 'All' || v.eventId === eventFilter;
            const dutyDate = v.carNumber?.split('#')[1];
            const matchesDate = dutyDate >= fromDate && dutyDate <= toDate;
            const src = v.vehicleSource || 'External';
            const matchesSource = sourceFilter === 'All' || src === sourceFilter;
            return matchesSearch && matchesClient && matchesEvent && matchesDate && matchesSource;
        }).sort((a, b) => {
            const dA = a.carNumber?.split('#')[1] || '';
            const dB = b.carNumber?.split('#')[1] || '';
            return dB.localeCompare(dA);
        });
    }, [vehicles, events, searchTerm, clientFilter, eventFilter, fromDate, toDate, sourceFilter]);

    // OPTIMIZATION: Memoize statistics
    const stats = React.useMemo(() => {
        const totalDuties = filtered.length;
        const totalAmount = filtered.reduce((sum, v) => sum + (Number(v.dutyAmount) || 0), 0);
        const fleetCount = filtered.filter(v => (v.vehicleSource || 'External') === 'Fleet').length;
        const extCount = filtered.filter(v => (v.vehicleSource || 'External') === 'External').length;
        const uniqueClients = [...new Set(events.map(e => e.client).filter(Boolean))].sort();
        return { totalDuties, totalAmount, fleetCount, extCount, uniqueClients };
    }, [filtered, events]);

    const { totalDuties, totalAmount, fleetCount, extCount, uniqueClients } = stats;

    const now = nowIST();
    const curMonth = (now.getUTCMonth() + 1).toString().padStart(2, '0');
    const curYear = now.getUTCFullYear().toString();
    const currentMonthDuties = vehicles.filter(v => {
        const d = v.carNumber?.split('#')[1];
        return d && d.startsWith(`${curYear}-${curMonth}`);
    }).length;

    const targetPercentage = monthlyTarget > 0 ? Math.min(Math.round((currentMonthDuties / monthlyTarget) * 100), 100) : 0;

    const exportExcel = () => {
        const data = filtered.map(v => {
            const event = events.find(e => e._id === v.eventId);
            return {
                'Date': v.carNumber?.split('#')[1] || '',
                'Vehicle': v.carNumber?.split('#')[0],
                'Model': v.model,
                'Driver': v.driverName || '-',
                'Source': v.vehicleSource || 'External',
                'Event': event?.name || 'N/A',
                'Client': event?.client || 'N/A',
                'Duty Type': v.dutyType || '',
                'Drop Loc': v.dropLocation || '',
                'Duty Time': v.dutyTime || '',
                'Amount': v.dutyAmount || 0
            };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Events Report");
        XLSX.writeFile(wb, `Event_Duties_${fromDate}_to_${toDate}.xlsx`);
    };

    const formatDateDisplay = (dateStr) => formatDateIST(dateStr);

    return (
        <div className="container-fluid" style={{ paddingBottom: '60px' }}>
            <SEO title="Event Command Center" description="Unified tracking for company and external vehicles assigned to events." />

            {/* ═══ HERO HEADER ═══ */}
            <div style={{ position: 'relative', padding: 'clamp(24px,4vw,40px) 0 24px', marginBottom: '24px' }}>
                {/* Ambient glow */}
                <div style={{ position: 'absolute', top: 0, left: '10%', width: '40%', height: '120px', background: 'radial-gradient(ellipse, rgba(251,191,36,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    {/* Title Block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                        <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #fbbf24, #d97706)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(251,191,36,0.3), 0 0 0 1px rgba(251,191,36,0.2)' }}>
                            <Briefcase size={28} color="black" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 10px #22d3ee', animation: 'pulse 2s infinite' }} />
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#22d3ee', letterSpacing: '2px', textTransform: 'uppercase' }}>Fleet Operations</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(26px,4vw,36px)', fontWeight: '900', margin: 0, letterSpacing: '-1.5px', lineHeight: 1 }}>
                                Event<span style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Command</span>
                            </h1>
                            <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.3px' }}>
                                {isRange
                                    ? <><span style={{ color: '#38bdf8' }}>{new Date(fromDate+'T12:00:00Z').toLocaleDateString('en-IN',{day:'2-digit',month:'short',timeZone:'Asia/Kolkata'})}</span> → <span style={{ color: '#fbbf24' }}>{new Date(toDate+'T12:00:00Z').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kolkata'})}</span></>
                                    : <><span style={{ color: 'rgba(255,255,255,0.5)' }}>Viewing</span> <span style={{ color: 'white', fontWeight: '700' }}>{new Date(toDate+'T12:00:00Z').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'})}</span></>
                                }
                            </p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Total Duties', value: totalDuties, color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', icon: '📋' },
                            { label: 'Revenue', value: `₹${totalAmount.toLocaleString()}`, color: '#10b981', bg: 'rgba(16,185,129,0.07)', icon: '💰' },
                            { label: 'Fleet', value: fleetCount, color: '#22d3ee', bg: 'rgba(34,211,238,0.07)', icon: '🚗' },
                            { label: 'External', value: extCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', icon: '🔗' },
                        ].map((s, i) => (
                            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} style={{
                                padding: '14px 20px', borderRadius: '16px',
                                background: s.bg, border: `1px solid ${s.color}22`,
                                display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '110px',
                                boxShadow: `0 4px 20px ${s.color}0d`
                            }}>
                                <span style={{ fontSize: '9px', fontWeight: '800', color: s.color, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{s.label}</span>
                                <span style={{ color: 'white', fontSize: '22px', fontWeight: '900', lineHeight: 1 }}>{s.value}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ CONTROL BAR ═══ */}
            <div style={{ background: 'rgba(8,14,26,0.8)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '16px 20px', marginBottom: '16px', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Row 1: Search + Source Toggle + Selects */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                        <input type="text" placeholder="Search vehicle, driver, event, location..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', height: '44px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', paddingLeft: '42px', outline: 'none', fontSize: '13px' }} />
                    </div>

                    {/* Source pills */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', gap: '3px' }}>
                        {[['All','#38bdf8'],['Fleet','#10b981'],['External','#f59e0b']].map(([s,c]) => (
                            <button key={s} onClick={() => setSourceFilter(s)} style={{
                                padding: '7px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '800',
                                background: sourceFilter === s ? `${c}20` : 'transparent',
                                color: sourceFilter === s ? c : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.5px',
                                boxShadow: sourceFilter === s ? `0 0 0 1px ${c}40` : 'none'
                            }}>{s}</button>
                        ))}
                    </div>

                    {/* Client filter */}
                    <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} style={{ height: '44px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', padding: '0 14px', outline: 'none', minWidth: '150px', fontSize: '12px' }}>
                        <option value="All" style={{ background: '#0f172a' }}>All Clients</option>
                        {uniqueClients.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
                    </select>

                    {/* Event filter */}
                    <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} style={{ height: '44px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'white', padding: '0 14px', outline: 'none', minWidth: '160px', fontSize: '12px' }}>
                        <option value="All" style={{ background: '#0f172a' }}>All Events</option>
                        {events.map(e => <option key={e._id} value={e._id} style={{ background: '#0f172a' }}>{e.name}</option>)}
                    </select>
                </div>

                {/* Row 2: Date Navigator + Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    {/* Date Navigator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => shiftDays(-1)} style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                            <ChevronLeft size={16} />
                        </button>

                        {isRange ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div onClick={(e) => { const i=e.currentTarget.querySelector('input'); if(i.showPicker)i.showPicker(); else i.click(); }} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '34px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '10px', cursor: 'pointer', overflow: 'hidden' }}>
                                    <span style={{ fontSize: '8px', color: '#38bdf8', fontWeight: '900', letterSpacing: '1px' }}>FROM</span>
                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '800' }}>{formatDateIST(fromDate)}</span>
                                    <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); if(e.target.value===toDate)setIsRange(false); }} onClick={e=>e.stopPropagation()} style={{ position:'absolute',opacity:0,inset:0,cursor:'pointer',zIndex:-1 }} />
                                </div>
                                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px' }}>→</span>
                                <div onClick={(e) => { const i=e.currentTarget.querySelector('input'); if(i.showPicker)i.showPicker(); else i.click(); }} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', height: '34px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '10px', cursor: 'pointer', overflow: 'hidden' }}>
                                    <span style={{ fontSize: '8px', color: '#fbbf24', fontWeight: '900', letterSpacing: '1px' }}>TO</span>
                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '800' }}>{formatDateIST(toDate)}</span>
                                    <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); if(e.target.value===fromDate)setIsRange(false); }} onClick={e=>e.stopPropagation()} style={{ position:'absolute',opacity:0,inset:0,cursor:'pointer',zIndex:-1 }} />
                                </div>
                                <button onClick={() => setIsRange(false)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={13} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div onClick={(e) => { const i=e.currentTarget.querySelector('input'); if(i.showPicker)i.showPicker(); else i.click(); }} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '10px', padding: '0 18px', height: '34px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '10px', cursor: 'pointer', overflow: 'hidden' }}>
                                    <Calendar size={14} color="#0ea5e9" />
                                    <span style={{ color: 'white', fontSize: '13px', fontWeight: '800', letterSpacing: '0.3px' }}>
                                        {new Date(toDate+'T12:00:00Z').toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Kolkata'}).toUpperCase()}
                                    </span>
                                    <input type="date" value={toDate} onChange={(e) => { const d=e.target.value; setToDate(d); setFromDate(d); setIsRange(false); }} onClick={e=>e.stopPropagation()} style={{ position:'absolute',opacity:0,inset:0,cursor:'pointer',zIndex:-1 }} />
                                </div>
                                <button onClick={() => setIsRange(true)} style={{ display:'flex',alignItems:'center',gap:'6px',padding:'0 12px',height:'34px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',color:'rgba(255,255,255,0.5)',fontSize:'10px',fontWeight:'800',letterSpacing:'1px',cursor:'pointer',textTransform:'uppercase' }}>
                                    <Plus size={13} />Range
                                </button>
                            </div>
                        )}

                        <button onClick={() => shiftDays(1)} style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button onClick={exportExcel} style={{ display:'flex',alignItems:'center',gap:'7px',height:'40px',padding:'0 16px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'11px',color:'rgba(255,255,255,0.7)',fontSize:'12px',fontWeight:'700',cursor:'pointer',transition:'0.2s' }}>
                            <FileSpreadsheet size={15} /> Excel
                        </button>
                        <button onClick={() => { setIsEditingEvent(false); setEventFormData({ name:'',client:'',date:getToday(),location:'',description:'' }); setShowEventModal(true); }} style={{ display:'flex',alignItems:'center',gap:'7px',height:'40px',padding:'0 16px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'11px',color:'rgba(255,255,255,0.7)',fontSize:'12px',fontWeight:'700',cursor:'pointer',transition:'0.2s' }}>
                            <Plus size={15} /> New Event
                        </button>
                        <button onClick={() => {
                            setIsEditingDuty(false);
                            setDutyFormData({ carNumber:'',model:'',dropLocation:'',date:getToday(),eventId:'',dutyAmount:'',driverName:'',vehicleSource:'Fleet',dutyType:'',dutyTime:currentTimeIST() });
                            setShowDutyModal(true);
                        }} style={{ display:'flex',alignItems:'center',gap:'8px',height:'42px',padding:'0 20px',background:'linear-gradient(135deg,#fbbf24,#d97706)',border:'none',borderRadius:'12px',color:'black',fontSize:'13px',fontWeight:'800',cursor:'pointer',boxShadow:'0 4px 16px rgba(251,191,36,0.3)',transition:'0.2s', letterSpacing: '0.3px' }}>
                            <Plus size={17} /> Add Duty Entry
                        </button>
                    </div>
                </div>
            </div>


            {/* Desktop Table */}
            <div className="glass-card main-table-container hide-mobile">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Vehicle & Source</th>
                            <th>Event / Client</th>
                            <th style={{ color: '#fbbf24' }}>Duty Type</th>
                            <th style={{ color: '#0ea5e9' }}>Duty Time</th>
                            <th style={{ color: '#818cf8' }}>Drop Location</th>
                            <th>Settlement</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '80px 0' }}><div className="spinner"></div></td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px 0' }}>
                                <Briefcase size={60} style={{ opacity: 0.1, color: 'var(--secondary)', marginBottom: '20px' }} />
                                <h3 style={{ color: 'white', fontWeight: '800' }}>No Records Logged</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Try adjusting your date range or filters.</p>
                            </td></tr>
                        ) : filtered.map((v, idx) => {
                            const event = events.find(e => e._id === v.eventId);
                            const dutyDate = v.carNumber?.split('#')[1];
                            const dObj = nowIST(dutyDate);
                            const src = v.vehicleSource || 'External';
                            const isFleet = src === 'Fleet';
                            return (
                                <motion.tr key={v._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }} className="table-row">
                                    <td className="date-cell" style={{ whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                            <span className="date-val" style={{ fontSize: '17px', color: 'white', fontWeight: '900', letterSpacing: '-0.5px' }}>{
                                                dutyDate ? new Date(dutyDate + 'T12:00:00Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }) : '--'
                                            }</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                                            <span className="day-name" style={{ fontSize: '10px', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px' }}>{
                                                dutyDate ? new Date(dutyDate + 'T12:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' }) : '--'
                                            }</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>{
                                                dutyDate ? new Date(dutyDate + 'T12:00:00Z').toLocaleDateString('en-IN', { year: 'numeric', timeZone: 'Asia/Kolkata' }) : ''
                                            }</span>
                                        </div>
                                    </td>
                                    <td className="vehicle-cell">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                            <span className={isFleet ? 'badge-fleet' : 'badge-ext'}>{src}</span>
                                            <span className="plate-num">{v.carNumber?.split('#')[0]}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="model-name">{v.model || '—'}</span>
                                            {v.driverName && <><span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span><span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{v.driverName}</span></>}
                                        </div>
                                    </td>
                                    <td className="duty-cell">
                                        <div className="event-name">{event?.name || 'N/A'}</div>
                                        <div className="venue-text">{event?.client || 'N/A'}</div>
                                    </td>
                                    <td>
                                        <span className="badge-duty">{v.dutyType || 'General'}</span>
                                    </td>
                                    <td>
                                        {v.dutyTime ? (
                                            <span className="badge-time">
                                                {(() => {
                                                    const [h, m] = v.dutyTime.split(':').map(Number);
                                                    if (isNaN(h) || isNaN(m)) return v.dutyTime;
                                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                                    const hour12 = h % 12 || 12;
                                                    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                                                })()}
                                            </span>
                                        ) : (
                                            <span className="badge-no-data">—</span>
                                        )}
                                    </td>
                                    <td>
                                        {v.dropLocation ? (
                                            <span className="badge-loc"><MapPin size={11} color="#818cf8" />{v.dropLocation}</span>
                                        ) : (
                                            <span className="badge-no-data">—</span>
                                        )}
                                    </td>
                                    <td className="amount-cell">
                                        <div className="amount-badge">₹{Number(v.dutyAmount || 0).toLocaleString()}</div>
                                    </td>
                                    <td className="action-cell">
                                        <div className="action-group">
                                            <button onClick={() => handleEditDuty(v)} className="edit-btn"><Edit size={15} /></button>
                                            <button onClick={() => handleDeleteDuty(v._id)} className="delete-btn"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div >

            {/* Mobile View */}
            < div className="show-mobile" >
                {
                    filtered.map((v, idx) => {
                        const event = events.find(e => e._id === v.eventId);
                        const dutyDate = v.carNumber?.split('#')[1];
                        const src = v.vehicleSource || 'External';
                        const isFleet = src === 'Fleet';
                        return (
                            <motion.div key={v._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mobile-duty-card">
                                <div className="card-header">
                                    <div className="header-left">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span className="car-num">{v.carNumber?.split('#')[0]}</span>
                                            <span style={{
                                                padding: '2px 7px', borderRadius: '20px', fontSize: '8px', fontWeight: '900',
                                                background: isFleet ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                                color: isFleet ? '#10b981' : '#f59e0b'
                                            }}>{src.toUpperCase()}</span>
                                        </div>
                                        <span className="date-label">{formatDateDisplay(dutyDate)}</span>
                                    </div>
                                    <div className="amount-tag">₹{Number(v.dutyAmount || 0).toLocaleString()}</div>
                                </div>
                                <div className="card-body">
                                    {v.driverName && (
                                        <div className="detail-item">
                                            <label>Driver</label>
                                            <div className="val">{v.driverName}</div>
                                        </div>
                                    )}
                                    <div className="detail-item">
                                        <label>Event · Client</label>
                                        <div className="val">{event?.name || 'N/A'} · {event?.client || 'N/A'}</div>
                                    </div>
                                    <div className="detail-item" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                            <label>Duty Type</label>
                                            <div className="val">{v.dutyType || 'General'}</div>
                                        </div>
                                        <div>
                                            <label>Duty Time</label>
                                            <div className="val">{v.dutyTime || '—'}</div>
                                        </div>
                                    </div>
                                    <div className="detail-item">
                                        <label>Drop Location</label>
                                        <div className="val">{v.dropLocation || '—'}</div>
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <div className="model-info">{v.model}</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEditDuty(v)} className="icon-btn"><Edit size={14} /></button>
                                        <button onClick={() => handleDeleteDuty(v._id)} className="icon-btn del"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                }
            </div >

            {/* Duty Modal */}
            < AnimatePresence >
                {showDutyModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="modal-container"
                            style={{
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                width: 'min(95%, 600px)',
                                borderRadius: '24px',
                                background: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative'
                            }}
                        >
                            <div className="modal-header" style={{
                                background: 'linear-gradient(to right, rgba(251, 191, 36, 0.08), transparent)',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                padding: '25px 30px',
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 12px rgba(251, 191, 36, 0.4)' }}></div>
                                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>
                                            {isEditingDuty ? 'Edit Duty Log' : 'New Duty Entry'}
                                        </h3>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>Enter assignment and logistics detail below</p>
                                </div>
                                <button onClick={() => setShowDutyModal(false)} className="close-btn" style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmitDuty} className="modal-form" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>

                                {/* Step 1: Assignment & Date */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '5px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '900', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', display: 'block' }}>Assignment Context</label>

                                    <div className="form-group" style={{ marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {['Fleet', 'External'].map(src => (
                                                <button key={src} type="button" onClick={() => setDutyFormData(prev => ({ ...prev, vehicleSource: src }))}
                                                    style={{
                                                        flex: 1, padding: '14px', borderRadius: '14px', border: `1px solid ${dutyFormData.vehicleSource === src ? (src === 'Fleet' ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)') : 'rgba(255,255,255,0.08)'}`,
                                                        background: dutyFormData.vehicleSource === src ? (src === 'Fleet' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)') : 'rgba(0,0,0,0.3)',
                                                        color: dutyFormData.vehicleSource === src ? (src === 'Fleet' ? '#10b981' : '#f59e0b') : 'rgba(255,255,255,0.4)',
                                                        fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        boxShadow: dutyFormData.vehicleSource === src ? `0 4px 15px ${src === 'Fleet' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}` : 'none'
                                                    }}>
                                                    {src === 'Fleet' ? <Building2 size={16} /> : <TruckIcon size={16} />}
                                                    {src === 'Fleet' ? 'COMPANY FLEET' : 'EXTERNAL CAR'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid-row" style={{ gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 0 }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <Briefcase size={14} color="rgba(255,255,255,0.3)" />
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Event *</label>
                                            </div>
                                            <select required value={dutyFormData.eventId} onChange={e => setDutyFormData({ ...dutyFormData, eventId: e.target.value })} className="modal-input" style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px' }}>
                                                <option value="">Select Event</option>
                                                {events.map(e => <option key={e._id} value={e._id}>{e.name} ({e.client})</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <Calendar size={14} color="rgba(255,255,255,0.3)" />
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duty Date *</label>
                                            </div>
                                            <input type="date" required value={dutyFormData.date} onChange={e => setDutyFormData({ ...dutyFormData, date: e.target.value })} className="modal-input" style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 2: Vehicle & Driver */}
                                <div style={{ background: 'rgba(255,255,255,0.015)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <div style={{ width: '4px', height: '14px', borderRadius: '2px', background: '#10b981' }}></div>
                                        <label style={{ fontSize: '12px', fontWeight: '900', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle & Personnel</label>
                                    </div>

                                    <div className="grid-row" style={{ gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '20px' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <Car size={14} color="rgba(255,255,255,0.3)" />
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plate Number *</label>
                                            </div>
                                            <input
                                                type="text"
                                                list={dutyFormData.vehicleSource === 'Fleet' ? "masterCars" : undefined}
                                                required
                                                value={dutyFormData.carNumber}
                                                onChange={e => handleCarNumberChange(e.target.value)}
                                                className="modal-input"
                                                placeholder="Search Car"
                                                style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px', textTransform: 'uppercase', fontWeight: 'bold' }}
                                            />
                                            {dutyFormData.vehicleSource === 'Fleet' && (
                                                <datalist id="masterCars">
                                                    {allVehiclesMaster.map(v => <option key={v._id} value={v.carNumber} />)}
                                                </datalist>
                                            )}
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <Target size={14} color="rgba(255,255,255,0.3)" />
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicle Model</label>
                                            </div>
                                            <input type="text" value={dutyFormData.model} onChange={e => setDutyFormData({ ...dutyFormData, model: e.target.value })} className="modal-input" placeholder="e.g. Innova Crysta" style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px' }} />
                                        </div>
                                    </div>

                                    <div className="grid-row" style={{ gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 0 }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <User size={14} color="rgba(255,255,255,0.3)" />
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Driver / POC Name</label>
                                            </div>
                                            <input type="text" value={dutyFormData.driverName} onChange={e => setDutyFormData({ ...dutyFormData, driverName: e.target.value })} className="modal-input" placeholder="Enter name..." style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px' }} />
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '14px', fontWeight: '900', color: '#10b981' }}>₹</span>
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duty Settlement (₹)</label>
                                            </div>
                                            <input type="number" value={dutyFormData.dutyAmount} onChange={e => setDutyFormData({ ...dutyFormData, dutyAmount: e.target.value })} className="modal-input" placeholder="0.00" style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: '#10b981', padding: '0 15px', fontWeight: '900', fontSize: '16px' }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Step 3: Operational Logistics */}
                                <div style={{ background: 'rgba(255,255,255,0.015)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <div style={{ width: '4px', height: '14px', borderRadius: '2px', background: '#0ea5e9' }}></div>
                                        <label style={{ fontSize: '12px', fontWeight: '900', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '1px' }}>Operational Logistics</label>
                                    </div>

                                    <div className="grid-row" style={{ gap: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '20px' }}>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                <Users size={14} color="rgba(255,255,255,0.3)" />
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duty Type</label>
                                            </div>
                                            <input type="text" list="dutyTypes" value={dutyFormData.dutyType} onChange={e => setDutyFormData({ ...dutyFormData, dutyType: e.target.value })} className="modal-input" placeholder="e.g. Pickup, Drop" style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px' }} />
                                            <datalist id="dutyTypes">
                                                <option value="Airport Pickup" />
                                                <option value="Airport Drop" />
                                                <option value="Full Day Local" />
                                                <option value="Outstation" />
                                                <option value="Hotel Transfer" />
                                                <option value="Dinner Drop" />
                                            </datalist>
                                        </div>
                                        <div className="form-group" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={14} color="rgba(255,255,255,0.3)" />
                                                    <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duty Time</label>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setDutyFormData(prev => ({ ...prev, dutyTime: currentTimeIST() }))}
                                                    style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', color: '#0ea5e9', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    SET NOW
                                                </button>
                                            </div>
                                            <input
                                                type="time"
                                                value={dutyFormData.dutyTime}
                                                onChange={e => setDutyFormData({ ...dutyFormData, dutyTime: e.target.value })}
                                                className="modal-input"
                                                style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px', colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <MapPin size={14} color="rgba(255,255,255,0.3)" />
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destination / Venue</label>
                                        </div>
                                        <input type="text" value={dutyFormData.dropLocation} onChange={e => setDutyFormData({ ...dutyFormData, dropLocation: e.target.value })} className="modal-input" placeholder="e.g. Terminal 3, Hotel Radisson..." style={{ width: '100%', height: '52px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', color: 'white', padding: '0 15px' }} />
                                    </div>
                                </div>


                                <button type="submit" className="submit-btn" style={{
                                    height: '56px', fontSize: '16px', fontWeight: '900', letterSpacing: '1px',
                                    background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                                    color: 'black', borderRadius: '16px', border: 'none', cursor: 'pointer',
                                    marginTop: '10px', boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)'
                                }}>
                                    {isEditingDuty ? 'UPDATE DUTY LOG' : 'CONFIRM & LOG DUTY'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Event Modal */}
            < AnimatePresence >
                {showEventModal && (
                    <div className="modal-overlay">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-container small">
                            <div className="modal-header">
                                <div>
                                    <h3>Configure Event</h3>
                                    <p>Create a master entry for a new client event</p>
                                </div>
                                <button onClick={() => setShowEventModal(false)} className="close-btn"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateEvent} className="modal-form">
                                <div className="form-group">
                                    <label>Event Name *</label>
                                    <input type="text" required value={eventFormData.name} onChange={e => setEventFormData({ ...eventFormData, name: e.target.value })} className="modal-input" placeholder="Reliance Conference 2024" />
                                </div>
                                <div className="form-group">
                                    <label>Client *</label>
                                    <input type="text" required value={eventFormData.client} onChange={e => setEventFormData({ ...eventFormData, client: e.target.value })} className="modal-input" placeholder="Client Name" />
                                </div>
                                <div className="form-group">
                                    <label>Default Date</label>
                                    <input type="date" value={eventFormData.date} onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })} className="modal-input" />
                                </div>
                                <button type="submit" className="submit-btn">Save Event Master</button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            <style>{`
                .premium-icon-bg { width: clamp(40px,10vw,50px); height: clamp(40px,10vw,50px); background: linear-gradient(135deg, white, #f8fafc); border-radius: 16px; display: flex; justify-content: center; align-items: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); padding: 8px; }
                .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #fbbf24; box-shadow: 0 0 8px #fbbf24; animation: pulse 2s infinite; }
                .label-text { font-size: clamp(9px,2.5vw,10px); font-weight: 800; color: rgba(255,255,255,0.5); letter-spacing: 1px; text-transform: uppercase; }
                .main-title { color: white; font-size: clamp(24px, 5vw, 32px); font-weight: 900; margin: 0; letter-spacing: -1px; }
                .text-gradient-yellow { background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .subtitle-text { margin-top: 4px; font-size: 13px; color: rgba(255,255,255,0.6); margin: 0; }
                .flex-resp { display: flex; flex-wrap: wrap; }
                .stat-card { padding: 12px 20px; min-width: 150px; display: flex; flex-direction: column; position: relative; overflow: hidden; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); }
                .stat-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                .stat-value { color: white; font-size: 20px; font-weight: 900; }
                .stat-unit { color: rgba(255,255,255,0.4); font-size: 11px; font-weight: 700; margin-left: 4px; }
                
                .filter-container { display: flex; flex-wrap: wrap; gap: 12px; padding: 20px; align-items: center; background: rgba(15, 23, 42, 0.4) !important; margin-bottom: 20px; }
                .search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); }
                .search-input { width: 100%; height: 50px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding-left: 45px; color: white; outline: none; transition: 0.3s; }
                .search-input:focus { border-color: #fbbf24; background: rgba(0,0,0,0.3); }
                .select-field { flex: 1 1 140px; height: 50px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; color: white; padding: 0 15px; outline: none; cursor: pointer; }
                .select-field option { background: #1e293b; color: white; }
                
                .calendar-controls { display: flex; align-items: center; gap: 5px; background: rgba(0,0,0,0.25); padding: 4px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                .shift-btn { width: 36px; height: 36px; border-radius: 12px; background: rgba(255,255,255,0.03); border: none; color: rgba(255,255,255,0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .shift-btn:hover { background: rgba(255,255,255,0.08); color: white; }
                .date-inputs { display: flex; gap: 5px; }
                .date-chip { padding: 0 15px; height: 36px; display: flex; align-items: center; gap: 8px; cursor: pointer; border-radius: 10px; position: relative; overflow: hidden; border: 1px solid transparent; }
                .date-chip.from { background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); }
                .date-chip.to { background: rgba(251, 191, 36, 0.1); border-color: rgba(251, 191, 36, 0.2); }
                .date-chip span { font-size: 9px; font-weight: 900; opacity: 0.6; }
                .date-chip b { font-size: 11px; font-weight: 800; color: white; }
                .date-chip input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
                
                .toggle-btn-plus { width: 36px; height: 36px; border-radius: 10px; border: none; cursor: pointer; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); display: flex; align-items: center; justify-content: center; transition: 0.3s; }
                .toggle-btn-plus.active { background: #fbbf24; color: black; }
                
                .action-buttons-row { display: flex; justify-content: space-between; align-items: center; gap: 15px; margin-top: 15px; flex-wrap: wrap; }
                .primary-btn { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 25px; border-radius: 14px; background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: black; font-weight: 800; border: none; cursor: pointer; box-shadow: 0 8px 15px rgba(251,191,36,0.2); transition: 0.2s; }
                .primary-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
                .secondary-btn { display: flex; align-items: center; gap: 8px; height: 52px; padding: 0 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: white; font-weight: 700; border-radius: 12px; cursor: pointer; transition: 0.2s; }
                .secondary-btn:hover { background: rgba(255,255,255,0.08); }
                .target-input-inline { width: 60px; background: transparent; border: none; border-bottom: 2px solid rgba(251,191,36,0.5); color: #fbbf24; font-weight: 900; font-size: 16px; outline: none; text-align: center; }

                /* ===== TABLE ===== */
                .main-table-container { padding: 0; border: 1px solid rgba(255,255,255,0.06); background: rgba(10, 16, 30, 0.6) !important; overflow: hidden; border-radius: 20px; }
                table { width: 100%; border-collapse: separate; border-spacing: 0; }
                th { padding: 16px 20px; text-align: left; background: rgba(255,255,255,0.025); color: rgba(255,255,255,0.35); font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: nowrap; }
                .table-row { transition: background 0.2s; }
                .table-row:hover { background: rgba(251,191,36,0.03); }
                .table-row td { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
                .table-row:last-child td { border-bottom: none; }

                /* ===== DATE CELL ===== */
                .date-cell { min-width: 80px; }
                .date-cell .day-name { font-size: 8px; font-weight: 950; color: #fbbf24; letter-spacing: 1.5px; margin-bottom: 3px; text-transform: uppercase; }
                .date-cell .date-val { color: white; font-weight: 800; font-size: 15px; line-height: 1.2; }
                .date-cell .year-val { font-size: 10px; color: rgba(255,255,255,0.25); font-weight: 600; margin-top: 2px; }

                /* ===== VEHICLE CELL ===== */
                .vehicle-cell .plate-num { font-weight: 900; color: white; font-size: 14px; letter-spacing: 0.8px; font-variant-numeric: tabular-nums; }
                .vehicle-cell .model-name { font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 600; margin-top: 3px; }
                
                /* ===== DUTY CELL ===== */
                .duty-cell .event-name { color: white; font-weight: 800; font-size: 14px; margin-bottom: 3px; }
                .duty-cell .venue-text { font-size: 11px; color: rgba(255,255,255,0.35); }
                .duty-cell .loc-text { font-size: 11px; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 4px; }

                /* ===== ENTITY CELL ===== */
                .entity-cell .client-name { color: white; font-weight: 700; font-size: 14px; margin-bottom: 4px; }
                .entity-cell .venue-text { font-size: 11px; color: rgba(255,255,255,0.3); }

                /* ===== BADGES ===== */
                .badge-fleet { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
                .badge-ext { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; letter-spacing: 0.5px; background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
                .badge-duty { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); white-space: nowrap; }
                .badge-time { display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 800; background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.25); white-space: nowrap; }
                .badge-loc { display: flex; align-items: center; gap: 5px; color: rgba(255,255,255,0.65); font-size: 12px; font-weight: 600; }
                .badge-no-data { font-size: 11px; color: rgba(255,255,255,0.18); font-style: italic; }
                
                /* ===== AMOUNT ===== */
                .amount-cell { text-align: right; }
                .amount-badge { display: inline-block; padding: 6px 14px; background: rgba(16,185,129,0.1); color: #10b981; font-weight: 900; font-size: 14px; border-radius: 10px; border: 1px solid rgba(16,185,129,0.2); }

                /* ===== ACTIONS ===== */
                .action-cell { text-align: right; }
                .action-group { display: flex; gap: 8px; justify-content: flex-end; }
                .action-group button { width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                .edit-btn:hover { background: rgba(251,191,36,0.15); color: #fbbf24; border-color: rgba(251,191,36,0.3); }
                .delete-btn:hover { background: rgba(244,63,94,0.15); color: #f43f5e; border-color: rgba(244,63,94,0.3); }
                
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px; }
                .action-group button { width: 34px; height: 34px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                .edit-btn:hover { background: rgba(251,191,36,0.12); color: #fbbf24; border-color: rgba(251,191,36,0.25); }
                .delete-btn:hover { background: rgba(244,63,94,0.12); color: #f43f5e; border-color: rgba(244,63,94,0.25); }

                /* ===== MODAL ===== */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(14px); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px; }
                .modal-container { width: 100%; max-width: 680px; background: #080d18; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; max-height: 90vh; overflow-y: auto; }
                .modal-container.small { max-width: 450px; }
                .modal-header { padding: 25px 30px; background: linear-gradient(to right, rgba(251,191,36,0.07), transparent); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 2; backdrop-filter: blur(10px); }
                .modal-header h3 { color: white; margin: 0; font-size: 20px; font-weight: 800; }
                .modal-header p { color: rgba(255,255,255,0.4); margin: 4px 0 0; font-size: 12px; }
                .close-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); border-radius: 10px; width: 36px; height: 36px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
                .close-btn:hover { background: rgba(244,63,94,0.15); color: #f43f5e; border-color: rgba(244,63,94,0.3); }
                .modal-form { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
                .grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-group label { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; }
                .modal-input { height: 52px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 0 15px; color: white; outline: none; transition: 0.3s; width: 100%; }
                .modal-input:focus { border-color: #fbbf24; background: rgba(251,191,36,0.04); box-shadow: 0 0 0 3px rgba(251,191,36,0.07); }
                .submit-btn { height: 56px; background: linear-gradient(135deg, #fbbf24, #d97706); border: none; border-radius: 16px; color: black; font-weight: 900; font-size: 16px; margin-top: 10px; cursor: pointer; transition: 0.2s; box-shadow: 0 10px 20px -5px rgba(251,191,36,0.3); }
                .submit-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 28px -5px rgba(251,191,36,0.4); }

                /* ===== MOBILE CARDS ===== */
                .mobile-duty-card { background: linear-gradient(140deg, rgba(20,30,50,0.8), rgba(10,15,30,0.95)); padding: 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 14px; }
                .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
                .header-left { display: flex; flex-direction: column; gap: 4px; }
                .car-num { color: white; font-weight: 900; font-size: 17px; letter-spacing: 0.5px; }
                .date-label { color: #fbbf24; font-size: 11px; font-weight: 700; }
                .amount-tag { color: #10b981; font-weight: 900; font-size: 16px; }
                .detail-item { margin-bottom: 10px; }
                .detail-item label { display: block; font-size: 9px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 2px; }
                .detail-item .val { color: white; font-size: 13px; font-weight: 600; }
                .card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); }
                .model-info { color: rgba(255,255,255,0.3); font-size: 11px; }
                .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
                .icon-btn.del { color: #f43f5e; }

                @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                @media (max-width: 768px) { .grid-row { grid-template-columns: 1fr; } .header-left { flex-direction: row; align-items: baseline; gap: 10px; } }
            `}</style>
        </div >
    );
};

export default EventManagement;
