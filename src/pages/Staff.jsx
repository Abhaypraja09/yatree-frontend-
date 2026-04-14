import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useTheme } from '../context/ThemeContext';
import {
    Users, Plus, Search, Clock, MapPin, User, MoreVertical, IndianRupee, Calendar, Download, X,
    ChevronLeft, ChevronRight, UserPlus, Eye, Trash2, Filter, ArrowUpRight, ArrowDownLeft,
    ShieldCheck, Lock, Unlock, Settings, LayoutDashboard, AlertCircle, CheckCircle, Info,
    Camera, Printer, FileText, Phone, Edit2, TrendingUp, History, CheckCircle2, XCircle, Target,
    CalendarX, Plane, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import OfficeGeofencePicker from '../components/OfficeGeofencePicker';
import { todayIST, toISTDateString, formatDateIST, formatTimeIST, nowIST } from '../utils/istUtils';

const Staff = () => {
    const { theme } = useTheme();
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes profilePulse {
                0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
            .premium-compact-input:focus {
                border-color: rgba(99, 102, 241, 0.5) !important;
                box-shadow: 0 0 20px rgba(99, 102, 241, 0.2) !important;
                background: rgba(255,255,255,0.08) !important;
            }
            .glass-panel {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            .staff-card-hover:hover {
                transform: translateY(-8px) scale(1.01);
                border-color: rgba(59, 130, 246, 0.4) !important;
                box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5) !important;
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.6) 100%) !important;
            }
            input[type="date"]::-webkit-calendar-picker-indicator {
                filter: invert(1);
                opacity: 0.5;
                cursor: pointer;
            }
            ::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            ::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.1);
                border-radius: 10px;
            }
            ::-webkit-scrollbar-track {
                background: transparent;
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const { user } = useAuth();
    const { selectedCompany } = useCompany();

    const location = useLocation();
    const [staffList, setStaffList] = useState([]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [view, setView] = useState('list'); // 'list', 'attendance', 'leaves', 'summary'
    const [searchTerm, setSearchTerm] = useState('');
    const [isRange, setIsRange] = useState(false);
    const [fromDate, setFromDate] = useState(todayIST());
    const [toDate, setToDate] = useState(todayIST());
    const [filterStaff, setFilterStaff] = useState('all');

    const [formData, setFormData] = useState({
        name: '', mobile: '', username: '', password: '', confirmPassword: '', oldPassword: '', salary: 0, monthlyLeaveAllowance: 4,
        email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
        officeLocation: { latitude: '', longitude: '', address: '', radius: 200 },
        joiningDate: todayIST(),
        staffType: 'Company'
    });

    const [locationLoading, setLocationLoading] = useState(false);

    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [monthlyReport, setMonthlyReport] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState((nowIST().getUTCMonth() + 1).toString());
    const [selectedYear, setSelectedYear] = useState(nowIST().getUTCFullYear().toString());
    const [selectedStaffReport, setSelectedStaffReport] = useState(null);
    const [showBackdateModal, setShowBackdateModal] = useState(false);
    const [backdateForm, setBackdateForm] = useState({ staffId: '', date: todayIST(), status: 'present', punchInTime: '', punchOutTime: '' });
    const [monthlyTarget, setMonthlyTarget] = useState(26); // Default monthly attendance target
    const [isEditing, setIsEditing] = useState(false);
    const [editingStaffId, setEditingStaffId] = useState(null);

    const handleTargetChange = (val) => {
        const num = Number(val);
        setMonthlyTarget(num);
        if (selectedCompany?._id) localStorage.setItem(`staffTarget_${selectedCompany._id}`, num.toString());
    };

    useEffect(() => {
        if (selectedCompany?._id) {
            const savedTarget = localStorage.getItem(`staffTarget_${selectedCompany._id}`);
            if (savedTarget) setMonthlyTarget(Number(savedTarget));
        }
    }, [selectedCompany]);

    const MIN_BACKDATE_LIMIT = (() => {
        const d = nowIST();
        d.setUTCDate(d.getUTCDate() - 60); // Allow up to 2 months old backdated entries
        return toISTDateString(d);
    })();

    useEffect(() => {
        if (selectedCompany) {
            fetchStaff();
            fetchAttendance();
            fetchPendingLeaves();
            // Pre-load summaries in background for instant modal opens
            fetchMonthlyReport();
        }
    }, [selectedCompany, fromDate, toDate, view, selectedMonth, selectedYear]);

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
            let url = `/api/admin/staff-attendance/${selectedCompany._id}`;
            if (isRange) {
                url += `?from=${fromDate}&to=${toDate}`;
            } else {
                url += `?month=${selectedMonth}&year=${selectedYear}`;
            }
            const { data } = await axios.get(url);
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

    const handleDeleteStaffAttendance = async (id) => {
        if (!window.confirm('Are you sure you want to delete this attendance record?')) return;
        try {
            await axios.delete(`/api/admin/staff-attendance/${id}`);
            fetchAttendance();
            alert('Attendance record deleted');
        } catch (error) {
            alert('Error deleting attendance record');
        }
    };

    // ── AI AGENT SEARCH INTEGRATION ──
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchParam = params.get('search') || params.get('name') || params.get('staff');
        if (searchParam) setSearchTerm(searchParam);
    }, [location.search]);

    useEffect(() => {
        const resetAll = () => {
            setSearchTerm('');
            setShowAddModal(false);
            setShowBackdateModal(false);
            setIsEditing(false);
            const now = nowIST();
            setSelectedMonth((now.getUTCMonth() + 1).toString());
            setSelectedYear(now.getUTCFullYear().toString());
            setFromDate(todayIST());
            setToDate(todayIST());
            setBackdateForm({ staffId: '', date: todayIST(), status: 'present', punchInTime: '', punchOutTime: '' });
            setFormData({
                name: '', mobile: '', username: '', password: '', oldPassword: '', salary: 0, monthlyLeaveAllowance: 4,
                email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
                officeLocation: { latitude: '', longitude: '', address: '', radius: 200 },
                joiningDate: todayIST(),
                staffType: 'Company'
            });
        };

        resetAll();
        return () => resetAll();
    }, [location.pathname, location.key]);

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
            'Punch In Time': record.punchIn?.time ? formatTimeIST(record.punchIn.time) : '—',
            'Punch In Location': record.punchIn?.location?.address || 'N/A',
            'Punch Out Time': record.punchOut?.time ? formatTimeIST(record.punchOut.time) : (record.status === 'absent' ? 'Leave' : 'On Duty'),
            'Punch Out Location': record.punchOut?.location?.address || 'N/A',
            'Status': record.status || 'Present'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Staff Attendance");
        XLSX.writeFile(wb, `Staff_Attendance_${isRange ? `${fromDate}_to_${toDate}` : toDate}.xlsx`);
    };

    const exportPayrollToExcel = () => {
        if (!monthlyReport || monthlyReport.length === 0) {
            alert('No payroll data available to export.');
            return;
        }

        const dataToExport = monthlyReport.map(item => ({
            'Staff Name': item.name,
            'Designation': item.designation || 'Staff',
            'Cycle Start': item.cycleStart,
            'Cycle End': item.cycleEnd,
            'Basic Salary': item.salary,
            'Present Days': item.presentDays,
            'Paid Leaves Used': item.paidLeavesUsed,
            'Sundays Passed': item.sundaysPassed,
            'Sundays Worked': item.sundaysWorked,
            'Extra Leaves (Unpaid)': item.extraLeaves,
            'Deduction': item.deduction,
            'Sunday Bonus': item.sundayBonus,
            'Final Salary': item.finalSalary
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payroll Summary");
        XLSX.writeFile(wb, `Staff_Payroll_${selectedMonth}_${selectedYear}.xlsx`);
    };

    const downloadSalarySlip = (staff) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text("SALARY SLIP", 105, 20, { align: "center" });

        doc.setFontSize(14);
        doc.text(`${selectedCompany?.name || 'Company CRM'}`, 105, 30, { align: "center" });
        doc.line(20, 35, 190, 35);

        // Staff Info
        doc.setFontSize(11);
        doc.setTextColor(60);
        doc.text(`Staff Name: ${staff.name}`, 20, 50);
        doc.text(`Designation: ${staff.designation || 'Staff'}`, 20, 57);
        doc.text(`Month/Year: ${selectedMonth}/${selectedYear}`, 140, 50);
        doc.text(`Date Generated: ${todayIST()}`, 140, 57);

        if (staff.cycleStart && staff.cycleEnd) {
            doc.text(`Salary Cycle: ${staff.cycleStart} to ${staff.cycleEnd}`, 20, 64);
        }

        // Salary Details Table
        const tableBody = [
            ["Monthly Base Salary", `Rs. ${staff.salary || 0}`],
            ["Effective Present Days", `${staff.presentDays || 0} Days`],
            ["Approved Paid Leaves", `${staff.paidLeavesUsed || 0} Days`],
            ["Sunday Holidays (Paid)", `${staff.sundaysPassed || 0} Days`],
            ["Sundays Worked (Bonus)", `${staff.sundaysWorked || 0} Days`],
            ["Unpaid Absences / Extra Leaves", `${staff.extraLeaves || 0} Days`],
            ["Total Deductions", `Rs. ${staff.deduction || 0}`],
            ["Sunday Bonus Payout", `Rs. ${staff.sundayBonus || 0}`],
            ["", ""],
            ["NET PAYABLE AMOUNT", `Rs. ${staff.finalSalary || 0}`]
        ];

        doc.autoTable({
            startY: 75,
            head: [['Earnings & Deductions', 'Amount / Details']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            bodyStyles: { fontSize: 10 },
            columnStyles: {
                1: { halign: 'right', fontStyle: 'bold' }
            },
            didParseCell: function (data) {
                if (data.row.index === 9) {
                    data.cell.styles.fillColor = [241, 191, 36];
                    data.cell.styles.textColor = [0, 0, 0];
                    data.cell.styles.fontSize = 12;
                }
            }
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY + 30;
        doc.setFontSize(10);
        doc.text("Authorized Signatory", 20, finalY);
        doc.line(20, finalY - 5, 60, finalY - 5);

        doc.text("Employee Signature", 140, finalY);
        doc.line(140, finalY - 5, 180, finalY - 5);

        doc.save(`${staff.name}_Salary_Slip_${selectedMonth}_${selectedYear}.pdf`);
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
            const defaultOffice = staffList.find(s => s.officeLocation?.latitude)?.officeLocation || { latitude: '', longitude: '', address: '', radius: 200 };
            setFormData({
                name: '', mobile: '', username: '', password: '', salary: 0, monthlyLeaveAllowance: 4,
                email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
                officeLocation: defaultOffice,
                joiningDate: todayIST(),
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
            officeLocation: staff.officeLocation || { latitude: '', longitude: '', address: '', radius: 200 },
            staffType: staff.staffType || 'Company',
            joiningDate: staff.joiningDate ? toISTDateString(staff.joiningDate) : todayIST()
        });
        setEditingStaffId(staff._id);
        setIsEditing(true);
        setShowAddModal(true);
    };

    // Unified detail view
    const handleStaffClick = async (staff) => {
        // 1. Instant check check from pre-loaded data
        const cached = (monthlyReport || []).find(r => r.staffId === (staff._id || staff.staffId));
        if (cached) {
            setSelectedStaffReport(cached);
            setView('summary');
            return;
        }

        try {
            // 2. Targeted Fetch for speed (Optimized backend will handle staffId)
            const { data } = await axios.get(`/api/admin/staff-attendance/${selectedCompany._id}?month=${selectedMonth}&year=${selectedYear}&staffId=${staff._id}`);
            const report = data.report?.[0] || data.report?.find(r => r.staffId === staff._id);
            if (report) {
                setSelectedStaffReport(report);
                setView('summary');
            } else {
                setSelectedStaffReport({
                    staffId: staff._id,
                    name: staff.name,
                    designation: staff.designation,
                    salary: staff.salary,
                    presentDays: 0,
                    leavesTaken: 0,
                    sundaysWorked: 0,
                    sundaysPassed: 0,
                    finalSalary: 0,
                    attendanceData: []
                });
                setView('summary');
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
        const matchesDate = isRange
            ? (record.date >= fromDate && record.date <= toDate)
            : record.date === toDate;
        const matchesStaff = filterStaff === 'all' || record.staff?._id === filterStaff;
        return matchesDate && matchesStaff;
    });

    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div key={location.key} className="livefeed-root" style={{ padding: 'clamp(15px, 4vw, 40px)', minHeight: '100vh', background: 'radial-gradient(circle at top right, #1e293b, #0f172a)', overflowX: 'hidden', fontFamily: "'Outfit', sans-serif" }}>
            <style>
                {`
                    @media (max-width: 768px) {
                        /* Legacy helpers */
                        .resp-grid { grid-template-columns: 1fr !important; }
                        .staff-card { grid-template-columns: 1fr !important; gap: 15px !important; }
                        .hide-mobile { display: none !important; }
                        .mobile-column { flex-direction: column !important; }

                        /* Stats grid: 2 columns */
                        .staff-stats-grid {
                            grid-template-columns: repeat(2, 1fr) !important;
                            gap: 14px !important;
                        }
                        .staff-stats-grid > div {
                            padding: 18px !important;
                            border-radius: 22px !important;
                        }
                        .staff-stats-grid > div > div:last-child {
                            padding: 12px 14px !important;
                        }

                        /* Stats value font size */
                        .staff-stats-grid .stat-number {
                            font-size: 28px !important;
                        }

                        /* Header: shrink logo */
                        .staff-header > div:first-child {
                            gap: 12px !important;
                        }
                        .staff-header > div:first-child > div:first-child {
                            width: 44px !important;
                            height: 44px !important;
                            border-radius: 14px !important;
                        }
                        .staff-header > div:first-child > div:first-child svg {
                            width: 22px !important;
                            height: 22px !important;
                        }

                        /* Hide ADD PERSONNEL text, show only icon */
                        .add-personnel-btn span.btn-label {
                            display: none !important;
                        }

                        /* Controls bar stacks vertically */
                        .staff-controls-bar {
                            flex-direction: column !important;
                            align-items: stretch !important;
                            gap: 12px !important;
                        }
                        .staff-controls-bar > * {
                            width: 100% !important;
                            min-width: 0 !important;
                            max-width: 100% !important;
                        }

                        /* Tabs scroll horizontally */
                        .staff-tabs-row {
                            overflow-x: auto !important;
                            -webkit-overflow-scrolling: touch !important;
                            scrollbar-width: none !important;
                        }
                        .staff-tabs-row::-webkit-scrollbar { display: none; }
                        .staff-tabs-row button {
                            white-space: nowrap !important;
                            padding: 8px 14px !important;
                            font-size: 10px !important;
                        }

                        /* Staff list cards */
                        .staff-member-card {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                            gap: 16px !important;
                        }

                        /* Attendance / Payroll detail flex rows */
                        .attendance-row-grid {
                            grid-template-columns: 1fr !important;
                        }

                        /* Modal forms single column */
                        .staff-modal-body .grid-2col {
                            grid-template-columns: 1fr !important;
                        }
                        .staff-add-modal {
                            padding: 20px !important;
                            border-radius: 24px !important;
                        }
                    }

                    @media (max-width: 480px) {
                        .staff-stats-grid {
                            gap: 10px !important;
                        }
                        .staff-stats-grid > div {
                            padding: 14px !important;
                        }
                    }
                `}
            </style>

            <SEO title="Staff Management & Payroll" />

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

            <header style={{ padding: 'clamp(20px, 4vw, 40px) 0' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
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
                            boxShadow: `0 10px 25px ${theme.primary}30`
                        }}>
                            <Users size={32} color={theme.primary} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.primary, boxShadow: `0 0 8px ${theme.primary}` }}></div>
                                <span style={{ fontSize: 'clamp(9px,2.5vw,10px)', fontWeight: '800', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>Human Resources</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: '1000', margin: 0, letterSpacing: '-1.5px', lineHeight: 1 }}>
                                Staff <span className="theme-gradient-text">Management</span>
                            </h1>
                            <p style={{ marginTop: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                                Personnel Tracking: <b style={{ color: 'white' }}>{formatDateIST(todayIST())}</b>
                            </p>
                        </div>
                    </div>

                    <div className="flex-resp" style={{ gap: '12px' }}>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '12px 20px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '130px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Active Staff</span>
                            <span style={{ color: 'white', fontSize: '18px', fontWeight: '900' }}>{staffList.filter(s => s.status !== 'blocked').length}</span>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '12px 20px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', flexDirection: 'column', minWidth: '130px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>On Duty</span>
                            <span style={{ color: 'white', fontSize: '18px', fontWeight: '900' }}>{attendanceList.filter(r => r.date === todayIST()).length}</span>
                        </motion.div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    setIsEditing(false);

                                    // Try to find a default office location from other staff
                                    const defaultOffice = staffList.find(s => s.officeLocation?.latitude)?.officeLocation || { latitude: '', longitude: '', address: '', radius: 200 };

                                    setFormData({
                                        name: '', mobile: '', username: '', password: '', salary: 0, monthlyLeaveAllowance: 4,
                                        email: '', designation: '', shiftTiming: { start: '09:00', end: '18:00' },
                                        officeLocation: defaultOffice,
                                        joiningDate: todayIST(),
                                        staffType: 'Company'
                                    });
                                    setShowAddModal(true);
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', height: '52px', padding: '0 25px',
                                    borderRadius: '14px', fontWeight: '800',
                                    background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary || theme.primary} 100%)`,
                                    color: 'black', border: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                                    boxShadow: `0 8px 15px ${theme.primary}40`, cursor: 'pointer'
                                }}
                            >
                                <Plus size={20} /> <span className="hide-mobile">Add Personnel</span><span className="show-mobile">Add</span>
                            </button>
                            <button
                                onClick={exportToExcel}
                                className="glass-card-hover-effect"
                                style={{
                                    height: '52px',
                                    width: '52px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRadius: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                <Download size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main style={{ padding: '0', maxWidth: '1600px', margin: '0 auto' }}>
                <div className="staff-stats-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '20px',
                    marginBottom: '30px'
                }}>
                    {[
                        { label: 'STAFF STRENGTH', value: staffList.length, icon: Users, color: 'var(--primary)', sub: 'Total Personnel' },
                        { label: "TODAY'S ATTENDANCE", value: attendanceList.filter(r => r.date === todayIST()).length, icon: ShieldCheck, color: '#10b981', sub: 'On Duty' },
                        { label: 'PENDING LEAVES', value: pendingLeaves.length, icon: CalendarX, color: 'var(--primary)', sub: 'Awaiting Review' },
                        {
                            label: 'MONTHLY TARGET',
                            value: attendanceList.filter(r => {
                                const d = nowIST();
                                const monthStr = (d.getUTCMonth() + 1).toString().padStart(2, '0');
                                const yearStr = d.getUTCFullYear().toString();
                                return r.date.startsWith(`${yearStr}-${monthStr}`);
                            }).length,
                            icon: Target,
                            color: 'var(--primary)',
                            sub: `Goal: ${monthlyTarget} days`,
                            isTarget: true
                        }
                    ].map((stat, idx) => (
                        <div key={idx} className="glass-card" style={{
                            padding: '24px',
                            borderRadius: '24px',
                            background: 'rgba(30, 41, 59, 0.4)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {stat.isTarget && (
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, height: '3px', background: 'var(--primary)',
                                    width: `${Math.min((stat.value / (monthlyTarget || 1)) * 100, 100)}%`,
                                    transition: 'width 1s ease-out'
                                }}></div>
                            )}
                            <div>
                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{stat.label}</div>
                                <div style={{ color: 'white', fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>
                                    {stat.value}
                                    {stat.isTarget && <span style={{ fontSize: '14px', opacity: 0.3, marginLeft: '8px' }}>/ {monthlyTarget}</span>}
                                </div>
                                <div style={{ color: stat.color, fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>{stat.sub}</div>
                            </div>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '16px',
                                background: `${stat.color}15`,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                border: `1px solid ${stat.color}20`
                            }}>
                                <stat.icon size={24} color={stat.color} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Control Bar */}
                <div className="staff-controls-bar" style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    padding: '12px',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '25px',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }} className="staff-tabs-row custom-scrollbar">
                        {[
                            { id: 'list', label: 'STAFF LIST', icon: Users },
                            { id: 'attendance', label: 'ATTENDANCE', icon: ShieldCheck },
                            { id: 'leaves', label: 'LEAVE MGMT', icon: Plane }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setView(tab.id)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s',
                                    background: view === tab.id ? theme.primary : 'transparent',
                                    color: view === tab.id ? 'black' : 'rgba(255,255,255,0.4)',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                        <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH BY NAME..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                height: '48px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '14px',
                                padding: '0 15px 0 45px',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: '800',
                                letterSpacing: '0.5px'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '0 15px', border: '1px solid rgba(255,255,255,0.05)', height: '48px' }}>
                        <Target size={14} style={{ color: 'var(--primary)', marginRight: '10px' }} />
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', marginRight: '10px' }}>GOAL:</span>
                        <input
                            type="number"
                            value={monthlyTarget}
                            onChange={e => handleTargetChange(e.target.value)}
                            style={{ width: '40px', background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '900', fontSize: '14px', textAlign: 'center', outline: 'none' }}
                        />
                    </div>

                    {(view === 'summary' || view === 'list' || view === 'attendance') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {view === 'attendance' && (
                                <button
                                    onClick={() => setShowBackdateModal(true)}
                                    style={{
                                        height: '40px', padding: '0 15px', borderRadius: '12px',
                                        background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: '800',
                                        border: '1px solid rgba(99, 102, 241, 0.3)', cursor: 'pointer', fontSize: '11px', textTransform: 'uppercase',
                                        display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <History size={14} /> MANUAL ENTRY
                                </button>
                            )}
                            
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <button
                                    onClick={() => setIsRange(false)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        background: !isRange ? 'var(--primary)' : 'transparent',
                                        color: !isRange ? 'white' : 'rgba(255,255,255,0.4)',
                                        fontSize: '11px', fontWeight: '800', transition: '0.3s'
                                    }}
                                >
                                    MONTHLY
                                </button>
                                <button
                                    onClick={() => setIsRange(true)}
                                    style={{
                                        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        background: isRange ? 'var(--primary)' : 'transparent',
                                        color: isRange ? 'white' : 'rgba(255,255,255,0.4)',
                                        fontSize: '11px', fontWeight: '800', transition: '0.3s'
                                    }}
                                >
                                    RANGE
                                </button>
                            </div>

                            {!isRange ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={() => {
                                            const d = nowIST(toDate);
                                            d.setUTCDate(d.getUTCDate() - 1);
                                            const newDate = d.toISOString().split('T')[0];
                                            setToDate(newDate);
                                            setFromDate(newDate);
                                        }}
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <select
                                        className="premium-compact-input"
                                        style={{ height: '40px', width: '120px', margin: 0, fontSize: '11px' }}
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                    >
                                        <option value="1">January</option><option value="2">February</option><option value="3">March</option><option value="4">April</option><option value="5">May</option><option value="6">June</option><option value="7">July</option><option value="8">August</option><option value="9">September</option><option value="10">October</option><option value="11">November</option><option value="12">December</option>
                                    </select>
                                    <select
                                        className="premium-compact-input"
                                        style={{ height: '40px', width: '90px', margin: 0, fontSize: '11px' }}
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                    >
                                        {Array.from({ length: 5 }, (_, i) => nowIST().getUTCFullYear() - 2 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => {
                                            const d = nowIST(toDate);
                                            d.setUTCDate(d.getUTCDate() + 1);
                                            const newDate = d.toISOString().split('T')[0];
                                            setToDate(newDate);
                                            setFromDate(newDate);
                                        }}
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div
                                        onClick={() => document.getElementById('range-from-picker').showPicker()}
                                        style={{
                                            padding: '0 12px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px',
                                            background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer', position: 'relative'
                                        }}
                                    >
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>FROM:</span>
                                        <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>{formatDateIST(fromDate)}</span>
                                        <input
                                            id="range-from-picker"
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer' }}
                                        />
                                    </div>
                                    <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                                    <div
                                        onClick={() => document.getElementById('range-to-picker').showPicker()}
                                        style={{
                                            padding: '0 12px', height: '40px', display: 'flex', alignItems: 'center', gap: '8px',
                                            background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                            cursor: 'pointer', position: 'relative'
                                        }}
                                    >
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>TO:</span>
                                        <span style={{ color: 'white', fontSize: '12px', fontWeight: '700' }}>{formatDateIST(toDate)}</span>
                                        <input
                                            id="range-to-picker"
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', left: 0, top: 0, cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div style={{ padding: '0 0 50px 0' }}>
                    {view === 'list' && (
                        <div className="livefeed-cards-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '20px'
                        }}>
                            {filteredStaff.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                    <Users size={40} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 15px' }} />
                                    <h3 style={{ color: 'white', fontWeight: '800' }}>No Personnel Found</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Try adjusting your search or filters.</p>
                                </div>
                            ) : filteredStaff.map((staff) => (
                                <motion.div
                                    key={staff._id}
                                    whileHover={{ y: -5, background: 'rgba(255,255,255,0.05)' }}
                                    onClick={() => handleStaffClick(staff)}
                                    style={{
                                        padding: '24px',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '24px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '16px',
                                                background: staff.status === 'blocked' ? '#f43f5e' : 'linear-gradient(135deg, var(--primary), var(--primary))',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                fontSize: '22px',
                                                fontWeight: '900',
                                                color: 'white',
                                                overflow: 'hidden'
                                            }}>
                                                {staff.profilePhoto ? <img src={staff.profilePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : staff.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, color: 'white', fontSize: '17px', fontWeight: '800' }}>{staff.name}</h3>
                                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '600', marginTop: '2px' }}>{staff.designation || 'Staff Member'}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditStaff(staff); }}
                                                style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteStaff(staff._id); }}
                                                style={{ padding: '8px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '600' }}>
                                            <Phone size={14} color="var(--primary)" />
                                            <span>{staff.mobile}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '600' }}>
                                            <Mail size={14} color="var(--primary)" />
                                            <span style={{ fontSize: '12px', opacity: 0.8 }}>{staff.email || 'No Email'}</span>
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '12px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid rgba(255,255,255,0.03)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <IndianRupee size={12} color="#10b981" />
                                            <span style={{ fontSize: '13px', color: 'white', fontWeight: '800' }}>₹{staff.salary?.toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase' }}>Basic Salary</div>
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
                            <div style={{ overflowX: 'auto', padding: '10px' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', color: 'white', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left' }}>
                                            <th style={{ padding: '0 25px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>STAFF MEMBER</th>
                                            <th style={{ padding: '0 25px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>IN / OUT TIMES</th>
                                            <th style={{ padding: '0 25px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>EVIDENCE</th>
                                            <th style={{ padding: '0 25px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>LOCATION</th>
                                            <th style={{ padding: '0 25px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'right' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAttendance.length === 0 ? (
                                            <tr>
                                                <td colSpan="5">
                                                    <div style={{ padding: '100px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                                        <History size={48} color="var(--primary)" style={{ opacity: 0.2, marginBottom: '20px' }} />
                                                        <p style={{ margin: 0, fontWeight: '800', fontSize: '18px', color: 'white' }}>No Attendance found</p>
                                                        <p style={{ margin: '8px 0 0 0', fontWeight: '500', fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>There are no records for this date range.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredAttendance.map(record => (
                                            <motion.tr
                                                key={record._id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)', scale: 1.002 }}
                                                style={{
                                                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.5) 100%)',
                                                    borderRadius: '20px',
                                                    transition: 'all 0.3s ease',
                                                    boxShadow: '0 10px 20px -10px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <td style={{ padding: '20px 25px', borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)', fontWeight: '900', fontSize: '18px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                                            {record.staff?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '900', color: 'white', fontSize: '16px', letterSpacing: '-0.3px' }}>{record.staff?.name || 'Unknown Staff'}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>User: {record.staff?.username || 'SYSTEM'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 25px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        {record.status === 'absent' ? (
                                                            <div style={{ background: 'rgba(251, 191, 36, 0.1)', color: 'var(--primary)', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', letterSpacing: '1px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                                                ON LEAVE / ABSENT
                                                            </div>
                                                        ) : (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px', fontWeight: '900' }}>
                                                                    <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <ArrowUpRight size={14} />
                                                                    </div>
                                                                    {record.punchIn?.time ? formatTimeIST(record.punchIn.time) : 'N/A'}
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: record.punchOut?.time ? '#f43f5e' : 'var(--primary)', fontSize: '13px', fontWeight: '900' }}>
                                                                    <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: record.punchOut?.time ? 'rgba(244, 63, 94, 0.1)' : 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <ArrowDownLeft size={14} />
                                                                    </div>
                                                                    {record.punchOut?.time
                                                                        ? formatTimeIST(record.punchOut.time)
                                                                        : 'ACTIVE SHIFT'
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 25px' }}>
                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                        {record.punchIn?.photo ? (
                                                            <motion.div whileHover={{ scale: 1.1, translateY: -2 }} onClick={() => setSelectedPhoto(record.punchIn.photo)} style={{ position: 'relative', cursor: 'zoom-in' }}>
                                                                <img src={record.punchIn.photo} style={{ width: '50px', height: '50px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(16,185,129,0.3)', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} alt="" />
                                                                <div style={{ position: 'absolute', top: -5, right: -5, background: '#10b981', padding: '4px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}><ArrowUpRight size={10} color="white" /></div>
                                                            </motion.div>
                                                        ) : <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Camera size={18} style={{ opacity: 0.2 }} /></div>}

                                                        {record.punchOut?.photo ? (
                                                            <motion.div whileHover={{ scale: 1.1, translateY: -2 }} onClick={() => setSelectedPhoto(record.punchOut.photo)} style={{ position: 'relative', cursor: 'zoom-in' }}>
                                                                <img src={record.punchOut.photo} style={{ width: '50px', height: '50px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(244,63,94,0.3)', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} alt="" />
                                                                <div style={{ position: 'absolute', top: -5, right: -5, background: '#f43f5e', padding: '4px', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' }}><ArrowDownLeft size={10} color="white" /></div>
                                                            </motion.div>
                                                        ) : record.punchOut?.time ? (
                                                            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Camera size={18} style={{ opacity: 0.2 }} /></div>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 25px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                                                            <MapPin size={20} color="var(--primary)" />
                                                        </div>
                                                        <div style={{ maxWidth: '240px' }}>
                                                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {record.punchIn?.location?.address || 'Location unknown'}
                                                            </div>
                                                            {record.punchIn?.location?.latitude && (
                                                                <a
                                                                    href={`https://www.google.com/maps?q=${record.punchIn.location.latitude},${record.punchIn.location.longitude}`}
                                                                    target="_blank" rel="noreferrer"
                                                                    style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px', display: 'inline-block', textDecoration: 'none', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '6px' }}
                                                                >
                                                                    OPEN MAP →
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 25px', borderTopRightRadius: '20px', borderBottomRightRadius: '20px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, background: 'rgba(244, 63, 94, 0.2)', y: -2 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => handleDeleteStaffAttendance(record._id)}
                                                            style={{
                                                                width: '44px',
                                                                height: '44px',
                                                                borderRadius: '14px',
                                                                background: 'rgba(244, 63, 94, 0.1)',
                                                                color: '#f43f5e',
                                                                border: '1px solid rgba(244, 63, 94, 0.2)',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                alignItems: 'center',
                                                                transition: '0.2s'
                                                            }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </motion.button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div >
                        </div >
                    )}

                    {/* Leaves Management View */}
                    {
                        view === 'leaves' && (
                            <div style={{
                                background: 'rgba(15, 23, 42, 0.4)',
                                borderRadius: '28px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                overflow: 'hidden',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 20px 40px -20px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ overflowX: 'auto', padding: '10px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px', color: 'white', minWidth: '800px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left' }}>
                                                <th style={{ padding: '0 25px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>STAFF MEMBER</th>
                                                <th style={{ padding: '0 25px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>LEAVE DURATION</th>
                                                <th style={{ padding: '0 25px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>REASON / DETAILS</th>
                                                <th style={{ padding: '0 25px 10px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', textAlign: 'right' }}>ACTIONS (APPROVE / REJECT)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingLeaves.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4">
                                                        <div style={{ padding: '100px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                                            <Calendar size={48} color="#8b5cf6" style={{ opacity: 0.2, marginBottom: '20px' }} />
                                                            <p style={{ margin: 0, fontWeight: '800', fontSize: '18px', color: 'white' }}>No Pending Leaves</p>
                                                            <p style={{ margin: '8px 0 0 0', fontWeight: '500', fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>Hooray! No leave requests are currently pending approval.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : pendingLeaves.map(leave => (
                                                <motion.tr
                                                    key={leave._id}
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)', scale: 1.002 }}
                                                    style={{
                                                        background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.5) 100%)',
                                                        borderRadius: '20px',
                                                        transition: 'all 0.3s ease',
                                                        boxShadow: '0 10px 20px -10px rgba(0,0,0,0.2)'
                                                    }}
                                                >
                                                    <td style={{ padding: '20px 25px', borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#8b5cf6', fontWeight: '900', fontSize: '18px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                                                {leave.staff?.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '900', color: 'white', fontSize: '16px', letterSpacing: '-0.3px' }}>{leave.staff?.name || 'Unknown Staff'}</div>
                                                                <div style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>ID: {leave._id.slice(-6).toUpperCase()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '20px 25px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: '800', color: 'white' }}>
                                                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
                                                                {formatDateIST(leave.startDate, { day: '2-digit', month: 'short' })}
                                                            </div>
                                                            <ChevronRight size={14} style={{ opacity: 0.5 }} />
                                                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px' }}>
                                                                {formatDateIST(leave.endDate, { day: '2-digit', month: 'short' })}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', marginTop: '8px', letterSpacing: '1px', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '6px', display: 'inline-block' }}>{leave.type} LEAVE</div>
                                                    </td>
                                                    <td style={{ padding: '20px 25px' }}>
                                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', maxWidth: '320px', lineHeight: '1.6', fontWeight: '500', background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                                            {leave.reason || <span style={{ opacity: 0.5, fontStyle: 'italic' }}>No reason provided.</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '20px 25px', borderTopRightRadius: '20px', borderBottomRightRadius: '20px', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05, background: 'rgba(16, 185, 129, 0.2)', y: -2 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleLeaveAction(leave._id, 'Approved')}
                                                                style={{
                                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                                    color: '#10b981',
                                                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                                                    padding: '10px 20px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '800',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    letterSpacing: '0.5px',
                                                                    transition: '0.2s'
                                                                }}
                                                            >
                                                                <CheckCircle2 size={16} /> APPROVE
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05, background: 'rgba(244, 63, 94, 0.2)', y: -2 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleLeaveAction(leave._id, 'Rejected')}
                                                                style={{
                                                                    background: 'rgba(244, 63, 94, 0.1)',
                                                                    color: '#f43f5e',
                                                                    border: '1px solid rgba(244, 63, 94, 0.2)',
                                                                    padding: '10px 20px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '12px',
                                                                    fontWeight: '800',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    letterSpacing: '0.5px',
                                                                    transition: '0.2s'
                                                                }}
                                                            >
                                                                <XCircle size={16} /> REJECT
                                                            </motion.button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    }
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
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
                                    padding: '30px 40px',
                                    borderRadius: '32px',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(20px)'
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--primary)', boxShadow: '0 0 15px var(--primary)', transform: 'rotate(45deg)' }}></div>
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>Operational Expenditure</span>
                                        </div>
                                        <h2 style={{ fontSize: '34px', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-1.5px' }}>Payroll Intelligence</h2>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
                                        <div>
                                            <p style={{ fontSize: '11px', color: 'var(--primary)', margin: '0 0 5px 0', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>GROSS DISBURSEMENT</p>
                                            <h2 style={{ fontSize: '48px', fontWeight: '1000', color: 'white', margin: 0, letterSpacing: '-2px', textShadow: '0 0 40px rgba(251, 191, 36, 0.3)' }}>
                                                <span style={{ color: 'var(--primary)', fontSize: '24px', verticalAlign: 'top', marginRight: '8px', opacity: 0.8 }}>₹</span>{monthlyReport.reduce((acc, curr) => acc + (curr.finalSalary || 0), 0).toLocaleString()}
                                            </h2>
                                        </div>
                                        <button
                                            onClick={exportPayrollToExcel}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px',
                                                borderRadius: '14px', background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white',
                                                fontSize: '11px', fontWeight: '800', cursor: 'pointer', transition: '0.3s'
                                            }}
                                            onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'var(--primary)'; }}
                                            onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                        >
                                            <Download size={16} color="var(--primary)" /> DOWNLOAD PAYROLL REPORT
                                        </button>
                                    </div>
                                </div>

                                {monthlyReport.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '120px 0', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '40px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 25px' }}>
                                            <IndianRupee size={32} color="var(--primary)" style={{ opacity: 0.5 }} />
                                        </div>
                                        <h3 style={{ color: 'white', margin: '0 0 10px 0', fontWeight: '700', fontSize: '20px' }}>No Payroll Records</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: '500', fontSize: '15px' }}>No records found for the selected month.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {monthlyReport.map((item, idx) => (
                                            <motion.div
                                                key={item.staffId}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => setSelectedStaffReport(item)}
                                                whileHover={{ y: -5, background: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(251, 191, 36, 0.3)' }}
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.4) 100%)',
                                                    borderRadius: '28px',
                                                    padding: '28px 35px',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '30px',
                                                    flexWrap: 'wrap'
                                                }}
                                            >
                                                <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.05) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }}></div>

                                                {/* Identity Section */}
                                                <div style={{ flex: '1 1 250px', display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                                                    <div style={{
                                                        width: '64px',
                                                        height: '64px',
                                                        borderRadius: '20px',
                                                        background: 'linear-gradient(135deg, var(--primary), #d97706)',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        fontSize: '26px',
                                                        fontWeight: '1000',
                                                        color: '#1e293b',
                                                        boxShadow: '0 8px 16px -4px rgba(217, 119, 6, 0.4)'
                                                    }}>
                                                        {item.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: 'white', letterSpacing: '-0.8px' }}>{item.name}</h3>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                                                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{item.designation || 'Specialist'}</p>
                                                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                                            <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800' }}>VERIFIED</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stats grid */}
                                                <div style={{ flex: '2 1 400px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', position: 'relative', zIndex: 2 }}>
                                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
                                                            <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>PRESENCE</p>
                                                        </div>
                                                        <div style={{ fontSize: '22px', fontWeight: '1000', color: 'white' }}>{item.presentDays || 0}<span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>DAYS</span></div>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.extraLeaves > 0 ? '#f43f5e' : '#10b981', boxShadow: `0 0 10px ${item.extraLeaves > 0 ? '#f43f5e' : '#10b981'}` }}></div>
                                                            <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>LEAVE STATUS</p>
                                                        </div>
                                                        <div style={{ fontSize: '22px', fontWeight: '1000', color: item.extraLeaves > 0 ? '#f43f5e' : '#10b981' }}>{item.leavesTaken || 0} <span style={{ fontSize: '12px', opacity: 0.3 }}>/ {item.allowance || 4}</span></div>
                                                    </div>
                                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
                                                            <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>OVERTIME</p>
                                                        </div>
                                                        <div style={{ fontSize: '22px', fontWeight: '1000', color: 'var(--primary)' }}>{item.sundaysWorked || 0}<span style={{ fontSize: '12px', opacity: 0.5, marginLeft: '6px' }}>SUN</span></div>
                                                    </div>
                                                </div>

                                                {/* Payout */}
                                                <div style={{ flex: '1 1 200px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '25px', position: 'relative', zIndex: 2 }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px' }}>NET PAYABLE</p>
                                                        <h2 style={{ margin: '4px 0 0 0', fontSize: '32px', fontWeight: '1000', color: 'var(--primary)', letterSpacing: '-1.5px', textShadow: '0 0 20px rgba(251, 191, 36, 0.2)' }}>₹{(item.finalSalary || 0).toLocaleString()}</h2>
                                                    </div>
                                                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)' }}>
                                                        <ChevronRight size={22} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }
                </div>
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
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, var(--primary), var(--primary), var(--primary), var(--primary))', backgroundSize: '300% 100%', animation: 'gradientFlow 5s linear infinite' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                            <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>Staff Records</span>
                                        </div>
                                        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>
                                            {isEditing ? 'Edit Staff Details' : 'Add New Staff'}
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
                                                <h4 style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ width: '20px', height: '1px', background: 'currentColor' }}></span> 01. BASIC INFO
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">FULL NAME</label>
                                                        <input required type="text" className="premium-compact-input" placeholder="e.g. John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                                    </div>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">STAFF CATEGORY</label>
                                                        <select className="premium-compact-input" value={formData.staffType} onChange={(e) => setFormData({ ...formData, staffType: e.target.value })}>
                                                            <option value="Company">Regular (Mon-Sat)</option>
                                                            <option value="Hotel">Full Time (7 Days)</option>
                                                        </select>
                                                    </div>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">DESIGNATION</label>
                                                        <input type="text" className="premium-compact-input" placeholder="e.g. Accountant" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} />
                                                    </div>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">MOBILE NUMBER</label>
                                                        <input required type="number" className="premium-compact-input" placeholder="e.g. 9876543210" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ width: '20px', height: '1px', background: 'currentColor' }}></span> 02. LOGIN DETAILS
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">USERNAME</label>
                                                        <input required type="text" className="premium-compact-input" placeholder="e.g. john_doe" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                                                    </div>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">{isEditing ? 'RESET PASSWORD (OPTIONAL)' : 'PASSWORD'}</label>
                                                        <input required={!isEditing} type="password" underline="none" className="premium-compact-input" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Right Column: Financial & Geofencing */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                            <div>
                                                <h4 style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ width: '20px', height: '1px', background: 'currentColor' }}></span> 03. SALARY DETAILS
                                                </h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    <div className="premium-input-group">
                                                        <label className="premium-label">MONTHLY SALARY</label>
                                                        <input required type="number" className="premium-compact-input" placeholder="0.00" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
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
                                                    <Clock size={16} color="var(--primary)" />
                                                    <h4 style={{ color: 'white', fontSize: '13px', fontWeight: '700', margin: 0, letterSpacing: '0.5px' }}>SHIFT TIMING</h4>
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
                                            </div>

                                            <div style={{
                                                background: 'rgba(99, 102, 241, 0.05)',
                                                border: '1px solid rgba(99, 102, 241, 0.1)',
                                                borderRadius: '24px',
                                                padding: '24px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '20px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '8px', borderRadius: '12px' }}>
                                                        <MapPin size={18} color="var(--primary)" />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '800', margin: 0, letterSpacing: '0.5px' }}>OFFICE GEOFENCING</h4>
                                                        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>SET WORK LOCATION LIMITS</p>
                                                    </div>
                                                </div>

                                                <OfficeGeofencePicker
                                                    value={formData.officeLocation}
                                                    onChange={(newLocation) => setFormData({ ...formData, officeLocation: newLocation })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '20px' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -2 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            style={{
                                                width: '100%',
                                                height: '64px',
                                                background: 'linear-gradient(135deg, var(--primary), var(--primary))',
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
                                            {isEditing ? 'Save Changes' : 'Create Staff Member'}
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
                                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(20px)', zIndex: 2, overflowY: 'auto' }}>
                                        <div style={{ padding: '30px 25px 20px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), transparent)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '22px', fontWeight: '800', color: 'var(--primary)', flexShrink: 0 }}>
                                                    {selectedStaffReport.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>{selectedStaffReport.name}</h3>
                                                    <p style={{ margin: '3px 0 0 0', fontSize: '10px', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedStaffReport.designation || 'Staff Member'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Net Payout Hero */}
                                        <div style={{
                                            margin: '16px 16px 0 16px',
                                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.02))',
                                            borderRadius: '20px',
                                            border: '1px solid rgba(251, 191, 36, 0.3)',
                                            padding: '20px 14px',
                                            textAlign: 'center',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            flexShrink: 0
                                        }}>
                                            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 50%)', opacity: 0.5 }}></div>
                                            <p style={{ margin: 0, fontSize: '9px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>NET PAYABLE THIS CYCLE</p>
                                            <h1 style={{ margin: '6px 0 0 0', fontSize: '40px', fontWeight: '900', color: 'white', letterSpacing: '-2px', textShadow: '0 0 30px rgba(251, 191, 36, 0.4)', position: 'relative' }}>
                                                <span style={{ fontSize: '14px', verticalAlign: 'top', color: 'var(--primary)', marginRight: '3px', fontWeight: '700' }}>₹</span>
                                                {(selectedStaffReport.finalSalary || 0).toLocaleString()}
                                            </h1>
                                            {selectedStaffReport.cycleStart && (
                                                <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: '600' }}>
                                                    📅 {formatDateIST(selectedStaffReport.cycleStart, { day: '2-digit', month: 'short' })} → {formatDateIST(selectedStaffReport.cycleEnd, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                            )}

                                            <button
                                                onClick={() => downloadSalarySlip(selectedStaffReport)}
                                                style={{
                                                    marginTop: '20px', width: '100%', padding: '12px',
                                                    borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                                                    fontSize: '11px', fontWeight: '800', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                }}
                                            >
                                                <FileText size={16} color="var(--primary)" /> DOWNLOAD SALARY SLIP
                                            </button>
                                        </div>

                                        {/* Detailed Breakdown */}
                                        <div style={{ padding: '12px 16px 24px 16px', flexGrow: 1 }}>
                                            {/* Formula Banner */}
                                            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '14px', padding: '10px 12px', marginBottom: '10px' }}>
                                                <p style={{ margin: 0, fontSize: '9px', color: '#818cf8', fontWeight: '700', letterSpacing: '0.5px' }}>📐 HOW IS SALARY CALCULATED?</p>
                                                <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.65)', fontWeight: '600', lineHeight: '1.5' }}>
                                                    (Present + Paid Leaves + Sundays + Extras) × ₹{selectedStaffReport.perDaySalary || Math.round((selectedStaffReport.salary || 0) / 30)}/day
                                                </p>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {/* Base Salary */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '12px' }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: '700' }}>BASE SALARY</p>
                                                        <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontWeight: '500' }}>÷30 = ₹{selectedStaffReport.perDaySalary || Math.round((selectedStaffReport.salary || 0) / 30)}/day</p>
                                                    </div>
                                                    <span style={{ fontWeight: '800', color: 'white', fontSize: '13px' }}>₹{(selectedStaffReport.salary || 0).toLocaleString()}</span>
                                                </div>

                                                {/* Days Present */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16,185,129,0.07)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.14)' }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '10px', color: '#10b981', fontWeight: '700' }}>✅ DAYS PRESENT</p>
                                                        <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'rgba(16,185,129,0.5)', fontWeight: '500' }}>Of {selectedStaffReport.workingDaysPassed || 0} working days passed</p>
                                                    </div>
                                                    <span style={{ fontWeight: '800', color: '#10b981', fontSize: '13px' }}>{selectedStaffReport.presentDays || 0} <small style={{ fontSize: '9px', opacity: 0.6 }}>days</small></span>
                                                </div>

                                                {/* Free Leaves Allowance */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(14,165,233,0.07)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.14)' }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '10px', color: 'var(--primary)', fontWeight: '700' }}>🎫 FREE LEAVE USED</p>
                                                        <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'rgba(14,165,233,0.5)', fontWeight: '500' }}>Allowance: {selectedStaffReport.allowance || 4}/cycle (paid absences)</p>
                                                    </div>
                                                    <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '13px' }}>{selectedStaffReport.paidLeavesUsed || 0} <small style={{ fontSize: '9px', opacity: 0.6 }}>days</small></span>
                                                </div>

                                                {/* Sunday Holidays (Paid) */}
                                                {(selectedStaffReport.sundaysPassed || 0) > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(251, 191, 36, 0.05)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.1)' }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '10px', color: 'var(--primary)', fontWeight: '700' }}>⭐ SUNDAY HOLIDAYS</p>
                                                            <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'rgba(251, 191, 36, 0.5)', fontWeight: '500' }}>Automatically paid rest days</p>
                                                        </div>
                                                        <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '13px' }}>{selectedStaffReport.sundaysPassed} <small style={{ fontSize: '9px', opacity: 0.6 }}>days</small></span>
                                                    </div>
                                                )}

                                                {/* Sunday Extras (Worked) */}
                                                {(selectedStaffReport.sundaysWorked || 0) > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99,102,241,0.07)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.14)' }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '10px', color: '#818cf8', fontWeight: '700' }}>☀️ SUNDAYS WORKED</p>
                                                            <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'rgba(99,102,241,0.5)', fontWeight: '500' }}>Extra pay for holiday duty</p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <p style={{ margin: 0, fontWeight: '800', color: '#818cf8', fontSize: '13px' }}>+{selectedStaffReport.sundaysWorked} days</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '2px 0' }}></div>

                                                {/* Unpaid Absences */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: (selectedStaffReport.extraLeaves || 0) > 0 ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '12px', border: `1px solid ${(selectedStaffReport.extraLeaves || 0) > 0 ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.04)'}` }}>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: '10px', color: (selectedStaffReport.extraLeaves || 0) > 0 ? '#f43f5e' : 'rgba(255,255,255,0.4)', fontWeight: '700' }}>❌ UNPAID ABSENT DAYS</p>
                                                        <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontWeight: '500' }}>Beyond free allowance → deducted</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ margin: 0, fontWeight: '800', color: (selectedStaffReport.extraLeaves || 0) > 0 ? '#f43f5e' : 'rgba(255,255,255,0.3)', fontSize: '13px' }}>{selectedStaffReport.extraLeaves || 0} days</p>
                                                        {(selectedStaffReport.extraLeaves || 0) > 0 && (
                                                            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#f43f5e', fontWeight: '700' }}>-₹{(selectedStaffReport.deduction || 0).toLocaleString()}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Final calc box */}
                                                <div style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.03))', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '14px', padding: '12px 14px', marginTop: '2px' }}>
                                                    <p style={{ margin: 0, fontSize: '9px', color: 'var(--primary)', fontWeight: '700', letterSpacing: '1px' }}>🧮 STEP-BY-STEP</p>
                                                    <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.55)', fontWeight: '600', lineHeight: '1.7' }}>
                                                        ({selectedStaffReport.presentDays || 0} presents
                                                        {(selectedStaffReport.paidLeavesUsed || 0) > 0 ? ` + ${selectedStaffReport.paidLeavesUsed} leaves` : ''}
                                                        {(selectedStaffReport.sundaysPassed || 0) > 0 ? ` + ${selectedStaffReport.sundaysPassed} sundays` : ''}
                                                        {(selectedStaffReport.sundaysWorked || 0) > 0 ? ` + ${selectedStaffReport.sundaysWorked} extras` : ''})
                                                        {' × ₹'}{selectedStaffReport.perDaySalary || Math.round((selectedStaffReport.salary || 0) / 30)}
                                                    </p>
                                                    <p style={{ margin: '5px 0 0 0', fontSize: '15px', fontWeight: '900', color: 'var(--primary)' }}>= ₹{(selectedStaffReport.finalSalary || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content: Date-wise Attendance */}
                                    <div style={{ padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '40px', zIndex: 2 }}>

                                        {/* Attendance Visual Insights */}
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>Salary Cycle Calendar</h4>
                                                    {selectedStaffReport.cycleStart && (
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                                                            {formatDateIST(selectedStaffReport.cycleStart, { day: '2-digit', month: 'short', year: 'numeric' })} → {formatDateIST(selectedStaffReport.cycleEnd, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '14px', fontSize: '11px', fontWeight: '600', marginRight: '40px', flexWrap: 'wrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#22c55e' }}>
                                                        <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}></div> PRESENT
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)' }}>
                                                        <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px rgba(14, 165, 233, 0.5)' }}></div> HALF DAY
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
                                                            {isSunday && <div style={{ position: 'absolute', top: '2px', right: '2px', width: '4px', height: '4px', background: 'var(--primary)', borderRadius: '50%' }}></div>}
                                                            <span style={{
                                                                fontSize: '12px',
                                                                fontWeight: '700',
                                                                color: isPresent ? '#10b981' : isHalfDay ? 'var(--primary)' : isAbsent ? '#f43f5e' : 'rgba(255,255,255,0.3)'
                                                            }}>{attendanceRecord.day}</span>

                                                            {isPresent ? (
                                                                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 12px #10b981' }}></div>
                                                            ) : isHalfDay ? (
                                                                <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 12px var(--primary)' }}></div>
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
                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>PAYROLL ACCRUAL</span>
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)' }}>{Math.round((selectedStaffReport.finalSalary / (selectedStaffReport.salary || 1)) * 100)}%</span>
                                                </div>
                                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (selectedStaffReport.finalSalary / (selectedStaffReport.salary || 1)) * 100)}%` }}
                                                        style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--primary))', boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)' }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>ATTENDANCE RATE</span>
                                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981' }}>{Math.round((selectedStaffReport.presentDays / (selectedStaffReport.workingDaysPassed || 1)) * 100) || 0}%</span>
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
                                            <h4 style={{ margin: '0 0 25px 0', fontSize: '16px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>Attendance Activity Log</h4>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)', textAlign: 'left' }}>
                                                            <th style={{ padding: '22px 25px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: '1.5px' }}>DATE</th>
                                                            <th style={{ padding: '22px 25px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: '1.5px' }}>PHOTOS</th>
                                                            <th style={{ padding: '22px 25px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: '1.5px' }}>STATUS</th>
                                                            <th style={{ padding: '22px 25px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: '1.5px' }}>TIME (IN/OUT)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(selectedStaffReport.attendanceData || []).sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                                                            <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                                <td style={{ padding: '15px 20px' }}>
                                                                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>{formatDateIST(log.date, { day: '2-digit', month: 'short' })}</div>
                                                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>{formatDateIST(log.date, { weekday: 'short' })}</div>
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
                                                                    <span style={{ fontSize: '9px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px', background: log.status === 'present' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.1)', color: log.status === 'present' ? '#22c55e' : '#ef4444' }}>{log.status.toUpperCase()}</span>
                                                                </td>
                                                                <td style={{ padding: '15px 20px' }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>{log.punchIn?.time ? formatTimeIST(log.punchIn.time) : '--'}</div>
                                                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#f43f5e' }}>{log.punchOut?.time ? formatTimeIST(log.punchOut.time) : '--'}</div>
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
                            background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(20px)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200,
                            padding: '20px'
                        }}>
                            {/* Abstract Background Glows */}
                            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '300px', height: '300px', background: 'rgba(99, 102, 241, 0.15)', filter: 'blur(100px)', borderRadius: '50%', zIndex: -1 }}></div>
                            <div style={{ position: 'absolute', bottom: '20%', right: '30%', width: '300px', height: '300px', background: 'rgba(14, 165, 233, 0.15)', filter: 'blur(100px)', borderRadius: '50%', zIndex: -1 }}></div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                style={{
                                    maxWidth: '540px',
                                    width: '100%',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '40px',
                                    padding: '45px',
                                    boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(255,255,255,0.02)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    backdropFilter: 'blur(40px)'
                                }}
                            >
                                {/* Header Decorative element */}
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: 'linear-gradient(90deg, var(--primary), var(--primary), var(--primary))', backgroundSize: '200% 100%', animation: 'gradientMove 3s infinite linear' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                                            <ShieldCheck size={28} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>Security Panel</span>
                                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                                <span style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin Override</span>
                                            </div>
                                            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>Mark Attendance</h2>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90, background: 'rgba(255,255,255,0.05)' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setShowBackdateModal(false)}
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: "center" }}
                                    >
                                        <X size={20} />
                                    </motion.button>
                                </div>

                                <form onSubmit={handleBackdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                    <motion.div
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}
                                    >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <AlertCircle size={18} color="var(--primary)" />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.2px' }}>Attendance Policy</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(251, 191, 36, 0.6)', fontWeight: '600' }}>Backdated entries are limited to the previous 60 days (2 Months).</span>
                                        </div>
                                    </motion.div>

                                    <div className="premium-input-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <label className="premium-label" style={{ margin: 0 }}>STAFF MEMBER</label>
                                            <User size={14} style={{ opacity: 0.3 }} color="white" />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                required
                                                className="premium-compact-input"
                                                value={backdateForm.staffId}
                                                onChange={(e) => setBackdateForm({ ...backdateForm, staffId: e.target.value })}
                                                style={{ background: 'rgba(255,255,255,0.04)', height: '58px', borderRadius: '18px', paddingLeft: '20px', fontSize: '15px' }}
                                            >
                                                <option value="" style={{ background: '#0B1121' }}>Identify staff member...</option>
                                                {staffList.map(s => <option key={s._id} value={s._id} style={{ background: '#0B1121' }}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                                        <div className="premium-input-group">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <label className="premium-label" style={{ margin: 0 }}>TARGET DATE</label>
                                                <Calendar size={14} style={{ opacity: 0.3 }} color="white" />
                                            </div>
                                            <input
                                                type="date"
                                                required
                                                className="premium-compact-input"
                                                min={MIN_BACKDATE_LIMIT}
                                                max={todayIST()}
                                                value={backdateForm.date}
                                                onChange={(e) => setBackdateForm({ ...backdateForm, date: e.target.value })}
                                                style={{ background: 'rgba(255,255,255,0.04)', height: '58px', borderRadius: '18px', padding: '0 20px', fontSize: '15px' }}
                                            />
                                        </div>
                                        <div className="premium-input-group">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <label className="premium-label" style={{ margin: 0 }}>OFFICIAL STATUS</label>
                                                <Target size={14} style={{ opacity: 0.3 }} color="white" />
                                            </div>
                                            <select
                                                required className="premium-compact-input"
                                                value={backdateForm.status}
                                                onChange={(e) => setBackdateForm({ ...backdateForm, status: e.target.value })}
                                                style={{
                                                    background: 'rgba(255,255,255,0.04)',
                                                    height: '58px',
                                                    borderRadius: '18px',
                                                    paddingLeft: '20px',
                                                    fontSize: '15px',
                                                    color: backdateForm.status === 'present' ? '#10b981' : backdateForm.status === 'half-day' ? 'var(--primary)' : '#f43f5e',
                                                    fontWeight: '700'
                                                }}
                                            >
                                                <option value="present" style={{ background: '#0B1121', color: '#10b981' }}>PRESENT</option>
                                                <option value="half-day" style={{ background: '#0B1121', color: 'var(--primary)' }}>HALF DAY</option>
                                                <option value="absent" style={{ background: '#0B1121', color: '#f43f5e' }}>ABSENT</option>
                                            </select>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {backdateForm.status !== 'absent' && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', overflow: 'hidden' }}
                                            >
                                                <div className="premium-input-group">
                                                    <label className="premium-label">PUNCH IN TIME</label>
                                                    <input
                                                        type="time"
                                                        className="premium-compact-input"
                                                        value={backdateForm.punchInTime}
                                                        onChange={(e) => setBackdateForm({ ...backdateForm, punchInTime: e.target.value })}
                                                        style={{ background: 'rgba(255,255,255,0.04)', height: '58px', borderRadius: '18px', padding: '0 20px' }}
                                                    />
                                                </div>
                                                <div className="premium-input-group">
                                                    <label className="premium-label">PUNCH OUT TIME</label>
                                                    <input
                                                        type="time"
                                                        className="premium-compact-input"
                                                        value={backdateForm.punchOutTime}
                                                        onChange={(e) => setBackdateForm({ ...backdateForm, punchOutTime: e.target.value })}
                                                        style={{ background: 'rgba(255,255,255,0.04)', height: '58px', borderRadius: '18px', padding: '0 20px' }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div style={{ marginTop: '10px' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -4, boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.5)' }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            style={{
                                                width: '100%',
                                                height: '64px',
                                                background: 'linear-gradient(135deg, var(--primary), #4f46e5, var(--primary))',
                                                backgroundSize: '200% 200%',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '20px',
                                                fontSize: '17px',
                                                fontWeight: '800',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '12px',
                                                boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.4)',
                                                letterSpacing: '0.5px',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <CheckCircle2 size={22} />
                                            AUTHORIZE ENTRY
                                        </motion.button>
                                        <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '16px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Action will be logged in security audit history
                                        </p>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main >
        </div >
    );
};

export default Staff;
