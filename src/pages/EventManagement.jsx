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
    nowIST 
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
    const [sourceFilter, setSourceFilter] = useState('All'); // 'All' | 'Fleet' | 'External'

    const getToday = () => todayIST();
    const [isRange, setIsRange] = useState(false);
    const [fromDate, setFromDate] = useState(firstDayOfMonthIST());
    const [toDate, setToDate] = useState(todayIST());

    useEffect(() => {
        if (!isRange) {
            const d = nowIST(toDate);
            const firstDay = toISTDateString(new Date(d.getUTCFullYear(), d.getUTCMonth(), 1));
            const lastDay = toISTDateString(new Date(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
            if (fromDate !== firstDay) setFromDate(firstDay);
            if (toDate !== lastDay) setToDate(lastDay);
        }
    }, [isRange, toDate]);

    const [monthlyTarget, setMonthlyTarget] = useState(0);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showDutyModal, setShowDutyModal] = useState(false);
    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [isEditingDuty, setIsEditingDuty] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const [eventFormData, setEventFormData] = useState({ name: '', client: '', date: getToday(), location: '', description: '' });
    const [dutyFormData, setDutyFormData] = useState({
        carNumber: '', model: '', dropLocation: '', date: getToday(),
        eventId: '', dutyAmount: '', driverName: '', vehicleSource: 'External' // 'Fleet' | 'External'
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
        const f = nowIST(fromDate);
        f.setUTCDate(f.getUTCDate() + n);
        const fStr = f.toISOString().split('T')[0];
        setFromDate(fStr);
        if (!isRange) setToDate(fStr);
    };

    const handleCarNumberChange = (val) => {
        const upVal = val.toUpperCase();
        const existingFleet = allVehiclesMaster.find(v => v.carNumber === upVal);
        if (existingFleet) {
            setDutyFormData(prev => ({ ...prev, carNumber: upVal, model: existingFleet.model || prev.model, vehicleSource: 'Fleet' }));
            return;
        }
        const existingDuty = vehicles.find(v => v.carNumber?.split('#')[0] === upVal);
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
                vehicleSource: dutyFormData.vehicleSource || 'External'
            };
            if (isEditingDuty && selectedId) {
                await axios.put(`/api/admin/vehicles/${selectedId}`, payload, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            } else {
                const data = new FormData();
                Object.keys(payload).forEach(key => data.append(key, payload[key]));
                data.append('permitType', 'Contract');
                data.append('carType', 'Other');
                await axios.post('/api/admin/vehicles', data, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            }
            setShowDutyModal(false);
            fetchVehicles();
            setDutyFormData({ carNumber: '', model: '', dropLocation: '', date: getToday(), eventId: '', dutyAmount: '', driverName: '', vehicleSource: 'External' });
        } catch (err) { alert('Error saving duty entry'); }
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
            vehicleSource: v.vehicleSource || 'External'
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

    const filtered = vehicles.filter(v => {
        const plate = v.carNumber?.split('#')[0] || '';
        const event = events.find(e => e._id === v.eventId);
        const eventName = event?.name || '';
        const clientName = event?.client || '';
        const matchesSearch = plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.driverName || '').toLowerCase().includes(searchTerm.toLowerCase());
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

    const totalDuties = filtered.length;
    const totalAmount = filtered.reduce((sum, v) => sum + (Number(v.dutyAmount) || 0), 0);
    const fleetCount = filtered.filter(v => (v.vehicleSource || 'External') === 'Fleet').length;
    const extCount = filtered.filter(v => (v.vehicleSource || 'External') === 'External').length;
    const uniqueClients = [...new Set(events.map(e => e.client).filter(Boolean))].sort();

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
                'Duty Type / Loc': v.dropLocation || '',
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

            <header style={{ padding: 'clamp(20px, 4vw, 40px) 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
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
                            <Briefcase size={32} color="#fbbf24" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                                <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Fleet Operations</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
                                Event <span style={{ background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Command</span>
                            </h1>
                            <p style={{ marginTop: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                                {isRange ? (
                                    <>Range: <b style={{ color: 'white' }}>{formatDateDisplay(fromDate)}</b> — <b style={{ color: 'white' }}>{formatDateDisplay(toDate)}</b></>
                                ) : (
                                    <>Cycle: <b style={{ color: 'white' }}>{formatDateIST(toDate, { month: 'long', year: 'numeric' }).toUpperCase()}</b></>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex-resp" style={{ gap: '12px' }}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '12px 20px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '140px', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', background: '#fbbf24', width: `${targetPercentage}%`, transition: 'width 1s ease-out' }}></div>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#fbbf24', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Target size={10} /> Progress</span>
                            <span style={{ color: 'white', fontSize: '18px', fontWeight: '900' }}>{currentMonthDuties} <span style={{ fontSize: '12px', opacity: 0.4 }}>/ {monthlyTarget}</span></span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '12px 20px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '130px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Revenue</span>
                            <span style={{ color: 'white', fontSize: '18px', fontWeight: '900' }}>₹{totalAmount.toLocaleString()}</span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '12px 20px', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '140px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#818cf8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Fleet vs Ext</span>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ color: 'white', fontSize: '16px', fontWeight: '900' }}>{fleetCount}</span>
                                <span style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></span>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px', fontWeight: '900' }}>{extCount}</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card filter-container" style={{ padding: '20px', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Search vehicle, driver, event..."
                            className="input-field"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', height: '50px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', paddingLeft: '45px', margin: 0 }}
                        />
                    </div>

                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', gap: '4px' }}>
                        {['All', 'Fleet', 'External'].map(s => (
                            <button key={s} onClick={() => setSourceFilter(s)} style={{
                                padding: '8px 16px', borderRadius: '11px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '900',
                                background: sourceFilter === s ? (s === 'Fleet' ? 'rgba(16,185,129,0.2)' : s === 'External' ? 'rgba(245,158,11,0.2)' : 'rgba(14, 165, 233, 0.1)') : 'transparent',
                                color: sourceFilter === s ? (s === 'Fleet' ? '#10b981' : s === 'External' ? '#f59e0b' : '#38bdf8') : 'rgba(255,255,255,0.3)',
                                transition: 'all 0.3s ease',
                                textTransform: 'uppercase', letterSpacing: '0.5px'
                            }}>{s}</button>
                        ))}
                    </div>

                    <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="input-field" style={{ flex: '1 1 160px', height: '50px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', margin: 0 }}>
                        <option value="All" style={{ background: '#1e293b' }}>All Clients</option>
                        {uniqueClients.map(c => <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>)}
                    </select>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'rgba(0,0,0,0.25)',
                        padding: '4px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}>
                        <button
                            onClick={() => shiftDays(-1)}
                            style={{
                                width: '36px', height: '36px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.03)', border: 'none',
                                color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div style={{ display: 'flex', gap: '5px' }}>
                            {isRange && (
                                <div style={{
                                    padding: '0 15px', height: '36px', display: 'flex',
                                    alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    background: 'rgba(14, 165, 233, 0.1)', borderRadius: '10px',
                                    border: '1px solid rgba(14, 165, 233, 0.15)',
                                    position: 'relative', overflow: 'hidden'
                                }}>
                                    <span style={{ color: '#0ea5e9', fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px' }}>FROM:</span>
                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '950' }}>
                                        {formatDateIST(fromDate)}
                                    </span>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        style={{
                                            position: 'absolute', opacity: 0, inset: 0,
                                            width: '100%', height: '100%', cursor: 'pointer', zIndex: 2
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{
                                padding: '0 15px', height: '36px', display: 'flex',
                                alignItems: 'center', gap: '8px', cursor: 'pointer',
                                background: isRange ? 'rgba(251, 191, 36, 0.1)' : 'rgba(14, 165, 233, 0.1)',
                                borderRadius: '10px',
                                border: `1px solid ${isRange ? 'rgba(251, 191, 36, 0.2)' : 'rgba(14, 165, 233, 0.2)'}`,
                                position: 'relative', overflow: 'hidden'
                            }}>
                                {isRange ? (
                                    <span style={{ color: '#fbbf24', fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px' }}>TO:</span>
                                ) : (
                                    <Calendar size={14} color="#0ea5e9" />
                                )}
                                <span style={{ color: 'white', fontSize: '12px', fontWeight: '950' }}>
                                    {isRange ? formatDateIST(toDate) : formatDateIST(toDate, { month: 'long', year: 'numeric' }).toUpperCase()}
                                </span>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        if (!isRange) setFromDate(e.target.value);
                                    }}
                                    style={{
                                        position: 'absolute', opacity: 0, inset: 0,
                                        width: '100%', height: '100%', cursor: 'pointer', zIndex: 2
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => shiftDays(1)}
                            style={{
                                width: '36px', height: '36px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.03)', border: 'none',
                                color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            const next = !isRange;
                            setIsRange(next);
                        }}
                        style={{
                            marginLeft: '5px', padding: '0 12px', height: '38px',
                            borderRadius: '12px', border: 'none', cursor: 'pointer',
                            background: isRange ? '#fbbf24' : 'rgba(255,255,255,0.05)',
                            color: isRange ? 'black' : 'rgba(255,255,255,0.4)',
                            fontSize: '10px', fontWeight: '900', textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}
                    >
                        {isRange ? <X size={14} style={{ marginRight: '5px', display: 'inline', verticalAlign: 'middle' }} /> : <Plus size={14} style={{ marginRight: '5px', display: 'inline', verticalAlign: 'middle' }} />}
                        {isRange ? 'Custom Range' : 'Monthly Cycle'}
                    </button>
                </div>

                <div className="event-action-btns" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginTop: '15px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={exportExcel} className="secondary-btn"><FileSpreadsheet size={18} /> Excel</button>
                        <button onClick={() => { setIsEditingEvent(false); setEventFormData({ name: '', client: '', date: getToday(), location: '', description: '' }); setShowEventModal(true); }} className="secondary-btn"><Plus size={18} /> New Event</button>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0 15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', marginRight: '10px' }}>TARGET:</span>
                            <input type="number" value={monthlyTarget} onChange={e => handleTargetChange(e.target.value)} className="target-input-inline" />
                        </div>
                    </div>
                    <button onClick={() => { setIsEditingDuty(false); setDutyFormData({ carNumber: '', model: '', dropLocation: '', date: getToday(), eventId: '', dutyAmount: '', driverName: '', vehicleSource: 'External' }); setShowDutyModal(true); }} className="primary-btn">
                        <Plus size={20} /> Add Duty Entry
                    </button>
                </div>
            </header>

            {/* Desktop Table */}
            <div className="glass-card main-table-container hide-mobile">
                <table>
                    <thead>
                        <tr>
                            <th>Timeline</th>
                            <th>Vehicle</th>
                            <th>Driver / Source</th>
                            <th>Service Detail</th>
                            <th>Client / Venue</th>
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
                                <motion.tr key={v._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }} className="table-row">
                                    <td className="date-cell">
                                        <div className="day-name">{formatDateIST(dutyDate, { weekday: 'short' }).toUpperCase()}</div>
                                        <div className="date-val">{formatDateIST(dutyDate, { day: '2-digit', month: 'short' })}</div>
                                    </td>
                                    <td className="vehicle-cell">
                                        <div className="plate-num">{v.carNumber?.split('#')[0]}</div>
                                        <div className="model-name">{v.model || '—'}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                padding: '3px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px',
                                                background: isFleet ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                                color: isFleet ? '#10b981' : '#f59e0b',
                                                border: `1px solid ${isFleet ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`
                                            }}>
                                                {isFleet ? <Building2 size={9} /> : <TruckIcon size={9} />}
                                                {src.toUpperCase()}
                                            </div>
                                        </div>
                                        {v.driverName ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <User size={11} color="rgba(255,255,255,0.35)" />
                                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '700' }}>{v.driverName}</span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>No driver info</span>
                                        )}
                                    </td>
                                    <td className="duty-cell">
                                        <div className="event-name">{event?.name || 'N/A'}</div>
                                        <div className="loc-text"><MapPin size={10} style={{ marginRight: '4px' }} />{v.dropLocation || '—'}</div>
                                    </td>
                                    <td className="entity-cell">
                                        <div className="client-name">{event?.client || 'N/A'}</div>
                                        <div className="venue-text">{event?.location || '—'}</div>
                                    </td>
                                    <td className="amount-cell">
                                        <div className="amount-badge">₹{Number(v.dutyAmount || 0).toLocaleString()}</div>
                                    </td>
                                    <td className="action-cell">
                                        <div className="action-group">
                                            <button onClick={() => handleEditDuty(v)} className="edit-btn"><Edit size={16} /></button>
                                            <button onClick={() => handleDeleteDuty(v._id)} className="delete-btn"><Trash2 size={16} /></button>
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
                                        <label>Event / Client</label>
                                        <div className="val">{event?.name || 'N/A'} · {event?.client || 'N/A'}</div>
                                    </div>
                                    <div className="detail-item">
                                        <label>Duty Detail</label>
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
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-container">
                            <div className="modal-header">
                                <div>
                                    <h3>{isEditingDuty ? 'Edit Duty Log' : 'Add Event Duty'}</h3>
                                    <p>Assign fleet or external vehicle to an event</p>
                                </div>
                                <button onClick={() => setShowDutyModal(false)} className="close-btn"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmitDuty} className="modal-form">

                                {/* Vehicle Source Toggle */}
                                <div className="form-group">
                                    <label>Vehicle Source *</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {['Fleet', 'External'].map(src => (
                                            <button key={src} type="button" onClick={() => setDutyFormData(prev => ({ ...prev, vehicleSource: src }))}
                                                style={{
                                                    flex: 1, padding: '12px', borderRadius: '12px', border: `1px solid ${dutyFormData.vehicleSource === src ? (src === 'Fleet' ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)') : 'rgba(255,255,255,0.08)'}`,
                                                    background: dutyFormData.vehicleSource === src ? (src === 'Fleet' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)') : 'rgba(0,0,0,0.2)',
                                                    color: dutyFormData.vehicleSource === src ? (src === 'Fleet' ? '#10b981' : '#f59e0b') : 'rgba(255,255,255,0.4)',
                                                    fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
                                                }}>
                                                {src === 'Fleet' ? <Building2 size={14} /> : <TruckIcon size={14} />}
                                                {src === 'Fleet' ? 'Company Fleet' : 'OutSide Cars'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid-row">
                                    <div className="form-group">
                                        <label>Event *</label>
                                        <select required value={dutyFormData.eventId} onChange={e => setDutyFormData({ ...dutyFormData, eventId: e.target.value })} className="modal-input">
                                            <option value="">Select Event</option>
                                            {events.map(e => <option key={e._id} value={e._id}>{e.name} ({e.client})</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Duty Date *</label>
                                        <input type="date" required value={dutyFormData.date} onChange={e => setDutyFormData({ ...dutyFormData, date: e.target.value })} className="modal-input" />
                                    </div>
                                </div>
                                <div className="grid-row">
                                    <div className="form-group">
                                        <label>Vehicle Number *</label>
                                        <input type="text" list="masterCars" required value={dutyFormData.carNumber} onChange={e => handleCarNumberChange(e.target.value)} className="modal-input" placeholder="e.g. RJ27TA6113" />
                                        <datalist id="masterCars">
                                            {allVehiclesMaster.map(v => <option key={v._id} value={v.carNumber} />)}
                                        </datalist>
                                    </div>
                                    <div className="form-group">
                                        <label>Model</label>
                                        <input type="text" value={dutyFormData.model} onChange={e => setDutyFormData({ ...dutyFormData, model: e.target.value })} className="modal-input" placeholder="e.g. Innova Crysta" />
                                    </div>
                                </div>
                                <div className="grid-row">
                                    <div className="form-group">
                                        <label>Driver Name</label>
                                        <input type="text" value={dutyFormData.driverName} onChange={e => setDutyFormData({ ...dutyFormData, driverName: e.target.value })} className="modal-input" placeholder="Driver / Owner name" />
                                    </div>
                                    <div className="form-group">
                                        <label>Rate / Amount (₹)</label>
                                        <input type="number" value={dutyFormData.dutyAmount} onChange={e => setDutyFormData({ ...dutyFormData, dutyAmount: e.target.value })} className="modal-input" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Duty Detail / Terminal / Route</label>
                                    <input type="text" value={dutyFormData.dropLocation} onChange={e => setDutyFormData({ ...dutyFormData, dropLocation: e.target.value })} className="modal-input" placeholder="e.g. T3 PickUp, Airport Drop" />
                                </div>
                                <button type="submit" className="submit-btn">{isEditingDuty ? 'Update Entry' : 'Log Entry'}</button>
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

                .main-table-container { padding: 0; border: 1px solid rgba(255,255,255,0.05); background: rgba(15, 23, 42, 0.4) !important; overflow: hidden; }
                table { width: 100%; border-collapse: separate; border-spacing: 0; }
                th { padding: 18px 20px; text-align: left; background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .table-row { transition: 0.2s; }
                .table-row:hover { background: rgba(255,255,255,0.02); }
                .table-row td { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); vertical-align: middle; }
                
                .date-cell .day-name { font-size: 9px; font-weight: 950; color: #fbbf24; margin-bottom: 4px; }
                .date-cell .date-val { color: white; font-weight: 800; font-size: 14px; }
                .vehicle-cell .plate-num { font-weight: 900; color: white; font-size: 16px; letter-spacing: 0.5px; }
                .vehicle-cell .model-name { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 600; }
                .duty-cell .event-name { color: white; font-weight: 800; font-size: 15px; margin-bottom: 4px; }
                .duty-cell .loc-text { font-size: 12px; color: rgba(255,255,255,0.4); display: flex; align-items: center; }
                .entity-cell .client-name { color: white; font-weight: 700; font-size: 14px; margin-bottom: 4px; }
                .entity-cell .venue-text { font-size: 11px; color: rgba(255,255,255,0.3); }
                .amount-badge { display: inline-block; padding: 6px 12px; background: rgba(16, 185, 129, 0.05); color: #10b981; font-weight: 900; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.1); }
                
                .action-group { display: flex; gap: 8px; justify-content: flex-end; }
                .action-group button { width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: white; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
                .edit-btn:hover { background: #fbbf24; color: black; border-color: #fbbf24; }
                .delete-btn:hover { background: #f43f5e; color: white; border-color: #f43f5e; }
                
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 20px; }
                .modal-container { width: 100%; max-width: 680px; background: #0f172a; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; max-height: 90vh; overflow-y: auto; }
                .modal-container.small { max-width: 450px; }
                .modal-header { padding: 25px 30px; background: linear-gradient(to right, #1e293b, #0f172a); border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 2; }
                .modal-header h3 { color: white; margin: 0; font-size: 20px; font-weight: 800; }
                .modal-header p { color: rgba(255,255,255,0.4); margin: 4px 0 0; font-size: 12px; }
                .close-btn { background: rgba(255,255,255,0.05); border: none; color: white; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; flex-shrink: 0; }
                .modal-form { padding: 30px; display: flex; flex-direction: column; gap: 20px; }
                .grid-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .form-group { display: flex; flex-direction: column; gap: 8px; }
                .form-group label { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase; }
                .modal-input { height: 52px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0 15px; color: white; outline: none; transition: 0.3s; width: 100%; }
                .modal-input:focus { border-color: #fbbf24; background: rgba(0,0,0,0.4); }
                .submit-btn { height: 56px; background: linear-gradient(135deg, #fbbf24, #d97706); border: none; border-radius: 16px; color: black; font-weight: 900; font-size: 16px; margin-top: 10px; cursor: pointer; transition: 0.2s; box-shadow: 0 10px 20px -5px rgba(251,191,36,0.3); }
                .submit-btn:hover { transform: translateY(-2px); }

                .mobile-duty-card { background: rgba(30, 41, 59, 0.4); padding: 15px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 15px; }
                .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
                .header-left { display: flex; flex-direction: column; }
                .car-num { color: white; font-weight: 900; font-size: 16px; }
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
