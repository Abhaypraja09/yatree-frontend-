import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';
import * as XLSX from 'xlsx';
import {
    CalendarIcon, Search, Download, Eye, ArrowUpRight, ArrowDownLeft,
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
    drivers: { label: 'Staff Drivers', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: UserIcon },
    freelancers: { label: 'Freelancers', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: Users },
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
const ActionBtns = ({ onView, onEdit, onDelete }) => (
    <div style={{ display: 'flex', gap: '6px' }}>
        {onView && <button onClick={onView} title="View Details" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', color: '#38bdf8', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', transition: 'all 0.2s' }} className="btn-hover-scale"><Eye size={14} /> View</button>}
        {onEdit && <button onClick={onEdit} title="Edit" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', transition: 'all 0.2s' }} className="btn-hover-scale"><Edit2 size={14} /></button>}
        {onDelete && <button onClick={onDelete} title="Delete" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }} className="btn-hover-scale"><Trash2 size={14} /></button>}
    </div>
);

/* ─── TableWrapper ─── */
const TableSection = ({ tabId, fromDate, toDate, chips, headers, rows, empty }) => {
    const cfg = TAB_CONFIG[tabId] || {};
    return (
        <div style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${cfg.color || '#fff'}20`, borderRadius: '20px', overflow: 'hidden', marginBottom: '28px' }}>
            <SectionBanner tabId={tabId} count={rows?.length || 0} chips={chips} fromDate={fromDate} toDate={toDate} />
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '1000px' }}>
                    <thead><tr>{headers.map((h, i) => <Th key={i} color={cfg.color}>{h}</Th>)}</tr></thead>
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
const Reports = () => {
    const { user } = useAuth();
    const { selectedCompany } = useCompany();
    const location = useLocation();

    const getToday = () => todayIST();

    const [isRange, setIsRange] = useState(false);
    const [fromDate, setFromDate] = useState(getToday());
    const [toDate, setToDate] = useState(getToday());

    const [reports, setReports] = useState([]);
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
            } else if (location.pathname.includes('freelancer-duty')) {
                setActiveTabs(['freelancers']);
            } else if (location.pathname.includes('log-book')) {
                setActiveTabs(['drivers', 'freelancers']);
            } else if (activeTabs.length === 0) {
                setActiveTabs([tabList[0].id]);
            }
        }
    }, [tabList, location.pathname]);

    const toggleTab = (id) => {
        setActiveTabs(prev => {
            const next = prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id];
            return next.length === 0 ? [tabList[0].id] : next;
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
            setToDate(getToday());
        } else if (!hasRangeTab && isRange) {
            setIsRange(false);
            setFromDate(getToday());
            setToDate(getToday());
        }
    }, [activeTabs]);
    */

    useEffect(() => { if (selectedCompany) fetchReports(); }, [selectedCompany, fromDate, toDate, activeTabs]);

    const fetchReports = async () => {
        if (!selectedCompany) return;
        if (reports.length === 0) setLoading(true); // Flicker-free background updates
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/reports/${selectedCompany._id}?from=${fromDate}&to=${toDate}&_t=${Date.now()}`, { headers: { Authorization: `Bearer ${userInfo.token}` } });

            setReports(data.attendance || []);
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

    /* ── filtered attendance partitions ── */
    const staffDrivers = useMemo(() => reports.filter(r => !r.vehicle?.isOutsideCar && !r.isOutsideCar && !r.isFreelancer && !r.driver?.isFreelancer).map(r => ({ ...r, entryType: 'attendance' })), [reports]);
    const freelancerDrivers = useMemo(() => reports.filter(r => r.isFreelancer || r.driver?.isFreelancer).map(r => ({ ...r, entryType: 'attendance' })), [reports]);

    const applySearch = (list) => {
        if (!searchTerm) return list;
        const t = searchTerm.toLowerCase();
        return list.filter(r => (r.driver?.name || r.driverName || '').toLowerCase().includes(t) || (r.vehicle?.carNumber || '').toLowerCase().includes(t) || (r.driver?.mobile || '').includes(t));
    };

    /* navigate dates */
    const shiftDays = (n) => {
        const f = nowIST(fromDate);
        f.setUTCDate(f.getUTCDate() + n);
        const fStr = f.toISOString().split('T')[0];

        if (isRange) {
            // Also shift toDate by same amount to maintain the range window
            const t = nowIST(toDate);
            t.setUTCDate(t.getUTCDate() + n);
            const tStr = t.toISOString().split('T')[0];
            setFromDate(fStr);
            setToDate(tStr);
        } else {
            setFromDate(fStr);
            setToDate(fStr);
        }
    };
    const handleFromDate = (val) => { setFromDate(val); if (!isRange) setToDate(val); };
    const handleToggleRange = () => {
        setIsRange(!isRange);
        if (!isRange) {
            // Switching to range: set fromDate to 1st of month to make it meaningful
            setFromDate(firstDayOfMonthIST());
            setToDate(todayIST());
        } else {
            // Switching back to single: set both to today or current fromDate
            setToDate(fromDate);
        }
    };

    /* ── Attendance row renderer (shared for Staff + Freelancers + Outside) ── */
    const ATT_HEADERS = ['Date', 'Driver & Vehicle', 'Punch In', 'Punch Out', 'Open KM', 'Close KM', 'Total KM', 'Fuel', 'Parking', 'Salary', 'Status', 'Action'];
    const LOGBOOK_HEADERS = ['Date', 'Type', 'Driver & Vehicle', 'Punch In', 'Punch Out', 'Open KM', 'Close KM', 'Total KM', 'Fuel', 'Parking', 'Salary', 'Status', 'Action'];

    /* ── Attendance row renderer ── */
    const AttRow = ({ r, idx, isLogbook = false }) => {
        const isCompleted = r.status === 'completed';
        const inTime = fmtTime(r.punchIn?.time);
        const outTime = fmtTime(r.punchOut?.time);
        const openKM = r.punchIn?.km ?? '--';
        const closeKM = r.punchOut?.km ?? '--';
        const totalKM = r.totalKM ?? (typeof openKM === 'number' && typeof closeKM === 'number' ? closeKM - openKM : '--');
        const wage = Number(r.dailyWage) || 0;
        const bonus = Math.max((Number(r.punchOut?.allowanceTA) || 0) + (Number(r.punchOut?.nightStayAmount) || 0), Number(r.outsideTrip?.bonusAmount) || 0);
        const parkAmt = Number(r.punchOut?.tollParkingAmount) || 0;
        const parkBy = r.punchOut?.parkingPaidBy || 'Self';
        const fuelAmt = Number(r.fuel?.amount) || 0;

        const isFreelancer = r.isFreelancer || r.driver?.isFreelancer;

        return (
            <TR idx={idx}>
                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: '13px' }}>{fmt(r.date)}</span></TD>
                {isLogbook && (
                    <TD noWrap>
                        <span style={{
                            fontSize: '9px',
                            fontWeight: '900',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isFreelancer ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)',
                            color: isFreelancer ? '#a78bfa' : '#34d399',
                            border: `1px solid ${isFreelancer ? 'rgba(139,92,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
                            textTransform: 'uppercase'
                        }}>
                            {isFreelancer ? 'Freelancer' : 'Staff'}
                        </span>
                    </TD>
                )}
                <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                            <UserIcon size={15} color="rgba(255,255,255,0.5)" />
                        </div>
                        <div>
                            <div style={{ color: 'white', fontWeight: '800', fontSize: '13px', whiteSpace: 'nowrap' }}>{r.driver?.name || r.vehicle?.driverName || 'N/A'}</div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', marginTop: '1px' }}><Car size={9} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />{r.vehicle?.carNumber?.split('#')[0] || '--'}</div>
                            {r.pickUpLocation && <div style={{ fontSize: '9px', color: '#38bdf8', marginTop: '1px', fontWeight: '700' }}>📍 {r.pickUpLocation}</div>}
                            {r.dropLocation && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>🏁 {r.dropLocation}</div>}
                        </div>
                    </div>
                </TD>
                <TD noWrap><div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: '800', fontSize: '13px' }}><ArrowUpRight size={13} />{inTime}</div></TD>
                <TD noWrap>
                    {isCompleted
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f43f5e', fontWeight: '800', fontSize: '13px' }}><ArrowDownLeft size={13} />{outTime}</div>
                        : <StatusBadge ok={false} badLabel="⏳ On Duty" />}
                </TD>
                <TD noWrap>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#38bdf8', fontWeight: '900', fontSize: '14px' }}>{openKM}</div>
                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: '800' }}>OPEN KM</div>
                    </div>
                </TD>
                <TD noWrap>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: isCompleted ? '#f43f5e' : 'rgba(255,255,255,0.2)', fontWeight: '900', fontSize: '14px' }}>{closeKM}</div>
                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: '800' }}>CLOSE KM</div>
                    </div>
                </TD>
                <TD noWrap>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'white', fontWeight: '900', fontSize: '14px' }}>{totalKM !== '--' ? totalKM : '--'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: '800' }}>KM RUN</div>
                    </div>
                </TD>
                <TD>
                    {fuelAmt > 0
                        ? <div><span style={{ color: '#f59e0b', fontWeight: '900', fontSize: '13px' }}>₹{fuelAmt}</span><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>{r.fuel?.entries?.length || 1} fill</div></div>
                        : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                </TD>
                <TD>
                    {parkAmt > 0
                        ? <div>
                            <span style={{ color: '#818cf8', fontWeight: '900', fontSize: '13px' }}>₹{parkAmt}</span>
                            <div style={{ fontSize: '9px', fontWeight: '800', marginTop: '2px', color: parkBy === 'Office' ? '#10b981' : '#a78bfa' }}>{parkBy === 'Office' ? 'Office Paid' : 'Self Paid'}</div>
                        </div>
                        : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                </TD>
                <TD>
                    <div>
                        <span style={{ color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹{(wage + bonus).toLocaleString()}</span>
                        {bonus > 0 && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Base ₹{wage} + ₹{bonus}</div>}
                    </div>
                </TD>
                <TD noWrap><StatusBadge ok={isCompleted} okLabel="✓ Done" badLabel="⏳ Active" /></TD>
                <TD>
                    <ActionBtns
                        onView={() => setSelectedItem({ ...r, entryType: 'attendance' })}
                        onEdit={() => setEditingItem(r)}
                        onDelete={() => handleDelete({ ...r, entryType: 'attendance' })}
                    />
                </TD>
            </TR>
        );
    };



    /* ── render the active tab content ── */
    const renderSingleTab = (tabId) => {
        const cfg = TAB_CONFIG[tabId] || {};
        switch (tabId) {
            /* ── STAFF DRIVERS ── */
            case 'drivers': {
                const data = applySearch(staffDrivers);
                const totalWage = data.reduce((s, r) => s + (Number(r.dailyWage) || 0), 0);
                const totalKMs = data.reduce((s, r) => s + (Number(r.totalKM) || 0), 0);
                const totalFuel = data.reduce((s, r) => s + (Number(r.fuel?.amount) || 0), 0);
                return (
                    <TableSection tabId="drivers" fromDate={fromDate} toDate={toDate}
                        chips={[
                            <Chip key="c" label="Total Duties" value={data.length} color="#10b981" />,
                            <Chip key="km" label="Total KM" value={`${totalKMs.toLocaleString()}`} color="#38bdf8" />,
                            <Chip key="f" label="Fuel Amt" value={`₹${totalFuel.toLocaleString()}`} color="#f59e0b" />,
                            <Chip key="w" label="Total Salary" value={`₹${totalWage.toLocaleString()}`} color="#10b981" />,
                        ]}
                        headers={ATT_HEADERS}
                        rows={data.map((r, i) => <AttRow key={r._id} r={r} idx={i} />)}
                        empty="No staff driver records found."
                    />
                );
            }

            /* ── FREELANCERS ── */
            case 'freelancers': {
                const data = applySearch(freelancerDrivers);
                const totalWage = data.reduce((s, r) => s + (Number(r.dailyWage) || 0), 0);
                const totalKMs = data.reduce((s, r) => s + (Number(r.totalKM) || 0), 0);
                const totalFuel = data.reduce((s, r) => s + (Number(r.fuel?.amount) || 0), 0);
                const totalParking = data.reduce((s, r) => s + (Number(r.punchOut?.tollParkingAmount) || 0), 0);
                return (
                    <TableSection tabId="freelancers" fromDate={fromDate} toDate={toDate}
                        chips={[
                            <Chip key="c" label="Total Duties" value={data.length} color="#8b5cf6" />,
                            <Chip key="km" label="Total KM" value={`${totalKMs.toLocaleString()}`} color="#38bdf8" />,
                            <Chip key="f" label="Fuel Amt" value={`₹${totalFuel.toLocaleString()}`} color="#f59e0b" />,
                            <Chip key="p" label="Total Parking" value={`₹${totalParking.toLocaleString()}`} color="#818cf8" />,
                            <Chip key="w" label="Total Salary" value={`₹${totalWage.toLocaleString()}`} color="#8b5cf6" />,
                        ]}
                        headers={ATT_HEADERS}
                        rows={data.map((r, i) => <AttRow key={r._id} r={r} idx={i} showFreelancerCols />)}
                        empty="No freelancer records found."
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
                    <div className="spinner" /><span style={{ fontSize: '14px' }}>Loading data…</span>
                </div>
            </div>
        );

        if (location.pathname.includes('log-book')) {
            const data = [...staffDrivers, ...freelancerDrivers].filter(r => {
                const isFreelancer = r.isFreelancer || r.driver?.isFreelancer;
                if (isFreelancer) return activeTabs.includes('freelancers');
                return activeTabs.includes('drivers');
            }).sort((a, b) => new Date(b.date) - new Date(a.date));

            const searchedData = applySearch(data);
            const totalWage = searchedData.reduce((s, r) => s + (Number(r.dailyWage) || 0) + Math.max((Number(r.punchOut?.allowanceTA) || 0) + (Number(r.punchOut?.nightStayAmount) || 0), Number(r.outsideTrip?.bonusAmount) || 0), 0);
            const totalKMs = searchedData.reduce((s, r) => s + (Number(r.totalKM) || 0), 0);
            const totalFuel = searchedData.reduce((s, r) => s + (Number(r.fuel?.amount) || 0), 0);

            return (
                <TableSection tabId="logbook" fromDate={fromDate} toDate={toDate}
                    chips={[
                        <Chip key="c" label="Total Records" value={searchedData.length} color="#fbbf24" />,
                        <Chip key="km" label="Total KM" value={`${totalKMs.toLocaleString()}`} color="#38bdf8" />,
                        <Chip key="f" label="Fuel Amt" value={`₹${totalFuel.toLocaleString()}`} color="#f59e0b" />,
                        <Chip key="w" label="Total Payout" value={`₹${totalWage.toLocaleString()}`} color="#10b981" />,
                    ]}
                    headers={LOGBOOK_HEADERS}
                    rows={searchedData.map((r, i) => <AttRow key={r._id} r={r} idx={i} isLogbook />)}
                    empty="No log book records found."
                />
            );
        }

        return <>{activeTabs.map(t => <React.Fragment key={t}>{renderSingleTab(t)}</React.Fragment>)}</>;
    };

    return (
        <div className="container-fluid" style={{ paddingBottom: '60px', background: 'radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.03), transparent 40%)' }}>
            <SEO title="Daily Reports" description="Premium daily fleet reports with attendance, fuel, maintenance, advances and more." />

            {/* ── Header ── */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                    <button onClick={() => shiftDays(-1)} style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={18} />
                    </button>

                    <button
                        onClick={handleToggleRange}
                        style={{ background: isRange ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isRange ? '#10b981' : 'rgba(255,255,255,0.1)'}30`, color: isRange ? '#10b981' : 'rgba(255,255,255,0.5)', padding: '0 12px', height: '36px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <CalendarIcon size={14} /> {isRange ? 'SINGLE DATE' : 'RANGE'}
                    </button>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', display: 'block', paddingLeft: '4px', marginBottom: '2px' }}>{isRange ? 'FROM' : 'DATE'}</label>
                            <input type="date" value={fromDate} onChange={e => handleFromDate(e.target.value)} onClick={e => e.target.showPicker?.()}
                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }} />
                        </div>
                        {isRange && <>
                            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', marginTop: '14px' }}>→</div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', display: 'block', paddingLeft: '4px', marginBottom: '2px' }}>TO</label>
                                <input type="date" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)} onClick={e => e.target.showPicker?.()}
                                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }} />
                            </div>
                        </>}
                    </div>

                    <button onClick={() => shiftDays(1)} style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={18} />
                    </button>

                    <button
                        onClick={handleDownloadExcel}
                        style={{ marginLeft: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0 20px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', cursor: 'pointer' }}
                        title="Download selected categories to Excel"
                    >
                        <Download size={14} /> EXCEL
                    </button>
                </div>
            </header>

            {/* ── Tab Bar (multi-select) ── */}
            {tabList.length > 1 && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.04)', padding: '8px', marginBottom: '20px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Explore Report Categories</span>
                        <button
                            onClick={handleSelectAll}
                            style={{
                                background: activeTabs.length === tabList.length ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                                border: activeTabs.length === tabList.length ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                color: activeTabs.length === tabList.length ? '#10b981' : 'rgba(255,255,255,0.4)',
                                fontSize: '10px',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                fontWeight: '900',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s',
                                letterSpacing: '0.8px'
                            }}
                        >
                            {activeTabs.length === tabList.length ? '✓ ALL SELECTED' : 'SELECT ALL'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {tabList.map(tab => {
                            const isActive = activeTabs.includes(tab.id);
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id} onClick={() => toggleTab(tab.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', fontSize: '12px', fontWeight: '800',
                                        background: isActive ? tab.bg : 'rgba(255,255,255,0.02)',
                                        border: isActive ? `1px solid ${tab.color}70` : '1px solid rgba(255,255,255,0.06)',
                                        color: isActive ? 'white' : 'rgba(255,255,255,0.3)',
                                        transform: isActive ? 'translateY(-1px)' : 'none',
                                        boxShadow: isActive ? `0 4px 12px ${tab.color}25` : 'none'
                                    }}
                                >
                                    <Icon size={14} color={isActive ? tab.color : 'rgba(255,255,255,0.3)'} />{tab.label}
                                </button>
                            );
                        })}
                    </div>
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
                {selectedItem && <AttendanceModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
                {editingItem && <EditAttendanceModal item={editingItem} onClose={() => setEditingItem(null)} onUpdate={handleUpdateAttendance} />}
            </AnimatePresence>
        </div>
    );
};

export default Reports;
