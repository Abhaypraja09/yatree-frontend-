import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    Calendar, Plus, Search, Trash2, Edit, ChevronLeft, ChevronRight, Car,
    User, MapPin, Target, Briefcase, X, Save, FileSpreadsheet, Users, Building2, TruckIcon, Wallet, Navigation
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
            const headers = { Authorization: `Bearer ${userInfo.token}` };
            
            // 1. Fetch Outside Duties
            const outsideRes = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=outside&from=${fromDate}&to=${toDate}`, { headers });
            const outsideDuties = (outsideRes.data.vehicles || [])
                .filter(v => v.eventId)
                .map(v => ({ 
                    ...v, 
                    vehicleSource: v.vehicleSource || 'External' 
                }));

            // 2. Fetch Fleet Attendance for the same range
            const attendanceRes = await axios.get(`/api/admin/reports/${selectedCompany._id}?from=${fromDate}&to=${toDate}`, { headers });
            
            const attendanceDuties = (attendanceRes.data.attendance || [])
                .filter(a => a.eventId)
                .map(a => ({
                    _id: a._id,
                    carNumber: a.vehicle?.carNumber || 'N/A',
                    model: a.vehicle?.model || 'N/A',
                    driverName: a.driver?.name || 'N/A',
                    vehicleSource: 'Fleet',
                    eventId: a.eventId?._id || a.eventId,
                    dutyAmount: 0,
                    dropLocation: a.dropLocation || '',
                    date: a.date,
                    isAttendance: true,
                    dutyType: a.punchOut?.remarks || 'Fleet Duty',
                    dutyTime: a.punchIn?.time ? formatTimeIST(a.punchIn.time) : ''
                }));

            setVehicles([...outsideDuties, ...attendanceDuties]);
        } catch (err) { 
            console.error('Fetch duties error:', err);
        } finally { 
            setLoading(false); 
        }
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
            setFromDate(tStr);
            setToDate(tStr);
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
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            
            const selectedDuty = isEditingDuty ? vehicles.find(v => v._id === selectedId) : null;

            if (selectedDuty?.isAttendance) {
                // Update Fleet Attendance Record
                const attendancePayload = {
                    eventId: dutyFormData.eventId || 'undefined',
                    dropLocation: dutyFormData.dropLocation
                };
                await axios.put(`/api/admin/attendance/${selectedId}`, attendancePayload, config);
            } else {
                // Handle Outside Car (Virtual Record)
                let internalCarNumber = `${dutyFormData.carNumber}#${dutyFormData.date}`;
                if (!isEditingDuty) {
                    internalCarNumber += `#${Math.random().toString(36).substring(2, 7)}`;
                } else {
                    const parts = selectedDuty?.carNumber?.split('#') || [];
                    if (dutyFormData.carNumber === parts[0] && dutyFormData.date === parts[1] && parts[2]) {
                        internalCarNumber += `#${parts[2]}`;
                    } else {
                        internalCarNumber += `#${Math.random().toString(36).substring(2, 7)}`;
                    }
                }
                const vehiclePayload = {
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

                if (isEditingDuty && selectedId) {
                    await axios.put(`/api/admin/vehicles/${selectedId}`, vehiclePayload, config);
                } else {
                    const data = new FormData();
                    Object.keys(vehiclePayload).forEach(key => data.append(key, vehiclePayload[key]));
                    data.append('permitType', 'Contract');
                    data.append('carType', 'Other');
                    await axios.post('/api/admin/vehicles', data, config);
                }
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
            const duty = vehicles.find(d => d._id === id);
            if (duty?.isAttendance) {
                // For attendance, we just clear the eventId, we don't delete the whole attendance record usually
                // BUT if they want to delete, we call deleteAttendance
                await axios.delete(`/api/admin/attendance/${id}`, { headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` } });
            } else {
                await axios.delete(`/api/admin/vehicles/${id}`, { headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` } });
            }
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
            const plate = (v.carNumber || '').split('#')[0];
            const event = events.find(e => e._id === v.eventId);
            const eventName = event?.name || '';
            const clientName = event?.client || '';
            
            const matchesSearch = 
                plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (v.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (v.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                clientName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesEvent = eventFilter === 'All' || v.eventId === eventFilter;
            const matchesClient = clientFilter === 'All' || clientName === clientFilter;
            const matchesSource = sourceFilter === 'All' || (v.vehicleSource || 'External') === sourceFilter;

            return matchesSearch && matchesEvent && matchesClient && matchesSource;
        }).sort((a, b) => {
            const dA = (a.date || a.carNumber?.split('#')[1] || '');
            const dB = (b.date || b.carNumber?.split('#')[1] || '');
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

            {/* ═══ PREMIUM HERO HEADER ═══ */}
            <div style={{ position: 'relative', padding: 'clamp(20px, 5vw, 40px) 0 20px', marginBottom: '24px' }}>
                {/* Ambient dynamic background elements */}
                <div style={{ position: 'absolute', top: -40, right: '0%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} className="hide-mobile" />
                
                <div className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '30px', position: 'relative' }}>
                    {/* Title Block */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(15px, 3vw, 24px)' }}>
                        <div style={{ 
                            width: 'clamp(50px, 12vw, 68px)', height: 'clamp(50px, 12vw, 68px)', 
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
                            borderRadius: '16px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                            border: '1px solid rgba(251,191,36,0.2)',
                            flexShrink: 0
                        }}>
                            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 5, repeat: Infinity }}>
                                <Briefcase size={28} color="#fbbf24" strokeWidth={1.5} />
                            </motion.div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <div className="pulse-dot" />
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#fbbf24', letterSpacing: '2px', textTransform: 'uppercase' }}>Command Center</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(24px, 6vw, 42px)', fontWeight: '950', margin: 0, letterSpacing: '-1.5px', lineHeight: 1 }}>
                                Event<span style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> Logistics</span>
                            </h1>
                        </div>
                    </div>

                    {/* Stats Grid - High Fidelity */}
                    <div className="stats-grid" style={{ flex: '1', maxWidth: '750px', width: '100%' }}>
                        {[
                            { label: 'Active', value: totalDuties, color: '#fbbf24', icon: <TruckIcon size={18} /> },
                            { label: 'Revenue', value: `₹${totalAmount.toLocaleString()}`, color: '#10b981', icon: <Target size={18} /> },
                            { label: 'Fleet', value: fleetCount, color: '#38bdf8', icon: <Car size={18} /> },
                            { label: 'External', value: extCount, color: '#a855f7', icon: <Users size={18} /> },
                        ].map((s, i) => (
                            <motion.div key={s.label} 
                                initial={{ opacity: 0, y: 15 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: i * 0.1 }}
                                style={{
                                    padding: '16px', borderRadius: '20px',
                                    background: 'rgba(15, 23, 42, 0.4)',
                                    border: `1px solid rgba(255,255,255,0.05)`,
                                    borderLeft: `3px solid ${s.color}`,
                                    display: 'flex', flexDirection: 'column', gap: '8px',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{s.label}</span>
                                    <div style={{ color: s.color, opacity: 0.6 }}>{s.icon}</div>
                                </div>
                                <span style={{ color: 'white', fontSize: '20px', fontWeight: '900' }}>{s.value}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ DYNAMIC INTEGRATED CONTROL BAR ═══ */}
            <div style={{ 
                background: 'rgba(15, 23, 42, 0.65)', 
                border: '1px solid rgba(255,255,255,0.07)', 
                borderRadius: '24px', 
                padding: 'clamp(15px, 3vw, 24px)', 
                marginBottom: '24px', 
                backdropFilter: 'blur(24px)', 
                display: 'flex', flexDirection: 'column', gap: '20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
                {/* Search & Main Selects */}
                <div className="flex-resp" style={{ gap: '16px', alignItems: 'center' }}>
                    {/* Unified Search */}
                    <div style={{ position: 'relative', flex: '1', minWidth: 'min(100%, 300px)' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                        <input 
                            type="text" 
                            placeholder="Search duties..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                            className="premium-compact-input"
                            style={{ paddingLeft: '48px', height: '52px', fontSize: '14px', background: 'rgba(0,0,0,0.2)' }} 
                        />
                    </div>

                    {/* Data Source Filters */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', gap: '4px', overflowX: 'auto' }} className="premium-scroll">
                        {[
                            { id: 'All', label: 'All', color: '#fbbf24' },
                            { id: 'Fleet', label: 'Fleet', color: '#10b981' },
                            { id: 'External', label: 'Ext', color: '#a855f7' }
                        ].map(s => (
                            <button key={s.id} onClick={() => setSourceFilter(s.id)} style={{
                                padding: '8px 15px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '800',
                                background: sourceFilter === s.id ? `${s.color}20` : 'transparent',
                                color: sourceFilter === s.id ? s.color : 'rgba(255,255,255,0.35)',
                                transition: 'all 0.3s ease', 
                                textTransform: 'uppercase'
                            }}>{s.label}</button>
                        ))}
                    </div>

                    {/* Advanced Dropdowns */}
                    <div className="flex-resp" style={{ gap: '10px', flex: '1' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '150px' }}>
                            <Building2 size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                            <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="premium-compact-input" style={{ width: '100%', height: '52px', paddingLeft: '40px', fontSize: '13px', background: 'rgba(0,0,0,0.2)' }}>
                                <option value="All" style={{ background: '#0f172a' }}>All Clients</option>
                                {uniqueClients.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1.2, minWidth: '200px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Target size={14} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                                <select value={eventFilter} onChange={e => setEventFilter(e.target.value)} className="premium-compact-input" style={{ width: '100%', height: '52px', paddingLeft: '40px', fontSize: '13px', background: 'rgba(0,0,0,0.2)' }}>
                                    <option value="All" style={{ background: '#0f172a' }}>All Events</option>
                                    {events.map(e => <option key={e._id} value={e._id} style={{ background: '#0f172a' }}>{e.name}</option>)}
                                </select>
                            </div>
                            <button onClick={() => {
                                const ev = events.find(e => e._id === (eventFilter !== 'All' ? eventFilter : events[0]?._id));
                                if(ev) {
                                    setIsEditingEvent(true);
                                    setSelectedId(ev._id);
                                    setEventFormData({ name: ev.name, client: ev.client, date: typeof ev.date === 'string' ? ev.date.split('T')[0] : getToday(), location: ev.location || '', description: ev.description || '' });
                                    setShowEventModal(true);
                                } else {
                                    alert("Please select or create an event first");
                                }
                            }} style={{ height: '52px', padding: '0 16px', borderRadius: '14px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Edit size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sub Row: Date Navigator & Global Actions */}
                <div className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'center', gap: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {/* Date Navigation System */}
                    <div className="flex-resp" style={{ alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => shiftDays(-1)} style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => shiftDays(1)} style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Smart Date Range */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.4)', padding: '4px 12px 4px 6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', flex: 1 }}>
                            <div 
                                onClick={(e) => { const i=e.currentTarget.querySelector('input'); if(i.showPicker)i.showPicker(); else i.click(); }} 
                                style={{ 
                                    position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', 
                                    padding: '8px 16px', background: isRange ? 'rgba(56,189,248,0.1)' : 'rgba(251,191,36,0.1)', 
                                    borderRadius: '10px', cursor: 'pointer', transition: '0.3s', flex: 1
                                }}
                            >
                                <Calendar size={14} color={isRange ? '#38bdf8' : '#fbbf24'} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '7px', fontWeight: '900', color: isRange ? '#38bdf8' : '#fbbf24', textTransform: 'uppercase' }}>{isRange ? 'RANGE' : 'DATE'}</span>
                                    <span style={{ color: 'white', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                                        {isRange ? `${formatDateIST(fromDate)} - ${formatDateIST(toDate)}` : formatDateIST(toDate)}
                                    </span>
                                </div>
                                <input type="date" value={toDate} onChange={(e) => { const d=e.target.value; setToDate(d); if(!isRange) setFromDate(d); }} onClick={e=>e.stopPropagation()} style={{ position:'absolute',opacity:0,inset:0,cursor:'pointer',zIndex:-1 }} />
                            </div>
                            <button 
                                onClick={() => setIsRange(!isRange)} 
                                style={{ 
                                    padding: '8px 12px', borderRadius: '8px', 
                                    background: isRange ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.05)', 
                                    color: isRange ? '#f87171' : 'rgba(255,255,255,0.6)', 
                                    fontSize: '10px', fontWeight: '800', cursor: 'pointer', border: 'none'
                                }}
                            >
                                {isRange ? <X size={12} /> : <Plus size={12} />}
                            </button>
                        </div>
                    </div>

                    {/* Global Actions */}
                    <div className="flex-resp" style={{ gap: '10px', alignItems: 'center' }}>
                        <button onClick={exportExcel} style={{ display:'flex',alignItems:'center',gap:'8px',height:'48px',padding:'0 15px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',color:'rgba(255,255,255,0.8)',fontSize:'12px',fontWeight:'700',cursor:'pointer' }}>
                            <FileSpreadsheet size={16} /> <span className="hide-mobile">EXCEL</span>
                        </button>
                        <button onClick={() => { setIsEditingEvent(false); setEventFormData({ name:'',client:'',date:getToday(),location:'',description:'' }); setShowEventModal(true); }} style={{ display:'flex',alignItems:'center',gap:'8px',height:'48px',padding:'0 15px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'14px',color:'rgba(255,255,255,0.8)',fontSize:'12px',fontWeight:'700',cursor:'pointer' }}>
                            <Plus size={16} /> <span className="hide-mobile">EVENT</span>
                        </button>
                        <button onClick={() => {
                            setIsEditingDuty(false);
                            setDutyFormData({ carNumber:'',model:'',dropLocation:'',date:getToday(),eventId:'',dutyAmount:'',driverName:'',vehicleSource:'Fleet',dutyType:'',dutyTime:currentTimeIST() });
                            setShowDutyModal(true);
                        }} className="btn-primary" style={{ display:'flex',alignItems:'center',gap:'8px',height:'48px',padding:'0 20px',borderRadius:'14px',fontSize:'13px', fontWeight: '900' }}>
                            <Plus size={18} strokeWidth={3} /> <span className="show-mobile">ADD</span><span className="hide-mobile">ADD DUTY</span>
                        </button>
                    </div>
                </div>
            </div>


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
                <div className="scroll-x">
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                {[
                                    { label: 'Timeline', width: '120px' },
                                    { label: 'Vehicle / Resource', width: 'auto' },
                                    { label: 'Assignment', width: 'auto' },
                                    { label: 'Operational Logistics', width: 'auto' },
                                    { label: 'Settlement', width: '140px', align: 'right' },
                                    { label: '', width: '100px', align: 'right' }
                                ].map((h, i) => (
                                    <th key={i} style={{ 
                                        padding: '18px 24px', 
                                        textAlign: h.align || 'left', 
                                        fontSize: '10px', 
                                        fontWeight: '900', 
                                        color: 'rgba(255,255,255,0.3)', 
                                        textTransform: 'uppercase', 
                                        letterSpacing: '1.5px',
                                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                                        borderRight: i < 5 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                        width: h.width
                                    }}>
                                        {h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '120px 0' }}>
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                        <Briefcase size={80} style={{ opacity: 0.05, color: 'white', marginBottom: '24px' }} />
                                        <h3 style={{ color: 'white', fontWeight: '900', fontSize: '24px', marginBottom: '8px' }}>No Assignments</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Refine your filters.</p>
                                    </motion.div>
                                </td></tr>
                            ) : filtered.map((v, idx) => {
                                const event = events.find(e => e._id === v.eventId);
                                const dutyDate = v.carNumber?.split('#')[1];
                                const src = v.vehicleSource || 'External';
                                const isFleet = src === 'Fleet';
                                
                                return (
                                    <motion.tr 
                                        key={v._id} 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        transition={{ delay: idx * 0.03 }}
                                        style={{ 
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        className="table-row-hover"
                                    >
                                        {/* Timeline Cell */}
                                        <td style={{ padding: '20px 24px', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '15px', fontWeight: '900', color: 'white', letterSpacing: '-0.3px' }}>
                                                    {dutyDate ? new Date(dutyDate + 'T12:00:00Z').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                                                </span>
                                                <span style={{ fontSize: '9px', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '2px', opacity: 0.8 }}>
                                                    {dutyDate ? new Date(dutyDate + 'T12:00:00Z').toLocaleDateString('en-IN', { weekday: 'short' }) : '—'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Vehicle Cell */}
                                        <td style={{ padding: '20px 24px', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ 
                                                    width: '38px', height: '38px', borderRadius: '12px', 
                                                    background: isFleet ? 'rgba(16,185,129,0.08)' : 'rgba(168,85,247,0.08)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: `1px solid ${isFleet ? 'rgba(16,185,129,0.15)' : 'rgba(168,85,247,0.15)'}`
                                                }}>
                                                    <Car size={18} color={isFleet ? '#10b981' : '#a855f7'} />
                                                </div>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>{v.carNumber?.split('#')[0]}</span>
                                                        <span style={{ fontSize: '7px', fontWeight: '950', padding: '1px 6px', borderRadius: '4px', background: isFleet ? '#10b98115' : '#a855f715', color: isFleet ? '#10b981' : '#a855f7', border: `1px solid ${isFleet ? '#10b98125' : '#a855f725'}`, letterSpacing: '0.5px' }}>{src.toUpperCase()}</span>
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', fontWeight: '600' }}>
                                                        {v.model} {v.driverName && <span style={{ opacity: 0.4 }}> • {v.driverName}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Assignment Cell */}
                                        <td style={{ padding: '20px 24px', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ maxWidth: '200px' }}>
                                                <div style={{ color: 'white', fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event?.name || 'Unassigned Event'}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                    <Building2 size={10} color="rgba(255,255,255,0.2)" />
                                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event?.client || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Logistics Cell */}
                                        <td style={{ padding: '20px 24px', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {v.dutyType && <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(251,191,36,0.05)', color: '#fbbf24', fontSize: '9px', fontWeight: '800', border: '1px solid rgba(251,191,36,0.1)' }}>{v.dutyType}</span>}
                                                {v.dutyTime && (
                                                    <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(56,189,248,0.05)', color: '#38bdf8', fontSize: '9px', fontWeight: '800', border: '1px solid rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                        {(() => {
                                                            const [h, m] = v.dutyTime.split(':').map(Number);
                                                            if (isNaN(h) || isNaN(m)) return v.dutyTime;
                                                            const ampm = h >= 12 ? 'PM' : 'AM';
                                                            const hour12 = h % 12 || 12;
                                                            return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
                                                        })()}
                                                    </span>
                                                )}
                                                {v.dropLocation && <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={9} /> {v.dropLocation}</span>}
                                            </div>
                                        </td>

                                        {/* Settlement Cell */}
                                        <td style={{ padding: '20px 24px', textAlign: 'right', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ fontSize: '16px', fontWeight: '950', color: '#10b981' }}>₹{Number(v.dutyAmount || 0).toLocaleString()}</div>
                                            <div style={{ fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Duty Value</div>
                                        </td>

                                        {/* Actions Cell */}
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => handleEditDuty(v)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} className="action-btn-hover">
                                                    <Edit size={14} />
                                                </button>
                                                <button onClick={() => handleDeleteDuty(v._id)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }} className="action-btn-hover-del">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div >

            {/* ═══ PREMIUM MOBILE CARDS ═══ */}
            <div className="show-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <div style={{ padding: '60px 0', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', margin: 0 }}>No duties recorded for this period.</p>
                    </div>
                ) : filtered.map((v, idx) => {
                    const event = events.find(e => e._id === v.eventId);
                    const dutyDate = v.carNumber?.split('#')[1];
                    const src = v.vehicleSource || 'External';
                    const isFleet = src === 'Fleet';
                    
                    return (
                        <motion.div 
                            key={v._id} 
                            initial={{ opacity: 0, y: 15 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: idx * 0.03 }}
                            style={{
                                background: 'rgba(15, 23, 42, 0.4)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                            }}
                        >
                            {/* Card Header */}
                            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: isFleet ? 'rgba(16,185,129,0.1)' : 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Car size={18} color={isFleet ? '#10b981' : '#a855f7'} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '900', color: 'white' }}>{v.carNumber?.split('#')[0]}</div>
                                        <div style={{ fontSize: '9px', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase' }}>{formatDateDisplay(dutyDate)}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '16px', fontWeight: '950', color: '#10b981' }}>₹{Number(v.dutyAmount || 0).toLocaleString()}</div>
                                    <span style={{ fontSize: '7px', fontWeight: '950', padding: '2px 8px', borderRadius: '20px', background: isFleet ? '#10b98120' : '#a855f720', color: isFleet ? '#10b981' : '#a855f7', border: `1px solid ${isFleet ? '#10b98130' : '#a855f730'}`, letterSpacing: '1px' }}>{src.toUpperCase()}</span>
                                </div>
                            </div>
                            
                            {/* Card Body */}
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ flex: 1.2 }}>
                                        <label style={{ fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Event & Client</label>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>{event?.name || 'N/A'}</div>
                                        <div style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)' }}>{event?.client || 'N/A'}</div>
                                    </div>
                                    {v.driverName && (
                                        <div style={{ flex: 0.8 }}>
                                            <label style={{ fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Driver</label>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>{v.driverName}</div>
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {v.dutyType && <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(251,191,36,0.06)', color: '#fbbf24', fontSize: '10px', fontWeight: '800' }}>{v.dutyType}</span>}
                                    {v.dutyTime && <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(56,189,248,0.06)', color: '#38bdf8', fontSize: '10px', fontWeight: '800' }}>{v.dutyTime}</span>}
                                    {v.dropLocation && <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', fontSize: '10px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} /> {v.dropLocation}</span>}
                                </div>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px', display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleEditDuty(v)} style={{ flex: 1, height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                                        <Edit size={14} /> EDIT
                                    </button>
                                    <button onClick={() => handleDeleteDuty(v._id)} style={{ width: '40px', height: '36px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div >

            {/* ═══ DUTY LOG MODAL ═══ */}
            <AnimatePresence>
                {showDutyModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.98 }}
                            className="modal-container"
                            style={{
                                width: 'min(95%, 650px)',
                                borderRadius: '32px',
                                background: '#0a0f1d',
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: '95vh',
                                boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Dynamic Header */}
                            <div style={{
                                background: 'linear-gradient(to right, rgba(251, 191, 36, 0.05), rgba(14, 165, 233, 0.03))',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                padding: 'clamp(20px, 4vw, 28px) clamp(20px, 5vw, 32px)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backdropFilter: 'blur(20px)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: 'clamp(32px, 8vw, 40px)', height: 'clamp(32px, 8vw, 40px)', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Briefcase size={20} color="#fbbf24" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '950', color: 'white', letterSpacing: '-0.8px', lineHeight: 1.1 }}>
                                            {isEditingDuty ? 'Update Duty' : 'Log Assignment'}
                                        </h3>
                                        <p className="hide-mobile" style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', letterSpacing: '0.2px', marginTop: '4px' }}>Operational Command Center Entry Flow</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowDutyModal(false)} className="close-btn" style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    padding: '8px',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}><X size={20} /></button>
                            </div>

                            {/* Scrollable Body */}
                            <form onSubmit={handleSubmitDuty} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
                                <div style={{ padding: 'clamp(20px, 5vw, 32px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }} className="premium-scroll">
                                    
                                    {/* Section 1: Logistics Context */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {['Fleet', 'External'].map(src => (
                                                <button key={src} type="button" onClick={() => setDutyFormData(prev => ({ ...prev, vehicleSource: src }))}
                                                    style={{
                                                        flex: 1, height: '48px', borderRadius: '14px', border: `1px solid ${dutyFormData.vehicleSource === src ? (src === 'Fleet' ? '#10b98150' : '#f59e0b50') : 'rgba(255,255,255,0.06)'}`,
                                                        background: dutyFormData.vehicleSource === src ? (src === 'Fleet' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)') : 'rgba(255,255,255,0.02)',
                                                        color: dutyFormData.vehicleSource === src ? (src === 'Fleet' ? '#10b981' : '#f59e0b') : 'rgba(255,255,255,0.3)',
                                                        fontWeight: '900', fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                                    }}>
                                                    {src === 'Fleet' ? <Building2 size={16} /> : <TruckIcon size={16} />}
                                                    {src.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="form-grid-2">
                                            <div className="premium-input-group">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Target size={12} color="#fbbf24" style={{ opacity: 0.7 }} />
                                                    <label className="premium-label">Operational Event</label>
                                                </div>
                                                <select required value={dutyFormData.eventId} onChange={e => setDutyFormData({ ...dutyFormData, eventId: e.target.value })} className="premium-compact-input" style={{ appearance: 'none', height: '50px' }}>
                                                    <option value="" disabled>Select Master Event</option>
                                                    {events.map(e => <option key={e._id} value={e._id}>{e.name} • {e.client}</option>)}
                                                </select>
                                            </div>
                                            <div className="premium-input-group">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={12} color="#fbbf24" style={{ opacity: 0.7 }} />
                                                    <label className="premium-label">Log Date</label>
                                                </div>
                                                <input type="date" required value={dutyFormData.date} onChange={e => setDutyFormData({ ...dutyFormData, date: e.target.value })} className="premium-compact-input" style={{ colorScheme: 'dark', height: '50px' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Resource Allocation */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: 'clamp(15px, 4vw, 24px)', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div className="form-grid-2">
                                            <div className="premium-input-group">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Car size={12} color="#10b981" />
                                                    <label className="premium-label">Plate Identification</label>
                                                </div>
                                                <input type="text" list={dutyFormData.vehicleSource === 'Fleet' ? "masterCars" : undefined} required value={dutyFormData.carNumber} onChange={e => handleCarNumberChange(e.target.value)} className="premium-compact-input" placeholder="Search Vehicle..." style={{ textTransform: 'uppercase', height: '50px' }} />
                                                {dutyFormData.vehicleSource === 'Fleet' && (
                                                    <datalist id="masterCars">
                                                        {allVehiclesMaster.map(v => <option key={v._id} value={v.carNumber} />)}
                                                    </datalist>
                                                )}
                                            </div>
                                            <div className="premium-input-group">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <TruckIcon size={12} color="#10b981" />
                                                    <label className="premium-label">Vehicle Specification</label>
                                                </div>
                                                <input type="text" value={dutyFormData.model} onChange={e => setDutyFormData({ ...dutyFormData, model: e.target.value })} className="premium-compact-input" placeholder="e.g. Innova Crysta" style={{ height: '50px' }} />
                                            </div>
                                        </div>

                                        <div className="form-grid-2">
                                            <div className="premium-input-group">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <User size={12} color="#10b981" />
                                                    <label className="premium-label">Operator / Driver</label>
                                                </div>
                                                <input type="text" value={dutyFormData.driverName} onChange={e => setDutyFormData({ ...dutyFormData, driverName: e.target.value })} className="premium-compact-input" placeholder="Enter full name" style={{ height: '50px' }} />
                                            </div>
                                            <div className="premium-input-group">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Wallet size={12} color="#10b981" />
                                                    <label className="premium-label">Payout Amount</label>
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', fontWeight: '900', color: '#10b981' }}>₹</span>
                                                    <input type="number" required value={dutyFormData.dutyAmount} onChange={e => setDutyFormData({ ...dutyFormData, dutyAmount: e.target.value })} className="premium-compact-input" placeholder="0" style={{ paddingLeft: '35px', color: '#10b981', fontWeight: '800', height: '50px' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Logistic Details */}
                                    <div className="form-grid-2">
                                        <div className="premium-input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Briefcase size={12} color="#0ea5e9" />
                                                <label className="premium-label">Service Category</label>
                                            </div>
                                            <input type="text" list="dutyTypes" value={dutyFormData.dutyType} onChange={e => setDutyFormData({ ...dutyFormData, dutyType: e.target.value })} className="premium-compact-input" placeholder="e.g. Airport Transfer" style={{ height: '50px' }} />
                                            <datalist id="dutyTypes">
                                                {['Airport Pickup', 'Airport Drop', 'Full Day Local', 'Outstation', 'Dinner Drop'].map(t => <option key={t} value={t} />)}
                                            </datalist>
                                        </div>
                                        <div className="premium-input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Calendar size={12} color="#0ea5e9" />
                                                    <label className="premium-label">Operation Time</label>
                                                </div>
                                                <button type="button" onClick={() => setDutyFormData(prev => ({ ...prev, dutyTime: currentTimeIST() }))} style={{ fontSize: '9px', fontWeight: '900', color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(14, 165, 233, 0.2)', cursor: 'pointer' }}>SET NOW</button>
                                            </div>
                                            <input type="time" value={dutyFormData.dutyTime} onChange={e => setDutyFormData({ ...dutyFormData, dutyTime: e.target.value })} className="premium-compact-input" style={{ colorScheme: 'dark', height: '50px' }} />
                                        </div>
                                    </div>

                                    <div className="premium-input-group" style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Navigation size={12} color="#0ea5e9" />
                                            <label className="premium-label">Operational Destination</label>
                                        </div>
                                        <input type="text" value={dutyFormData.dropLocation} onChange={e => setDutyFormData({ ...dutyFormData, dropLocation: e.target.value })} className="premium-compact-input" placeholder="Specific drop point or venue..." style={{ height: '50px' }} />
                                    </div>
                                </div>

                                {/* Fixed Footer */}
                                <div style={{
                                    padding: 'clamp(20px, 4vw, 24px) clamp(20px, 5vw, 32px)',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    display: 'flex',
                                    gap: '12px'
                                }}>
                                    <button type="button" onClick={() => setShowDutyModal(false)} style={{
                                        flex: 1, height: '50px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.5)', fontWeight: '800', fontSize: '13px'
                                    }}>Cancel</button>
                                    <button type="submit" style={{
                                        flex: 2, height: '50px', borderRadius: '14px', background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                                        color: 'black', fontWeight: '900', fontSize: '13px', border: 'none'
                                    }}>
                                        {isEditingDuty ? 'SAVE CHANGES' : 'GENERATE LOG'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* ═══ CONFIGURE EVENT MODAL ═══ */}
            <AnimatePresence>
                {showEventModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.98 }}
                            className="modal-container small"
                            style={{
                                width: 'min(95%, 480px)',
                                borderRadius: '32px',
                                background: '#0a101f',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 40px 100px rgba(0,0,0,0.6)'
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                background: 'linear-gradient(to bottom right, rgba(251, 191, 36, 0.08), rgba(0,0,0,0))',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                padding: 'clamp(20px, 4vw, 28px) clamp(20px, 5vw, 32px)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: 'clamp(32px, 8vw, 40px)', height: 'clamp(32px, 8vw, 40px)', borderRadius: '10px', background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Target size={18} color="#fbbf24" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>{isEditingEvent ? 'Update Event' : 'New Event'}</h3>
                                        <p className="hide-mobile" style={{ margin: 4, fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>Create a high-level operational master</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowEventModal(false)} className="close-btn" style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'white',
                                    padding: '8px'
                                }}><X size={18} /></button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleCreateEvent} style={{ padding: 'clamp(20px, 5vw, 32px)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="premium-input-group">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Target size={12} color="#fbbf24" />
                                        <label className="premium-label">Operational Name *</label>
                                    </div>
                                    <input type="text" required value={eventFormData.name} onChange={e => setEventFormData({ ...eventFormData, name: e.target.value })} className="premium-compact-input" placeholder="e.g. Global Tech Summit 2024" style={{ height: '52px' }} />
                                </div>

                                <div className="premium-input-group">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Building2 size={12} color="#fbbf24" />
                                        <label className="premium-label">Direct Client *</label>
                                    </div>
                                    <input type="text" required value={eventFormData.client} onChange={e => setEventFormData({ ...eventFormData, client: e.target.value })} className="premium-compact-input" placeholder="Client or Organization Name" style={{ height: '52px' }} />
                                </div>

                                <div className="premium-input-group">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={12} color="#fbbf24" />
                                        <label className="premium-label">Operational Focus Date</label>
                                    </div>
                                    <input type="date" value={eventFormData.date} onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })} className="premium-compact-input" style={{ colorScheme: 'dark', height: '52px' }} />
                                </div>

                                <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
                                    <button type="button" onClick={() => setShowEventModal(false)} className="hide-mobile" style={{
                                        flex: 1, height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.5)', fontWeight: '800', fontSize: '14px'
                                    }}>Cancel</button>
                                    <button type="submit" style={{
                                        flex: 2, height: '56px', borderRadius: '16px', background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                                        color: 'black', fontWeight: '900', fontSize: '15px', letterSpacing: '1px', border: 'none'
                                    }}>{isEditingEvent ? 'UPDATE' : 'PROVISION'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                .table-row-hover:hover { background: rgba(255,255,255,0.03) !important; }
                .table-row-hover td { padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
                .table-row-hover:last-child td { border-bottom: none; }
                
                .action-btn-hover:hover { background: rgba(56,189,248,0.15) !important; color: #38bdf8 !important; border-color: rgba(56,189,248,0.3) !important; transform: scale(1.05); }
                .action-btn-hover-del:hover { background: rgba(244,63,94,0.15) !important; color: #f43f5e !important; border-color: rgba(244,63,94,0.3) !important; transform: scale(1.05); }

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
                
                /* ===== MODAL BASE (GLOBAL OVERLAYS) ===== */
                .modal-overlay { 
                    position: fixed; inset: 0; 
                    background: rgba(0,0,0,0.85); 
                    backdrop-filter: blur(14px); 
                    z-index: 2000; 
                    display: flex; justify-content: center; align-items: center; 
                    padding: clamp(10px, 3vw, 20px); 
                }

                /* ===== MOBILE CARD LEGACY (if needed for list view) ===== */
                .mobile-duty-card { background: linear-gradient(140deg, rgba(20,30,50,0.8), rgba(10,15,30,0.95)); padding: 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.07); margin-bottom: 14px; }

                @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                @media (max-width: 768px) { .header-left { flex-direction: row; align-items: baseline; gap: 10px; } }
            `}</style>
        </div >
    );
};

export default EventManagement;
