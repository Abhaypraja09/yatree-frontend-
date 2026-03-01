import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import {
    Users, Plus, Search, Clock, MapPin, User, MoreVertical, IndianRupee, Calendar, Download, X,
    ChevronLeft, ChevronRight, UserPlus, Eye, Trash2, Filter, ArrowUpRight, ArrowDownLeft,
    ShieldCheck, Lock, Unlock, Settings, LayoutDashboard, AlertCircle, CheckCircle, Info,
    Camera, Printer, FileText, DollarSign, Phone, Edit2, TrendingUp, History, CheckCircle2, XCircle
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
    const [view, setView] = useState('list'); // 'list', 'attendance', 'leaves', 'summary'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStaff, setFilterStaff] = useState('all');

    const [formData, setFormData] = useState({
        name: '', mobile: '', username: '', password: '', salary: 0, monthlyLeaveAllowance: 4,
        email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
        officeLocation: { latitude: '', longitude: '', address: '', radius: 200 },
        joiningDate: new Date().toISOString().split('T')[0],
        staffType: 'Company'
    });

    const [locationLoading, setLocationLoading] = useState(false);

    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [monthlyReport, setMonthlyReport] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedStaffReport, setSelectedStaffReport] = useState(null);
    const [showBackdateModal, setShowBackdateModal] = useState(false);
    const [backdateForm, setBackdateForm] = useState({ staffId: '', date: new Date().toISOString().split('T')[0], status: 'present', punchInTime: '', punchOutTime: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState(null);

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


    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                companyId: selectedCompany._id,
                officeLocation: {
                    ...formData.officeLocation,
                    latitude: formData.officeLocation.latitude ? Number(formData.officeLocation.latitude) : undefined,
                    longitude: formData.officeLocation.longitude ? Number(formData.officeLocation.longitude) : undefined,
                    radius: formData.officeLocation.radius ? Number(formData.officeLocation.radius) : 200
                }
            };
            if (isEditing) {
                await axios.put(`/api/admin/staff/${editingStaffId}`, payload);
                alert('Staff updated successfully');
            } else {
                await axios.post('/api/admin/staff', payload);
            }
            setShowAddModal(false);
            setIsEditing(false);
            setEditingStaffId(null);
            fetchStaff();
            setFormData({
                name: '', mobile: '', username: '', password: '', salary: 0, monthlyLeaveAllowance: 4,
                email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
                joiningDate: new Date().toISOString().split('T')[0],
                staffType: 'Company'
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Error processing staff request');
        }
    };

    const handleEditStaff = (staff) => {
        setFormData({
            name: staff.name || '',
            mobile: staff.mobile || '',
            username: staff.username || '',
            password: '',
            salary: staff.salary || 0,
            monthlyLeaveAllowance: staff.monthlyLeaveAllowance || 4,
            email: staff.email || '',
            designation: staff.designation || '',
            shiftTiming: staff.shiftTiming || { start: '09:00', end: '18:00' },
            staffType: staff.staffType || 'Company',
            joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setEditingStaffId(staff._id);
        setIsEditing(true);
        setShowAddModal(true);
    };

    // Unified detail view
    const [selectedStaff, setSelectedStaff] = useState(null);

    const handleStaffClick = async (staff) => {
        try {
            const { data } = await axios.get(`/api/admin/staff-attendance/${selectedCompany._id}?month=${selectedMonth}&year=${selectedYear}`);
            const report = data.report.find(r => r.staffId === staff._id);
            if (report) {
                setSelectedStaffReport(report);
            } else {
                setSelectedStaffReport({
                    staffId: staff._id,
                    name: staff.name,
                    designation: staff.designation,
                    salary: staff.salary,
                    presentDays: 0,
                    leavesTaken: 0,
                    sundaysWorked: 0,
                    finalSalary: 0,
                    attendanceData: []
                });
            }
        } catch (err) {
            console.error(err);
            // Default fallback if error
            setSelectedStaffReport({
                staffId: staff._id,
                name: staff.name,
                designation: staff.designation,
                salary: staff.salary,
                presentDays: 0,
                leavesTaken: 0,
                sundaysWorked: 0,
                finalSalary: 0,
                attendanceData: []
            });
        }
    };

    const handleBackdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/staff-attendance/backdate', {
                ...backdateForm,
                companyId: selectedCompany._id
            });
            setShowBackdateModal(false);
            alert('Attendance added successfully');
            fetchAttendance();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding attendance');
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

    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div style={{ padding: isMobile ? '20px 15px' : '60px 40px', background: '#020617', minHeight: '100vh', position: 'relative', overflowX: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
            <style>
                {`
                    @media (max-width: 768px) {
                        .resp-grid {
                            grid-template-columns: 1fr !important;
                        }
                        .staff-card {
                            grid-template-columns: 1fr !important;
                            gap: 15px !important;
                        }
                        .hide-mobile {
                            display: none !important;
                        }
                        .mobile-column {
                            flex-direction: column !important;
                        }
                    }
                `}
            </style>
            <SEO title="Staff Intelligence & Assets" />

            {/* Photo Preview Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(5, 8, 15, 0.95)', zIndex: 11000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(20px)' }}
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={selectedPhoto} style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }} alt="Evidence" />
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                style={{ position: 'absolute', top: '-60px', right: '-10px', background: 'white', color: 'black', border: 'none', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}
                            >
                                <X size={24} />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

            {/* Premium Header */}
            <header style={{
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(30px)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                padding: isMobile ? '15px 20px' : '24px 40px',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '15px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 20px -5px rgba(14, 165, 233, 0.4)' }}>
                        <Users size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '950', color: 'white', margin: 0, letterSpacing: '-1px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WORKFORCE COMMAND</h1>
                        <p style={{ fontSize: '10px', color: 'rgba(56, 189, 248, 0.8)', margin: '4px 0 0 0', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>Operational Intelligence Engine</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setIsEditing(false);
                            setFormData({
                                name: '', mobile: '', username: '', password: '', salary: 0, monthlyLeaveAllowance: 4,
                                email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
                                joiningDate: new Date().toISOString().split('T')[0],
                                staffType: 'Company'
                            });
                            setShowAddModal(true);
                        }}
                        style={{
                            padding: '0 24px',
                            height: '48px',
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '14px',
                            fontWeight: '900',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.3)'
                        }}
                    >
                        <Plus size={18} /> NEW PERSONNEL
                    </motion.button>

                    <button
                        onClick={() => setShowBackdateModal(true)}
                        style={{
                            padding: '0 20px',
                            height: '48px',
                            background: 'rgba(255,255,255,0.03)',
                            color: '#fbbf24',
                            border: '1px solid rgba(251, 191, 36, 0.2)',
                            borderRadius: '14px',
                            fontWeight: '800',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Clock size={16} /> RECORD OVERRIDE
                    </button>

                    <button
                        onClick={exportToExcel}
                        style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer'
                        }}
                        title="Export Telemetry"
                    >
                        <FileText size={20} />
                    </button>
                </div>
            </header>


            <main style={{ padding: isMobile ? '20px 0' : '40px', maxWidth: '1600px', margin: '0 auto' }}>
                {/* Dashboard Intelligence Row Body */}
                <div className="resp-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    {[
                        { label: 'TOTAL ASSETS', value: staffList.length, icon: Users, color: '#0ea5e9', sub: 'Active Personnel' },
                        { label: 'PRESENT TODAY', value: attendanceList.filter(r => r.date === new Date().toISOString().split('T')[0]).length, icon: CheckCircle, color: '#10b981', sub: 'Daily Attendance' },
                        { label: 'PENDING SIGNALS', value: pendingLeaves.length, icon: Calendar, color: '#fbbf24', sub: 'Leave Requests' },
                        { label: 'EFFICIENCY', value: '94.2%', icon: TrendingUp, color: '#6366f1', sub: 'Workforce Index' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(15, 23, 42, 0.4)',
                                padding: '24px',
                                borderRadius: '32px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                backdropFilter: 'blur(20px)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: stat.color }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: `${stat.color}15`, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${stat.color}30` }}>
                                    <stat.icon size={20} color={stat.color} />
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px' }}>{stat.label}</p>
                                    <h3 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>{stat.value}</h3>
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{stat.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Search & Navigation Bar */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '24px',
                    marginBottom: '40px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    padding: '20px',
                    borderRadius: '35px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(30px)'
                }}>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '22px', gap: '6px' }}>
                        {[
                            { id: 'list', label: 'WORKFORCE', icon: Users },
                            { id: 'attendance', label: 'LOGS', icon: Clock },
                            { id: 'leaves', label: 'LEAVES', icon: Calendar },
                            { id: 'summary', label: 'PAYROLL', icon: DollarSign }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setView(t.id)}
                                style={{
                                    padding: '12px 28px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: view === t.id ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'transparent',
                                    color: view === t.id ? 'white' : 'rgba(255,255,255,0.4)',
                                    fontWeight: '950',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    letterSpacing: '0.5px',
                                    boxShadow: view === t.id ? '0 10px 20px -5px rgba(14, 165, 233, 0.4)' : 'none'
                                }}
                            >
                                <t.icon size={16} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ flex: 1, minWidth: '300px', maxWidth: '600px', position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(14, 165, 233, 0.4)' }} />
                        <input
                            type="text"
                            placeholder="Identify Personnel or Sector Hub..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                height: '56px',
                                background: 'rgba(0, 0, 0, 0.6)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '24px',
                                padding: '0 24px 0 60px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '700',
                                transition: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#0ea5e9';
                                e.target.style.boxShadow = '0 0 0 4px rgba(14, 165, 233, 0.1), inset 0 2px 4px rgba(0,0,0,0.2)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255,255,255,0.05)';
                                e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
                            }}
                        />
                    </div>

                    {view === 'attendance' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '15px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                                <Calendar size={20} color="#0ea5e9" />
                            </div>
                            <input
                                type="date"
                                className="premium-compact-input"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ height: '48px', margin: 0, width: '180px' }}
                            />
                        </div>
                    )}

                    {(view === 'summary' || view === 'list') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <select
                                className="premium-compact-input"
                                style={{ height: '48px', width: '130px', margin: 0 }}
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                <option value="1">January</option>
                                <option value="2">February</option>
                                <option value="3">March</option>
                                <option value="4">April</option>
                                <option value="5">May</option>
                                <option value="6">June</option>
                                <option value="7">July</option>
                                <option value="8">August</option>
                                <option value="9">September</option>
                                <option value="10">October</option>
                                <option value="11">November</option>
                                <option value="12">December</option>
                            </select>
                            <select
                                className="premium-compact-input"
                                style={{ height: '48px', width: '100px', margin: 0 }}
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                {view === 'list' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Table Header Replacement */}
                        <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 1fr', padding: '0 30px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '950', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>PERSONNEL IDENTITY</span>
                            <span style={{ fontSize: '10px', fontWeight: '950', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>COMMUNICATION</span>
                            <span style={{ fontSize: '10px', fontWeight: '950', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>ONBOARDING DATE</span>
                            <span style={{ fontSize: '10px', fontWeight: '950', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>FINANCIAL PAYSCALE</span>
                            <span style={{ fontSize: '10px', fontWeight: '950', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textAlign: 'right' }}>COMMAND</span>
                        </div>

                        {filteredStaff.length === 0 ? (
                            <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '100px', textAlign: 'center', borderRadius: '40px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <Users size={64} style={{ opacity: 0.1, marginBottom: '20px' }} />
                                <h3 style={{ margin: 0, color: 'white', fontWeight: '950', fontSize: '20px' }}>No Active Signals</h3>
                                <p style={{ margin: '8px 0 0 0', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>Sector scanned. No personnel identified in this range.</p>
                            </div>
                        ) : filteredStaff.map((staff, idx) => (
                            <motion.div
                                key={staff._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                whileHover={{ scale: 1.01, borderColor: 'rgba(14, 165, 233, 0.3)' }}
                                onClick={() => handleStaffClick(staff)}
                                className="staff-card"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.4)',
                                    padding: isMobile ? '20px' : '28px 32px',
                                    borderRadius: '32px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '2fr 1.5fr 1.5fr 1.5fr 1fr',
                                    alignItems: 'center',
                                    gap: '24px',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backdropFilter: 'blur(40px)',
                                    boxShadow: '0 4px 20px -10px rgba(0,0,0,0.5), inset 0 0 1px 1px rgba(255,255,255,0.02)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '22px',
                                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                            padding: '2px',
                                            boxShadow: '0 10px 20px -5px rgba(14, 165, 233, 0.4)'
                                        }}>
                                            <div style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', background: '#0B1121', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '1000', fontSize: '24px', color: 'white' }}>
                                                {staff.profilePhoto ? <img src={staff.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : staff.name?.charAt(0)}
                                            </div>
                                        </div>
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-3px',
                                            right: '-3px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: '#10b981',
                                            border: '4px solid #0B1121',
                                            boxShadow: '0 0 15px #10b981',
                                            zIndex: 2
                                        }}></div>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>{staff.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                            <div style={{ background: 'rgba(14, 165, 233, 0.15)', padding: '4px 10px', borderRadius: '8px', color: '#0ea5e9', fontSize: '10px', fontWeight: '950', letterSpacing: '1px', textTransform: 'uppercase' }}>{staff.designation || 'SPECIALIST'}</div>
                                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '950', letterSpacing: '1px' }}>{staff.staffType?.toUpperCase()}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: '900', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={14} color="#0ea5e9" />
                                        {staff.mobile}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginLeft: '22px' }}>{staff.email || 'NO SECURE MAIL'}</div>
                                </div>

                                <div>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        padding: '10px 20px',
                                        borderRadius: '16px',
                                        fontSize: '14px',
                                        fontWeight: '950',
                                        color: 'white'
                                    }}>
                                        <Calendar size={16} color="#0ea5e9" />
                                        {new Date(staff.joiningDate).toLocaleDateString()}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative', zIndex: 2 }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '16px',
                                        background: 'rgba(251, 191, 36, 0.08)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        border: '1px solid rgba(251, 191, 36, 0.2)',
                                        boxShadow: '0 5px 15px -5px rgba(251, 191, 36, 0.2)'
                                    }}>
                                        <DollarSign size={20} color="#fbbf24" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '18px', fontWeight: '1000', color: 'white', letterSpacing: '-0.5px' }}>₹{(staff.salary || 0).toLocaleString()}</div>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>ANNUAL BASIS</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.1, background: 'rgba(14, 165, 233, 0.2)' }}
                                        onClick={(e) => { e.stopPropagation(); handleEditStaff(staff); }}
                                        style={{ width: '44px', height: '44px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.2s' }}
                                    >
                                        <Edit2 size={20} />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.1, background: 'rgba(244, 63, 94, 0.2)' }}
                                        onClick={(e) => { e.stopPropagation(); handleDeleteStaff(staff._id); }}
                                        style={{ width: '44px', height: '44px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.2s' }}
                                    >
                                        <Trash2 size={20} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}


                {/* Redesigned Selected Staff Sidebar is removed for simplicity */}
                {/* Attendance Logs View */}
                {view === 'attendance' && (
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '28px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', color: 'white', padding: '16px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '15px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>STAFF UNIT</th>
                                        <th style={{ padding: '15px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>TELEMETRY (IN/OUT)</th>
                                        <th style={{ padding: '15px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>VERIFICATION</th>
                                        <th style={{ padding: '15px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>LOCATION HUB</th>
                                    </tr>
                                </thead>
                                <tbody style={{ padding: '0 10px' }}>
                                    {filteredAttendance.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '100px', textAlign: 'center', opacity: 0.3 }}>
                                                <History size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                                <p style={{ margin: 0, fontWeight: '700' }}>No telemetry signals detected for {filterDate}.</p>
                                            </td>
                                        </tr>
                                    ) : filteredAttendance.map(record => (
                                        <motion.tr
                                            key={record._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            style={{
                                                background: 'rgba(255,255,255,0.015)',
                                                borderRadius: '16px',
                                                transition: '0.2s'
                                            }}
                                        >
                                            <td style={{ padding: '16px 25px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                                                <div style={{ fontWeight: '950', color: 'white', fontSize: '15px' }}>{record.staff?.name || 'Unknown Unit'}</div>
                                                <div style={{ fontSize: '10px', color: '#0ea5e9', marginTop: '4px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>ID: {record.staff?.username || 'SYSTEM'}</div>
                                            </td>
                                            <td style={{ padding: '16px 25px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: '900' }}>
                                                            <ArrowUpRight size={14} />
                                                            {record.punchIn?.time ? new Date(record.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A'}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: record.punchOut?.time ? '#f43f5e' : '#0ea5e9', fontSize: '13px', fontWeight: '900' }}>
                                                            <ArrowDownLeft size={14} />
                                                            {record.punchOut?.time
                                                                ? new Date(record.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                                                                : 'ACTIVE'
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 25px' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {record.punchIn?.photo ? (
                                                        <motion.div whileHover={{ scale: 1.1 }} onClick={() => setSelectedPhoto(record.punchIn.photo)} style={{ position: 'relative', cursor: 'pointer' }}>
                                                            <img src={record.punchIn.photo} style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(16,185,129,0.2)' }} alt="" />
                                                            <div style={{ position: 'absolute', top: -3, right: -3, background: '#10b981', padding: '2px', borderRadius: '50%' }}><ArrowUpRight size={8} color="white" /></div>
                                                        </motion.div>
                                                    ) : <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Camera size={16} style={{ opacity: 0.1 }} /></div>}

                                                    {record.punchOut?.photo ? (
                                                        <motion.div whileHover={{ scale: 1.1 }} onClick={() => setSelectedPhoto(record.punchOut.photo)} style={{ position: 'relative', cursor: 'pointer' }}>
                                                            <img src={record.punchOut.photo} style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(244,63,94,0.2)' }} alt="" />
                                                            <div style={{ position: 'absolute', top: -3, right: -3, background: '#f43f5e', padding: '2px', borderRadius: '50%' }}><ArrowDownLeft size={8} color="white" /></div>
                                                        </motion.div>
                                                    ) : record.punchOut?.time ? (
                                                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Camera size={16} style={{ opacity: 0.1 }} /></div>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 25px', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                                                        <MapPin size={18} color="#0ea5e9" />
                                                    </div>
                                                    <div style={{ maxWidth: '240px' }}>
                                                        <div style={{ fontSize: '13px', fontWeight: '800', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {record.punchIn?.location?.address || 'COORDINATES ENCRYPTED'}
                                                        </div>
                                                        {record.punchIn?.location?.latitude && (
                                                            <a
                                                                href={`https://www.google.com/maps?q=${record.punchIn.location.latitude},${record.punchIn.location.longitude}`}
                                                                target="_blank" rel="noreferrer"
                                                                style={{ fontSize: '9px', color: '#fbbf24', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '3px', display: 'block', textDecoration: 'none' }}
                                                            >
                                                                OPEN SECURE LINK →
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Leaves Management View */}
                {view === 'leaves' && (
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.4)',
                        borderRadius: '28px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', color: 'white', padding: '16px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left' }}>
                                        <th style={{ padding: '15px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>STAFF FORCE</th>
                                        <th style={{ padding: '15px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>DURATION CYCLES</th>
                                        <th style={{ padding: '15px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>REASON / CONTEXT</th>
                                        <th style={{ padding: '15px 25px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'right' }}>PROTOCOLS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingLeaves.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '100px', textAlign: 'center', opacity: 0.3 }}>
                                                <Calendar size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                                                <p style={{ margin: 0, fontWeight: '700' }}>Operational Schedule Clear. No pending requests.</p>
                                            </td>
                                        </tr>
                                    ) : pendingLeaves.map(leave => (
                                        <motion.tr
                                            key={leave._id}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{
                                                background: 'rgba(255,255,255,0.015)',
                                                borderRadius: '16px',
                                                transition: '0.2s'
                                            }}
                                        >
                                            <td style={{ padding: '16px 25px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                                                <div style={{ fontWeight: '950', fontSize: '15px' }}>{leave.staff?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: '900', marginTop: '4px', textTransform: 'uppercase' }}>CASE: LV-{leave._id.slice(-6).toUpperCase()}</div>
                                            </td>
                                            <td style={{ padding: '16px 25px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '800', color: 'white' }}>
                                                    {new Date(leave.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    <ChevronRight size={12} style={{ opacity: 0.3 }} />
                                                    {new Date(leave.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: '900', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>{leave.type} LEAVE</div>
                                            </td>
                                            <td style={{ padding: '16px 25px' }}>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', maxWidth: '280px', lineHeight: '1.5', fontWeight: '500' }}>
                                                    {leave.reason || "No operational context provided."}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 25px', borderTopRightRadius: '16px', borderBottomRightRadius: '16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05, background: 'rgba(16, 185, 129, 0.2)' }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleLeaveAction(leave._id, 'approved')}
                                                        style={{
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            color: '#10b981',
                                                            border: 'none',
                                                            padding: '10px 18px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '950',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            letterSpacing: '0.5px'
                                                        }}
                                                    >
                                                        <CheckCircle2 size={14} /> AUTHORIZE
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05, background: 'rgba(244, 63, 94, 0.2)' }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleLeaveAction(leave._id, 'rejected')}
                                                        style={{
                                                            background: 'rgba(244, 63, 94, 0.1)',
                                                            color: '#f43f5e',
                                                            border: 'none',
                                                            padding: '10px 18px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            fontWeight: '950',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            letterSpacing: '0.5px'
                                                        }}
                                                    >
                                                        <XCircle size={14} /> DECLINE
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {
                    view === 'summary' && (
                        <div style={{ marginTop: '10px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '20px',
                                marginBottom: '35px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                padding: '25px 30px',
                                borderRadius: '32px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(20px)'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 15px #fbbf24' }}></div>
                                        <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Financial Ledger</span>
                                    </div>
                                    <h2 style={{ fontSize: '32px', fontWeight: '950', color: 'white', margin: 0, letterSpacing: '-1.2px' }}>Payroll Distribution</h2>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '11px', color: '#fbbf24', margin: '0 0 5px 0', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>TOTAL SALARY</p>
                                    <h2 style={{ fontSize: '42px', fontWeight: '950', color: 'white', margin: 0, letterSpacing: '-1.5px', textShadow: '0 0 30px rgba(251, 191, 36, 0.4)' }}>
                                        <span style={{ color: '#fbbf24', fontSize: '28px', verticalAlign: 'top', marginRight: '6px' }}>Rs.</span>{monthlyReport.reduce((acc, curr) => acc + (curr.finalSalary || 0), 0).toLocaleString()}
                                    </h2>
                                </div>
                            </div>

                            {monthlyReport.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '120px 0', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '40px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 25px' }}>
                                        <DollarSign size={32} color="#fbbf24" style={{ opacity: 0.5 }} />
                                    </div>
                                    <h3 style={{ color: 'white', margin: '0 0 10px 0', fontWeight: '900', fontSize: '20px' }}>No Fiscal Records</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: '700', fontSize: '15px' }}>Awaiting payroll generation for the selected cycle.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {monthlyReport.map((item, idx) => (
                                        <motion.div
                                            key={item.staffId}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            onClick={() => setSelectedStaffReport(item)}
                                            whileHover={{ y: -5, background: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(251, 191, 36, 0.3)' }}
                                            style={{
                                                background: 'rgba(15, 23, 42, 0.5)',
                                                borderRadius: '24px',
                                                padding: '25px 35px',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                cursor: 'pointer',
                                                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '30px',
                                                flexWrap: 'wrap'
                                            }}
                                        >
                                            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)' }}></div>

                                            {/* Identity Section */}
                                            <div style={{ flex: '1 1 250px', display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                                                <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), transparent)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: '950', color: '#fbbf24', boxShadow: '0 10px 20px rgba(251, 191, 36, 0.1)' }}>
                                                    {item.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '22px', fontWeight: '950', margin: 0, color: 'white', letterSpacing: '-0.5px' }}>{item.name}</h3>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                                        <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.designation || 'Force Member'}</p>
                                                        <div style={{ background: 'rgba(251, 191, 36, 0.15)', padding: '4px 10px', borderRadius: '8px', color: '#fbbf24', fontSize: '9px', fontWeight: '950', letterSpacing: '1px' }}>ACTIVE</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats grid */}
                                            <div style={{ flex: '2 1 400px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', position: 'relative', zIndex: 2 }}>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 10px rgba(14, 165, 233, 0.8)' }}></div>
                                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>PRESENCE</p>
                                                    </div>
                                                    <div style={{ fontSize: '20px', fontWeight: '950', color: 'white' }}>{item.presentDays || 0}<span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>D</span></div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.extraLeaves > 0 ? '#f43f5e' : '#10b981', boxShadow: `0 0 10px ${item.extraLeaves > 0 ? 'rgba(244, 63, 94, 0.8)' : 'rgba(16, 185, 129, 0.8)'}` }}></div>
                                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>LEAVES</p>
                                                    </div>
                                                    <div style={{ fontSize: '20px', fontWeight: '950', color: item.extraLeaves > 0 ? '#f43f5e' : '#10b981' }}>{item.leavesTaken || 0} <span style={{ fontSize: '11px', opacity: 0.4 }}>/ {item.allowance || 4}</span></div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px rgba(99, 102, 241, 0.8)' }}></div>
                                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}>OVERTIME</p>
                                                    </div>
                                                    <div style={{ fontSize: '20px', fontWeight: '950', color: '#6366f1' }}>{item.sundaysWorked || 0}<span style={{ fontSize: '11px', opacity: 0.6, marginLeft: '4px' }}>D</span></div>
                                                </div>
                                            </div>

                                            {/* Payout */}
                                            <div style={{ flex: '1 1 200px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 2 }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>ACCRUED PAYOUT</p>
                                                    <h2 style={{ margin: '4px 0 0 0', fontSize: '30px', fontWeight: '950', color: '#fbbf24', letterSpacing: '-1.5px', textShadow: '0 0 20px rgba(251, 191, 36, 0.2)' }}>Rs. {(item.finalSalary || 0).toLocaleString()}</h2>
                                                </div>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fbbf24' }}>
                                                    <ChevronRight size={18} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }
                <AnimatePresence>
                    {showAddModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(15px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                            padding: '20px'
                        }}>
                            <motion.div
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                style={{
                                    maxWidth: '800px',
                                    width: '100%',
                                    background: '#0B1121',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '32px',
                                    padding: '40px',
                                    maxHeight: '90vh',
                                    overflowY: 'auto',
                                    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.6)',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #fbbf24, #0ea5e9)', backgroundSize: '300% 100%', animation: 'gradientFlow 5s linear infinite' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9', boxShadow: '0 0 10px #0ea5e9' }}></div>
                                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '2px' }}>Personnel Protocol</span>
                                        </div>
                                        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '950', margin: 0, letterSpacing: '-1px' }}>
                                            {isEditing ? 'UPDATE IDENTITY' : 'ASSET ONBOARDING'}
                                        </h2>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e' }}
                                        onClick={() => setShowAddModal(false)}
                                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }}
                                    >
                                        <X size={20} />
                                    </motion.button>
                                </div>

                                <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                                    {/* Grid Layout for Form Sections */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

                                        {/* Left Column: Core & Security */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                            <div>
                                                <h4 style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ width: '20px', height: '1px', background: 'currentColor' }}></span> 01. CORE PROFILE
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">FULL LEGAL NAME</label>
                                                        <input required type="text" className="premium-compact-input" placeholder="Enter personnel name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                                    </div>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">STAFF CLASSIFICATION</label>
                                                        <select className="premium-compact-input" value={formData.staffType} onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}>
                                                            <option value="Company">Corporate (Mon-Sat)</option>
                                                            <option value="Hotel">Operational (7 Days)</option>
                                                        </select>
                                                    </div>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">OFFICIAL DESIGNATION</label>
                                                        <input type="text" className="premium-compact-input" placeholder="e.g. Field Specialist" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ width: '20px', height: '1px', background: 'currentColor' }}></span> 02. ACCESS CREDENTIALS
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                        <div className="premium-input-group">
                                                            <label className="premium-label">USERNAME</label>
                                                            <input required type="text" className="premium-compact-input" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                                                        </div>
                                                        <div className="premium-input-group">
                                                            <label className="premium-label">PASSWORD</label>
                                                            <input required type="password" underline="none" className="premium-compact-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">MOBILE TELEMETRY (+91)</label>
                                                        <input required type="number" className="premium-compact-input" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Financial & Geofencing */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                            <div>
                                                <h4 style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ width: '20px', height: '1px', background: 'currentColor' }}></span> 03. FINANCIALS
                                                </h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">BASE SALARY</label>
                                                        <input required type="number" className="premium-compact-input" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
                                                    </div>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">JOINING DATE</label>
                                                        <input required type="date" className="premium-compact-input" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{
                                                background: 'rgba(255, 255, 255, 0.02)',
                                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                                borderRadius: '24px',
                                                padding: '24px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '20px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <Clock size={16} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.5))' }} />
                                                    <h4 style={{ color: 'white', fontSize: '13px', fontWeight: '900', margin: 0, letterSpacing: '0.5px' }}>SHIFT PROTOCOL</h4>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>START TIME</label>
                                                        <input type="time" className="premium-compact-input" style={{ height: '48px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }} value={formData.shiftTiming.start} onChange={(e) => setFormData({ ...formData, shiftTiming: { ...formData.shiftTiming, start: e.target.value } })} />
                                                    </div>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>END TIME</label>
                                                        <input type="time" className="premium-compact-input" style={{ height: '48px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }} value={formData.shiftTiming.end} onChange={(e) => setFormData({ ...formData, shiftTiming: { ...formData.shiftTiming, end: e.target.value } })} />
                                                    </div>
                                                </div>
                                            </div>                                        </div>
                                    </div>

                                    <div style={{ marginTop: '20px' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            style={{
                                                width: '100%',
                                                height: '64px',
                                                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '20px',
                                                fontSize: '16px',
                                                fontWeight: '950',
                                                cursor: 'pointer',
                                                boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.4)',
                                                letterSpacing: '1px'
                                            }}
                                        >
                                            {isEditing ? 'COMMIT OPERATIONAL UPDATES' : 'FINALIZE PERSONNEL ONBOARDING'}
                                        </motion.button>
                                    </div>
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
                                    maxWidth: '1000px', width: '100%', maxHeight: '90vh',
                                    background: '#080c14', borderRadius: '40px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    overflow: 'hidden', position: 'relative',
                                    display: 'flex', flexDirection: 'column',
                                    boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)'
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
                                >
                                    <X size={20} />
                                </button>
                                {/* Left Side: Summary & Receipt (35%) | Right Side: Date-wise Calendar (65%) */}
                                <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', height: '100%', overflow: 'hidden', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }}></div>
                                    <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }}></div>

                                    {/* Sidebar: Financials */}
                                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(20px)', zIndex: 2 }}>
                                        <div style={{ padding: '40px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), transparent)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: '950', color: '#fbbf24', boxShadow: '0 10px 20px rgba(251, 191, 36, 0.1)' }}>
                                                    {selectedStaffReport.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '22px', fontWeight: '950', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>{selectedStaffReport.name}</h3>
                                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedStaffReport.designation || 'Specialist'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            margin: '30px',
                                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.02))',
                                            borderRadius: '28px',
                                            border: '1px solid rgba(251, 191, 36, 0.3)',
                                            padding: '35px 20px',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            boxShadow: '0 20px 40px -15px rgba(251, 191, 36, 0.2)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 50%)', opacity: 0.5 }}></div>
                                            <p style={{ margin: 0, fontSize: '11px', fontWeight: '950', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '3px', opacity: 0.8 }}>NET PAYABLE LIMIT</p>
                                            <h1 style={{ margin: '12px 0 0 0', fontSize: '56px', fontWeight: '1000', color: 'white', letterSpacing: '-2.5px', textShadow: '0 0 40px rgba(251, 191, 36, 0.6)', position: 'relative' }}>
                                                <span style={{ fontSize: '20px', verticalAlign: 'top', color: '#fbbf24', marginRight: '4px', fontWeight: '900' }}>Rs.</span>
                                                {(selectedStaffReport.finalSalary || 0).toLocaleString()}
                                            </h1>
                                        </div>

                                        <div style={{ padding: '0 30px 30px 30px', flex: 1, overflowY: 'auto' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <motion.div
                                                    whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.04)' }}
                                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', transition: '0.2s' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}></div>
                                                        <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '800' }}>Base Salary</span>
                                                    </div>
                                                    <span style={{ fontWeight: '950', color: 'white' }}>Rs. {(selectedStaffReport.salary || 0).toLocaleString()}</span>
                                                </motion.div>

                                                <motion.div
                                                    whileHover={{ scale: 1.02, background: 'rgba(16, 185, 129, 0.08)' }}
                                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '16px', transition: '0.2s' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}></div>
                                                        <span style={{ color: '#10b981', fontWeight: '800' }}>Active Presence</span>
                                                    </div>
                                                    <span style={{ fontWeight: '950', color: '#10b981' }}>{selectedStaffReport.presentDays} <small style={{ fontSize: '10px' }}>DAYS</small></span>
                                                </motion.div>

                                                <motion.div
                                                    whileHover={{ scale: 1.02, background: 'rgba(244, 63, 94, 0.08)' }}
                                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center', background: 'rgba(244, 63, 94, 0.05)', padding: '16px', borderRadius: '16px', transition: '0.2s' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px rgba(244,63,94,0.5)' }}></div>
                                                        <span style={{ color: '#f43f5e', fontWeight: '800' }}>Deductions</span>
                                                    </div>
                                                    <span style={{ fontWeight: '950', color: '#f43f5e' }}>- Rs. {(selectedStaffReport.deduction || 0).toLocaleString()}</span>
                                                </motion.div>

                                                <motion.div
                                                    whileHover={{ scale: 1.02, background: 'rgba(99, 102, 241, 0.08)' }}
                                                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center', background: 'rgba(99, 102, 241, 0.05)', padding: '16px', borderRadius: '16px', transition: '0.2s' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px rgba(99,102,241,0.5)' }}></div>
                                                        <span style={{ color: '#6366f1', fontWeight: '800' }}>Incentive Bonus</span>
                                                    </div>
                                                    <span style={{ fontWeight: '950', color: '#6366f1' }}>+ Rs. {(selectedStaffReport.sundayBonus || 0).toLocaleString()}</span>
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content: Date-wise Attendance */}
                                    <div style={{ padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '40px', zIndex: 2 }}>

                                        {/* Attendance Visual Insights */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>Attendance Telemetry</h4>
                                                <div style={{ display: 'flex', gap: '20px', fontSize: '11px', fontWeight: '900', marginRight: '40px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#22c55e' }}>
                                                        <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}></div> PRESENT
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444' }}>
                                                        <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }}></div> ABSENT
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                                                {/* Cycle Day Cells */}
                                                {(selectedStaffReport.attendanceData || []).map((attendanceRecord, idx) => {
                                                    const isPresent = attendanceRecord.status === 'present';
                                                    const isHalfDay = attendanceRecord.status === 'half-day';
                                                    const isAbsent = attendanceRecord.status === 'absent';
                                                    const isUpcoming = attendanceRecord.status === 'upcoming';
                                                    const isSunday = attendanceRecord.isSunday;

                                                    return (
                                                        <motion.div
                                                            key={attendanceRecord.date}
                                                            whileHover={{ scale: 1.05, y: -2 }}
                                                            style={{
                                                                aspectRatio: '1',
                                                                background: isPresent ? 'rgba(16, 185, 129, 0.15)' :
                                                                    isHalfDay ? 'rgba(14, 165, 233, 0.15)' :
                                                                        isAbsent ? 'rgba(244, 63, 94, 0.15)' :
                                                                            'rgba(255,255,255,0.03)',
                                                                border: `1px solid ${isPresent ? 'rgba(16, 185, 129, 0.4)' :
                                                                    isHalfDay ? 'rgba(14, 165, 233, 0.4)' :
                                                                        isAbsent ? 'rgba(244, 63, 94, 0.4)' :
                                                                            'rgba(255,255,255,0.08)'}`,
                                                                borderRadius: '14px',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                opacity: isUpcoming ? 0.3 : 1,
                                                                position: 'relative',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            {isSunday && <div style={{ position: 'absolute', top: '2px', right: '2px', width: '4px', height: '4px', background: '#fbbf24', borderRadius: '50%' }}></div>}
                                                            <span style={{
                                                                fontSize: '12px',
                                                                fontWeight: '1000',
                                                                color: isPresent ? '#10b981' : isHalfDay ? '#0ea5e9' : isAbsent ? '#f43f5e' : 'rgba(255,255,255,0.3)'
                                                            }}>{attendanceRecord.day}</span>

                                                            {isPresent ? (
                                                                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 12px #10b981' }}></div>
                                                            ) : isHalfDay ? (
                                                                <div style={{ width: '8px', height: '8px', background: '#0ea5e9', borderRadius: '50%', boxShadow: '0 0 12px #0ea5e9' }}></div>
                                                            ) : isAbsent ? (
                                                                <div style={{ width: '8px', height: '8px', background: '#f43f5e', borderRadius: '50%', boxShadow: '0 0 12px #f43f5e' }}></div>
                                                            ) : null}
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Performance Intelligence HUD */}
                                        <div style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '28px',
                                            padding: '25px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '30px'
                                        }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '950', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>FISCAL PROGRESS</span>
                                                    <span style={{ fontSize: '11px', fontWeight: '950', color: '#fbbf24' }}>{Math.round((selectedStaffReport.finalSalary / (selectedStaffReport.salary || 1)) * 100)}%</span>
                                                </div>
                                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (selectedStaffReport.finalSalary / (selectedStaffReport.salary || 1)) * 100)}%` }}
                                                        style={{ height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)' }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '950', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>ACCURACY INDEX</span>
                                                    <span style={{ fontSize: '11px', fontWeight: '950', color: '#10b981' }}>{Math.round((selectedStaffReport.presentDays / (selectedStaffReport.workingDaysPassed || 1)) * 100) || 0}%</span>
                                                </div>
                                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (selectedStaffReport.presentDays / (selectedStaffReport.workingDaysPassed || 1)) * 100)}%` }}
                                                        style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Daily Log Table */}
                                        <div>
                                            <h4 style={{ margin: '0 0 25px 0', fontSize: '16px', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>Signal Integrity Stream</h4>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)', textAlign: 'left' }}>
                                                            <th style={{ padding: '22px 25px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '950', letterSpacing: '1.5px' }}>TEMPORAL INDEX</th>
                                                            <th style={{ padding: '22px 25px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '950', letterSpacing: '1.5px' }}>VISUAL AUTH</th>
                                                            <th style={{ padding: '22px 25px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '950', letterSpacing: '1.5px' }}>SYSTEM STATE</th>
                                                            <th style={{ padding: '22px 25px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '950', letterSpacing: '1.5px' }}>SEQUENCE</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(selectedStaffReport.attendanceData || []).sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                                                            <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                                <td style={{ padding: '15px 20px' }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>{new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>{new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                                                                </td>
                                                                <td style={{ padding: '15px 20px' }}>
                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                        {log.punchIn?.photo ? (
                                                                            <div onClick={() => setSelectedPhoto(log.punchIn.photo)} style={{ cursor: 'pointer' }}>
                                                                                <img src={log.punchIn.photo} style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="In" />
                                                                            </div>
                                                                        ) : <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}><Camera size={18} style={{ opacity: 0.4 }} /></div>}
                                                                        {log.punchOut?.photo && (
                                                                            <div onClick={() => setSelectedPhoto(log.punchOut.photo)} style={{ cursor: 'pointer' }}>
                                                                                <img src={log.punchOut.photo} style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="Out" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding: '15px 20px' }}>
                                                                    <span style={{ fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', background: log.status === 'present' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: log.status === 'present' ? '#22c55e' : '#ef4444' }}>{log.status.toUpperCase()}</span>
                                                                </td>
                                                                <td style={{ padding: '15px 20px' }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#10b981' }}>{log.punchIn?.time ? new Date(log.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</div>
                                                                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#f43f5e' }}>{log.punchOut?.time ? new Date(log.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</div>
                                                                </td>
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

                    {showBackdateModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(15px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200,
                            padding: '20px'
                        }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                style={{
                                    maxWidth: '500px',
                                    width: '100%',
                                    background: '#0B1121',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '32px',
                                    padding: '40px',
                                    boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.6)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #6366f1, #0ea5e9)' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px #6366f1' }}></div>
                                            <span style={{ fontSize: '10px', fontWeight: '900', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Override System</span>
                                        </div>
                                        <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '950', margin: 0, letterSpacing: '-0.5px' }}>PERSONNEL OVERRIDE</h2>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.05)' }}
                                        onClick={() => setShowBackdateModal(false)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: "center" }}
                                    >
                                        <X size={20} />
                                    </motion.button>
                                </div>

                                <form onSubmit={handleBackdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                    <div className="premium-input-group">
                                        <label className="premium-label">TARGET PERSONNEL</label>
                                        <select
                                            required
                                            className="premium-compact-input"
                                            value={backdateForm.staffId}
                                            onChange={(e) => setBackdateForm({ ...backdateForm, staffId: e.target.value })}
                                            style={{ background: 'rgba(255,255,255,0.03)' }}
                                        >
                                            <option value="">Operational Unit Select...</option>
                                            {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label">LOG DATE</label>
                                            <input
                                                type="date" required className="premium-compact-input"
                                                value={backdateForm.date} onChange={(e) => setBackdateForm({ ...backdateForm, date: e.target.value })}
                                            />
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label">STATION STATUS</label>
                                            <select
                                                required className="premium-compact-input"
                                                value={backdateForm.status} onChange={(e) => setBackdateForm({ ...backdateForm, status: e.target.value })}
                                            >
                                                <option value="present">Present (Full)</option>
                                                <option value="half-day">Half-Day</option>
                                                <option value="absent">Absent</option>
                                            </select>
                                        </div>
                                    </div>

                                    {backdateForm.status !== 'absent' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div className="premium-input-group">
                                                <label className="premium-label">PUNCH START</label>
                                                <input type="time" className="premium-compact-input" value={backdateForm.punchInTime} onChange={(e) => setBackdateForm({ ...backdateForm, punchInTime: e.target.value })} />
                                            </div>
                                            <div className="premium-input-group">
                                                <label className="premium-label">PUNCH TERMINATE</label>
                                                <input type="time" className="premium-compact-input" value={backdateForm.punchOutTime} onChange={(e) => setBackdateForm({ ...backdateForm, punchOutTime: e.target.value })} />
                                            </div>
                                        </div>
                                    )}

                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        style={{
                                            width: '100%',
                                            height: '56px',
                                            background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '16px',
                                            fontSize: '15px',
                                            fontWeight: '950',
                                            cursor: 'pointer',
                                            marginTop: '10px',
                                            boxShadow: '0 15px 30px -10px rgba(99, 102, 241, 0.4)',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        EXECUTE OVERRIDE
                                    </motion.button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Staff;
