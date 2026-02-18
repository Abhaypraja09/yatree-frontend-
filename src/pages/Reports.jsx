import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import {
    Calendar as CalendarIcon,
    Search,
    Download,
    Eye,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    MapPin,
    X,
    User as UserIcon,
    Users,
    Car,
    Shield,
    Wallet,
    LayoutGrid,
    CheckCircle2,
    Fuel,
    Wrench,
    IndianRupee,
    Trash2,
    ShieldAlert,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const AttendanceModal = ({ item, onClose, borderTaxRecords }) => (
    <div className="modal-overlay">
        <style>{`
            .grid-1-2-2-3 { display: grid; grid-template-columns: 1fr; }
            @media(min-width: 768px) { .grid-1-2-2-3 { grid-template-columns: 1fr 1fr; } }
            
            .grid-1-2-3-4 { display: grid; grid-template-columns: 1fr; }
            @media(min-width: 640px) { .grid-1-2-3-4 { grid-template-columns: 1fr 1fr; } }
            @media(min-width: 1024px) { .grid-1-2-3-4 { grid-template-columns: 1fr 1fr 1fr; } }
        `}</style>
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card modal-content"
            style={{ width: '100%', maxWidth: '900px', maxHeight: '92vh', overflowY: 'auto' }}
        >
            <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'var(--bg-dark)', zIndex: 10, margin: '-20px -20px 20px -20px', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h2 className="modal-title">Report Detail: {item.driver?.name || item.driverName || 'Report'}</h2>
                <button onClick={onClose} className="modal-close-btn"><X size={18} /></button>
            </div>

            {item.entryType === 'attendance' ? (
                <>
                    <div className="grid-1-2-2-3" style={{ gap: '20px' }}>
                        {/* Punch In */}
                        <div>
                            <h3 className="modal-section-title" style={{ borderColor: '#10b981' }}>Punch In Details</h3>
                            <div className="photo-grid">
                                <div>
                                    <p className="photo-label">SELFIE</p>
                                    <img src={item.punchIn?.selfie} className="photo-thumbnail" onClick={() => window.open(item.punchIn?.selfie)} loading="lazy" />
                                </div>
                                <div>
                                    <p className="photo-label">KM METER</p>
                                    <img src={item.punchIn?.kmPhoto} className="photo-thumbnail" onClick={() => window.open(item.punchIn?.kmPhoto)} loading="lazy" />
                                </div>
                                <div>
                                    <p className="photo-label">CAR PHOTO</p>
                                    <img src={item.punchIn?.carSelfie} className="photo-thumbnail" onClick={() => window.open(item.punchIn?.carSelfie)} loading="lazy" />
                                </div>
                            </div>
                        </div>

                        {/* Punch Out */}
                        <div>
                            <h3 className="modal-section-title" style={{ borderColor: '#f43f5e' }}>Punch Out Details</h3>
                            {item.punchOut?.time ? (
                                <div className="photo-grid">
                                    <div>
                                        <p className="photo-label">SELFIE</p>
                                        <img src={item.punchOut?.selfie} className="photo-thumbnail" onClick={() => window.open(item.punchOut?.selfie)} loading="lazy" />
                                    </div>
                                    <div>
                                        <p className="photo-label">KM METER</p>
                                        <img src={item.punchOut?.kmPhoto} className="photo-thumbnail" onClick={() => window.open(item.punchOut?.kmPhoto)} loading="lazy" />
                                    </div>
                                    <div>
                                        <p className="photo-label">CAR PHOTO</p>
                                        <img src={item.punchOut?.carSelfie} className="photo-thumbnail" onClick={() => window.open(item.punchOut?.carSelfie)} loading="lazy" />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '12px', margin: 0, fontWeight: '600' }}>Driver currently on road...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expenditure & Extras */}
                    <div className="resp-grid grid-1-2-3-4" style={{ marginTop: '25px', gap: '15px' }}>
                        <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Fuel Management</p>
                            {item.fuel?.filled ? (
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    {(item.fuel.entries && item.fuel.entries.length > 0) ? (
                                        item.fuel.entries.map((entry, idx) => (
                                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                                                <img src={entry.slipPhoto} onClick={() => window.open(entry.slipPhoto)} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer' }} loading="lazy" />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ color: 'white', fontWeight: '800', fontSize: '14px', margin: 0 }}>₹{entry.amount}</p>
                                                    <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '10px', margin: 0 }}>{entry.km} KM</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {item.fuel.slipPhoto && <img src={item.fuel.slipPhoto} onClick={() => window.open(item.fuel.slipPhoto)} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }} />}
                                            <div style={{ flex: 1 }}>
                                                <p style={{ color: 'white', fontWeight: '800', fontSize: '16px', margin: 0 }}>₹{item.fuel.amount}</p>
                                                <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '11px', margin: 0 }}>{item.fuel.km || '--'} KM</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Tolls & Parking</p>
                            {item.punchOut?.tollParkingAmount > 0 || (item.parking && item.parking.length > 0) ? (
                                <div>
                                    <p style={{ color: 'white', fontWeight: '800', fontSize: '16px', margin: 0 }}>₹{item.punchOut?.tollParkingAmount || item.parking?.reduce((s, p) => s + (p.amount || 0), 0)}</p>
                                    {item.parking && item.parking.length > 0 && (
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '10px', flexWrap: 'wrap' }}>
                                            {item.parking.map((p, idx) => (
                                                <img key={idx} src={p.slipPhoto} onClick={() => window.open(p.slipPhoto)} style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="glass-card" style={{ padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '800', textTransform: 'uppercase' }}>Incentives & Taxes</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {item.punchOut?.allowanceTA > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: 'var(--text-muted)' }}>TA:</span> <span style={{ color: '#10b981', fontWeight: '800' }}>+₹{item.punchOut.allowanceTA}</span></div>}
                                {item.punchOut?.nightStayAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: 'var(--text-muted)' }}>Stay:</span> <span style={{ color: '#10b981', fontWeight: '800' }}>+₹{item.punchOut.nightStayAmount}</span></div>}
                                {item.outsideTrip?.occurred && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: 'var(--text-muted)' }}>Bonus:</span> <span style={{ color: 'var(--primary)', fontWeight: '800' }}>+₹{item.outsideTrip.bonusAmount}</span></div>}

                                {borderTaxRecords.filter(b => b.date === item.date && b.vehicle?._id === item.vehicle?._id).map((bt, idx) => (
                                    <div key={idx} style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'white' }}>{bt.borderName}</span>
                                            <span style={{ color: '#10b981', fontWeight: '900' }}>₹{bt.amount}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-resp" style={{ marginTop: '20px', gap: '12px', display: 'flex' }}>
                        <div className="glass-card" style={{ padding: '15px', flex: '1', minWidth: '120px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.03)' }}>
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '800' }}>DAILY SALARY</p>
                            <h3 style={{ color: '#10b981', margin: 0, fontSize: '20px', fontWeight: '900' }}>₹{(item.dailyWage || item.driver?.dailyWage || item.vehicle?.dutyAmount || 500).toLocaleString()}</h3>
                        </div>
                        <div className="glass-card" style={{ padding: '15px', flex: '1', minWidth: '120px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.03)' }}>
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: '800' }}>DISTANCE</p>
                            <h3 style={{ color: '#10b981', margin: 0, fontSize: '20px', fontWeight: '900' }}>{item.totalKM || '0'} KM</h3>
                        </div>
                    </div>

                    {/* Duty Details Section */}
                    {item.punchOut?.remarks && (
                        <div className="glass-card" style={{ padding: '15px', marginTop: '15px', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.02)' }}>
                            <p style={{ fontSize: '9px', color: '#10b981', marginBottom: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Duty Remarks / Destination</p>
                            <p style={{ color: 'white', fontSize: '13px', lineHeight: '1.6', margin: 0, fontWeight: '600' }}>{item.punchOut.remarks}</p>
                        </div>
                    )}

                    {/* Issues Section */}
                    {item.punchOut?.otherRemarks && (
                        <div className="glass-card" style={{ padding: '15px', marginTop: '12px', border: '1px solid rgba(244, 63, 94, 0.2)', background: 'rgba(244, 63, 94, 0.02)' }}>
                            <p style={{ fontSize: '9px', color: '#f43f5e', marginBottom: '8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Maintenance Remarks</p>
                            <p style={{ color: 'white', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>{item.punchOut.otherRemarks}</p>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {(item.billPhoto || item.receiptPhoto || item.slipPhoto) && (
                            <div style={{ flex: '0 0 300px' }}>
                                <p className="photo-label">RECEIPT / BILL PHOTO</p>
                                <img src={item.billPhoto || item.receiptPhoto || item.slipPhoto} style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => window.open(item.billPhoto || item.receiptPhoto || item.slipPhoto)} />
                            </div>
                        )}
                        {item.entryType === 'accident' && item.photos?.length > 0 && (
                            <div style={{ flex: '0 0 300px' }}>
                                <p className="photo-label">ACCIDENT EVIDENCE ({item.photos.length})</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {item.photos.map((ph, i) => (
                                        <img key={i} src={ph} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(ph)} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div style={{ flex: 1, minWidth: '250px' }}>
                            <h3 className="modal-section-title" style={{ borderColor: 'var(--primary)' }}>Entry Details</h3>
                            <div className="glass-card" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>CATEGORY</p>
                                    <p style={{ color: 'var(--primary)', fontWeight: '900', textTransform: 'uppercase' }}>{item.entryType}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>AMOUNT</p>
                                    <p style={{ color: '#10b981', fontSize: '24px', fontWeight: '900' }}>₹{item.amount}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>VEHICLE</p>
                                    <p style={{ color: 'white', fontWeight: '800' }}>{item.vehicle?.carNumber || item.carNumber || '--'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>ODOMETER</p>
                                    <p style={{ color: 'white', fontWeight: '800' }}>{item.odometer || item.km || '--'} KM</p>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>REMARKS / DESCRIPTION</p>
                                    <p style={{ color: 'white', fontSize: '14px' }}>{item.remarks || item.location || item.description || '--'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    </div>
);

const Reports = () => {
    const { selectedCompany } = useCompany();

    // Helpers
    const getToday = () => new Date().toISOString().split('T')[0];
    const getOneEightyDaysAgo = () => {
        const date = new Date();
        date.setDate(date.getDate() - 180);
        return date.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(getOneEightyDaysAgo());
    const [endDate, setEndDate] = useState(getToday());

    const [reports, setReports] = useState([]);
    const [fastagRecharges, setFastagRecharges] = useState([]);
    const [borderTaxRecords, setBorderTaxRecords] = useState([]);
    const [fuelRecords, setFuelRecords] = useState([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [advanceRecords, setAdvanceRecords] = useState([]);
    const [parkingRecords, setParkingRecords] = useState([]);
    const [accidentLogs, setAccidentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedReports, setSelectedReports] = useState(['drivers']);

    const reportOptions = [
        { id: 'drivers', label: 'Staff Drivers', icon: UserIcon, color: '#10b981' },
        { id: 'freelancers', label: 'Freelancers', icon: Users, color: '#8b5cf6' },
        { id: 'vehicles', label: 'Vehicle Fleet', icon: LayoutGrid, color: '#0ea5e9' },
        { id: 'outsideCars', label: 'Outside Cars', icon: Car, color: '#f59e0b' },
        { id: 'fuel', label: 'Fuel Logs', icon: Fuel, color: '#22c55e' },
        { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: '#ef4444' },
        { id: 'advances', label: 'Advances', icon: IndianRupee, color: '#6366f1' },
        { id: 'borderTax', label: 'Border Tax', icon: Shield, color: '#8b5cf6' },
        { id: 'parking', label: 'Parking', icon: MapPin, color: '#6366f1' },
        { id: 'fastag', label: 'Fastag Logs', icon: Wallet, color: '#ec4899' },
        { id: 'accidents', label: 'Accident Logs', icon: ShieldAlert, color: '#f43f5e' },
    ];

    const toggleReport = (id) => {
        setSelectedReports(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedReports.length === reportOptions.length) {
            setSelectedReports([]);
        } else {
            setSelectedReports(reportOptions.map(opt => opt.id));
        }
    };

    useEffect(() => {
        if (selectedCompany) {
            fetchReports();
        }
    }, [selectedCompany, startDate, endDate]);

    const fetchReports = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo) return;

            const { data } = await axios.get(`/api/admin/reports/${selectedCompany._id}?from=${startDate}&to=${endDate}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });

            setReports(data.attendance || []);
            setFastagRecharges(data.fastagRecharges || []);
            setBorderTaxRecords(data.borderTax || []);
            setFuelRecords(data.fuel || []);
            setMaintenanceRecords(data.maintenance || []);
            setAdvanceRecords(data.advances || []);
            setParkingRecords(data.parking || []);
            setAccidentLogs(data.accidentLogs || []);
        } catch (err) {
            console.error('Error fetching reports', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm('Are you sure you want to delete this report entry? This action cannot be undone.')) {
            return;
        }

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            let endpoint = '';

            if (item.entryType === 'attendance') {
                endpoint = item.isOutsideCar ? `/api/admin/vehicles/${item._id}` : `/api/admin/attendance/${item._id}`;
            } else if (item.entryType === 'fuel') {
                endpoint = `/api/admin/fuel/${item._id}`;
            } else if (item.entryType === 'parking') {
                endpoint = `/api/admin/parking/${item._id}`;
            } else if (item.entryType === 'advance') {
                endpoint = `/api/admin/advances/${item._id}`;
            } else if (item.entryType === 'maintenance') {
                endpoint = `/api/admin/maintenance/${item._id}`;
            } else if (item.entryType === 'borderTax') {
                endpoint = `/api/admin/border-tax/${item._id}`;
            } else if (item.entryType === 'accident') {
                endpoint = `/api/admin/accident-logs/${item._id}`;
            } else {
                alert('Deletion not supported for this entry type');
                return;
            }

            await axios.delete(endpoint, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });

            // Refresh counts/data
            fetchReports();
            alert('Record deleted successfully');
        } catch (error) {
            console.error('Error deleting record:', error);
            alert('Failed to delete record: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleExportTableData = async () => {
        const XLSX = await import('xlsx-js-style');
        if (filteredReports.length === 0) return alert('No records to export in the current table.');

        const wb = XLSX.utils.book_new();
        const paidDriversOnDate = new Set();

        const tableData = filteredReports.map(r => {
            const punchInTime = r.punchIn?.time ? new Date(r.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            const punchOutTime = r.punchOut?.time ? new Date(r.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            const reportDate = r.date || 'Unknown';
            const [yyyy, mm, dd] = reportDate.split('-');

            const driverUniqueId = r.driver?._id || r.vehicle?._id || r.driver?.name;
            const driverDayKey = `${driverUniqueId}_${reportDate}`;
            let dailySalary = 0;
            if (driverUniqueId && !paidDriversOnDate.has(driverDayKey)) {
                dailySalary = r.dailyWage || r.driver?.dailyWage || r.vehicle?.dutyAmount || 500;
                paidDriversOnDate.add(driverDayKey);
            }

            return {
                'Date': `${dd}-${mm}-${yyyy}`,
                'Name': r.driver?.name || r.vehicle?.driverName || (r.vehicle?.isOutsideCar ? 'Outside Car' : 'Unknown'),
                'Car': r.vehicle?.carNumber ? r.vehicle.carNumber.split('#')[0] : '',
                'In': punchInTime,
                'Out': punchOutTime,
                'KM': r.totalKM || 0,
                'Daily': dailySalary,
                'Bonus': (r.punchOut?.allowanceTA || 0) + (r.punchOut?.nightStayAmount || 0),
                'T/P': r.punchOut?.tollParkingAmount || (r.parking || []).reduce((sum, p) => sum + (p.amount || 0), 0),
                'Company': r.vehicle?.isOutsideCar ? 'OUTSIDE' : (r.driver?.isFreelancer ? 'FREELANCER' : 'Yatree Destination'),
                'Remarks': r.punchOut?.otherRemarks || ''
            };
        });

        const ws = XLSX.utils.json_to_sheet(tableData);

        // Auto-sizing and Styling
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxWidth = 10;
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                if (!cell) continue;
                cell.s = { alignment: { horizontal: 'center', vertical: 'center' }, font: { name: 'Arial', sz: 10 } };
                if (R === 0) { cell.s.font.bold = true; cell.s.fill = { fgColor: { rgb: "E9E9E9" } }; }
                if (cell.v) maxWidth = Math.max(maxWidth, cell.v.toString().length + 2);
            }
            if (!ws['!cols']) ws['!cols'] = [];
            ws['!cols'][C] = { wch: maxWidth };
        }

        XLSX.utils.book_append_sheet(wb, ws, "Daily Operational Log");
        XLSX.writeFile(wb, `Daily_Log_${selectedCompany.name}_${startDate}.xlsx`);
    };

    const handleExportConfig = async () => {
        const XLSX = await import('xlsx-js-style');
        if (selectedReports.length === 0) return alert('Please select at least one report type from the config box.');

        const wb = XLSX.utils.book_new();
        let hasGlobalData = false;

        const fmtDate = (dateStr) => {
            if (!dateStr) return '--';
            if (dateStr instanceof Date) {
                const d = dateStr.getDate();
                const m = dateStr.getMonth() + 1;
                const y = dateStr.getFullYear();
                return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
            }
            const [y, m, d] = dateStr.includes('T') ? dateStr.split('T')[0].split('-') : dateStr.split('-');
            return `${d}-${m}-${y}`;
        };

        const createAttendanceSheet = (sheetName, filterFn) => {
            const filtered = reports.filter(filterFn);
            if (filtered.length === 0) return;

            const isOutsideSheet = sheetName === "Outside Cars";

            filtered.sort((a, b) => {
                const nameA = (a.driver?.name || '').toLowerCase();
                const nameB = (b.driver?.name || '').toLowerCase();
                if (nameA < nameB) return -1;
                if (nameA > nameB) return 1;
                return new Date(a.date) - new Date(b.date);
            });

            hasGlobalData = true;
            const paidOnDate = new Set();

            const rows = filtered.map(r => {
                const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
                const punchInTime = r.punchIn?.time ? new Date(r.punchIn.time).toLocaleTimeString('en-IN', timeOptions) : '--';
                const punchOutTime = r.punchOut?.time ? new Date(r.punchOut.time).toLocaleTimeString('en-IN', timeOptions) : '--';
                const driverUniqueId = r.driver?._id || r.vehicle?._id || r.driver?.name;
                const driverDayKey = `${driverUniqueId}_${r.date}`;

                let dailySalary = 0;
                if (driverUniqueId && !paidOnDate.has(driverDayKey)) {
                    dailySalary = r.dailyWage || r.driver?.dailyWage || r.vehicle?.dutyAmount || 500;
                    paidOnDate.add(driverDayKey);
                }

                const displayCar = r.vehicle?.carNumber ? r.vehicle.carNumber.split('#')[0].slice(-4) : '';

                if (isOutsideSheet) {
                    return {
                        'Driver Name': r.driver?.name || r.vehicle?.driverName || (r.vehicle?.isOutsideCar ? 'Outside Car' : 'Unknown'),
                        'Date': fmtDate(r.date),
                        'Car': displayCar,
                        'Punch In': punchInTime,
                        'Punch Out': punchOutTime,
                        'Daily Wage': dailySalary
                    };
                }

                return {
                    'Driver Name': r.driver?.name || r.vehicle?.driverName || (r.vehicle?.isOutsideCar ? 'Outside Car' : 'Unknown'),
                    'Date': fmtDate(r.date),
                    'Car': displayCar,
                    'Punch In': punchInTime,
                    'Punch Out': punchOutTime,
                    'KM Run': r.totalKM || 0,
                    'Daily Wage': dailySalary,
                    'Bonus': (r.punchOut?.allowanceTA || 0) + (r.punchOut?.nightStayAmount || 0),
                    'Toll/Parking': r.punchOut?.tollParkingAmount || (r.parking || []).reduce((sum, p) => sum + (p.amount || 0), 0),
                    'Fuel Cost': r.fuel?.amount || 0,
                    'Remarks': r.punchOut?.otherRemarks || r.punchIn?.remarks || ''
                };
            });

            const totals = rows.reduce((acc, curr) => {
                if (!isOutsideSheet) {
                    acc['KM Run'] += Number(curr['KM Run']) || 0;
                    acc['Toll/Parking'] += Number(curr['Toll/Parking']) || 0;
                    acc['Fuel Cost'] += Number(curr['Fuel Cost']) || 0;
                    acc['Bonus'] += Number(curr['Bonus']) || 0;
                }
                acc['Daily Wage'] += Number(curr['Daily Wage']) || 0;
                return acc;
            }, isOutsideSheet ?
                { 'Driver Name': 'TOTAL', 'Date': '-', 'Car': '-', 'Punch In': '-', 'Punch Out': '-', 'Daily Wage': 0 } :
                { 'Driver Name': 'TOTAL', 'Date': '-', 'Car': '-', 'KM Run': 0, 'Daily Wage': 0, 'Bonus': 0, 'Toll/Parking': 0, 'Fuel Cost': 0 }
            );

            rows.push(totals);
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        };

        if (selectedReports.includes('drivers')) createAttendanceSheet("Staff Drivers", r => !((r.vehicle?.isOutsideCar || r.isOutsideCar) || (r.isFreelancer || r.driver?.isFreelancer)));
        if (selectedReports.includes('freelancers')) createAttendanceSheet("Freelancers", r => (r.isFreelancer || r.driver?.isFreelancer) && !(r.vehicle?.isOutsideCar || r.isOutsideCar));
        if (selectedReports.includes('outsideCars')) createAttendanceSheet("Outside Cars", r => (r.vehicle?.isOutsideCar || r.isOutsideCar));

        if (selectedReports.includes('vehicles')) {
            const vehicleSummary = {};
            reports.forEach(r => {
                const vId = r.vehicle?._id;
                if (!vId) return;
                const cleanCar = r.vehicle.carNumber ? r.vehicle.carNumber.split('#')[0] : '';
                if (!vehicleSummary[vId]) {
                    vehicleSummary[vId] = { 'Car Number': cleanCar, 'Model': r.vehicle.model || '', 'Type': r.vehicle.carType || '', 'Total KM': 0, 'Days Worked': 0, 'Toll & Parking': 0, 'Fuel Cost': 0, 'Net Revenue': 0 };
                }
                vehicleSummary[vId]['Total KM'] += (r.totalKM || 0);
                vehicleSummary[vId]['Days Worked'] += 1;
                vehicleSummary[vId]['Toll & Parking'] += (r.punchOut?.tollParkingAmount || 0);
                vehicleSummary[vId]['Fuel Cost'] += (r.fuel?.amount || 0);
                vehicleSummary[vId]['Net Revenue'] += (r.vehicle?.dutyAmount || 0);
            });
            const vehicleData = Object.values(vehicleSummary).sort((a, b) => a['Car Number'].localeCompare(b['Car Number']));
            if (vehicleData.length > 0) {
                hasGlobalData = true;
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vehicleData), "Vehicle Summary");
            }
        }

        if (selectedReports.includes('fuel') && fuelRecords.length > 0) {
            hasGlobalData = true;
            const fuelRows = fuelRecords.map(f => ({
                'Date': fmtDate(new Date(f.date)),
                'Car': f.vehicle?.carNumber ? f.vehicle.carNumber.split('#')[0] : 'N/A',
                'Fuel Type': f.fuelType,
                'Quantity': f.quantity,
                'Rate': f.rate,
                'Amount': f.amount,
                'KM Odometer': f.odometer,
                'Station': f.stationName || 'N/A',
                'Payment': f.paymentMode,
                'Driver': f.driver || 'N/A'
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fuelRows), "Fuel Logs");
        }

        if (selectedReports.includes('maintenance') && maintenanceRecords.length > 0) {
            hasGlobalData = true;
            const maintRows = maintenanceRecords.map(m => ({
                'Date': fmtDate(new Date(m.billDate)),
                'Car': m.vehicle?.carNumber ? m.vehicle.carNumber.split('#')[0] : 'N/A',
                'Type': m.maintenanceType,
                'Category': m.category || 'N/A',
                'Description': m.description || 'N/A',
                'Garage': m.garageName || 'N/A',
                'Bill No': m.billNumber || 'N/A',
                'Amount': m.amount,
                'KM Reading': m.currentKm || 'N/A'
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(maintRows), "Maintenance");
        }

        if (selectedReports.includes('advances') && advanceRecords.length > 0) {
            hasGlobalData = true;
            const advRows = advanceRecords.map(a => ({
                'Date': fmtDate(new Date(a.date)),
                'Driver Name': a.driver?.name || 'Unknown',
                'Mobile': a.driver?.mobile || 'N/A',
                'Amount': a.amount,
                'Remark': a.remark || '',
                'Status': a.status === 'Pending' ? 'Advance Success' :
                    a.status === 'Recovered' ? 'Fully Recovered' : a.status
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(advRows), "Advances");
        }

        if (selectedReports.includes('borderTax') && borderTaxRecords.length > 0) {
            hasGlobalData = true;
            const sortedBT = [...borderTaxRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
            const btRows = sortedBT.map(b => ({ 'Date': fmtDate(b.date), 'Car Number': b.vehicle?.carNumber ? b.vehicle.carNumber.split('#')[0] : 'N/A', 'Border Name': b.borderName, 'Amount': b.amount, 'Remarks': b.remarks || '' }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(btRows), "Border Tax");
        }

        if (selectedReports.includes('parking') && parkingRecords.length > 0) {
            hasGlobalData = true;
            const parkingRows = parkingRecords.map(p => ({
                'Date': fmtDate(new Date(p.date)),
                'Car': p.vehicle?.carNumber ? p.vehicle.carNumber.split('#')[0] : 'N/A',
                'Driver': p.driver || 'N/A',
                'Amount': p.amount,
                'Location': p.location || 'N/A',
                'Remark': p.remark || '',
                'Source': p.source || 'Admin'
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parkingRows), "Parking Logs");
        }

        if (selectedReports.includes('accidents') && accidentLogs.length > 0) {
            hasGlobalData = true;
            const accRows = accidentLogs.map(a => ({
                'Date': fmtDate(new Date(a.date)),
                'Car': a.vehicle?.carNumber ? a.vehicle.carNumber.split('#')[0] : 'N/A',
                'Driver': a.driver?.name || 'N/A',
                'Location': a.location || 'N/A',
                'Cost': a.amount,
                'Status': a.status,
                'Description': a.description || ''
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(accRows), "Accident Logs");
        }

        if (selectedReports.includes('fastag') && fastagRecharges.length > 0) {
            hasGlobalData = true;
            const sortedFT = [...fastagRecharges].sort((a, b) => new Date(a.date) - new Date(b.date));
            const ftRows = sortedFT.map(f => {
                const fDate = new Date(f.date);
                return { 'Date': fmtDate(fDate), 'Time': fDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'Car Number': f.carNumber || 'N/A', 'Amount': Number(f.amount) || 0, 'Bank/Method': f.method || 'Not Specified', 'Remarks': f.remarks || '' };
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ftRows), "Fastag Recharges");
        }

        if (!hasGlobalData) return alert('No data available for the selected categories in this range.');

        Object.values(wb.Sheets).forEach(ws => {
            if (!ws['!ref']) return;
            const range = XLSX.utils.decode_range(ws['!ref']);
            const colWidths = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxWidth = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                    if (!cell) continue;
                    cell.s = { alignment: { horizontal: 'center', vertical: 'center' }, font: { name: 'Arial', sz: 10 } };
                    if (R === 0) { cell.s.font.bold = true; cell.s.fill = { fgColor: { rgb: "333333" } }; cell.s.font.color = { rgb: "FFFFFF" }; }
                    if (ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v === 'TOTAL') { cell.s.font.bold = true; cell.s.fill = { fgColor: { rgb: "FFFFCC" } }; }
                    if (cell.v) maxWidth = Math.max(maxWidth, cell.v.toString().length + 2);
                }
                colWidths.push({ wch: maxWidth });
            }
            ws['!cols'] = colWidths;
        });

        XLSX.writeFile(wb, `Premium_Fleet_Export_${startDate}.xlsx`);
    };

    const getUnifiedData = () => {
        let combined = [];
        // Helper to get date string
        const getEntryDate = (d) => {
            if (!d) return "";
            if (typeof d === 'string') return d.split('T')[0];
            try {
                return new Date(d).toISOString().split('T')[0];
            } catch (e) {
                return "";
            }
        };

        // 1. Attendance
        if (selectedReports.includes('drivers') || selectedReports.includes('freelancers') || selectedReports.includes('outsideCars') || selectedReports.includes('vehicles')) {
            const filteredAtt = reports.filter(r => {
                const isOutside = r.vehicle?.isOutsideCar || r.isOutsideCar;
                const isFreelancer = r.isFreelancer || r.driver?.isFreelancer;

                if (selectedReports.includes('outsideCars') && isOutside) return true;
                if (selectedReports.includes('freelancers') && isFreelancer) return true;
                if (selectedReports.includes('drivers') && !isOutside && !isFreelancer) return true;
                if (selectedReports.includes('vehicles')) return true;
                return false;
            });
            combined = [...combined, ...filteredAtt.map(r => ({ ...r, entryType: 'attendance' }))];
        }

        // 2. Fuel
        if (selectedReports.includes('fuel') || selectedReports.includes('vehicles')) {
            combined = [...combined, ...fuelRecords.map(f => ({ ...f, entryType: 'fuel', date: getEntryDate(f.date) }))];
        }

        // 3. Maintenance
        if (selectedReports.includes('maintenance') || selectedReports.includes('vehicles')) {
            combined = [...combined, ...maintenanceRecords.map(m => ({ ...m, entryType: 'maintenance', date: getEntryDate(m.billDate) }))];
        }

        // 4. Advances
        if (selectedReports.includes('advances')) {
            combined = [...combined, ...advanceRecords.map(a => ({ ...a, entryType: 'advance', date: getEntryDate(a.date) }))];
        }

        // 5. Border Tax
        if (selectedReports.includes('borderTax') || selectedReports.includes('vehicles')) {
            combined = [...combined, ...borderTaxRecords.map(b => ({ ...b, entryType: 'borderTax' }))];
        }

        // 6. Fastag
        if (selectedReports.includes('fastag')) {
            combined = [...combined, ...fastagRecharges.map(f => ({ ...f, entryType: 'fastag', date: getEntryDate(f.date) }))];
        }

        // 7. Parking
        if (selectedReports.includes('parking')) {
            combined = [...combined, ...parkingRecords.map(p => ({ ...p, entryType: 'parking', date: getEntryDate(p.date) }))];
        }

        // 8. Accidents
        if (selectedReports.includes('accidents')) {
            combined = [...combined, ...accidentLogs.map(a => ({ ...a, entryType: 'accident', date: getEntryDate(a.date) }))];
        }

        return combined.sort((a, b) => {
            const dateA = a.date || "";
            const dateB = b.date || "";
            return dateB.localeCompare(dateA);
        });
    };

    const searchFilter = (item) => {
        const term = searchTerm.toLowerCase();
        const driverName = (item.driver?.name || item.driverName || '').toLowerCase();
        const carNum = (item.vehicle?.carNumber || item.carNumber || '').toLowerCase();
        return driverName.includes(term) || carNum.includes(term);
    };

    const finalUnifiedList = getUnifiedData().filter(searchFilter);
    const filteredReports = finalUnifiedList; // for backward compatibility in mapping

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Operational Reports" description="Detailed daily fleet reports, attendance logs, and expenditure history for your taxi business." />
            <header className="flex-resp" style={{
                justifyContent: 'space-between',
                padding: '30px 0',
                gap: '20px',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', background: 'white', borderRadius: '12px', padding: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <img src="/logos/logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h1 className="resp-title" style={{ fontSize: '24px' }}>Daily Reports</h1>
                        <p className="resp-subtitle">Operational logs for Yatree Destination</p>
                    </div>
                </div>

                <div className="flex-resp" style={{ gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '1 1 auto' }}>
                    <div className="mobile-stack" style={{ gap: '15px', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <div style={{ position: 'relative', flex: '1 1 140px' }}>
                            <span style={{ position: 'absolute', top: '-18px', left: '0', fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>From</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-field"
                                style={{
                                    height: '45px',
                                    marginBottom: 0,
                                    width: '100%',
                                    minWidth: '130px',
                                    padding: '0 12px'
                                }}
                            />
                        </div>
                        <div style={{ position: 'relative', flex: '1 1 140px' }}>
                            <span style={{ position: 'absolute', top: '-18px', left: '0', fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>To</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-field"
                                style={{
                                    height: '45px',
                                    marginBottom: 0,
                                    width: '100%',
                                    minWidth: '130px',
                                    padding: '0 12px'
                                }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleExportTableData}
                        className="btn-primary"
                        style={{ height: '45px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        <Download size={18} /> <span className="hide-mobile">Export Excel</span><span className="show-mobile">Export</span>
                    </button>
                </div>
            </header>

            {/* Report Center - Selection Options */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: 'clamp(15px, 3vw, 25px)', marginBottom: '30px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                    <div className="flex-resp" style={{ gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LayoutGrid size={20} style={{ color: 'var(--primary)' }} />
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: 0 }}>Reports Config</h2>
                        </div>

                        {/* Date Selection inside Config */}
                        <div className="flex-resp hide-mobile" style={{ gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>START:</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                                />
                            </div>
                            <div style={{ width: '1px', height: '15px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>END:</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleExportConfig}
                            className="btn-primary"
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                padding: '10px 18px',
                                fontSize: '13px',
                                gap: '8px'
                            }}
                        >
                            <Download size={16} /> <span className="hide-mobile">Download Selected</span><span className="show-mobile">Download</span>
                        </button>
                    </div>

                    <button
                        onClick={selectAll}
                        style={{ background: 'rgba(14, 165, 233, 0.1)', border: 'none', color: 'var(--primary)', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {selectedReports.length === reportOptions.length ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                    {reportOptions.map((opt) => (
                        <motion.div
                            key={opt.id}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleReport(opt.id)}
                            style={{
                                padding: '12px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: '0.2s',
                                background: selectedReports.includes(opt.id) ? `${opt.color}15` : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${selectedReports.includes(opt.id) ? opt.color : 'rgba(255,255,255,0.05)'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                background: selectedReports.includes(opt.id) ? opt.color : 'rgba(255,255,255,0.05)',
                                color: selectedReports.includes(opt.id) ? 'white' : 'var(--text-muted)'
                            }}>
                                <opt.icon size={16} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: selectedReports.includes(opt.id) ? 'white' : 'var(--text-muted)' }}>{opt.label}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Filter Bar */}
            <div className="flex-resp" style={{ marginBottom: '30px', gap: '15px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 300px)' }}>
                    <input
                        type="text"
                        placeholder="Search driver or car number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '45px', marginBottom: 0, height: '50px', borderRadius: '15px' }}
                    />
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                </div>

            </div>

            <div className="scroll-x glass-card hide-mobile" style={{ padding: '0', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '1000px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Duty Date</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Fleet Personnel</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Type</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Insight</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>In/Start</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Out/End</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Amount/Pay</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Duty KM</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const paidInUI = new Set();
                            return loading ? (
                                <tr><td colSpan="7" style={{ padding: '80px', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                                        <div className="spinner"></div>
                                        <span>Parsing fleet logs...</span>
                                    </div>
                                </td></tr>
                            ) : filteredReports.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '80px', textAlign: 'center' }}>
                                    <div style={{ opacity: 0.2, marginBottom: '15px' }}><CalendarIcon size={40} style={{ margin: '0 auto' }} /></div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No transaction history found for the selected period.</p>
                                </td></tr>
                            ) : filteredReports.map((report) => {
                                const driverUniqueId = report.driver?._id || report.vehicle?._id || report.driver?.name;
                                const driverDayKey = `${driverUniqueId}_${report.date}`;
                                let showSalary = 0;
                                if (driverUniqueId && !paidInUI.has(driverDayKey)) {
                                    showSalary = report.dailyWage || report.driver?.dailyWage || report.vehicle?.dutyAmount || 500;
                                    paidInUI.add(driverDayKey);
                                }
                                return (
                                    <motion.tr
                                        key={report._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                        className="hover-row"
                                    >
                                        <td style={{ padding: '18px 25px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                                                <CalendarIcon size={14} style={{ opacity: 0.5 }} />
                                                <span style={{ fontWeight: '700', fontSize: '13px', color: 'white' }}>
                                                    {(() => {
                                                        if (!report.date) return '--';
                                                        const [y, m, d] = report.date.split('-');
                                                        return `${d}-${m}-${y}`;
                                                    })()}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <UserIcon size={18} color="white" />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '800', fontSize: '14px', margin: 0 }}>
                                                        {report.driver?.name || report.vehicle?.driverName || (report.vehicle?.isOutsideCar ? 'Outside Car' : (typeof report.driver === 'string' ? report.driver : 'N/A'))}
                                                    </p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{report.driver?.mobile || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                background: report.entryType === 'attendance' ? 'rgba(16, 185, 129, 0.1)' :
                                                    report.entryType === 'parking' ? 'rgba(99, 102, 241, 0.1)' :
                                                        report.entryType === 'advance' ? 'rgba(99, 102, 241, 0.1)' :
                                                            report.entryType === 'accident' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                                color: report.entryType === 'attendance' ? '#10b981' :
                                                    report.entryType === 'fuel' ? '#22c55e' :
                                                        report.entryType === 'parking' ? '#6366f1' :
                                                            report.entryType === 'advance' ? '#6366f1' :
                                                                report.entryType === 'accident' ? '#f43f5e' : 'white'
                                            }}>
                                                {report.entryType}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: '700', fontSize: '14px' }}>
                                                <Car size={16} style={{ color: 'var(--primary)', opacity: 0.7 }} />
                                                <span>{(report.vehicle?.carNumber || report.carNumber || '--').split('#')[0]}</span>
                                                {report.entryType === 'attendance' && report.dutyCount > 1 && (
                                                    <span style={{
                                                        fontSize: '9px',
                                                        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                                                        color: 'white',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: '900',
                                                        marginLeft: '4px',
                                                        boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)'
                                                    }}>
                                                        {report.dutyCount} DUTIES
                                                    </span>
                                                )}
                                            </div>
                                            {report.entryType === 'attendance' && (report.punchOut?.allowanceTA > 0 || report.punchOut?.nightStayAmount > 0) && (
                                                <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                                    {report.punchOut.allowanceTA > 0 && <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1px 4px', borderRadius: '3px', fontWeight: '800' }}>DAY +100</span>}
                                                    {report.punchOut.nightStayAmount > 0 && <span style={{ fontSize: '9px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '1px 4px', borderRadius: '3px', fontWeight: '800' }}>NIGHT +500</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            {report.entryType === 'attendance' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '800' }}>
                                                    <ArrowUpRight size={14} />
                                                    <span>{new Date(report.punchIn?.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            ) : report.entryType === 'fuel' ? (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{report.fuelType} | {report.quantity}L</span>
                                            ) : report.entryType === 'parking' ? (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{report.location || 'Local Parking'}</span>
                                            ) : report.entryType === 'fastag' ? (
                                                <span style={{ color: '#ec4899', fontSize: '12px', fontWeight: '800' }}>{report.method || 'Manual'}</span>
                                            ) : report.entryType === 'maintenance' ? (
                                                <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: '800' }}>{report.maintenanceType || 'Service'}</span>
                                            ) : report.entryType === 'borderTax' ? (
                                                <span style={{ color: '#8b5cf6', fontSize: '12px', fontWeight: '800' }}>{report.borderName}</span>
                                            ) : report.entryType === 'accident' ? (
                                                <span style={{ color: '#f43f5e', fontSize: '12px', fontWeight: '800' }}>{report.location || 'Accident'}</span>
                                            ) : '--'}
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            {report.entryType === 'attendance' && report.punchOut?.time ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontWeight: '800' }}>
                                                    <ArrowDownLeft size={14} />
                                                    <span>{new Date(report.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            ) : report.entryType === 'fastag' ? (
                                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Recharge</span>
                                            ) : report.entryType === 'accident' ? (
                                                <span style={{ color: report.status === 'Pending' ? '#fbbf24' : '#10b981', fontSize: '11px', fontWeight: '800' }}>{report.status}</span>
                                            ) : '--'}
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <span style={{ color: '#10b981', fontWeight: '900', fontSize: '15px' }}>
                                                ₹{(report.amount || showSalary || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            {report.entryType === 'advance' ? (
                                                <span style={{ fontSize: '11px', fontWeight: '800', color: report.status === 'Pending' ? '#fbbf24' : '#10b981' }}>
                                                    {report.status === 'Pending' ? 'Advance Given' : 'Success'}
                                                </span>
                                            ) : report.entryType === 'attendance' ? (
                                                <span style={{ color: 'white', fontSize: '14px', fontWeight: '800' }}>{report.totalKM ? `${report.totalKM} KM` : '--'}</span>
                                            ) : report.entryType === 'fuel' ? (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{report.odometer || '--'} KM</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>--</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                {(report.entryType === 'attendance' || report.entryType === 'fuel' || report.entryType === 'parking' || report.entryType === 'advance' || report.entryType === 'maintenance' || report.entryType === 'borderTax' || report.entryType === 'accident') && (
                                                    <button
                                                        onClick={() => setSelectedItem(report)}
                                                        className="glass-card"
                                                        style={{ padding: '8px 15px', color: 'var(--primary)', border: '1px solid rgba(14, 165, 233, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800' }}
                                                    >
                                                        <Eye size={14} /> VIEW
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(report)}
                                                    className="glass-card"
                                                    style={{ padding: '8px 15px', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800' }}
                                                >
                                                    <Trash2 size={14} /> DELETE
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            });
                        })()}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="show-mobile">
                {(() => {
                    const paidInUI = new Set();
                    return loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
                    ) : filteredReports.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                            <CalendarIcon size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                            <p>No transactions found.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {filteredReports.map((report) => {
                                const driverUniqueId = report.driver?._id || report.vehicle?._id || report.driver?.name;
                                const driverDayKey = `${driverUniqueId}_${report.date}`;
                                let showSalary = 0;
                                if (driverUniqueId && !paidInUI.has(driverDayKey)) {
                                    showSalary = report.dailyWage || report.driver?.dailyWage || report.vehicle?.dutyAmount || 500;
                                    paidInUI.add(driverDayKey);
                                }
                                return (
                                    <motion.div
                                        key={report._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-card"
                                        style={{ padding: '16px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <UserIcon size={18} color="var(--primary)" />
                                                </div>
                                                <div>
                                                    <div style={{ color: 'white', fontWeight: '900', fontSize: '16px' }}>
                                                        {report.driver?.name || (report.vehicle?.isOutsideCar ? 'Outside Car' : (typeof report.driver === 'string' ? report.driver : 'N/A'))}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{report.vehicle?.carNumber?.split('#')[0] || (typeof report.carNumber === 'string' ? report.carNumber : '--')}</div>
                                                    <div style={{ marginTop: '4px' }}>
                                                        <span style={{
                                                            fontSize: '10px',
                                                            fontWeight: '800',
                                                            textTransform: 'uppercase',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            background: report.entryType === 'attendance' ? 'rgba(16, 185, 129, 0.1)' :
                                                                report.entryType === 'fuel' ? 'rgba(34, 197, 94, 0.1)' :
                                                                    report.entryType === 'parking' ? 'rgba(99, 102, 241, 0.1)' :
                                                                        report.entryType === 'advance' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)',
                                                            color: report.entryType === 'attendance' ? '#10b981' :
                                                                report.entryType === 'fuel' ? '#22c55e' :
                                                                    report.entryType === 'parking' ? '#6366f1' :
                                                                        report.entryType === 'advance' ? '#6366f1' : 'white'
                                                        }}>
                                                            {report.entryType}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span style={{
                                                fontSize: '9px',
                                                color: report.vehicle?.isOutsideCar ? '#f59e0b' : (report.driver?.isFreelancer ? '#f43f5e' : '#10b981'),
                                                background: report.vehicle?.isOutsideCar ? 'rgba(245, 158, 11, 0.1)' : (report.driver?.isFreelancer ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.4px'
                                            }}>
                                                {report.vehicle?.isOutsideCar ? 'OUT' : (report.driver?.isFreelancer ? 'FREE' : 'STAFF')}
                                            </span>
                                            {report.entryType === 'attendance' && (report.punchOut?.allowanceTA > 0 || report.punchOut?.nightStayAmount > 0) && (
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    {report.punchOut.allowanceTA > 0 && <span style={{ fontSize: '9px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1px 4px', borderRadius: '3px', fontWeight: '800' }}>+100</span>}
                                                    {report.punchOut.nightStayAmount > 0 && <span style={{ fontSize: '9px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '1px 4px', borderRadius: '3px', fontWeight: '800' }}>+500</span>}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                                            <div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>In Time</div>
                                                <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <ArrowUpRight size={12} />
                                                    {new Date(report.punchIn?.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800' }}>Out Time</div>
                                                <div style={{ color: '#f43f5e', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <ArrowDownLeft size={12} />
                                                    {report.punchOut?.time ? new Date(report.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ON DUTY'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>KM RUN</div>
                                                    <div style={{ color: 'white', fontWeight: '900' }}>{report.totalKM || report.odometer || '0'} KM</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '800' }}>PAY</div>
                                                    <div style={{ color: '#10b981', fontWeight: '900' }}>{showSalary > 0 ? `₹${showSalary}` : '--'}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {(report.entryType === 'attendance' || report.entryType === 'fuel' || report.entryType === 'parking' || report.entryType === 'advance' || report.entryType === 'maintenance' || report.entryType === 'borderTax') && (
                                                    <button
                                                        onClick={() => setSelectedItem(report)}
                                                        style={{ background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.2)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}
                                                    >
                                                        <Eye size={14} /> View
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(report)}
                                                    style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>

            <AnimatePresence>
                {selectedItem && (
                    <AttendanceModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        borderTaxRecords={borderTaxRecords}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};

export default Reports;
