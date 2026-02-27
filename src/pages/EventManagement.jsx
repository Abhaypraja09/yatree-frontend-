import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    Calendar, Plus, Search, Trash2, Edit, ChevronRight, Car,
    FileSpreadsheet, User, MapPin, IndianRupee, Clock, CheckCircle2,
    Briefcase, ArrowRight, X, Save, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';
import * as XLSX from 'xlsx-js-style';

const EventManagement = () => {
    const { selectedCompany } = useCompany();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('All');

    // Filters - Same as Outside Cars design
    const getToday = () => new Date().toISOString().split('T')[0];
    const getThirtyDaysAgo = () => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    };

    const [fromDate, setFromDate] = useState(getThirtyDaysAgo());
    const [toDate, setToDate] = useState(getToday());

    const [showEventModal, setShowEventModal] = useState(false);
    const [showRecordModal, setShowRecordModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventDetails, setEventDetails] = useState(null);
    const [recordsLoading, setRecordsLoading] = useState(false);

    // Form States
    const [eventFormData, setEventFormData] = useState({
        name: '',
        client: '',
        date: getToday(),
        location: '',
        description: ''
    });

    const [recordFormData, setRecordFormData] = useState({
        carNumber: '',
        model: '',
        ownerName: '',
        dutyType: '',
        dutyAmount: '',
        dropLocation: '',
        date: getToday()
    });

    const [isEditingEvent, setIsEditingEvent] = useState(false);
    const [allVehicles, setAllVehicles] = useState([]);

    useEffect(() => {
        if (selectedCompany) {
            fetchEvents();
            fetchAllVehicles();
        }
    }, [selectedCompany, fromDate, toDate]);

    const fetchAllVehicles = async () => {
        if (!selectedCompany?._id) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setAllVehicles(data.vehicles || []);
        } catch (err) { console.error(err); }
    };

    const fetchEvents = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/events/${selectedCompany._id}?from=${fromDate}&to=${toDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setEvents(data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchEventDetails = async (eventId) => {
        setRecordsLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/events/details/${eventId}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setEventDetails(data);
        } catch (err) { console.error(err); }
        finally { setRecordsLoading(false); }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (isEditingEvent) {
                await axios.put(`/api/admin/events/${selectedEvent._id}`, eventFormData, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            } else {
                await axios.post('/api/admin/events', { ...eventFormData, companyId: selectedCompany._id }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            }
            setShowEventModal(false);
            fetchEvents();
            if (selectedEvent) fetchEventDetails(selectedEvent._id);
        } catch (err) { alert('Error saving event'); }
    };

    const handleAddRecord = async (e) => {
        e.preventDefault();
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));

            // Following OutsideCars.jsx logic for carNumber uniqueness
            const internalCarNumber = `${recordFormData.carNumber}#${recordFormData.date}#${Math.random().toString(36).substring(2, 7)}`;

            const payload = {
                carNumber: internalCarNumber,
                model: recordFormData.model,
                ownerName: recordFormData.ownerName,
                dutyType: recordFormData.dutyType,
                dutyAmount: Number(recordFormData.dutyAmount),
                dropLocation: recordFormData.dropLocation,
                companyId: selectedCompany._id,
                isOutsideCar: true,
                eventId: selectedEvent._id,
                createdAt: recordFormData.date
            };

            const data = new FormData();
            Object.keys(payload).forEach(key => data.append(key, payload[key]));
            data.append('permitType', 'Contract');
            data.append('carType', 'Other');

            await axios.post('/api/admin/vehicles', data, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });

            setShowRecordModal(false);
            setRecordFormData({ carNumber: '', model: '', ownerName: '', dutyType: '', dutyAmount: '', dropLocation: '', date: getToday() });
            fetchEventDetails(selectedEvent._id);
            fetchEvents(); // Refresh event list for total amount
        } catch (err) { alert('Error adding car record'); }
    };

    const handleCarNumberChange = (val) => {
        val = val.toUpperCase();
        const existing = allVehicles.find(v => v.carNumber?.toUpperCase() === val || v.carNumber?.split('#')[0].toUpperCase() === val);
        if (existing) {
            setRecordFormData({
                ...recordFormData,
                carNumber: val,
                model: existing.model || recordFormData.model,
                ownerName: existing.ownerName || recordFormData.ownerName
            });
        } else {
            setRecordFormData({ ...recordFormData, carNumber: val });
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Delete this event and all associated car records?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/events/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setEventDetails(null);
            setSelectedEvent(null);
            fetchEvents();
        } catch (err) { alert('Error deleting event'); }
    };

    const handleDeleteRecord = async (id) => {
        if (!window.confirm('Remove this car record?')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(`/api/admin/vehicles/${id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            fetchEventDetails(selectedEvent._id);
            fetchEvents(); // Refresh list for totals
        } catch (err) { alert('Error deleting record'); }
    };

    const totalMonthlyAmount = events.reduce((sum, e) => {
        // Simple logic for "Monthly" amount: events in current month
        const eventDate = new Date(e.date);
        const now = new Date();
        if (eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()) {
            return sum + (e.totalAmount || 0); // Note: totalAmount in model is updated by controller details call usually
        }
        return sum;
    }, 0);

    const uniqueClients = [...new Set(events.map(e => e.client).filter(Boolean))].sort();

    const filteredEvents = events.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.client?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClient = clientFilter === 'All' || e.client === clientFilter;
        return matchesSearch && matchesClient;
    });

    const totalFilteredPayout = filteredEvents.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

    const formatDateDisplay = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const exportEventsExcel = () => {
        const data = filteredEvents.map(e => ({
            'Event Name': e.name,
            'Client': e.client || 'N/A',
            'Date': new Date(e.date).toLocaleDateString('en-IN'),
            'Venue': e.location || 'N/A',
            'Total Amount': e.totalAmount || 0,
            'Status': e.status,
            'Records': e.recordCount || 0
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);

        // Styling (similar to other pages)
        const headerStyle = {
            fill: { fgColor: { rgb: "4F46E5" } },
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center" }
        };

        // Apply styles to headers
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!ws[address]) continue;
            ws[address].s = headerStyle;
        }

        XLSX.utils.book_append_sheet(wb, ws, "Events Report");
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

        const s2ab = (s) => {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        };

        const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Events_Report_${fromDate}_to_${toDate}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container-fluid" style={{ paddingBottom: '60px' }}>
            <SEO title="Event Management" description="Track cars and expenses for special events and bookings." />

            <header style={{ padding: '40px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{
                            width: '50px', height: '50px',
                            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                            borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                            boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
                        }}>
                            <Briefcase size={28} color="white" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }}></div>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Operations</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>
                                Event <span className="text-gradient-indigo">Management</span>
                            </h1>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div className="glass-card" style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', minWidth: '150px', borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.05)' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#34d399', textTransform: 'uppercase' }}>Total Payable (Filtered)</span>
                            <span style={{ color: 'white', fontSize: '20px', fontWeight: '900' }}>₹{totalFilteredPayout.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={exportEventsExcel}
                            style={{
                                height: '52px', padding: '0 20px',
                                background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                                color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', cursor: 'pointer'
                            }}
                        >
                            <Save size={18} /> Excel
                        </button>
                        <button
                            onClick={() => { setIsEditingEvent(false); setEventFormData({ name: '', client: '', date: getToday(), location: '', description: '' }); setShowEventModal(true); }}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '52px', padding: '0 25px', borderRadius: '14px', background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: 'black', fontWeight: '800', border: 'none' }}
                        >
                            <Plus size={20} /> Create Event
                        </button>
                    </div>
                </div>

                {/* Filters Bar - Identical to Outside Cars */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '30px', background: 'rgba(15, 23, 42, 0.3)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ flex: '1 1 250px', position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                        <input
                            type="text"
                            placeholder="Search event or client..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', height: '50px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', paddingLeft: '45px', color: 'white' }}
                        />
                    </div>
                    <select
                        value={clientFilter}
                        onChange={e => setClientFilter(e.target.value)}
                        style={{ flex: '1 1 180px', height: '50px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 15px' }}
                    >
                        <option value="All" style={{ background: '#1e293b' }}>All Clients</option>
                        {uniqueClients.map(c => <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '8px', flex: '0 0 auto' }}>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            style={{ width: '135px', height: '50px', fontSize: '13px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 12px' }}
                        />
                        <input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            style={{ width: '135px', height: '50px', fontSize: '13px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', color: 'white', padding: '0 12px' }}
                        />
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: selectedEvent ? '1fr 1.5fr' : '1fr', gap: '30px', transition: 'all 0.4s ease' }}>
                {/* Events List */}
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Available Events ({filteredEvents.length})</span>
                    </div>

                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }} className="custom-scrollbar">
                        {loading ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
                        ) : filteredEvents.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                <p>No events found</p>
                            </div>
                        ) : filteredEvents.map((event) => (
                            <div
                                key={event._id}
                                onClick={() => { setSelectedEvent(event); fetchEventDetails(event._id); }}
                                style={{
                                    padding: '20px',
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    cursor: 'pointer',
                                    background: selectedEvent?._id === event._id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}
                                className="event-item-hover"
                            >
                                {selectedEvent?._id === event._id && <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', background: '#6366f1', borderRadius: '0 4px 4px 0' }}></div>}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '800' }}>{event.name}</h3>
                                            {new Date(event.date).toDateString() === new Date().toDateString() && (
                                                <span className="badge-today" style={{ fontSize: '9px', background: '#f43f5e', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: '900', letterSpacing: '0.5px' }}>TODAY</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></span>
                                            <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: '800' }}>{event.client || 'General Client'}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>₹{event.totalAmount?.toLocaleString() || 0}</div>
                                        <span style={{ fontSize: '10px', color: event.status === 'Active' ? '#34d399' : 'rgba(255,255,255,0.3)', fontWeight: '900', textTransform: 'uppercase' }}>{event.status} ({event.recordCount || 0} CARS)</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Event Details View */}
                <AnimatePresence mode="wait">
                    {selectedEvent ? (
                        <motion.div
                            key={selectedEvent._id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="glass-card"
                            style={{ padding: '30px', background: 'rgba(15, 23, 42, 0.6)' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <span style={{ background: '#6366f1', color: 'white', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>Event Details</span>
                                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>ID: {selectedEvent._id.slice(-6).toUpperCase()}</span>
                                    </div>
                                    <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>{selectedEvent.name}</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px', fontSize: '14px' }}>{selectedEvent.description || 'No description provided for this event.'}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => { setEventFormData({ ...selectedEvent, date: new Date(selectedEvent.date).toISOString().split('T')[0] }); setIsEditingEvent(true); setShowEventModal(true); }}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEvent(selectedEvent._id)}
                                        style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <button onClick={() => setSelectedEvent(null)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}>
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                                <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '5px' }}>
                                        <User size={12} /> Client name
                                    </div>
                                    <div style={{ color: 'white', fontWeight: '800', fontSize: '15px' }}>{selectedEvent.client || 'N/A'}</div>
                                </div>
                                <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '5px' }}>
                                        <MapPin size={12} /> Venue
                                    </div>
                                    <div style={{ color: 'white', fontWeight: '800', fontSize: '15px' }}>{selectedEvent.location || 'N/A'}</div>
                                </div>
                                <div className="glass-card" style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '5px' }}>
                                        <IndianRupee size={12} /> Total Budget
                                    </div>
                                    <div style={{ color: 'white', fontWeight: '900', fontSize: '18px' }}>₹{eventDetails?.event?.totalAmount?.toLocaleString() || 0}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Car size={20} color="#6366f1" /> Assigned Cars & Duties
                                </h3>
                                <button
                                    onClick={() => { setRecordFormData({ ...recordFormData, date: new Date(selectedEvent.date).toISOString().split('T')[0] }); setShowRecordModal(true); }}
                                    style={{ background: '#6366f1', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Plus size={16} /> Add Car Record
                                </button>
                            </div>

                            <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <tr>
                                            <th style={{ padding: '12px 15px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px' }}>Vehicle</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px' }}>Vendor / Owner</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px' }}>Duty Detail</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px' }}>Amount</th>
                                            <th style={{ padding: '12px 15px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recordsLoading ? (
                                            <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></td></tr>
                                        ) : eventDetails?.records?.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}>
                                                    <div style={{ padding: '20px', color: 'rgba(255,255,255,0.2)' }}>No car records assigned yet.</div>
                                                </td>
                                            </tr>
                                        ) : eventDetails?.records?.map((record, rIdx) => (
                                            <motion.tr
                                                key={record._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: rIdx * 0.03 }}
                                                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                                className="record-row-hover"
                                            >
                                                <td style={{ padding: '12px 15px' }}>
                                                    <div style={{ fontWeight: '800', color: 'white' }}>{record.carNumber?.split('#')[0]}</div>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{record.model}</div>
                                                </td>
                                                <td style={{ padding: '12px 15px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                                                    {record.ownerName}
                                                </td>
                                                <td style={{ padding: '12px 15px' }}>
                                                    <div style={{ color: 'white' }}>{record.dutyType}</div>
                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{record.dropLocation}</div>
                                                </td>
                                                <td style={{ padding: '12px 15px', textAlign: 'right', color: '#34d399', fontWeight: '900', fontSize: '15px' }}>
                                                    ₹{record.dutyAmount?.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleDeleteRecord(record._id)}
                                                        style={{ background: 'transparent', color: 'rgba(244, 63, 94, 0.4)', border: 'none', cursor: 'pointer', padding: '5px' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '100px', textAlign: 'center', color: 'rgba(255,255,255,0.1)' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px dashed rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '30px' }}>
                                <ArrowRight size={48} />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Select an Event</h2>
                            <p style={{ maxWidth: '300px', marginTop: '10px' }}>Select an event from the list to view detailed logs and car records.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Event Form Modal */}
            <AnimatePresence>
                {showEventModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '30px', background: '#0f172a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: 0 }}>{isEditingEvent ? 'Edit Event' : 'New Event'}</h2>
                                <button onClick={() => setShowEventModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Event Name *</label>
                                    <input type="text" required className="input-field" value={eventFormData.name} onChange={e => setEventFormData({ ...eventFormData, name: e.target.value })} placeholder="e.g. Reliance Annual Meet" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Client</label>
                                        <input type="text" className="input-field" value={eventFormData.client} onChange={e => setEventFormData({ ...eventFormData, client: e.target.value })} placeholder="Client Name" />
                                    </div>
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Event Date *</label>
                                        <input type="date" required className="input-field" value={eventFormData.date} onChange={e => setEventFormData({ ...eventFormData, date: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Venue / Location</label>
                                    <input type="text" className="input-field" value={eventFormData.location} onChange={e => setEventFormData({ ...eventFormData, location: e.target.value })} placeholder="Venue Details" />
                                </div>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Description (Optional)</label>
                                    <textarea className="input-field" style={{ minHeight: '100px', paddingTop: '12px' }} value={eventFormData.description} onChange={e => setEventFormData({ ...eventFormData, description: e.target.value })} placeholder="Additional notes about the event..." />
                                </div>
                                <button type="submit" className="btn-primary" style={{ height: '54px', fontWeight: '900', marginTop: '10px' }}>
                                    {isEditingEvent ? 'Save Changes' : 'Create Event'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Record Form Modal */}
            <AnimatePresence>
                {showRecordModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '30px', background: '#0f172a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: 0 }}>Add Car Duty</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0 }}>Linking car to: <b>{selectedEvent.name}</b></p>
                                </div>
                                <button onClick={() => setShowRecordModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleAddRecord} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Car Number *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            list="carNumbers"
                                            value={recordFormData.carNumber}
                                            onChange={e => handleCarNumberChange(e.target.value)}
                                            placeholder="DL..."
                                            autoFocus
                                        />
                                        <datalist id="carNumbers">
                                            {[...new Set(allVehicles.map(v => v.carNumber?.split('#')[0]).filter(Boolean))].map(num => (
                                                <option key={num} value={num} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Model *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            list="carModels"
                                            value={recordFormData.model}
                                            onChange={e => setRecordFormData({ ...recordFormData, model: e.target.value })}
                                            placeholder="e.g. Innova"
                                        />
                                        <datalist id="carModels">
                                            {[...new Set(allVehicles.map(v => v.model).filter(Boolean))].map(m => (
                                                <option key={m} value={m} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Owner / Vendor</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            list="carOwners"
                                            value={recordFormData.ownerName}
                                            onChange={e => setRecordFormData({ ...recordFormData, ownerName: e.target.value })}
                                            placeholder="Vendor Name"
                                        />
                                        <datalist id="carOwners">
                                            {[...new Set(allVehicles.map(v => v.ownerName).filter(Boolean))].map(o => (
                                                <option key={o} value={o} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Date *</label>
                                        <input type="date" required className="input-field" value={recordFormData.date} onChange={e => setRecordFormData({ ...recordFormData, date: e.target.value })} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Duty Type</label>
                                        <input type="text" className="input-field" value={recordFormData.dutyType} onChange={e => setRecordFormData({ ...recordFormData, dutyType: e.target.value })} placeholder="e.g. Guest Pickup" />
                                    </div>
                                    <div>
                                        <label style={{ color: '#34d399', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Amount (₹) *</label>
                                        <input type="number" required className="input-field" style={{ color: '#34d399', fontWeight: '900', fontSize: '18px' }} value={recordFormData.dutyAmount} onChange={e => setRecordFormData({ ...recordFormData, dutyAmount: e.target.value })} placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Drop / Pickup Detail</label>
                                    <input type="text" className="input-field" value={recordFormData.dropLocation} onChange={e => setRecordFormData({ ...recordFormData, dropLocation: e.target.value })} placeholder="Specific location..." />
                                </div>
                                <button type="submit" className="btn-primary" style={{ height: '54px', fontWeight: '900', marginTop: '10px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                    Confirm Car Assignment
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .text-gradient-indigo {
                    background: linear-gradient(to right, #818cf8, #6366f1);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .event-item-hover:hover {
                    background: rgba(255,255,255,0.02) !important;
                }
                .record-row-hover:hover {
                    background: rgba(255,255,255,0.02) !important;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                
                @keyframes pulse-red {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .badge-today {
                    animation: pulse-red 2s infinite;
                }
            `}</style>
        </div>
    );
};

export default EventManagement;
