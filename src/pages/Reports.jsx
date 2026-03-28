import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';
import * as XLSX from 'xlsx';
import {
    Calendar, CalendarIcon, Search, Download, Eye, ArrowUpRight, ArrowDownLeft,
    User as UserIcon, Users, Car, FileText, ChevronLeft, ChevronRight, X,
    Edit2, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';
import AttendanceModal from '../components/reports/AttendanceModal';
import EditAttendanceModal from '../components/reports/EditAttendanceModal';
import { todayIST, toISTDateString, firstDayOfMonthIST, formatTimeIST, nowIST } from '../utils/istUtils';

/* ─── tiny helpers ─── */
const fmt = (d) => { if (!d) return '--'; const [y, m, dd] = (typeof d === 'string' ? d.split('T')[0] : toISTDateString(new Date(d))).split('-'); return `${dd}/${m}/${y}`; };
const fmtTime = (t) => t ? formatTimeIST(t) : '--';

/* ─── shared table theme tokens ─── */
const TAB_CONFIG = {
    drivers: { label: 'Staff Duties', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: UserIcon },
    freelancers: { label: 'Freelancer Duties', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: Users },
    parking: { label: 'Parking & Toll', color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: ArrowUpRight },
    logbook: { label: 'Overall Log Book', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: FileText },
};

/* ─── Chip (summary stat) ─── */
const Chip = ({ label, value, color }) => (
    <div style={{ padding: '8px 14px', borderRadius: '10px', background: `${color}18`, border: `1px solid ${color}30`, flexShrink: 0 }}>
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ color, fontWeight: '900', fontSize: '14px', marginTop: '2px', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
);

/* ─── Section Banner ─── */
const SectionBanner = ({ tabId, count, chips, fromDate, toDate }) => {
    const cfg = TAB_CONFIG[tabId] || { label: tabId, color: '#fff', bg: 'rgba(255,255,255,0.05)', icon: FileText };
    const Icon = cfg.icon;
    return (
        <div style={{ padding: '18px 24px', background: `linear-gradient(135deg, ${cfg.bg}, transparent)`, borderBottom: `1px solid ${cfg.color}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: cfg.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${cfg.color}30` }}>
                    <Icon size={18} color={cfg.color} />
                </div>
                <div>
                    <div style={{ color: 'white', fontWeight: '900', fontSize: '15px' }}>{cfg.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700' }}>{count} records · {fromDate === toDate ? fmt(fromDate) : `${fmt(fromDate)} – ${fmt(toDate)}`}</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{chips}</div>
        </div>
    );
};

/* ─── Shared TH ─── */
const Th = ({ color, children }) => (
    <th style={{ padding: '12px 16px', color: color || 'rgba(255,255,255,0.35)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.02)' }}>
        {children}
    </th>
);

/* ─── Status badge ─── */
const StatusBadge = ({ ok, okLabel = '✓ Done', badLabel = '⏳ Active' }) => (
    <span style={{ fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap', background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: ok ? '#10b981' : '#f59e0b', border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
        {ok ? okLabel : badLabel}
    </span>
);

/* ─── Action Buttons ─── */
const ActionBtns = ({ onView, onEdit, onDelete, onDeleteBonus }) => (
    <div style={{ display: 'flex', gap: '6px' }}>
        {onView && <button onClick={onView} title="View Details" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', color: '#38bdf8', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', transition: 'all 0.2s' }} className="btn-hover-scale"><Eye size={14} /> View</button>}
        {onEdit && <button onClick={onEdit} title="Edit" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', transition: 'all 0.2s' }} className="btn-hover-scale"><Edit2 size={14} /></button>}
        {onDelete && <button onClick={onDelete} title="Delete" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} className="btn-hover-scale"><Trash2 size={14} /></button>}
        {onDeleteBonus && <button onClick={onDeleteBonus} title="Delete Bonus Only" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '11px', fontWeight: '950', transition: 'all 0.2s' }} className="btn-hover-scale">Bonus Delete</button>}
    </div>
);

/* ─── TableWrapper ─── */
const TableSection = ({ tabId, fromDate, toDate, chips, headers, rows, empty, colSummaries }) => {
    const cfg = TAB_CONFIG[tabId] || {};
    return (
        <div style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${cfg.color || '#fff'}20`, borderRadius: '20px', overflow: 'hidden', marginBottom: '28px' }}>
            <SectionBanner tabId={tabId} count={rows?.length || 0} chips={chips} fromDate={fromDate} toDate={toDate} />
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '1000px' }}>
                    <thead>
                        {colSummaries && (
                            <tr>
                                {headers.map((h, i) => (
                                    <th key={'sum-' + i} style={{ padding: '12px 16px 4px', background: 'rgba(255,255,255,0.02)' }}>
                                        {colSummaries[h] && (
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                color: colSummaries[h].color || 'white',
                                                fontSize: '11px',
                                                fontWeight: '950'
                                            }}>
                                                {colSummaries[h].value}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        )}
                        <tr>{headers.map((h, i) => <Th key={i} color={cfg.color}>{h}</Th>)}</tr>
                    </thead>
                    <tbody>
                        {rows?.length === 0
                            ? <tr><td colSpan={headers.length} style={{ padding: '50px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>{empty || 'No records found.'}</td></tr>
                            : rows
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/* ─── TR wrapper ─── */
const TR = ({ children, idx }) => (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }} className="hover-row">
        {children}
    </motion.tr>
);
const TD = ({ children, noWrap }) => <td style={{ padding: '13px 16px', whiteSpace: noWrap ? 'nowrap' : undefined }}>{children}</td>;

/* ─── Loading skeleton ─── */
const LoadingRow = ({ cols }) => (
    <tr>
        <td colSpan={cols} style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.3)' }}>
                <div className="spinner" /><span>Loading data…</span>
            </div>
        </td>
    </tr>
);

/* ═══════════════════════════════════════════════════════ MAIN COMPONENT */
const Reports = ({ isSubComponent = false }) => {
    const { user } = useAuth();
    const { selectedCompany } = useCompany();
    const location = useLocation();

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDay, setSelectedDay] = useState(new Date().getDate().toString());
    const [fromDate, setFromDate] = useState(todayIST());
    const [toDate, setToDate] = useState(todayIST());

    const [reportsData, setReportsData] = useState({
        attendance: [],
        parking: [],
        fuel: [],
        maintenance: [],
        advances: [],
        borderTax: [],
        accidentLogs: [],
        partsWarranty: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const tabList = useMemo(() => {
        return Object.entries(TAB_CONFIG)
            .filter(([id]) => {
                // Filter by URL path first
                if (location.pathname.includes('driver-duty')) return id === 'drivers';
                if (location.pathname.includes('freelancer-duty')) return id === 'freelancers';
                if (location.pathname.includes('log-book')) return id === 'drivers' || id === 'freelancers';

                // Administrative overrides/permissions for standard /admin/reports
                if (user?.role === 'Admin') return true;
                const p = user?.permissions || {};
                const driversTabs = ['drivers', 'freelancers'];
                if (driversTabs.includes(id)) return p.driversService;

                return true;
            })
            .map(([id, v]) => ({ id, ...v }));
    }, [user?.role, user?.permissions, location.pathname]);

    const [activeTabs, setActiveTabs] = useState([]);

    // Initialize based on URL path or first available tab
    useEffect(() => {
        if (tabList.length > 0) {
            if (location.pathname.includes('driver-duty')) {
                setActiveTabs(['drivers']);
                setSelectedDay('All');
            } else if (location.pathname.includes('freelancer-duty')) {
                setActiveTabs(['freelancers']);
                setSelectedDay('All');
            } else if (location.pathname.includes('log-book')) {
                setActiveTabs(['drivers', 'freelancers']);
                setSelectedDay('All');
            } else if (activeTabs.length === 0) {
                setActiveTabs([tabList[0].id]);
                setSelectedDay('All');
            }
        }
    }, [tabList, location.pathname]);

    useEffect(() => {
        if (selectedDay === 'All') {
            const start = toISTDateString(new Date(selectedYear, selectedMonth, 1));
            const end = toISTDateString(new Date(selectedYear, selectedMonth + 1, 0));
            setFromDate(start);
            setToDate(end);
        } else {
            const d = toISTDateString(new Date(selectedYear, selectedMonth, parseInt(selectedDay)));
            setFromDate(d);
            setToDate(d);
        }
    }, [selectedMonth, selectedYear, selectedDay]);

    const toggleTab = (id) => {
        setActiveTabs(prev => {
            // Toggle logic: add if missing, remove if present.
            if (prev.includes(id)) {
                // If this is the only one active, clicking it again should reset/show all 
                // to make it easier to go back to the standard view.
                if (prev.length === 1) return tabList.map(t => t.id);
                return prev.filter(t => t !== id);
            }
            return [...prev, id];
        });
    };

    const handleSelectAll = () => {
        const allIds = tabList.map(t => t.id);
        const isAllActive = activeTabs.length === allIds.length;
        if (isAllActive) {
            setActiveTabs([allIds[0]]); // Keep just one active instead of none for better UX
        } else {
            setActiveTabs(allIds);
        }
    };
    // const selectAllTabs = () => setActiveTabs(prev => prev.length === tabList.length ? (tabList.length > 0 ? [tabList[0].id] : []) : tabList.map(t => t.id));

    // Auto-toggle range based on tab selection (REMOVED as per user request to keep calendar single)
    /*
    useEffect(() => {
        const rangeNeeded = ['fuel', 'parking', 'freelancers', 'outsideCars', 'events', 'maintenance', 'advances', 'fastag'];
        const hasRangeTab = activeTabs.some(t => rangeNeeded.includes(t));

        if (hasRangeTab && !isRange) {
            setIsRange(true);
            setFromDate(firstDayOfMonthIST());
            setToDate(todayIST());
        } else if (!hasRangeTab && isRange) {
            setIsRange(false);
            setFromDate(todayIST());
            setToDate(todayIST());
        }
    }, [activeTabs]);
    */

    useEffect(() => { if (selectedCompany) fetchReports(); }, [selectedCompany, fromDate, toDate, activeTabs]);

    const fetchReports = async () => {
        if (!selectedCompany) return;
        if (reportsData.attendance.length === 0) setLoading(true); // Flicker-free background updates
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/reports/${selectedCompany._id}?from=${fromDate}&to=${toDate}&_t=${Date.now()}`, { headers: { Authorization: `Bearer ${userInfo.token}` } });

            setReportsData(data);
        } catch (err) { console.error('fetchReports error:', err?.response?.status, err?.response?.config?.url || err.message); }
        finally { setLoading(false); }
    };


    const handleUpdateAttendance = async (id, updateData) => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.put(`/api/admin/attendance/${id}`, updateData, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            setEditingItem(null);
            fetchReports();
            alert('Updated successfully');
        } catch (error) { alert('Failed: ' + (error.response?.data?.message || error.message)); }
    };

    const handleDelete = async (item) => {
        if (!window.confirm('Delete this record? This cannot be undone.')) return;
        const endpoints = {
            attendance: `/api/admin/attendance/${item._id}`,
            fuel: `/api/admin/fuel/${item._id}`,
            parking: `/api/admin/parking/${item._id}`,
            advance: `/api/admin/advances/${item._id}`,
            maintenance: `/api/admin/maintenance/${item._id}`,
            borderTax: `/api/admin/border-tax/${item._id}`,
            accidentLog: `/api/admin/accident-logs/${item._id}`,
            partsWarranty: `/api/admin/parts-warranty/${item._id}`,
            voucher: `/api/admin/vehicles/${item._id}`,
        };
        const endpoint = endpoints[item.entryType];
        if (!endpoint) return alert('Delete not supported for this type.');
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(endpoint, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            fetchReports();
        } catch (error) { alert('Failed: ' + (error.response?.data?.message || error.message)); }
    };

    const handleDeleteBonus = async (item) => {
        if (!window.confirm('Clear all bonus amounts for this duty? (TA/DA/Trip Bonus will be set to zero)')) return;
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const updateData = {
                "punchOut.allowanceTA": 0,
                "punchOut.nightStayAmount": 0,
                "outsideTrip.occurred": false,
                "outsideTrip.bonusAmount": 0
            };
            await axios.put(`/api/admin/attendance/${item._id}`, updateData, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            fetchReports();
            alert('Bonus cleared successfully');
        } catch (error) { alert('Failed: ' + (error.response?.data?.message || error.message)); }
    };

    /* ── Smart Excel Export ── */
    const handleDownloadExcel = () => {
        if (activeTabs.length === 0) return alert('No report categories selected.');

        const wb = XLSX.utils.book_new();
        let sheetsAdded = 0;

        const getSheetData = (tabId) => {
            const cfg = TAB_CONFIG[tabId] || {};
            let data = [];
            switch (tabId) {
                case 'drivers':
                case 'freelancers': {
                    const raw = tabId === 'drivers' ? staffDrivers : freelancerDrivers;
                    data = applySearch(raw).map(r => ({
                        'Date': fmt(r.date),
                        'Driver': r.driver?.name || r.driverName || '---',
                        'Mobile': r.driver?.mobile || '---',
                        'Vehicle': r.vehicle?.carNumber?.split('#')[0] || '---',
                        'In Time': fmtTime(r.punchIn?.time),
                        'Out Time': fmtTime(r.punchOut?.time),
                        'Open KM': r.punchIn?.km || 0,
                        'Close KM': r.punchOut?.km || 0,
                        'Total KM': (r.punchOut?.km && r.punchIn?.km) ? (r.punchOut.km - r.punchIn.km) : (r.totalKM || 0),
                        'Fuel (₹)': r.fuel?.amount || 0,
                        'Parking (₹)': r.punchOut?.tollParkingAmount || 0,
                        'Salary (₹)': (Number(r.dailyWage) || 0) + Math.max((Number(r.punchOut?.allowanceTA) || 0) + (Number(r.punchOut?.nightStayAmount) || 0), Number(r.outsideTrip?.bonusAmount) || 0),
                        'Pick-up': r.pickUpLocation || '',
                        'Drop': r.dropLocation || ''
                    }));
                    break;
                }
                default: break;
            }
            return { data, name: cfg.label || tabId };
        };

        activeTabs.forEach(id => {
            const { data, name } = getSheetData(id);
            if (data && data.length > 0) {
                const sheetName = name.substring(0, 31).replace(/[\[\]\*\?\/\\]/g, '');
                const ws = XLSX.utils.json_to_sheet(data);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
                sheetsAdded++;
            }
        });

        if (sheetsAdded === 0) return alert('No data found for the selected categories.');

        const dateSuffix = isRange ? `${fromDate}_to_${toDate}` : fromDate;
        XLSX.writeFile(wb, `Reports_${dateSuffix}.xlsx`);
    };

    /* ── Grouping Helper (One Row Per Driver Per Day) ── */
    const groupAttendance = (list) => {
        const map = new Map();
        list.forEach(r => {
            const dId = r.driver?._id || r.driver || 'unk';
            const dateStr = r.date;
            const key = `${dId}_${dateStr}`;

            const isSelfPaid = (att) => att.punchOut?.parkingPaidBy !== 'Office';
            const parkVal = (att) => Number(att.punchOut?.tollParkingAmount) || 0;
            const bonusVal = (att) => Math.max((Number(att.punchOut?.allowanceTA) || 0) + (Number(att.punchOut?.nightStayAmount) || 0), Number(att.outsideTrip?.bonusAmount) || 0);

            if (!map.has(key)) {
                map.set(key, {
                    ...r,
                    _id: `group_${key}`,
                    attendances: [r],
                    totalKM: Number(r.totalKM) || 0,
                    fuelAmt: Number(r.fuel?.amount) || 0,
                    parkAmt: parkVal(r),
                    reimbursableParkAmt: isSelfPaid(r) ? parkVal(r) : 0,
                    bonusAmt: bonusVal(r),
                    entryType: 'attendance_group'
                });
            } else {
                const grp = map.get(key);
                grp.attendances.push(r);
                grp.totalKM += (Number(r.totalKM) || 0);
                grp.fuelAmt += (Number(r.fuel?.amount) || 0);
                grp.parkAmt += parkVal(r);
                grp.reimbursableParkAmt += (isSelfPaid(r) ? parkVal(r) : 0);
                grp.bonusAmt += bonusVal(r);

                if (r.status !== 'completed') grp.status = 'incomplete';
                if (r.punchOut?.time && (!grp.punchOut?.time || new Date(r.punchOut.time) > new Date(grp.punchOut.time))) {
                    grp.punchOut = r.punchOut;
                }
            }
        });

        const result = Array.from(map.values());

        // Sort individual attendances within each group by punch-in time
        result.forEach(grp => {
            grp.attendances.sort((a, b) => new Date(a.punchIn?.time || 0) - new Date(b.punchIn?.time || 0));
        });

        return result;
    };

    /* ── filtered attendance partitions ── */
    const staffDriversRaw = useMemo(() => reportsData.attendance.filter(r => r.driver && !r.vehicle?.isOutsideCar && !r.isOutsideCar && !r.isFreelancer && !r.driver?.isFreelancer).map(r => ({ ...r, entryType: 'attendance' })), [reportsData.attendance]);
    const freelancerDriversRaw = useMemo(() => reportsData.attendance.filter(r => r.driver && (r.isFreelancer || r.driver?.isFreelancer)).map(r => ({ ...r, entryType: 'attendance' })), [reportsData.attendance]);

    const staffDrivers = useMemo(() => groupAttendance(staffDriversRaw), [staffDriversRaw]);
    const freelancerDrivers = useMemo(() => groupAttendance(freelancerDriversRaw), [freelancerDriversRaw]);
    const standaloneParking = useMemo(() => (reportsData.parking || []).map(r => ({ ...r, entryType: 'parking' })), [reportsData.parking]);

    const applySearch = (list) => {
        if (!searchTerm) return list;
        const t = searchTerm.toLowerCase();
        return list.filter(r => (r.driver?.name || r.driverName || '').toLowerCase().includes(t) || (r.vehicle?.carNumber || '').toLowerCase().includes(t) || (r.driver?.mobile || '').includes(t));
    };

    /* navigate dates */
    const shiftDays = (n) => {
        let baseDate;
        if (selectedDay === 'All') {
            const today = new Date();
            // If the selected month/year is the current one, start navigation from TODAY
            if (selectedMonth === today.getMonth() && selectedYear === today.getFullYear()) {
                baseDate = today;
            } else {
                // Otherwise start from the 1st of that month
                baseDate = new Date(selectedYear, selectedMonth, 1);
            }
        } else {
            baseDate = new Date(selectedYear, selectedMonth, parseInt(selectedDay));
        }
        baseDate.setDate(baseDate.getDate() + n);
        setSelectedYear(baseDate.getFullYear());
        setSelectedMonth(baseDate.getMonth());
        setSelectedDay(baseDate.getDate().toString());
    };

    /* ── Attendance row renderer (shared for Staff + Freelancers + Outside) ── */
    const ATT_HEADERS = ['Date', 'Driver & Vehicle', 'Punch In', 'Punch Out', 'Open KM', 'Close KM', 'Total KM', 'Fuel', 'Parking', 'Salary', 'Status', 'Action'];
    const LOGBOOK_HEADERS = ['Date', 'Type', 'Driver & Vehicle', 'Punch In', 'Punch Out', 'Open KM', 'Close KM', 'Total KM', 'Fuel', 'Parking', 'Salary', 'Status', 'Action'];

    /* ── Attendance row renderer ── */
    const AttRow = ({ r, idx, isLogbook = false }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const entryType = r.entryType || 'attendance';
        const isGroup = entryType === 'attendance_group';
        const isCompleted = r.status === 'completed';
        const inTime = fmtTime(r.punchIn?.time);
        const outTime = fmtTime(r.punchOut?.time);
        const openKM = isGroup ? r.attendances[0]?.punchIn?.km : (r.punchIn?.km ?? '--');
        const closeKM = isGroup ? r.attendances[r.attendances.length - 1]?.punchOut?.km : (r.punchOut?.km ?? '--');
        const totalKM = isGroup ? r.totalKM : (r.totalKM ?? (typeof openKM === 'number' && typeof closeKM === 'number' ? closeKM - openKM : '--'));

        const wage = Number(r.dailyWage) || 0;
        const bonus = isGroup ? r.bonusAmt : Math.max((Number(r.punchOut?.allowanceTA) || 0) + (Number(r.punchOut?.nightStayAmount) || 0), Number(r.outsideTrip?.bonusAmount) || 0);
        const parkAmt = isGroup ? r.parkAmt : ((entryType === 'parking' ? Number(r.amount) : Number(r.punchOut?.tollParkingAmount)) || 0);
        const reimbursableParkAmt = isGroup ? r.reimbursableParkAmt : (r.punchOut?.parkingPaidBy !== 'Office' ? parkAmt : 0);
        const parkBy = r.punchOut?.parkingPaidBy || (entryType === 'parking' ? 'Office' : 'Self');
        const fuelAmt = isGroup ? r.fuelAmt : (Number(r.fuel?.amount) || 0);

        // Total to show in salary column (Wage + Bonus - exclude parking reimbursement to avoid double-showing)
        const rowSalaryTotal = wage + bonus;

        const isFreelancer = r.isFreelancer || r.driver?.isFreelancer;

        let typeLabel = isFreelancer ? 'Freelancer' : 'Staff';
        let typeColor = isFreelancer ? '#a78bfa' : '#34d399';
        let typeBg = isFreelancer ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)';
        let typeBorder = isFreelancer ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)';

        if (entryType === 'parking') {
            typeLabel = 'Parking (Exp)';
            typeColor = '#818cf8';
            typeBg = 'rgba(129,140,248,0.1)';
            typeBorder = 'rgba(129,140,248,0.2)';
        }

        return (
            <>
                <TR idx={idx}>
                    <TD noWrap>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isGroup && r.attendances.length > 1 && (
                                <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px', display: 'flex', transition: '0.2s', transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                                    <ChevronRight size={14} />
                                </button>
                            )}
                            <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: '13px' }}>{fmt(r.date)}</span>
                        </div>
                    </TD>
                    {isLogbook && (
                        <TD noWrap>
                            <span style={{
                                fontSize: '9px',
                                fontWeight: '900',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: typeBg,
                                color: typeColor,
                                border: `1px solid ${typeBorder}`,
                                textTransform: 'uppercase'
                            }}>
                                {typeLabel}
                            </span>
                        </TD>
                    )}
                    <TD>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                <UserIcon size={15} color="rgba(255,255,255,0.5)" />
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '900', color: 'white' }}>{r.driver?.name || 'Unknown'}</div>
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                                    {isGroup
                                        ? <><Users size={10} style={{ marginRight: '3px' }} /> {r.attendances.length} Duty Logs · {Array.from(new Set(r.attendances.map(a => a.vehicle?.carNumber).filter(Boolean))).join(', ') || 'No Machine'}</>
                                        : r.vehicle?.carNumber || 'No Machine'
                                    }</div>
                            </div>
                        </div>
                    </TD>
                    <TD noWrap>{entryType.includes('attendance') ? <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: '800', fontSize: '13px' }}><ArrowUpRight size={13} />{inTime}</div> : '--'}</TD>
                    <TD noWrap>
                        {entryType.includes('attendance') ? (isCompleted
                            ? <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f43f5e', fontWeight: '800', fontSize: '13px' }}><ArrowDownLeft size={13} />{outTime}</div>
                            : <StatusBadge ok={false} badLabel="⏳ On Duty" />) : '--'}
                    </TD>
                    <TD noWrap>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: entryType.includes('attendance') ? '#38bdf8' : 'rgba(255,255,255,0.1)', fontWeight: '900', fontSize: '14px' }}>{openKM}</div>
                            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: '800' }}>OPEN KM</div>
                        </div>
                    </TD>
                    <TD noWrap>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: (entryType.includes('attendance') && isCompleted) ? '#f43f5e' : 'rgba(255,255,255,0.1)', fontWeight: '900', fontSize: '14px' }}>{closeKM}</div>
                            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: '800' }}>CLOSE KM</div>
                        </div>
                    </TD>
                    <TD noWrap>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: entryType.includes('attendance') ? 'white' : 'rgba(255,255,255,0.1)', fontWeight: '900', fontSize: '14px' }}>{totalKM !== '--' ? totalKM : '--'}</div>
                            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: '800' }}>KM RUN</div>
                        </div>
                    </TD>
                    <TD>
                        {fuelAmt > 0
                            ? <div><span style={{ color: '#f59e0b', fontWeight: '900', fontSize: '13px' }}>₹{fuelAmt}</span><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{isGroup ? r.attendances.filter(a => a.fuel?.amount > 0).length : (r.fuel?.entries?.length || 1)} fill</div></div>
                            : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                    </TD>
                    <TD>
                        {parkAmt > 0
                            ? <div>
                                <span style={{ color: '#818cf8', fontWeight: '900', fontSize: '13px' }}>₹{parkAmt}</span>
                                <div style={{ fontSize: '9px', fontWeight: '800', marginTop: '2px', color: parkBy === 'Office' ? '#10b981' : '#a78bfa' }}>{parkBy === 'Office' ? 'Office Paid' : ''}</div>
                            </div>
                            : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                    </TD>
                    <TD><div>{entryType.includes('attendance') ? <><span style={{ color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹{rowSalaryTotal.toLocaleString()}</span>{bonus > 0 && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Base ₹{wage} + ₹{bonus} T/A</div>}</> : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>—</span>}</div></TD>
                    <TD noWrap>{entryType.includes('attendance') ? <StatusBadge ok={isCompleted} okLabel={isGroup ? `✓ ${r.attendances.length} Duties` : "✓ Done"} badLabel="⏳ Active" /> : <StatusBadge ok={true} okLabel="✓ Recorded" />}</TD>
                    <TD>
                        <ActionBtns
                            onView={() => setSelectedItem({ ...r, entryType: entryType === 'parking' ? 'parking' : (isGroup ? 'attendance_group' : 'attendance'), mode: 'view' })}
                            onEdit={(isFreelancer && !isCompleted) ? null : (() => {
                                if (isGroup && r.attendances?.length > 1) setIsExpanded(!isExpanded);
                                else setEditingItem(isGroup ? r.attendances[0] : r);
                            })}
                            onDelete={() => {
                                if (isGroup && r.attendances?.length > 1) setIsExpanded(!isExpanded);
                                else handleDelete(isGroup ? { ...r.attendances[0], entryType: 'attendance' } : { ...r, entryType: entryType === 'parking' ? 'parking' : 'attendance' });
                            }}
                            onDeleteBonus={(isFreelancer && bonus > 0 && isCompleted) ? (() => handleDeleteBonus(isGroup ? r.attendances[0] : r)) : null}
                        />
                    </TD>
                </TR>

                <AnimatePresence>
                    {isExpanded && isGroup && r.attendances.length > 1 && (
                        <motion.tr initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <td colSpan={isLogbook ? 13 : 12} style={{ padding: '0 16px 16px 48px' }}>
                                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Breakdown of {r.attendances.length} Duties</div>
                                    {r.attendances.map((att, attIdx) => (
                                        <div key={att._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ minWidth: '100px' }}>
                                                    <div style={{ fontSize: '13px', color: 'white', fontWeight: '800' }}>Duty #{attIdx + 1}</div>
                                                    <div style={{ fontSize: '10px', color: '#818cf8', fontWeight: '900', marginTop: '2px' }}>{att.vehicle?.carNumber || 'No Machine'}</div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><div style={{ fontSize: '12px', color: '#10b981', fontWeight: '800' }}>{fmtTime(att.punchIn?.time)}</div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>IN KM: {att.punchIn?.km || '--'}</div></div><div style={{ color: 'rgba(255,255,255,0.1)' }}>→</div><div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}><div style={{ fontSize: '12px', color: '#f43f5e', fontWeight: '800' }}>{fmtTime(att.punchOut?.time) || 'ACTIVE'}</div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>OUT KM: {att.punchOut?.km || '--'}</div></div><div style={{ marginLeft: '15px', padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px' }}><div style={{ fontSize: '10px', color: 'white', fontWeight: '950' }}>{att.totalKM || (att.punchOut?.km - att.punchIn?.km) || 0} KM</div></div></div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    {attIdx === 0 && Number(r.dailyWage) > 0 && (
                                                        <div style={{ marginBottom: '2px' }}>
                                                            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '950' }}>₹{(Number(r.dailyWage) || 0).toLocaleString()}</div>
                                                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Salary</div>
                                                        </div>
                                                    )}
                                                    {Math.max((Number(att.punchOut?.allowanceTA) || 0) + (Number(att.punchOut?.nightStayAmount) || 0), Number(att.outsideTrip?.bonusAmount) || 0) > 0 && (
                                                        <div>
                                                            <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: '950' }}>₹{Math.max((Number(att.punchOut?.allowanceTA) || 0) + (Number(att.punchOut?.nightStayAmount) || 0), Number(att.outsideTrip?.bonusAmount) || 0).toLocaleString()}</div>
                                                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>T/A</div>
                                                        </div>
                                                    )}
                                                    {!(attIdx === 0 && Number(r.dailyWage) > 0) && !(Math.max((Number(att.punchOut?.allowanceTA) || 0) + (Number(att.punchOut?.nightStayAmount) || 0), Number(att.outsideTrip?.bonusAmount) || 0) > 0) && (
                                                        <div>
                                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.1)', fontWeight: '950' }}>₹0</div>
                                                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>T/A</div>
                                                        </div>
                                                    )}
                                                </div>
                                                <ActionBtns
                                                    onView={() => setSelectedItem({ ...att, entryType: 'attendance', mode: 'view' })}
                                                    onEdit={(isFreelancer && att.status !== 'completed') ? null : (() => setEditingItem({ ...att, isSecondary: attIdx > 0 }))}
                                                    onDelete={() => handleDelete({ ...att, entryType: 'attendance' })}
                                                    onDeleteBonus={(isFreelancer && (Math.max((Number(att.punchOut?.allowanceTA) || 0) + (Number(att.punchOut?.nightStayAmount) || 0), Number(att.outsideTrip?.bonusAmount) || 0) > 0) && att.status === 'completed') ? (() => handleDeleteBonus(att)) : null}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </td>
                        </motion.tr>
                    )}
                </AnimatePresence>
            </>
        );
    };



    /* ── render the active tab content ── */
    const renderSingleTab = (tabId) => {
        const cfg = TAB_CONFIG[tabId] || {};
        switch (tabId) {
            /* ── STAFF DRIVERS ── */
            case 'drivers': {
                const data = applySearch(staffDrivers);
                return (
                    <TableSection tabId="drivers" fromDate={fromDate} toDate={toDate}
                        headers={ATT_HEADERS}
                        rows={data.map((r, i) => <AttRow key={r._id || `staff-${i}`} r={r} idx={i} />)}
                        empty="No staff driver records found."
                    />
                );
            }

            /* ── FREELANCERS ── */
            case 'freelancers': {
                const data = applySearch(freelancerDrivers);
                return (
                    <TableSection tabId="freelancers" fromDate={fromDate} toDate={toDate}
                        headers={ATT_HEADERS}
                        rows={data.map((r, i) => <AttRow key={r._id || `freelance-${i}`} r={r} idx={i} showFreelancerCols />)}
                        empty="No freelancer records found."
                    />
                );
            }

            /* ── PARKING ── */
            case 'parking': {
                const data = applySearch(standaloneParking);
                return (
                    <TableSection tabId="parking" fromDate={fromDate} toDate={toDate}
                        headers={ATT_HEADERS}
                        rows={data.map((r, i) => <AttRow key={r._id} r={r} idx={i} />)}
                        empty="No standalone parking records found."
                    />
                );
            }

            default: return null;
        }
    };

    const renderContent = () => {
        if (loading) return (
            <div style={{ padding: '80px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.3)' }}>
                    <div className="spinner" /><span style={{ fontSize: '14px' }}>Loading data...</span>
                </div>
            </div>
        );

        if (location.pathname.includes('log-book')) {
            const rawData = [...staffDriversRaw, ...freelancerDriversRaw].filter(r => {
                const isFreelancer = r.isFreelancer || r.driver?.isFreelancer;
                if (isFreelancer) return activeTabs.includes('freelancers') || activeTabs.length > 1;
                return activeTabs.includes('drivers') || activeTabs.length > 1;
            });

            const data = groupAttendance(rawData).sort((a, b) => new Date(b.date) - new Date(a.date));
            const searchedData = applySearch(data);

            return (
                <TableSection tabId="logbook" fromDate={fromDate} toDate={toDate}
                    headers={LOGBOOK_HEADERS}
                    rows={searchedData.map((r, i) => <AttRow key={r._id} r={r} idx={i} isLogbook />)}
                    empty="No log book records found."
                />
            );
        }

        return <>{activeTabs.map(t => <React.Fragment key={t}>{renderSingleTab(t)}</React.Fragment>)}</>;
    };

    return (
        <div className={isSubComponent ? "sub-component" : "container-fluid"} style={{ paddingBottom: '60px', background: 'radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.03), transparent 40%)' }}>
            {!isSubComponent && <SEO title="Daily Reports" description="Premium daily fleet reports with attendance, fuel, maintenance, advances and more." />}

            {/* ── Header ── */}
            {!isSubComponent && (
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
                            <FileText size={24} color="white" />
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Operational Insights</div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(22px,5vw,30px)', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>
                                {location.pathname.includes('driver-duty') ? 'Driver ' : (location.pathname.includes('freelancer-duty') ? 'Freelancer ' : (location.pathname.includes('log-book') ? 'Overall ' : 'Daily '))}
                                <span className="text-gradient-yellow">{location.pathname.includes('log-book') ? 'Log Book' : 'Duty'}</span>
                            </h1>
                        </div>
                    </div>

                    {/* Date Navigator */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(0,0,0,0.4)',
                            padding: '4px',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                            <button onClick={() => shiftDays(-1)} style={{
                                width: '42px', height: '42px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s'
                            }}> <ChevronLeft size={18} /> </button>

                            <div
                                onClick={(e) => { const i = e.currentTarget.querySelector('input'); if (i.showPicker) i.showPicker(); else i.click(); }}
                                style={{ height: '42px', minWidth: '140px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '16px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', margin: '0 6px' }}
                            >
                                <span style={{ fontSize: '13px', fontWeight: '950', color: 'white', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                                    {selectedDay === 'All' ?
                                        ` ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth]} ${selectedYear}` :
                                        fmt(toISTDateString(new Date(selectedYear, selectedMonth, parseInt(selectedDay))))}
                                </span>
                                <input
                                    type="date"
                                    value={toISTDateString(new Date(selectedYear, selectedMonth, selectedDay === 'All' ? 1 : parseInt(selectedDay)))}
                                    onChange={e => {
                                        const d = new Date(e.target.value);
                                        setSelectedYear(d.getFullYear());
                                        setSelectedMonth(d.getMonth());
                                        setSelectedDay(d.getDate().toString());
                                    }}
                                    style={{ position: 'absolute', inset: 0, opacity: 0 }}
                                />
                            </div>

                            <button onClick={() => shiftDays(1)} style={{
                                width: '42px', height: '42px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s'
                            }}> <ChevronRight size={18} /> </button>
                        </div>

                        {selectedDay !== 'All' && (
                            <button
                                onClick={() => setSelectedDay('All')}
                                style={{
                                    height: '50px',
                                    padding: '0 20px',
                                    borderRadius: '16px',
                                    background: 'rgba(251, 191, 36, 0.1)',
                                    border: '1px solid rgba(251, 191, 36, 0.2)',
                                    color: '#fbbf24',
                                    fontSize: '11px',
                                    fontWeight: '950',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                <Calendar size={14} /> Full Month
                            </button>
                        )}

                        <select
                            value={selectedMonth}
                            onChange={e => {
                                setSelectedMonth(Number(e.target.value));
                                setSelectedDay('All');
                            }}
                            style={{ height: '50px', padding: '0 12px', fontSize: '12px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontWeight: '800', width: '90px', outline: 'none' }}
                        >
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                                <option key={m} value={idx} style={{ background: '#0f172a' }}>{m}</option>
                            ))}
                        </select>

                        <select
                            value={selectedYear}
                            onChange={e => {
                                setSelectedYear(Number(e.target.value));
                                setSelectedDay('All');
                            }}
                            style={{ height: '50px', padding: '0 12px', fontSize: '12px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontWeight: '800', width: '80px', outline: 'none' }}
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y} style={{ background: '#0f172a' }}>{y}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleDownloadExcel}
                            style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0 20px', height: '50px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                        >
                            <Download size={14} /> EXCEL
                        </button>
                    </div>
                </header>
            )}

            {/* Sub-component quick header (Date/Search) */}
            {isSubComponent && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', padding: '0 4px', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '800', margin: 0 }}>Operational Duty Logs</h2>
                        <button onClick={handleDownloadExcel} style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Download size={12} /> EXCEL
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input type="date" value={fromDate} onChange={e => handleFromDate(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', outline: 'none' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Tab Bar (multi-select) ── */}
            {tabList.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '22px', flexWrap: 'wrap' }}>
                    {/* Primary Tab Group */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', padding: '6px', display: 'flex', gap: '4px' }}>
                        {tabList.map(tab => {
                            const isActive = activeTabs.includes(tab.id) && activeTabs.length === 1;
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id} onClick={() => toggleTab(tab.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '14px', cursor: 'pointer', transition: '0.2s', fontSize: '12px', fontWeight: '900',
                                        background: isActive ? tab.bg : 'transparent',
                                        border: 'none',
                                        color: isActive ? 'white' : 'rgba(255,255,255,0.3)',
                                    }}
                                >
                                    <Icon size={14} color={isActive ? tab.color : 'rgba(255,255,255,0.3)'} />{tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Standalone 'Both' Toggle */}
                    {location.pathname.includes('log-book') && (
                        <button onClick={() => setActiveTabs(['drivers', 'freelancers'])}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', borderRadius: '18px', cursor: 'pointer', transition: '0.3s', fontSize: '12px', fontWeight: '950',
                                background: (activeTabs.includes('drivers') && activeTabs.includes('freelancers')) ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${(activeTabs.includes('drivers') && activeTabs.includes('freelancers')) ? '#fbbf2460' : 'rgba(255,255,255,0.08)'}`,
                                color: (activeTabs.includes('drivers') && activeTabs.includes('freelancers')) ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                                boxShadow: (activeTabs.includes('drivers') && activeTabs.includes('freelancers')) ? '0 8px 25px rgba(251, 191, 36, 0.1)' : 'none'
                            }}
                        >
                            <FileText size={15} /> All Duties (Both)
                        </button>
                    )}
                </div>
            )}

            {/* ── Search Bar ── */}
            <div style={{ position: 'relative', marginBottom: '22px', maxWidth: '420px' }}>
                <input type="text" placeholder="Search Car Logs…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="input-field" style={{ width: '100%', paddingLeft: '44px', height: '46px', borderRadius: '13px', marginBottom: 0 }} />
                <Search size={18} style={{ position: 'absolute', left: '15px', top: '14px', color: 'var(--text-muted)' }} />
                {searchTerm && <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '13px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={16} /></button>}
            </div>

            {/* ── Main Content ── */}
            {renderContent()}

            {/* ── Modals ── */}
            <AnimatePresence>
                {selectedItem && (
                    <AttendanceModal
                        key="view-modal"
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        onEdit={setEditingItem}
                        onDelete={handleDelete}
                    />
                )}
                {editingItem && <EditAttendanceModal key="edit-modal" item={editingItem} onClose={() => setEditingItem(null)} onUpdate={handleUpdateAttendance} />}
            </AnimatePresence>
        </div>
    );
};

export default Reports;