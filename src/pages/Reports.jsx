import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import {
    CalendarIcon as CalendarIcon, Search, Download, Eye, ArrowUpRight, ArrowDownLeft,
    MapPin, User as UserIcon, Users, Car, Shield, Wallet, CheckCircle2,
    Fuel, Wrench, IndianRupee, Trash2, AlertTriangle, FileText, Edit2,
    ChevronLeft, ChevronRight, TrendingUp, X
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
    outsideCars: { label: 'Outside Cars', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Car },
    fuel: { label: 'Fuel Logs', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: Fuel },
    maintenance: { label: 'Maintenance', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: Wrench },
    advances: { label: 'Advances', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: IndianRupee },
    borderTax: { label: 'Border Tax', color: '#a855f7', bg: 'rgba(168,85,247,0.12)', icon: Shield },
    parking: { label: 'Parking', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', icon: MapPin },
    fastag: { label: 'Fastag Logs', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', icon: Wallet },
    accidentLogs: { label: 'Accident Logs', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', icon: AlertTriangle },
    partsWarranty: { label: 'Parts Warranty', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Shield },
    events: { label: 'Event Management', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: FileText },
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
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700' }}>{count} records · {fmt(fromDate)} – {fmt(toDate)}</div>
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
        {onView && <button onClick={onView} title="View Details" style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', color: '#38bdf8', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800' }}><Eye size={12} /> View</button>}
        {onEdit && <button onClick={onEdit} title="Edit" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800' }}><Edit2 size={12} /></button>}
        {onDelete && <button onClick={onDelete} title="Delete" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: '800' }}><Trash2 size={12} /></button>}
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

    const getToday = () => todayIST();

    const [isRange, setIsRange] = useState(false);
    const [fromDate, setFromDate] = useState(getToday());
    const [toDate, setToDate] = useState(getToday());

    const [reports, setReports] = useState([]);
    const [fastagRecharges, setFastagRecharges] = useState([]);
    const [borderTaxRecords, setBorderTaxRecords] = useState([]);
    const [fuelRecords, setFuelRecords] = useState([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [advanceRecords, setAdvanceRecords] = useState([]);
    const [parkingRecords, setParkingRecords] = useState([]);
    const [accidentLogs, setAccidentLogs] = useState([]);
    const [partsWarrantyRecords, setPartsWarrantyRecords] = useState([]);
    const [eventRecords, setEventRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const tabList = useMemo(() => {
        return Object.entries(TAB_CONFIG)
            .filter(([id]) => {
                if (user?.role === 'Admin') return true;
                const p = user?.permissions || {};
                
                // Group tabs by permission
                const driversTabs = ['drivers', 'freelancers', 'advances'];
                const buySellTabs = ['outsideCars', 'events'];
                const vehicleTabs = ['fuel', 'maintenance', 'borderTax', 'parking', 'fastag', 'accidentLogs', 'partsWarranty'];

                if (driversTabs.includes(id)) return p.driversService;
                if (buySellTabs.includes(id)) return p.buySell;
                if (vehicleTabs.includes(id)) return p.vehiclesManagement;
                
                return true; // Default
            })
            .map(([id, v]) => ({ id, ...v }));
    }, [user?.role, user?.permissions]);

    const [activeTabs, setActiveTabs] = useState(() => {
        if (tabList.length > 0) return [tabList[0].id];
        return ['drivers'];
    });

    const toggleTab = (id) => setActiveTabs(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(t => t !== id) : prev) : [...prev, id]);
    const selectAllTabs = () => setActiveTabs(prev => prev.length === tabList.length ? (tabList.length > 0 ? [tabList[0].id] : []) : tabList.map(t => t.id));

    // Auto-toggle range based on tab selection
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

    useEffect(() => { if (selectedCompany) fetchReports(); }, [selectedCompany, fromDate, toDate]);

    const fetchReports = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/reports/${selectedCompany._id}?from=${fromDate}&to=${toDate}`, { headers: { Authorization: `Bearer ${userInfo.token}` } });

            setReports(data.attendance || []);
            setFastagRecharges(data.fastagRecharges || []);
            setBorderTaxRecords(data.borderTax || []);
            setFuelRecords(data.fuel || []);
            setMaintenanceRecords(data.maintenance || []);
            setAdvanceRecords(data.advances || []);
            setParkingRecords(data.parking || []);
            setAccidentLogs(data.accidentLogs || []);
            setPartsWarrantyRecords(data.partsWarranty || []);

            // Fetch events explicitly if selected
            if (activeTabs.includes('events')) {
                const { data: eventData } = await axios.get(`/api/admin/events/${selectedCompany._id}?from=${fromDate}&to=${toDate}`, { headers: { Authorization: `Bearer ${userInfo.token}` } });
                setEventRecords(eventData || []);
            }
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
            attendance: item.isOutsideCar ? `/api/admin/vehicles/${item._id}` : `/api/admin/attendance/${item._id}`,
            fuel: `/api/admin/fuel/${item._id}`,
            parking: `/api/admin/parking/${item._id}`,
            advance: `/api/admin/advances/${item._id}`,
            maintenance: `/api/admin/maintenance/${item._id}`,
            borderTax: `/api/admin/border-tax/${item._id}`,
            accidentLog: `/api/admin/accident-logs/${item._id}`,
            partsWarranty: `/api/admin/parts-warranty/${item._id}`,
        };
        const endpoint = endpoints[item.entryType];
        if (!endpoint) return alert('Delete not supported for this type.');
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            await axios.delete(endpoint, { headers: { Authorization: `Bearer ${userInfo.token}` } });
            fetchReports();
        } catch (error) { alert('Failed: ' + (error.response?.data?.message || error.message)); }
    };

    /* ── filtered attendance partitions ── */
    const staffDrivers = useMemo(() => reports.filter(r => !r.vehicle?.isOutsideCar && !r.isOutsideCar && !r.isFreelancer && !r.driver?.isFreelancer).map(r => ({ ...r, entryType: 'attendance' })), [reports]);
    const freelancerDrivers = useMemo(() => reports.filter(r => r.isFreelancer || r.driver?.isFreelancer).map(r => ({ ...r, entryType: 'attendance' })), [reports]);
    const outsideCars = useMemo(() => reports.filter(r => r.vehicle?.isOutsideCar || r.isOutsideCar).map(r => ({ ...r, entryType: 'attendance' })), [reports]);

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
        setIsRange(p => {
            if (!p) {
                // Switching to Range: set to full current month
                const first = firstDayOfMonthIST();
                setFromDate(first);
                setToDate(getToday());
            } else {
                // Switching to Single: set to today or current 'fromDate'
                setToDate(fromDate);
            }
            return !p;
        });
    };

    /* ── Attendance row renderer (shared for Staff + Freelancers + Outside) ── */
    const AttRow = ({ r, idx, showFreelancerCols = false }) => {
        const isCompleted = r.status === 'completed';
        const inTime = fmtTime(r.punchIn?.time);
        const outTime = fmtTime(r.punchOut?.time);
        const openKM = r.punchIn?.km ?? '--';
        const closeKM = r.punchOut?.km ?? '--';
        const totalKM = r.totalKM ?? (typeof openKM === 'number' && typeof closeKM === 'number' ? closeKM - openKM : '--');
        const wage = Number(r.dailyWage) || 0;
        const bonus = (Number(r.punchOut?.allowanceTA) || 0) + (Number(r.punchOut?.nightStayAmount) || 0) + (Number(r.outsideTrip?.bonusAmount) || 0);
        const parkAmt = Number(r.punchOut?.tollParkingAmount) || 0;
        const parkBy = r.punchOut?.parkingPaidBy || 'Self';
        const fuelAmt = Number(r.fuel?.amount) || 0;
        return (
            <TR idx={idx}>
                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: '13px' }}>{fmt(r.date)}</span></TD>
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

    const ATT_HEADERS = ['Date', 'Driver & Vehicle', 'Punch In', 'Punch Out', 'Open KM', 'Close KM', 'Total KM', 'Fuel', 'Parking', 'Salary', 'Status', 'Action'];

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
                            <Chip key="p" label="Total Parking" value={`₹${totalParking.toLocaleString()}`} color="#818cf8" />,
                        ]}
                        headers={ATT_HEADERS}
                        rows={data.map((r, i) => <AttRow key={r._id} r={r} idx={i} showFreelancerCols />)}
                        empty="No freelancer records found."
                    />
                );
            }

            /* ── OUTSIDE CARS ── */
            case 'outsideCars': {
                const data = applySearch(outsideCars);
                const totalWage = data.reduce((s, r) => s + (Number(r.dailyWage) || Number(r.vehicle?.dutyAmount) || 0), 0);
                return (
                    <TableSection tabId="outsideCars" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="w" label="Total Amount" value={`₹${totalWage.toLocaleString()}`} color="#f59e0b" />]}
                        headers={ATT_HEADERS}
                        rows={data.map((r, i) => <AttRow key={r._id} r={r} idx={i} />)}
                        empty="No outside car records found."
                    />
                );
            }

            /* ── FUEL ── */
            case 'fuel': {
                const data = applySearch(fuelRecords).map(r => ({ ...r, entryType: 'fuel' }));
                const total = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
                return (
                    <TableSection tabId="fuel" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="t" label="Total Fuel Cost" value={`₹${total.toLocaleString()}`} color="#22c55e" />]}
                        headers={['Date', 'Vehicle', 'Driver', 'Type', 'Quantity', 'Amount', 'Odometer', 'Payment', 'Action']}
                        rows={data.map((r, i) => (
                            <TR key={r._id} idx={i}>
                                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>{fmt(r.date)}</span></TD>
                                <TD><span style={{ color: 'white', fontWeight: '800' }}>{r.vehicle?.carNumber?.split('#')[0] || '--'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.7)' }}>{r.driver?.name || '--'}</span></TD>
                                <TD><span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>{r.fuelType || 'Diesel'}</span></TD>
                                <TD><span style={{ color: '#f59e0b', fontWeight: '800' }}>{r.quantity || '--'} L</span></TD>
                                <TD><span style={{ color: '#22c55e', fontWeight: '900', fontSize: '14px' }}>₹{(r.amount || 0).toLocaleString()}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.5)' }}>{r.odometer || '--'} KM</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{r.paymentMethod || r.paymentSource || '--'}</span></TD>
                                <TD><ActionBtns onView={() => setSelectedItem({ ...r, entryType: 'fuel' })} onDelete={() => handleDelete({ ...r, entryType: 'fuel' })} /></TD>
                            </TR>
                        ))}
                        empty="No fuel logs found."
                    />
                );
            }

            /* ── MAINTENANCE ── */
            case 'maintenance': {
                const data = maintenanceRecords.filter(r => {
                    if (!searchTerm) return true;
                    const t = searchTerm.toLowerCase();
                    return (r.vehicle?.carNumber || '').toLowerCase().includes(t) || (r.maintenanceType || '').toLowerCase().includes(t);
                });
                const total = data.reduce((s, r) => s + (Number(r.cost) || 0), 0);
                return (
                    <TableSection tabId="maintenance" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="t" label="Total Cost" value={`₹${total.toLocaleString()}`} color="#ef4444" />]}
                        headers={['Bill Date', 'Vehicle', 'Type', 'Description', 'Amount', 'Vendor', 'Action']}
                        rows={data.map((r, i) => (
                            <TR key={r._id} idx={i}>
                                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>{fmt(r.billDate || r.date)}</span></TD>
                                <TD><span style={{ color: 'white', fontWeight: '800' }}>{r.vehicle?.carNumber?.split('#')[0] || '--'}</span></TD>
                                <TD><span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>{r.maintenanceType || '--'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{r.description || '--'}</span></TD>
                                <TD><span style={{ color: '#ef4444', fontWeight: '900', fontSize: '14px' }}>₹{(r.cost || 0).toLocaleString()}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{r.vendor || '--'}</span></TD>
                                <TD><ActionBtns onView={() => setSelectedItem({ ...r, entryType: 'maintenance' })} onDelete={() => handleDelete({ ...r, entryType: 'maintenance' })} /></TD>
                            </TR>
                        ))}
                        empty="No maintenance records found."
                    />
                );
            }

            /* ── ADVANCES ── */
            case 'advances': {
                const data = applySearch(advanceRecords.map(r => ({ ...r, entryType: 'advance' })));
                const total = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
                return (
                    <TableSection tabId="advances" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="t" label="Total Advances" value={`₹${total.toLocaleString()}`} color="#6366f1" />]}
                        headers={['Date', 'Driver', 'Amount', 'Type', 'Given By', 'Remark', 'Status', 'Action']}
                        rows={data.map((r, i) => (
                            <TR key={r._id} idx={i}>
                                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>{fmt(r.date)}</span></TD>
                                <TD><span style={{ color: 'white', fontWeight: '800' }}>{r.driver?.name || '--'}</span><div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{r.driver?.mobile || ''}</div></TD>
                                <TD><span style={{ color: '#6366f1', fontWeight: '900', fontSize: '14px' }}>₹{(r.amount || 0).toLocaleString()}</span></TD>
                                <TD><span style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>{r.advanceType || 'Office'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{r.givenBy || '--'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{r.remark || '--'}</span></TD>
                                <TD><StatusBadge ok={r.status !== 'Pending'} okLabel="✓ Settled" badLabel="Pending" /></TD>
                                <TD><ActionBtns onView={() => setSelectedItem({ ...r, entryType: 'advance' })} onDelete={() => handleDelete({ ...r, entryType: 'advance' })} /></TD>
                            </TR>
                        ))}
                        empty="No advance records found."
                    />
                );
            }

            /* ── BORDER TAX ── */
            case 'borderTax': {
                const data = borderTaxRecords.filter(r => !searchTerm || (r.vehicle?.carNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.borderName || '').toLowerCase().includes(searchTerm.toLowerCase()));
                const total = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
                return (
                    <TableSection tabId="borderTax" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="t" label="Total Tax" value={`₹${total.toLocaleString()}`} color="#a855f7" />]}
                        headers={['Date', 'Vehicle', 'Driver', 'Border Name', 'Amount', 'Remarks', 'Action']}
                        rows={data.map((r, i) => (
                            <TR key={r._id} idx={i}>
                                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>{fmt(r.date)}</span></TD>
                                <TD><span style={{ color: 'white', fontWeight: '800' }}>{r.vehicle?.carNumber?.split('#')[0] || '--'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.driver?.name || '--'}</span></TD>
                                <TD><span style={{ color: '#a855f7', fontWeight: '800' }}>{r.borderName || '--'}</span></TD>
                                <TD><span style={{ color: '#a855f7', fontWeight: '900', fontSize: '14px' }}>₹{(r.amount || 0).toLocaleString()}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{r.remarks || '--'}</span></TD>
                                <TD><ActionBtns onView={() => setSelectedItem({ ...r, entryType: 'borderTax' })} onDelete={() => handleDelete({ ...r, entryType: 'borderTax' })} /></TD>
                            </TR>
                        ))}
                        empty="No border tax records found."
                    />
                );
            }

            /* ── PARKING ── */
            case 'parking': {
                const data = parkingRecords.filter(r => !searchTerm || (r.vehicle?.carNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.driver || '').toLowerCase().includes(searchTerm.toLowerCase()));
                const total = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
                return (
                    <TableSection tabId="parking" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="t" label="Total Parking" value={`₹${total.toLocaleString()}`} color="#06b6d4" />]}
                        headers={['Date', 'Vehicle', 'Driver', 'Amount', 'Location', 'Source', 'Reimbursable', 'Action']}
                        rows={data.map((r, i) => (
                            <TR key={r._id} idx={i}>
                                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>{fmt(r.date)}</span></TD>
                                <TD><span style={{ color: 'white', fontWeight: '800' }}>{r.vehicle?.carNumber?.split('#')[0] || '--'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.driver || '--'}</span></TD>
                                <TD><span style={{ color: '#06b6d4', fontWeight: '900', fontSize: '14px' }}>₹{(r.amount || 0).toLocaleString()}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{r.location || r.notes || '--'}</span></TD>
                                <TD><span style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>{r.source || 'Admin'}</span></TD>
                                <TD><StatusBadge ok={r.isReimbursable} okLabel="✓ Reimbursable" badLabel="Office Cost" /></TD>
                                <TD><ActionBtns onView={() => setSelectedItem({ ...r, entryType: 'parking' })} onDelete={() => handleDelete({ ...r, entryType: 'parking' })} /></TD>
                            </TR>
                        ))}
                        empty="No parking records found."
                    />
                );
            }

            /* ── FASTAG ── */
            case 'fastag': {
                const data = fastagRecharges.filter(r => !searchTerm || (r.carNumber || '').toLowerCase().includes(searchTerm.toLowerCase()));
                const total = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
                return (
                    <TableSection tabId="fastag" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="t" label="Total Recharged" value={`₹${total.toLocaleString()}`} color="#ec4899" />]}
                        headers={['Date', 'Car Number', 'Amount', 'Method', 'Remarks', 'Action']}
                        rows={data.map((r, i) => (
                            <TR key={r._id || i} idx={i}>
                                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>{fmt(r.date)}</span></TD>
                                <TD><span style={{ color: 'white', fontWeight: '800' }}>{r.carNumber || r.vehicle?.carNumber || '--'}</span></TD>
                                <TD><span style={{ color: '#ec4899', fontWeight: '900', fontSize: '14px' }}>₹{(r.amount || 0).toLocaleString()}</span></TD>
                                <TD><span style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>{r.method || 'Manual'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{r.remarks || '--'}</span></TD>
                                <TD><ActionBtns onView={() => setSelectedItem({ ...r, entryType: 'fastag' })} /></TD>
                            </TR>
                        ))}
                        empty="No fastag records found."
                    />
                );
            }

            /* ── ACCIDENT LOGS ── */
            case 'accidentLogs': {
                const data = accidentLogs.filter(r => !searchTerm || (r.vehicle?.carNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.driver?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
                return (
                    <TableSection tabId="accidentLogs" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="t" label="Total Incidents" value={data.length} color="#f43f5e" />]}
                        headers={['Date', 'Vehicle', 'Driver', 'Description', 'Severity', 'Status', 'Action']}
                        rows={data.map((r, i) => (
                            <TR key={r._id} idx={i}>
                                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>{fmt(r.date)}</span></TD>
                                <TD><span style={{ color: 'white', fontWeight: '800' }}>{r.vehicle?.carNumber?.split('#')[0] || '--'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.6)' }}>{r.driver?.name || '--'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{r.description ? r.description.substring(0, 40) + (r.description.length > 40 ? '...' : '') : '--'}</span></TD>
                                <TD><span style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', padding: '3px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>{r.severity || 'Minor'}</span></TD>
                                <TD><StatusBadge ok={r.status === 'Recovered' || r.status === 'Resolved'} okLabel="✓ Resolved" badLabel="Open" /></TD>
                                <TD><ActionBtns onView={() => setSelectedItem({ ...r, entryType: 'accidentLog' })} onDelete={() => handleDelete({ ...r, entryType: 'accidentLog' })} /></TD>
                            </TR>
                        ))}
                        empty="No accident logs found."
                    />
                );
            }

            /* ── PARTS WARRANTY ── */
            case 'partsWarranty': {
                const data = partsWarrantyRecords.filter(r => !searchTerm || (r.vehicle?.carNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) || (r.partName || '').toLowerCase().includes(searchTerm.toLowerCase()));
                const total = data.reduce((s, r) => s + (Number(r.cost) || 0), 0);
                return (
                    <TableSection tabId="partsWarranty" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="t" label="Total Cost" value={`₹${total.toLocaleString()}`} color="#f59e0b" />]}
                        headers={['Purchase Date', 'Vehicle', 'Part Name', 'Brand', 'Cost', 'Warranty End', 'Action']}
                        rows={data.map((r, i) => (
                            <TR key={r._id} idx={i}>
                                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>{fmt(r.purchaseDate)}</span></TD>
                                <TD><span style={{ color: 'white', fontWeight: '800' }}>{r.vehicle?.carNumber?.split('#')[0] || '--'}</span></TD>
                                <TD><span style={{ color: '#f59e0b', fontWeight: '800' }}>{r.partName || '--'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{r.brandName || '--'}</span></TD>
                                <TD><span style={{ color: '#f59e0b', fontWeight: '900', fontSize: '14px' }}>₹{(r.cost || 0).toLocaleString()}</span></TD>
                                <TD noWrap><span style={{ color: new Date(r.warrantyEndDate) < new Date() ? '#f43f5e' : '#10b981', fontWeight: '700', fontSize: '12px' }}>{fmt(r.warrantyEndDate)}</span></TD>
                                <TD><ActionBtns onView={() => setSelectedItem({ ...r, entryType: 'partsWarranty' })} onDelete={() => handleDelete({ ...r, entryType: 'partsWarranty' })} /></TD>
                            </TR>
                        ))}
                        empty="No warranty records found."
                    />
                );
            }

            /* ── EVENTS ── */
            case 'events': {
                const data = applySearch(eventRecords);
                const total = data.reduce((s, e) => s + (e.totalAmount || 0), 0);
                return (
                    <TableSection tabId="events" fromDate={fromDate} toDate={toDate}
                        chips={[<Chip key="t" label="Total Budget" value={`₹${total.toLocaleString()}`} color="#6366f1" />]}
                        headers={['Date', 'Event Name', 'Client', 'Venue', 'Cars', 'Amount', 'Status', 'Action']}
                        rows={data.map((e, i) => (
                            <TR key={e._id} idx={i}>
                                <TD noWrap><span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>{fmt(e.date)}</span></TD>
                                <TD><span style={{ color: 'white', fontWeight: '800' }}>{e.name}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.6)' }}>{e.client || 'N/A'}</span></TD>
                                <TD><span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{e.location || '--'}</span></TD>
                                <TD><span style={{ color: '#38bdf8', fontWeight: '800' }}>{e.recordCount || 0}</span></TD>
                                <TD><span style={{ color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹{(e.totalAmount || 0).toLocaleString()}</span></TD>
                                <TD><StatusBadge ok={e.status === 'Completed'} okLabel="Completed" badLabel={e.status} /></TD>
                                <TD><button onClick={() => window.open(`/event-management`, '_blank')} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px', fontWeight: '800' }}>Manage</button></TD>
                            </TR>
                        ))}
                        empty="No events metadata found."
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
        return <>{activeTabs.map(t => <React.Fragment key={t}>{renderSingleTab(t)}</React.Fragment>)}</>;
    };

    return (
        <div className="container-fluid" style={{ paddingBottom: '60px' }}>
            <SEO title="Daily Reports" description="Premium daily fleet reports with attendance, fuel, maintenance, advances and more." />

            {/* ── Header ── */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 0 20px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 20px rgba(245,158,11,0.3)' }}>
                        <FileText size={24} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Operational Insights</div>
                        <h1 style={{ color: 'white', fontSize: 'clamp(22px,5vw,30px)', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Daily <span className="text-gradient-yellow">Reports</span></h1>
                    </div>
                </div>

                {/* Date Navigator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                    <button onClick={() => shiftDays(-1)} style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', display: 'block', paddingLeft: '4px', marginBottom: '2px' }}>{isRange ? 'FROM' : 'DATE'}</label>
                            <input type="date" value={fromDate} onChange={e => handleFromDate(e.target.value)} onClick={e => e.target.showPicker?.()}
                                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }} />
                        </div>
                        {isRange && <>
                            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', marginTop: '14px' }}>→</div>
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', display: 'block', paddingLeft: '4px', marginBottom: '2px' }}>TO</label>
                                <input type="date" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)} onClick={e => e.target.showPicker?.()}
                                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }} />
                            </div>
                        </>}
                    </div>
                    <button onClick={() => shiftDays(1)} style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronRight size={16} />
                    </button>
                    <button onClick={handleToggleRange} style={{ padding: '7px 14px', borderRadius: '10px', background: isRange ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', border: isRange ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)', color: isRange ? '#818cf8' : 'rgba(255,255,255,0.5)', fontSize: '11px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {isRange ? '📅 Range' : '📆 Single'}
                    </button>
                </div>
            </header>

            {/* ── Tab Bar (multi-select) ── */}
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.04)', padding: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase' }}>Select Reports · {activeTabs.length} active</span>
                    <button onClick={selectAllTabs} style={{ fontSize: '10px', fontWeight: '800', color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer' }}>
                        {activeTabs.length === tabList.length ? 'Clear All' : 'Select All'}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {tabList.map(tab => {
                        const isActive = activeTabs.includes(tab.id);
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => toggleTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', fontSize: '11px', fontWeight: '800',
                                    background: isActive ? tab.bg : 'rgba(255,255,255,0.02)',
                                    border: isActive ? `1px solid ${tab.color}50` : '1px solid rgba(255,255,255,0.04)',
                                    color: isActive ? tab.color : 'rgba(255,255,255,0.3)',
                                    boxShadow: isActive ? `0 0 10px ${tab.color}15` : 'none'
                                }}
                            >
                                <Icon size={13} />{tab.label}
                                {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tab.color, display: 'inline-block', marginLeft: '2px' }} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Search Bar ── */}
            <div style={{ position: 'relative', marginBottom: '22px', maxWidth: '420px' }}>
                <input type="text" placeholder="Search driver, vehicle, border…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
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
