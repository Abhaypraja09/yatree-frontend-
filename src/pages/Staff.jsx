import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import {
    Users,
    Plus,
    Search,
    Clock,
    MapPin,
    User,
    MoreVertical,
    IndianRupee,
    Calendar,
    Download,
    X,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Eye,
    Trash2,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle,
    Info,
    AlertCircle,
    Camera,
    Printer,
    FileText,
    Settings,
    LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import * as XLSX from 'xlsx';

const Staff = () => {
    const { user } = useAuth();
    const { selectedCompany } = useCompany();

    const [staffList, setStaffList] = useState([]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'attendance'
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStaff, setFilterStaff] = useState('all');

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        username: '',
        password: '',
        salary: 0,
        monthlyLeaveAllowance: 4,
        email: '',
        designation: '',
        shiftTiming: { start: '09:00', end: '18:00' },
        officeLocation: { latitude: '', longitude: '', address: '', radius: 200 }
    });

    const [locationLoading, setLocationLoading] = useState(false);

    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [monthlyReport, setMonthlyReport] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedStaffReport, setSelectedStaffReport] = useState(null);

    useEffect(() => {
        if (selectedCompany) {
            fetchStaff();
            fetchAttendance();
            fetchPendingLeaves();
            if (view === 'summary') {
                fetchMonthlyReport();
            }
        }
    }, [selectedCompany, filterDate, view, selectedMonth, selectedYear]);

    const fetchPendingLeaves = async () => {
        if (!selectedCompany?._id) return;
        try {
            const { data } = await axios.get(`/api/admin/leaves/pending/${selectedCompany._id}`);
            setPendingLeaves(data);
        } catch (error) {
            console.error('Error fetching pending leaves:', error);
        }
    };

    const fetchMonthlyReport = async () => {
        if (!selectedCompany?._id) return;
        try {
            const { data } = await axios.get(`/api/admin/staff-attendance/${selectedCompany._id}?month=${selectedMonth}&year=${selectedYear}`);
            setMonthlyReport(data.report || []);
        } catch (error) {
            console.error('Error fetching monthly report:', error);
        }
    };

    const handleLeaveAction = async (id, status) => {
        try {
            await axios.patch(`/api/admin/leaves/${id}`, { status });
            fetchPendingLeaves();
            fetchAttendance();
        } catch (error) {
            alert('Error updating leave status');
        }
    };

    const fetchStaff = async () => {
        if (!selectedCompany?._id) return;
        try {
            const { data } = await axios.get(`/api/admin/staff/${selectedCompany._id}`);
            setStaffList(data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchAttendance = async () => {
        if (!selectedCompany?._id) return;
        try {
            const { data } = await axios.get(`/api/admin/staff-attendance/${selectedCompany._id}`);
            setAttendanceList(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching staff attendance:', error);
        }
    };

    const exportToExcel = () => {
        const dataToExport = filteredAttendance.map(record => ({
            'Date': record.date,
            'Staff Name': record.staff?.name || 'Unknown',
            'Mobile': record.staff?.mobile || 'N/A',
            'Punch In Time': record.punchIn?.time ? new Date(record.punchIn.time).toLocaleTimeString() : '—',
            'Punch In Location': record.punchIn?.location?.address || 'N/A',
            'Punch Out Time': record.punchOut?.time ? new Date(record.punchOut.time).toLocaleTimeString() : (record.status === 'absent' ? 'Leave' : 'On Duty'),
            'Punch Out Location': record.punchOut?.location?.address || 'N/A',
            'Status': record.status || 'Present'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Staff Attendance");
        XLSX.writeFile(wb, `Staff_Attendance_${filterDate}.xlsx`);
    };

    const handleCaptureLocation = () => {
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                let address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`);
                    const data = await res.json();
                    if (data.display_name) address = data.display_name;
                } catch (e) { }

                setFormData({
                    ...formData,
                    officeLocation: { ...formData.officeLocation, latitude, longitude, address }
                });
                setLocationLoading(false);
            },
            (err) => {
                alert('Location error: ' + err.message);
                setLocationLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/staff', {
                ...formData,
                companyId: selectedCompany._id
            });
            setShowAddModal(false);
            fetchStaff();
            setFormData({
                name: '', mobile: '', username: '', password: '', salary: 0, monthlyLeaveAllowance: 4,
                email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
                officeLocation: { latitude: '', longitude: '', address: '', radius: 200 }
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding staff');
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;
        try {
            await axios.delete(`/api/admin/staff/${id}`);
            fetchStaff();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting staff');
        }
    };

    const toggleStaffStatus = async (staff) => {
        const newStatus = staff.status === 'blocked' ? 'active' : 'blocked';
        try {
            await axios.put(`/api/admin/staff/${staff._id}`, { status: newStatus });
            fetchStaff();
        } catch (error) {
            alert('Error updating status');
        }
    };

    const filteredStaff = staffList.filter(s =>
    ((s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.mobile || '').includes(searchTerm))
    );

    const filteredAttendance = attendanceList.filter(record => {
        const matchesDate = record.date === filterDate;
        const matchesStaff = filterStaff === 'all' || record.staff?._id === filterStaff;
        return matchesDate && matchesStaff;
    });

    return (
        <div style={{ minHeight: '100vh', background: '#020617', padding: '30px', color: 'white', position: 'relative' }}>
            <SEO title="Staff Ecosystem" />

            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

            <header style={{
                paddingBottom: '30px',
                marginBottom: '40px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
                zIndex: 2
            }}>
                <div className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                borderRadius: '18px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                boxShadow: '0 10px 30px rgba(14, 165, 233, 0.3)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <Users size={28} color="white" />
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(255,255,255,0.2), transparent)', pointerEvents: 'none' }}></div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#fbbf24', letterSpacing: '2px', textTransform: 'uppercase' }}>Human Resources</span>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Asset Ops</span>
                                </div>
                                <h1 style={{ color: 'white', fontSize: 'clamp(28px, 6vw, 36px)', fontWeight: '900', margin: 0, letterSpacing: '-1.5px' }}>
                                    Staff <span style={{ background: 'linear-gradient(to right, #0ea5e9, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ecosystem</span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex-resp" style={{ gap: '15px', alignItems: 'center' }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: '16px',
                            padding: '6px',
                            display: 'flex',
                            border: '1px solid rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            {['list', 'attendance', 'leaves', 'summary'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setView(t)}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: view === t ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'transparent',
                                        color: 'white',
                                        fontWeight: '800',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        textTransform: 'uppercase',
                                        boxShadow: view === t ? '0 4px 15px rgba(14, 165, 233, 0.2)' : 'none'
                                    }}
                                >
                                    {t === 'attendance' ? 'LOGS' : t}
                                    {t === 'leaves' && pendingLeaves.length > 0 &&
                                        <span style={{ background: '#f43f5e', padding: '1px 7px', borderRadius: '20px', fontSize: '9px', marginLeft: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>{pendingLeaves.length}</span>
                                    }
                                </button>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddModal(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                height: '52px',
                                padding: '0 24px',
                                fontSize: '13px',
                                fontWeight: '900',
                                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
                            }}
                        >
                            <Plus size={20} /> <span className="hide-mobile">ONBOARD STAFF</span><span className="show-mobile">ADD</span>
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="flex-resp" style={{ gap: '20px', marginBottom: '30px' }}>
                <div style={{ flex: 1, minWidth: '0', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '45px', marginBottom: 0, height: '52px', fontSize: '14px' }}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>

                {view === 'attendance' && (
                    <div className="flex-resp" style={{ gap: '10px', width: '100%', flex: 1, justifyContent: 'flex-end' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '0' }}>
                            <input
                                type="date"
                                className="input-field"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ width: '100%', marginBottom: 0, height: '52px', paddingLeft: '45px', fontSize: '14px' }}
                            />
                            <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                        </div>

                        <button
                            onClick={exportToExcel}
                            className="btn-primary"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: '8px', height: '52px', padding: '0 20px', fontSize: '12px', fontWeight: '900' }}
                        >
                            <Download size={20} /> <span className="hide-mobile">EXPORT EXCEL</span><span className="show-mobile">EXCEL</span>
                        </button>
                    </div>
                )}

                {view === 'summary' && (
                    <div className="flex-resp" style={{ gap: '10px', width: '100%', flex: 1, justifyContent: 'flex-end' }}>
                        <select
                            className="input-field"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ width: '150px', marginBottom: 0, height: '52px' }}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={(i + 1).toString()}>
                                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <select
                            className="input-field"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{ width: '120px', marginBottom: 0, height: '52px' }}
                        >
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                    </div>
                )}
            </div>

            {view === 'list' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {filteredStaff.map((staff, idx) => (
                        <motion.div
                            key={staff._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}
                            style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '24px',
                                padding: '28px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '20px',
                                    background: staff.status === 'blocked' ? '#334155' : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white',
                                    fontSize: '26px',
                                    fontWeight: '900',
                                    boxShadow: staff.status === 'blocked' ? 'none' : '0 10px 20px rgba(14, 165, 233, 0.2)'
                                }}>
                                    {(staff.name || '?').charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>{staff.name || 'Unnamed Staff'}</h3>
                                    <p style={{ margin: '4px 0 0 0', color: '#10b981', fontSize: '13px', fontWeight: '700' }}>{staff.designation || 'Staff Member'}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Mobile</p>
                                    <p style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '14px' }}>{staff.mobile || '—'}</p>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Monthly Salary</p>
                                    <p style={{ margin: 0, color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹{staff.salary?.toLocaleString() || '0'}</p>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Login ID</p>
                                    <p style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.username || 'Not Set'}</p>
                                </div>
                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 6px 0', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Paid Leaves</p>
                                    <p style={{ margin: 0, color: '#fbbf24', fontWeight: '900', fontSize: '14px' }}>{staff.monthlyLeaveAllowance || 4} / Mo</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => toggleStaffStatus(staff)}
                                    style={{
                                        flex: 2,
                                        background: staff.status === 'blocked' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                        color: staff.status === 'blocked' ? '#10b981' : 'white',
                                        border: staff.status === 'blocked' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.1)',
                                        padding: '12px',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: '900',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {staff.status === 'blocked' ? 'UNBLOCK ACCESS' : 'BLOCK ACCESS'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => handleDeleteStaff(staff._id)}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(244, 63, 94, 0.1)',
                                        color: '#f43f5e',
                                        border: '1px solid rgba(244, 63, 94, 0.2)',
                                        padding: '12px',
                                        borderRadius: '14px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : view === 'attendance' ? (
                <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 15px #0ea5e9' }} />
                        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>ATTENDANCE INTELLIGENCE</h2>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginLeft: 'auto' }}>{filteredAttendance.length} Records Found</span>
                    </div>

                    <div style={{
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                        backdropFilter: 'blur(10px)'
                    }} className="hide-mobile">
                        <div className="scroll-x">
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                                        <th style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Staff Unit</th>
                                        <th style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Check In</th>
                                        <th style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Check Out</th>
                                        <th style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Verify</th>
                                        <th style={{ padding: '20px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Geo Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttendance.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '100px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                                <Users size={40} style={{ opacity: 0.1, marginBottom: '15px' }} />
                                                <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>No active signals detected for {filterDate}</p>
                                            </td>
                                        </tr>
                                    ) : filteredAttendance.map(record => (
                                        <tr key={record._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: '0.2s' }} className="table-row-hover">
                                            <td style={{ padding: '20px 25px' }}>
                                                <div style={{ fontWeight: '900', color: 'white', fontSize: '15px' }}>{record.staff?.name || 'N/A'}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontWeight: '600' }}>{record.staff?.mobile || 'No Mobile'}</div>
                                            </td>
                                            <td style={{ padding: '20px 25px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '800', fontSize: '14px', background: 'rgba(16, 185, 129, 0.05)', padding: '6px 12px', borderRadius: '10px' }}>
                                                    <ArrowUpRight size={14} />
                                                    {record.punchIn?.time ? new Date(record.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 25px' }}>
                                                {record.punchOut?.time ? (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontWeight: '800', fontSize: '14px', background: 'rgba(244, 63, 94, 0.05)', padding: '6px 12px', borderRadius: '10px' }}>
                                                        <ArrowDownLeft size={14} />
                                                        {new Date(record.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#0ea5e9', fontSize: '10px', fontWeight: '900', background: 'rgba(14, 165, 233, 0.1)', padding: '6px 14px', borderRadius: '30px', letterSpacing: '0.5px' }}>ON DUTY</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '20px 25px' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {record.punchIn?.photo && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            onClick={() => window.open(record.punchIn.photo, '_blank')}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                                                            title="Punch-In Visual"
                                                        >
                                                            <Camera size={16} />
                                                        </motion.button>
                                                    )}
                                                    {record.punchOut?.photo && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            onClick={() => window.open(record.punchOut.photo, '_blank')}
                                                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                                                            title="Punch-Out Visual"
                                                        >
                                                            <Camera size={16} />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 25px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '280px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                                                        <MapPin size={14} style={{ color: '#0ea5e9' }} />
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {record.punchIn?.location?.address || 'Geolocation Encrypted'}
                                                        </span>
                                                    </div>
                                                    {record.punchIn?.location?.latitude && (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${record.punchIn.location.latitude},${record.punchIn.location.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ fontSize: '10px', color: '#0ea5e9', fontWeight: '800', letterSpacing: '0.5px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            TRACK COORDINATES <ChevronRight size={10} />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="show-mobile">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {filteredAttendance.map(record => (
                                <motion.div
                                    key={record._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'rgba(30, 41, 59, 0.4)',
                                        borderRadius: '20px',
                                        padding: '20px',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '15px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: '900', fontSize: '16px', color: 'white' }}>{record.staff?.name}</div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: '2px' }}>UNIT ID: {record.staff?.username}</div>
                                        </div>
                                        <div style={{ background: record.punchOut?.time ? 'rgba(244, 63, 94, 0.1)' : (record.status === 'absent' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(14, 165, 233, 0.1)'), padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', color: record.punchOut?.time ? '#f43f5e' : (record.status === 'absent' ? '#fbbf24' : '#0ea5e9') }}>
                                            {record.punchOut?.time ? 'COMPLETED' : (record.status === 'absent' ? 'LEAVE' : 'ACTIVE')}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px' }}>CHECK IN</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ArrowUpRight size={14} style={{ color: '#10b981' }} />
                                                <span style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>{record.punchIn?.time || '—'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '8px' }}>CHECK OUT</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <ArrowDownLeft size={14} style={{ color: '#f43f5e' }} />
                                                <span style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>{record.punchOut?.time || '—'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                            <MapPin size={12} style={{ color: '#0ea5e9' }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.punchIn?.location?.address || (record.status === 'absent' ? 'On Approved Leave' : 'Locality Locked')}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {record.punchIn?.photo && <Camera size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                                            {record.punchOut?.photo && <Camera size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </div>
            ) : view === 'leaves' ? (
                <div style={{
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '24px',
                    padding: '30px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 15px #fbbf24' }} />
                        <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>PENDING LEAVE APPROVALS</h3>
                    </div>

                    {pendingLeaves.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0' }}>
                            <Calendar size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                            <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: '700', fontSize: '15px' }}>Clear schedule. No requests awaiting review.</p>
                        </div>
                    ) : (
                        <div className="scroll-x">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '15px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Staff Force</th>
                                        <th style={{ padding: '15px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Duration</th>
                                        <th style={{ padding: '15px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Context/Reason</th>
                                        <th style={{ padding: '15px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Protocol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingLeaves.map(leave => (
                                        <tr key={leave._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '20px 15px' }}>
                                                <div style={{ fontWeight: '900', fontSize: '15px' }}>{leave.staff?.name || 'N/A'}</div>
                                                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '800', marginTop: '4px' }}>LV-{leave._id.slice(-6).toUpperCase()}</div>
                                            </td>
                                            <td style={{ padding: '20px 15px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{leave.startDate} <ChevronRight size={10} style={{ margin: '0 4px', opacity: 0.3 }} /> {leave.endDate}</div>
                                                <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', marginTop: '4px' }}>{leave.type}</div>
                                            </td>
                                            <td style={{ padding: '20px 15px' }}>
                                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', maxWidth: '250px', lineHeight: '1.4' }}>{leave.reason || 'No statement provided.'}</div>
                                            </td>
                                            <td style={{ padding: '20px 15px' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        onClick={() => handleLeaveAction(leave._id, 'Approved')}
                                                        style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 18px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                                                    >
                                                        AUTHORIZE
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        onClick={() => handleLeaveAction(leave._id, 'Rejected')}
                                                        style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '10px 18px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                                                    >
                                                        DECLINE
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', margin: 0 }}>Salary Report Overview</h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '5px 0 0 0' }}>Detailed payment list for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px 0', fontWeight: '900' }}>TOTAL COMPANY PAYOUT</p>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fbbf24', margin: 0 }}>
                                ₹{monthlyReport.reduce((acc, curr) => acc + (curr.finalSalary || 0), 0).toLocaleString()}
                            </h2>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {monthlyReport.map(item => (
                            <motion.div
                                key={item.staffId}
                                onClick={() => setSelectedStaffReport(item)}
                                whileHover={{ y: -4, background: 'rgba(30, 41, 59, 0.4)' }}
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderRadius: '24px',
                                    padding: '24px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '24px',
                                    cursor: 'pointer',
                                    transition: '0.3s'
                                }}
                            >
                                {/* Avatar/Initial */}
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '18px',
                                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    fontSize: '20px', fontWeight: '900', color: 'white'
                                }}>
                                    {item.name.charAt(0)}
                                </div>

                                {/* Info Section */}
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'white' }}>{item.name}</h3>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {item.designation || 'Staff Member'} • {item.staffId}
                                    </p>
                                </div>

                                {/* Simple Stats Inline */}
                                <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', marginBottom: '4px' }}>PRESENT</p>
                                        <span style={{ fontSize: '16px', fontWeight: '900', color: '#10b981' }}>{item.presentDays}d</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', marginBottom: '4px' }}>ABSENT</p>
                                        <span style={{ fontSize: '16px', fontWeight: '900', color: item.extraLeaves > 0 ? '#f43f5e' : 'rgba(255,255,255,0.2)' }}>{item.extraLeaves}d</span>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '120px', padding: '12px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', marginBottom: '2px' }}>FINAL PAYOUT</p>
                                        <span style={{ fontSize: '20px', fontWeight: '900', color: '#fbbf24' }}>₹{(item.finalSalary || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
            <AnimatePresence>
                {showAddModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(10px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                                maxWidth: '650px',
                                width: '100%',
                                background: '#0f172a',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '32px',
                                padding: '40px',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.8px' }}>Asset Onboarding</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '600' }}>Register new personnel to the ecosystem.</p>
                                </div>
                                <motion.button
                                    whileHover={{ rotate: 90 }}
                                    onClick={() => setShowAddModal(false)}
                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                                {/* Section 1: Core Identity */}
                                <div>
                                    <h4 style={{ color: '#0ea5e9', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '18px' }}>01. CORE IDENTITY</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>FULL LEGAL NAME</label>
                                            <input
                                                type="text" required className="input-field" placeholder="First & Last Name"
                                                style={{ height: '56px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>COMMUNICATION (MOB)</label>
                                                <input
                                                    type="text" required className="input-field" placeholder="+91 XXXX XXXX"
                                                    style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                                    value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>EMAIL (OFFICIAL)</label>
                                                <input
                                                    type="email" className="input-field" placeholder="user@yatree.com"
                                                    style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Financial & Access */}
                                <div>
                                    <h4 style={{ color: '#6366f1', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '18px' }}>02. PROTOCOL & FINANCIALS</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>ASSIGNED USERNAME</label>
                                            <input
                                                type="text" required className="input-field" placeholder="unique_id"
                                                style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                                value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>ACCESS PASSWORD</label>
                                            <input
                                                type="password" required className="input-field" placeholder="••••••••"
                                                style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                                value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>BASE SALARY (MONTHLY)</label>
                                            <input
                                                type="number" required className="input-field" placeholder="₹ Amount"
                                                style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                                value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>LEAVE ALLOWANCE (MO)</label>
                                            <input
                                                type="number" required className="input-field"
                                                style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                                value={formData.monthlyLeaveAllowance} onChange={(e) => setFormData({ ...formData, monthlyLeaveAllowance: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Geofencing Control */}
                                <div>
                                    <h4 style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '18px' }}>03. GEOFENCING & SHIFTS</h4>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', gap: '20px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <MapPin size={16} color="#fbbf24" />
                                                <span style={{ fontSize: '12px', fontWeight: '800' }}>STATIONARY OFFICE RADIUS</span>
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                type="button"
                                                onClick={handleCaptureLocation}
                                                disabled={locationLoading}
                                                style={{ background: '#fbbf24', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                                            >
                                                {locationLoading ? 'SYNCING...' : 'CAPTURE SIGNAL'}
                                            </motion.button>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 15px 0', lineHeight: '1.4' }}>{formData.officeLocation.address || 'Location signal not yet established.'}</p>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div className="form-group">
                                                <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, marginBottom: '8px', display: 'block' }}>FENCE RADIUS (METERS)</label>
                                                <input
                                                    type="number" className="input-field"
                                                    style={{ height: '48px', width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '0 15px' }}
                                                    value={formData.officeLocation.radius} onChange={(e) => setFormData({ ...formData, officeLocation: { ...formData.officeLocation, radius: Number(e.target.value) } })}
                                                />
                                            </div>
                                            <div className="form-group" style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, marginBottom: '8px', display: 'block' }}>SHIFT START</label>
                                                    <input type="time" className="input-field" style={{ height: '48px', width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '0 10px' }} value={formData.shiftTiming.start} onChange={(e) => setFormData({ ...formData, shiftTiming: { ...formData.shiftTiming, start: e.target.value } })} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, marginBottom: '8px', display: 'block' }}>SHIFT END</label>
                                                    <input type="time" className="input-field" style={{ height: '48px', width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: 'white', padding: '0 10px' }} value={formData.shiftTiming.end} onChange={(e) => setFormData({ ...formData, shiftTiming: { ...formData.shiftTiming, end: e.target.value } })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    style={{ width: '100%', height: '60px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 20px 30px -10px rgba(99, 102, 241, 0.4)', marginTop: '10px' }}
                                >
                                    INITIALIZE ONBOARDING
                                </motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
                {selectedStaffReport && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(2, 6, 23, 0.98)', backdropFilter: 'blur(40px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100,
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            style={{
                                maxWidth: '900px', width: '100%', maxHeight: '90vh',
                                background: '#0f172a', borderRadius: '32px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                overflow: 'hidden', position: 'relative',
                                display: 'flex', flexDirection: 'column',
                                boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7)'
                            }}
                        >
                            {/* Close Button Top Right */}
                            <button
                                onClick={() => setSelectedStaffReport(null)}
                                style={{
                                    position: 'absolute', top: '20px', right: '20px',
                                    background: 'rgba(255,255,255,0.08)', border: 'none',
                                    color: 'white', padding: '12px', borderRadius: '50%',
                                    cursor: 'pointer', zIndex: 100, transition: '0.2s',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(244, 63, 94, 0.4)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                            >
                                <X size={20} />
                            </button>
                            {/* Left Side: Summary & Receipt (40%) | Right Side: Date-wise Calendar (60%) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', height: '100%', overflow: 'hidden' }}>

                                {/* Sidebar: Financials */}
                                <div style={{ background: '#1c2235', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ background: 'linear-gradient(135deg, #FFB82B, #fbbf24)', padding: '40px 30px', textAlign: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase' }}>Net Payable</p>
                                        <h1 style={{ margin: '5px 0 0 0', fontSize: '42px', fontWeight: '900', color: '#000' }}>₹{selectedStaffReport.finalSalary.toLocaleString()}</h1>
                                    </div>

                                    <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
                                        <div style={{ marginBottom: '30px' }}>
                                            <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white', margin: 0 }}>{selectedStaffReport.name}</h3>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{selectedStaffReport.designation || 'Staff'} • {selectedMonth}/{selectedYear}</p>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Base Salary</span>
                                                <span style={{ fontWeight: '800', color: 'white' }}>₹{(selectedStaffReport.salary || 0).toLocaleString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#10b981', fontWeight: '600' }}>Days Present</span>
                                                <span style={{ fontWeight: '800', color: '#10b981' }}>{selectedStaffReport.presentDays}d</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#f43f5e', fontWeight: '600' }}>Days Absent</span>
                                                <span style={{ fontWeight: '800', color: '#f43f5e' }}>{selectedStaffReport.extraLeaves}d</span>
                                            </div>
                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '15px 0' }}></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#f43f5e', fontWeight: '800' }}>DEDUCTION</span>
                                                <span style={{ fontWeight: '900', color: '#f43f5e' }}>-₹{selectedStaffReport.deduction.toLocaleString()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#6366f1', fontWeight: '800' }}>INCENTIVE</span>
                                                <span style={{ fontWeight: '900', color: '#6366f1' }}>+₹{(selectedStaffReport.sundayBonus || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <button onClick={() => setSelectedStaffReport(null)} style={{ width: '100%', py: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', height: '45px' }}>
                                            CLOSE REPORT
                                        </button>
                                    </div>
                                </div>

                                {/* Main Content: Date-wise Attendance */}
                                <div style={{ padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '35px' }}>

                                    {/* Attendance Visual Insights */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Attendance Map</h4>
                                            <div style={{ display: 'flex', gap: '15px', fontSize: '10px', fontWeight: '800', marginRight: '40px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#22c55e' }}>
                                                    <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}></div> PRESENT
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444' }}>
                                                    <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}></div> ABSENT
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                                            {/* Weekday Headers */}
                                            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                                <div key={day} style={{ textAlign: 'center', fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.2)', paddingBottom: '5px' }}>{day}</div>
                                            ))}

                                            {/* Padding for first week offset */}
                                            {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() }).map((_, i) => (
                                                <div key={`offset-${i}`} style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.01)', borderRadius: '10px' }}></div>
                                            ))}

                                            {/* Day Cells */}
                                            {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => {
                                                const day = i + 1;
                                                const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                                const attendanceRecord = (selectedStaffReport.attendanceData || []).find(a => a.date === dateStr);
                                                const isPresent = attendanceRecord?.status === 'present';
                                                const isAbsent = attendanceRecord?.status === 'absent';
                                                const isSunday = new Date(selectedYear, selectedMonth - 1, day).getDay() === 0;

                                                return (
                                                    <motion.div
                                                        key={day}
                                                        whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.05)' }}
                                                        style={{
                                                            aspectRatio: '1',
                                                            background: isPresent ? 'rgba(16, 185, 129, 0.12)' : isAbsent ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255,255,255,0.02)',
                                                            border: `1px solid ${isPresent ? 'rgba(16, 185, 129, 0.25)' : isAbsent ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255,255,255,0.05)'}`,
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <span style={{
                                                            fontSize: '11px',
                                                            fontWeight: '900',
                                                            color: isPresent ? '#10b981' : isAbsent ? '#f43f5e' : isSunday ? '#fbbf24' : 'rgba(255,255,255,0.5)'
                                                        }}>{day}</span>

                                                        {isPresent ? (
                                                            <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 12px rgba(34, 197, 94, 0.6)' }}></div>
                                                        ) : isAbsent ? (
                                                            <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)' }}></div>
                                                        ) : (
                                                            <div style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Daily Log Table */}
                                    <div>
                                        <h4 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '900', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Daily Activity Logs</h4>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                                                        <th style={{ padding: '15px 20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '900' }}>DATE</th>
                                                        <th style={{ padding: '15px 20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '900' }}>MATCH</th>
                                                        <th style={{ padding: '15px 20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '900' }}>PUNCH IN</th>
                                                        <th style={{ padding: '15px 20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '900' }}>PUNCH OUT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(selectedStaffReport.attendanceData || []).map(log => (
                                                        <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                            <td style={{ padding: '15px 20px', fontSize: '13px', fontWeight: '800', color: 'white' }}>{new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                                                            <td style={{ padding: '15px 20px' }}>
                                                                <span style={{ fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', background: log.status === 'present' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: log.status === 'present' ? '#22c55e' : '#ef4444' }}>{log.status.toUpperCase()}</span>
                                                            </td>
                                                            <td style={{ padding: '15px 20px', fontSize: '12px', fontWeight: '700', color: 'white' }}>{log.punchIn?.time ? new Date(log.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                                                            <td style={{ padding: '15px 20px', fontSize: '12px', fontWeight: '700', color: 'white' }}>{log.punchOut?.time ? new Date(log.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Staff;
