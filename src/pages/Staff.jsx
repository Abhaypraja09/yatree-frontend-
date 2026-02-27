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
    LayoutDashboard,
    ShieldCheck,
    DollarSign
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
        officeLocation: { latitude: '', longitude: '', address: '', radius: 200 },
        joiningDate: new Date().toISOString().split('T')[0]
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
            if (isEditing) {
                await axios.put(`/api/admin/staff/${editingStaffId}`, {
                    ...formData,
                    companyId: selectedCompany._id
                });
                alert('Staff updated successfully');
            } else {
                await axios.post('/api/admin/staff', {
                    ...formData,
                    companyId: selectedCompany._id
                });
            }
            setShowAddModal(false);
            setIsEditing(false);
            setEditingStaffId(null);
            fetchStaff();
            setFormData({
                name: '', mobile: '', username: '', password: '', salary: 0, monthlyLeaveAllowance: 4,
                email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
                officeLocation: { latitude: '', longitude: '', address: '', radius: 200 },
                joiningDate: new Date().toISOString().split('T')[0]
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
            password: '', // Don't show hashed password
            salary: staff.salary || 0,
            monthlyLeaveAllowance: staff.monthlyLeaveAllowance || 4,
            email: staff.email || '',
            designation: staff.designation || '',
            shiftTiming: staff.shiftTiming || { start: '09:00', end: '18:00' },
            officeLocation: staff.officeLocation || { latitude: '', longitude: '', address: '', radius: 200 },
            joiningDate: staff.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setEditingStaffId(staff._id);
        setIsEditing(true);
        setShowAddModal(true);
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

    return (
        <div style={{ minHeight: '100vh', background: '#020617', padding: '30px', color: 'white', position: 'relative' }}>
            <SEO title="Staff Ecosystem" />

            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '30%', height: '30%', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>

            {/* Header Section */}
            <header style={{ marginBottom: '40px', position: 'relative', zIndex: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{
                            width: '70px',
                            height: '70px',
                            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                            borderRadius: '24px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 15px 35px rgba(14, 165, 233, 0.4)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <Users size={32} color="white" />
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(rgba(255,255,255,0.2), transparent)', pointerEvents: 'none' }}></div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                                <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>Operational Control</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: '38px', fontWeight: '950', margin: '4px 0', letterSpacing: '-1.5px' }}>Staff Ecosystem</h1>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 20px 30px -10px rgba(99, 102, 241, 0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setFormData({
                                    name: '', mobile: '', username: '', password: '', salary: 0, monthlyLeaveAllowance: 4,
                                    email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
                                    officeLocation: { latitude: '', longitude: '', address: '', radius: 200 },
                                    joiningDate: new Date().toISOString().split('T')[0]
                                });
                                setIsEditing(false);
                                setEditingStaffId(null);
                                setShowAddModal(true);
                            }}
                            style={{ padding: '0 30px', height: '56px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                        >
                            <UserPlus size={20} /> ONBOARD STAFF
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowBackdateModal(true)}
                            style={{ padding: '0 25px', height: '56px', background: 'rgba(30, 41, 59, 0.6)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '18px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(10px)' }}
                        >
                            <Clock size={20} /> RECORD ATTENDANCE
                        </motion.button>
                    </div>
                </div>

                {/* Statistics Dashboard */}
                {view !== 'summary' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '40px' }}>
                        {[
                            { label: 'Total Workforce', value: staffList.length, sub: 'Active Personnel', icon: Users, color: '#0ea5e9' },
                            { label: 'Present Today', value: attendanceList.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'present').length, sub: 'Officers on Duty', icon: ShieldCheck, color: '#10b981' },
                            { label: 'Pending Leaves', value: pendingLeaves.length, sub: 'Action Required', icon: FileText, color: '#f43f5e', alert: pendingLeaves.length > 0 },
                            { label: 'Monthly Accrual', value: `Rs. ${staffList.reduce((acc, s) => acc + (s.currentCycle?.earnedSalary || 0), 0).toLocaleString()}`, sub: 'Calculated Liability', icon: IndianRupee, color: '#fbbf24' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -stat.alert ? 10 : -3 }}
                                style={{
                                    background: 'rgba(15, 23, 42, 0.4)',
                                    border: `1px solid ${stat.alert ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                                    borderRadius: '28px',
                                    padding: '24px',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: stat.alert ? '0 10px 30px rgba(244, 63, 94, 0.1)' : 'none'
                                }}
                            >
                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '80px', height: '80px', background: `radial-gradient(circle, ${stat.color}15 0%, transparent 70%)` }}></div>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{stat.label}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                                    <div>
                                        <h2 style={{ margin: 0, color: 'white', fontSize: '28px', fontWeight: '950', letterSpacing: '-1px' }}>{stat.value}</h2>
                                        <p style={{ margin: '4px 0 0 0', color: stat.color, fontSize: '12px', fontWeight: '800' }}>{stat.sub}</p>
                                    </div>
                                    <div style={{ background: `${stat.color}15`, padding: '10px', borderRadius: '12px', color: stat.color }}>
                                        <stat.icon size={24} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </header>

            {/* Navigation & Search Control Center */}
            <div style={{
                background: 'rgba(15, 23, 42, 0.3)',
                padding: '12px',
                borderRadius: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '40px',
                border: '1px solid rgba(255,255,255,0.05)',
                backdropFilter: 'blur(30px)',
                position: 'sticky',
                top: '20px',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { id: 'list', label: 'WORKFORCE', icon: Users },
                        { id: 'attendance', label: 'LOGS', icon: Clock },
                        { id: 'leaves', label: 'LEAVES', icon: Calendar },
                        { id: 'summary', label: 'FINANCE', icon: IndianRupee }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setView(t.id)}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '16px',
                                border: 'none',
                                background: view === t.id ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'transparent',
                                color: view === t.id ? 'white' : 'rgba(255,255,255,0.4)',
                                fontWeight: '900',
                                fontSize: '11px',
                                cursor: 'pointer',
                                transition: '0.3s',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <t.icon size={14} />
                            {t.label}
                            {t.id === 'leaves' && pendingLeaves.length > 0 &&
                                <span style={{ background: '#f43f5e', padding: '2px 6px', borderRadius: '8px', fontSize: '9px', color: 'white' }}>{pendingLeaves.length}</span>
                            }
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'flex-end', maxWidth: '600px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            type="text"
                            placeholder="Search by Identity or Mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', height: '48px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '0 45px', color: 'white', fontSize: '13px', fontWeight: '600' }}
                        />
                        <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                    </div>

                    <div style={{ height: '48px', padding: '0 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Filter size={14} color="rgba(255,255,255,0.4)" />
                        {view === 'attendance' ? (
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ background: 'none', border: 'none', color: 'white', fontSize: '12px', fontWeight: '900', outline: 'none', colorScheme: 'dark' }}
                            />
                        ) : view === 'summary' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', fontWeight: '900', outline: 'none' }}>
                                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={(i + 1).toString()}>{new Date(2000, i).toLocaleString('default', { month: 'short' }).toUpperCase()}</option>)}
                                </select>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', fontWeight: '900', outline: 'none' }}>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                </select>
                            </div>
                        ) : (
                            <span style={{ fontSize: '12px', fontWeight: '900', color: 'rgba(255,255,255,0.4)' }}>FILTER INACTIVE</span>
                        )}
                    </div>
                </div>
            </div>

            {view === 'list' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '25px' }}>
                    {filteredStaff.map((staff, idx) => (
                        <motion.div
                            key={staff._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ y: -8 }}
                            style={{
                                background: 'rgba(30, 41, 59, 0.4)',
                                borderRadius: '32px',
                                padding: '30px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                position: 'relative',
                                overflow: 'hidden',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

                            {/* Card Top: Identity */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '22px',
                                        background: staff.status === 'blocked' ? 'rgba(244, 63, 94, 0.1)' : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontSize: '26px', fontWeight: '950', color: 'white',
                                        boxShadow: staff.status === 'blocked' ? 'none' : '0 10px 20px rgba(14, 165, 233, 0.2)'
                                    }}>
                                        {(staff.name || '?').charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '950', letterSpacing: '-0.8px', color: 'white' }}>{staff.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981' }}>{staff.designation || 'Specialist'}</span>
                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)' }}>ID: {staff.username}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    background: staff.status === 'blocked' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    padding: '4px 12px', borderRadius: '10px',
                                    fontSize: '10px', fontWeight: '900', color: staff.status === 'blocked' ? '#f43f5e' : '#10b981',
                                    textTransform: 'uppercase', letterSpacing: '1px'
                                }}>
                                    {staff.status === 'blocked' ? 'Blocked' : 'Active'}
                                </div>
                            </div>

                            {/* Card Middle: Financials */}
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.2)',
                                borderRadius: '24px',
                                padding: '20px',
                                marginBottom: '25px',
                                border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Cycle Earnings</p>
                                        <h2 style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: '950', color: '#fbbf24', letterSpacing: '-1px' }}>₹{staff.currentCycle?.earnedSalary?.toLocaleString() || '0'}</h2>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Presence</p>
                                        <div style={{ marginTop: '4px', fontSize: '18px', fontWeight: '950', color: 'white' }}>{staff.currentCycle?.presentDays || 0} <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>DAYS</span></div>
                                    </div>
                                </div>
                                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(((staff.currentCycle?.presentDays || 0) / 30) * 100, 100)}%` }}
                                        style={{ height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #6366f1)', borderRadius: '10px' }}
                                    ></motion.div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.3)' }}>
                                    <span>{staff.currentCycle?.startDate || '—'}</span>
                                    <span>{staff.currentCycle?.endDate || '—'}</span>
                                </div>
                            </div>

                            {/* Card Bottom: Details & Actions */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '25px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Contact</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '800', color: 'white' }}>{staff.mobile}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <p style={{ margin: 0, fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Monthly Base</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '800', color: 'white' }}>₹{(staff.salary || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => toggleStaffStatus(staff)}
                                    style={{
                                        flex: 4, height: '48px', borderRadius: '14px',
                                        background: staff.status === 'blocked' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.05)',
                                        color: staff.status === 'blocked' ? '#10b981' : '#f43f5e',
                                        border: '1px solid currentColor',
                                        fontSize: '11px', fontWeight: '900', cursor: 'pointer',
                                        textTransform: 'uppercase', letterSpacing: '1px'
                                    }}
                                >
                                    {staff.status === 'blocked' ? 'RESTORE ACCESS' : 'RESTRICT LOGINS'}
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => handleEditStaff(staff)}
                                    style={{ flex: 1, height: '48px', borderRadius: '14px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid #0ea5e9', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                >
                                    <Settings size={18} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => handleDeleteStaff(staff._id)}
                                    style={{ flex: 1, height: '48px', borderRadius: '14px', background: 'rgba(244, 63, 94, 0.05)', color: '#f43f5e', border: '1px solid #f43f5e', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                                >
                                    <Trash2 size={18} />
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            {view === 'attendance' && (
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
            )}

            {view === 'leaves' && (
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
            )}
            {view === 'summary' && (
                <div style={{ marginTop: '10px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
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
                                    <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.8px' }}>
                                        {isEditing ? 'Update Profile' : 'Asset Onboarding'}
                                    </h2>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: '4px 0 0 0', fontSize: '13px', fontWeight: '600' }}>
                                        {isEditing ? 'Modifying existing personnel records.' : 'Register new personnel to the ecosystem.'}
                                    </p>
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
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>JOINING DATE</label>
                                            <input
                                                type="date" required className="input-field"
                                                style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                                value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
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
                                    {isEditing ? 'COMMIT UPDATES' : 'INITIALIZE ONBOARDING'}
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
                                onMouseEnter={(e) => e.target.style.background = 'rgba(244, 63, 94, 0.4)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
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
                                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), transparent)',
                                        borderRadius: '24px',
                                        border: '1px solid rgba(251, 191, 36, 0.2)',
                                        padding: '30px',
                                        textAlign: 'center',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '2px' }}>Net Payable Limit</p>
                                        <h1 style={{ margin: '10px 0 0 0', fontSize: '50px', fontWeight: '950', color: 'white', letterSpacing: '-2px', textShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}><span style={{ fontSize: '24px', verticalAlign: 'top', color: '#fbbf24', marginRight: '6px' }}>Rs.</span>{selectedStaffReport.finalSalary.toLocaleString()}</h1>
                                    </div>

                                    <div style={{ padding: '0 30px 30px 30px', flex: 1, overflowY: 'auto' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.4)' }}></div>
                                                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '800' }}>Base Salary</span>
                                                </div>
                                                <span style={{ fontWeight: '950', color: 'white' }}>Rs. {(selectedStaffReport.salary || 0).toLocaleString()}</span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}></div>
                                                    <span style={{ color: '#10b981', fontWeight: '800' }}>Active Presence</span>
                                                </div>
                                                <span style={{ fontWeight: '950', color: '#10b981' }}>{selectedStaffReport.presentDays} <small style={{ fontSize: '10px' }}>DAYS</small></span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center', background: 'rgba(244, 63, 94, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 10px rgba(244,63,94,0.5)' }}></div>
                                                    <span style={{ color: '#f43f5e', fontWeight: '800' }}>Deductions</span>
                                                </div>
                                                <span style={{ fontWeight: '950', color: '#f43f5e' }}>- Rs. {selectedStaffReport.deduction.toLocaleString()}</span>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center', background: 'rgba(99, 102, 241, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px rgba(99,102,241,0.5)' }}></div>
                                                    <span style={{ color: '#6366f1', fontWeight: '800' }}>Incentive Bonus</span>
                                                </div>
                                                <span style={{ fontWeight: '950', color: '#6366f1' }}>+ Rs. {(selectedStaffReport.sundayBonus || 0).toLocaleString()}</span>
                                            </div>
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

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                                            {/* Cycle Day Cells */}
                                            {(selectedStaffReport.attendanceData || []).sort((a, b) => a.date.localeCompare(b.date)).map((attendanceRecord, idx) => {
                                                const dateObj = new Date(attendanceRecord.date);
                                                const isPresent = attendanceRecord.status === 'present';
                                                const isAbsent = attendanceRecord.status === 'absent';
                                                const isSunday = dateObj.getDay() === 0;

                                                return (
                                                    <motion.div
                                                        key={attendanceRecord.date}
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
                                                        }}>{dateObj.getDate()}</span>

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
                                        <h4 style={{ margin: '0 0 25px 0', fontSize: '16px', fontWeight: '950', color: 'white', letterSpacing: '-0.5px' }}>Daily Activity Sequences</h4>
                                        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left' }}>
                                                        <th style={{ padding: '20px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px' }}>TIMESTAMP</th>
                                                        <th style={{ padding: '20px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px' }}>VISUAL VERIFICATION</th>
                                                        <th style={{ padding: '20px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px' }}>SYSTEM STATUS</th>
                                                        <th style={{ padding: '20px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px' }}>PUNCH SEQUENCE</th>
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
                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                    {log.punchIn?.photo ? (
                                                                        <img src={log.punchIn.photo} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="In" />
                                                                    ) : <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Camera size={12} style={{ opacity: 0.2 }} /></div>}
                                                                    {log.punchOut?.photo && (
                                                                        <img src={log.punchOut.photo} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="Out" />
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
                        background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(10px)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200,
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                                maxWidth: '500px',
                                width: '100%',
                                background: '#1c2235',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '32px',
                                padding: '40px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: 0 }}>Add Backdated Entry</h2>
                                <button onClick={() => setShowBackdateModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleBackdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>SELECT STAFF</label>
                                    <select
                                        required className="input-field"
                                        style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                        value={backdateForm.staffId} onChange={(e) => setBackdateForm({ ...backdateForm, staffId: e.target.value })}
                                    >
                                        <option value="">Choose Staff Member</option>
                                        {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>ENTRY DATE</label>
                                    <input
                                        type="date" required className="input-field"
                                        style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                        value={backdateForm.date} onChange={(e) => setBackdateForm({ ...backdateForm, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>ATTENDANCE STATUS</label>
                                    <select
                                        required className="input-field"
                                        style={{ height: '56px', width: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0 20px' }}
                                        value={backdateForm.status} onChange={(e) => setBackdateForm({ ...backdateForm, status: e.target.value })}
                                    >
                                        <option value="present">Present (Full Day)</option>
                                        <option value="half-day">Half-Day</option>
                                        <option value="absent">Absent</option>
                                    </select>
                                </div>
                                {backdateForm.status !== 'absent' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>PUNCH IN</label>
                                            <input type="time" className="input-field" style={{ height: '56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white' }} value={backdateForm.punchInTime} onChange={(e) => setBackdateForm({ ...backdateForm, punchInTime: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', display: 'block' }}>PUNCH OUT</label>
                                            <input type="time" className="input-field" style={{ height: '56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white' }} value={backdateForm.punchOutTime} onChange={(e) => setBackdateForm({ ...backdateForm, punchOutTime: e.target.value })} />
                                        </div>
                                    </div>
                                )}
                                <button type="submit" style={{ width: '100%', height: '56px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', marginTop: '10px' }}>
                                    SAVE ENTRY
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Staff;
