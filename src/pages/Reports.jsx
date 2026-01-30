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
    Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const AttendanceModal = ({ item, onClose, borderTaxRecords }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '15px' }}>
        <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card modal-content"
            style={{ width: '100%', maxWidth: '900px', maxHeight: '95vh', overflowY: 'auto', padding: '25px', position: 'relative' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', position: 'sticky', top: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', zIndex: 10, padding: '10px 0' }}>
                <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: 0 }}>Report Detail: {item.driver?.name}</h2>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '8px', borderRadius: '50%' }}><X size={20} /></button>
            </div>

            <div className="grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                {/* Punch In */}
                <div>
                    <h3 style={{ borderLeft: '4px solid #10b981', paddingLeft: '12px', color: 'white', marginBottom: '20px', fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Punch In Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                        <div>
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '800' }}>SELFIE</p>
                            <img src={item.punchIn?.selfie} style={{ width: '100%', borderRadius: '10px', height: '100px', objectFit: 'cover', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />
                        </div>
                        <div>
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '800' }}>KM METER</p>
                            <img src={item.punchIn?.kmPhoto} style={{ width: '100%', borderRadius: '10px', height: '100px', objectFit: 'cover', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />
                        </div>
                        <div>
                            <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '800' }}>CAR PHOTO</p>
                            <img src={item.punchIn?.carSelfie} style={{ width: '100%', borderRadius: '10px', height: '100px', objectFit: 'cover', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />
                        </div>
                    </div>
                </div>

                {/* Punch Out */}
                <div>
                    <h3 style={{ borderLeft: '4px solid #f43f5e', paddingLeft: '12px', color: 'white', marginBottom: '20px', fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Punch Out Details</h3>
                    {item.punchOut?.time ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                            <div>
                                <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '800' }}>SELFIE</p>
                                <img src={item.punchOut?.selfie} style={{ width: '100%', borderRadius: '10px', height: '100px', objectFit: 'cover', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '800' }}>KM METER</p>
                                <img src={item.punchOut?.kmPhoto} style={{ width: '100%', borderRadius: '10px', height: '100px', objectFit: 'cover', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '9px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '800' }}>CAR PHOTO</p>
                                <img src={item.punchOut?.carSelfie} style={{ width: '100%', borderRadius: '10px', height: '100px', objectFit: 'cover', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }} />
                            </div>
                        </div>
                    ) : (
                        <div style={{ height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', gap: '8px' }}>
                            <div className="pulse-dot"></div>
                            <p style={{ fontSize: '12px', margin: 0, fontWeight: '600' }}>Driver currently on road...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Expenditure & Extras */}
            <div className="grid-responsive" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '15px', fontWeight: '800', textTransform: 'uppercase' }}>Fuel Management</p>
                    {item.fuel?.filled ? (
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            {item.fuel.slipPhoto ? (
                                <img src={item.fuel.slipPhoto} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                            ) : null}
                            <div>
                                <p style={{ color: 'white', fontWeight: '800', fontSize: '18px', margin: 0 }}>₹{item.fuel.amount}</p>
                                <p style={{ fontSize: '11px', color: '#10b981', margin: '4px 0 0 0', fontWeight: '700' }}>Refilled & Verified</p>
                            </div>
                        </div>
                    ) : <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No fuel entries recorded</p>}
                </div>

                <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '15px', fontWeight: '800', textTransform: 'uppercase' }}>Tolls & Parking</p>
                    {item.punchOut?.tollParkingAmount > 0 ? (
                        <div>
                            <p style={{ color: 'white', fontWeight: '800', fontSize: '18px', margin: 0 }}>₹{item.punchOut.tollParkingAmount}</p>
                            {item.parking && item.parking.length > 0 && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                                    {item.parking.map((p, idx) => (
                                        <img key={idx} src={p.slipPhoto} style={{ width: '35px', height: '35px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (item.parking && item.parking.length > 0) ? (
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <p style={{ color: 'white', fontWeight: '800', fontSize: '18px', margin: 0 }}>₹{item.parking.reduce((sum, p) => sum + (p.amount || 0), 0)}</p>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {item.parking.map((p, idx) => (
                                    <img key={idx} src={p.slipPhoto} title={`Amount: ₹${p.amount}`} style={{ width: '35px', height: '35px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                                ))}
                            </div>
                        </div>
                    ) : <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>None reported</p>}
                </div>

                <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '15px', fontWeight: '800', textTransform: 'uppercase' }}>Incentives & Taxes</p>

                    {(item.punchOut?.allowanceTA > 0 || item.punchOut?.nightStayAmount > 0) ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {item.punchOut.allowanceTA > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>TA:</span> <span style={{ color: '#10b981', fontWeight: '800' }}>+₹{item.punchOut.allowanceTA}</span></div>}
                            {item.punchOut.nightStayAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-muted)' }}>Stay:</span> <span style={{ color: '#10b981', fontWeight: '800' }}>+₹{item.punchOut.nightStayAmount}</span></div>}
                        </div>
                    ) : (item.outsideTrip?.occurred) ? (
                        <div>
                            <p style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '18px', margin: 0 }}>+₹{item.outsideTrip.bonusAmount}</p>
                            <p style={{ fontSize: '11px', color: 'white', marginTop: '4px', textTransform: 'uppercase', fontWeight: '700' }}>{item.outsideTrip.tripType}</p>
                        </div>
                    ) : null}

                    {borderTaxRecords.filter(b => b.date === item.date && b.vehicle?._id === item.vehicle?._id).length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>BORDER TAX:</span>
                                <span style={{ color: '#10b981', fontWeight: '800', fontSize: '15px' }}>₹{borderTaxRecords.filter(b => b.date === item.date && b.vehicle?._id === item.vehicle?._id).reduce((sum, b) => sum + b.amount, 0)}</span>
                            </div>
                        </div>
                    )}

                    {!(item.punchOut?.allowanceTA > 0 || item.punchOut?.nightStayAmount > 0 || item.outsideTrip?.occurred || borderTaxRecords.filter(b => b.date === item.date && b.vehicle?._id === item.vehicle?._id).length > 0) && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No extra expenses</p>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {item.punchOut?.otherRemarks && (
                    <div className="glass-card" style={{ padding: '20px', border: '1px solid rgba(244, 63, 94, 0.2)', background: 'rgba(244, 63, 94, 0.02)' }}>
                        <p style={{ fontSize: '10px', color: '#f43f5e', marginBottom: '10px', fontWeight: '900', textTransform: 'uppercase' }}>Reported Issues / Remarks</p>
                        <p style={{ color: 'white', fontSize: '14px', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>{item.punchOut.otherRemarks}</p>
                    </div>
                )}

                {item.punchOut?.remarks && (
                    <div className="glass-card" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Trip Route / Details</p>
                        <p style={{ color: 'white', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{item.punchOut.remarks}</p>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                <div className="glass-card" style={{ padding: '20px', flex: '1', minWidth: '150px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '800' }}>NET TRIP DISTANCE</p>
                    <h3 style={{ color: '#10b981', margin: 0, fontSize: '24px', fontWeight: '900' }}>{item.totalKM || '0'} KM</h3>
                </div>
                <div className="glass-card" style={{ padding: '20px', flex: '2', minWidth: '250px', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '12px', borderRadius: '12px' }}>
                        <MapPin size={22} color="var(--primary)" />
                    </div>
                    <div>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '800' }}>LAST RECORDED COORD</p>
                        <p style={{ fontSize: '12px', color: 'white', margin: 0, fontWeight: '600', lineHeight: '1.4' }}>{item.punchOut?.location?.address || item.punchIn?.location?.address || 'Location data unavailable'}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    </div>
);

const Reports = () => {
    const { selectedCompany } = useCompany();

    // Helpers
    const getToday = () => new Date().toISOString().split('T')[0];
    const getFirstDayOfMonth = () => {
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        return `${yyyy}-${mm}-01`;
    };

    const [startDate, setStartDate] = useState(getFirstDayOfMonth());
    const [endDate, setEndDate] = useState(getToday());

    const logoMap = {
        'YatreeDestination': '/logos/YD.Logo.webp',
        'GoGetGo': '/logos/gogetgo.webp'
    };
    const [reports, setReports] = useState([]);
    const [fastagRecharges, setFastagRecharges] = useState([]);
    const [borderTaxRecords, setBorderTaxRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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
        } catch (err) {
            console.error('Error fetching reports', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        const XLSX = await import('xlsx-js-style');
        if (reports.length === 0 && fastagRecharges.length === 0 && borderTaxRecords.length === 0) {
            return alert('No records to export for this date range.');
        }

        const wb = XLSX.utils.book_new();

        // Track which driver was paid for which day to avoid double counting
        const paidDriversOnDate = new Set();

        // 1. ATTENDANCE & TRIPS SHEET
        const attendanceData = reports.map(r => {
            const punchInTime = r.punchIn?.time ? new Date(r.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';
            const punchOutTime = r.punchOut?.time ? new Date(r.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--';

            // Format YYYY-MM-DD to DD-MM-YYYY
            const reportDate = r.date || 'Unknown';
            const [yyyy, mm, dd] = reportDate.split('-');
            const formattedDate = `${dd}-${mm}-${yyyy}`;

            // Calculate total border tax for this record
            const matchingTaxes = borderTaxRecords.filter(b =>
                b.date === reportDate &&
                b.vehicle?._id?.toString() === r.vehicle?._id?.toString()
            );
            const borderTaxAmount = matchingTaxes.reduce((sum, tax) => sum + (Number(tax.amount) || 0), 0);

            // Salary Logic: Only once per day per driver (prioritize vehicle dutyAmount or fallback to 400)
            const driverDayKey = `${r.driver?._id}_${reportDate}`;
            let dailySalary = 0;
            if (r.driver && !paidDriversOnDate.has(driverDayKey)) {
                dailySalary = r.vehicle?.dutyAmount || 400;
                paidDriversOnDate.add(driverDayKey);
            }

            return {
                'Date': formattedDate,
                'Name': r.driver?.name || 'Unknown',
                'Car': r.vehicle?.carNumber ? r.vehicle.carNumber.slice(-4) : '',
                'In': punchInTime,
                'Out': punchOutTime,
                'KM': r.totalKM || 0,
                'Route': r.punchOut?.remarks || r.punchIn?.remarks || '',
                'Company': (r.vehicle?.isOutsideCar || r.driver?.isFreelancer) ? 'FREELANCER' : selectedCompany.name,
                'Daily': dailySalary,
                'T/P': r.punchOut?.tollParkingAmount || (r.parking || []).reduce((sum, p) => sum + (p.amount || 0), 0),
                'Night': r.punchOut?.nightStayAmount || (r.outsideTrip?.tripType === 'Night Stay' ? 500 : 0),
                'T/A': r.punchOut?.allowanceTA || (r.outsideTrip?.tripType === 'Same Day' ? 100 : 0),
                'Fuel': r.fuel?.amount || 0,
                'Remarks': r.punchOut?.otherRemarks || ''
            };
        });

        const wsAttendance = XLSX.utils.json_to_sheet(attendanceData);
        XLSX.utils.book_append_sheet(wb, wsAttendance, "Daily Reports");

        // 2. BORDER TAX SHEET
        if (borderTaxRecords.length > 0) {
            const borderTaxData = borderTaxRecords.map(b => {
                const [yyyy, mm, dd] = b.date.split('-');
                return {
                    'Date': `${dd}-${mm}-${yyyy}`,
                    'Vehicle': b.vehicle?.carNumber || 'N/A',
                    'Border Name': b.borderName,
                    'Amount': b.amount,
                    'Remarks': b.remarks || ''
                };
            });
            const wsBorder = XLSX.utils.json_to_sheet(borderTaxData);
            XLSX.utils.book_append_sheet(wb, wsBorder, "Border Tax");
        }

        // 3. FASTAG RECHARGES SHEET
        if (fastagRecharges.length > 0) {
            const fastagData = fastagRecharges.map(f => {
                const fDate = new Date(f.date);
                return {
                    'Date': `${String(fDate.getDate()).padStart(2, '0')}-${String(fDate.getMonth() + 1).padStart(2, '0')}-${fDate.getFullYear()}`,
                    'Time': fDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    'Car Number': f.carNumber || 'N/A',
                    'Amount': Number(f.amount) || 0,
                    'Bank/Method': f.method || 'Not Specified',
                    'Remarks': f.remarks || ''
                };
            });
            const wsFastag = XLSX.utils.json_to_sheet(fastagData);
            XLSX.utils.book_append_sheet(wb, wsFastag, "Fastag Recharges");
        }

        // Auto-size columns and Center data for all sheets (using xlsx-js-style)
        const autoSizeColumns = (ws) => {
            if (!ws['!ref']) return;
            const range = XLSX.utils.decode_range(ws['!ref']);
            const colWidths = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxWidth = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    const cell = ws[cellAddress];
                    if (!cell) continue;

                    // Apply styles to every cell
                    cell.s = {
                        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                        font: { name: 'Arial', sz: 10 }
                    };

                    // Bold headers for the first row
                    if (R === 0) {
                        cell.s.font.bold = true;
                        cell.s.fill = { fgColor: { rgb: "E9E9E9" } };
                    }

                    if (!cell.v) continue;
                    const cellValue = cell.v.toString();
                    maxWidth = Math.max(maxWidth, cellValue.length + 2);
                }
                colWidths.push({ wch: maxWidth });
            }
            ws['!cols'] = colWidths;
        };

        Object.values(wb.Sheets).forEach(autoSizeColumns);

        // Generate Excel file and trigger download
        XLSX.writeFile(wb, `Fleet_Report_${selectedCompany.name}_${startDate}_to_${endDate}.xlsx`);
    };

    const filteredReports = reports.filter(r =>
        r.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.vehicle?.carNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Operational Reports" description="Detailed daily fleet reports, attendance logs, and expenditure history for your taxi business." />
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '30px 0',
                gap: '20px',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', background: 'white', borderRadius: '12px', padding: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <img src={logoMap[selectedCompany?.name]} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>Daily Reports</h1>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '12px' }}>Operational logs for {selectedCompany?.name}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', top: '-18px', left: '0', fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>From</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-field"
                                style={{
                                    height: '45px',
                                    marginBottom: 0,
                                    width: '140px',
                                    padding: '0 12px'
                                }}
                            />
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>-</span>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', top: '-18px', left: '0', fontSize: '9px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>To</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-field"
                                style={{
                                    height: '45px',
                                    marginBottom: 0,
                                    width: '140px',
                                    padding: '0 12px'
                                }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="btn-primary"
                        style={{ height: '45px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
                    >
                        <Download size={18} /> <span className="tablet-hide">Export Excel</span><span className="mobile-only">Excel</span>
                    </button>
                </div>
            </header>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <input
                        type="text"
                        placeholder="Search by driver name or car number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '45px', marginBottom: 0, height: '50px' }}
                    />
                    <Search size={20} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                </div>
                <button className="glass-card" style={{ width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', borderRadius: '12px' }}>
                    <Filter size={20} />
                </button>
            </div>

            <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '1000px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Fleet Personnel</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Vehicle Insight</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Start Duty</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>End Duty</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Base Pay</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Trip Distance</th>
                            <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right' }}>Details</th>
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
                                const driverDayKey = `${report.driver?._id}_${report.date}`;
                                let showSalary = 0;
                                if (report.driver && !paidInUI.has(driverDayKey)) {
                                    showSalary = report.vehicle?.dutyAmount || 400;
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <UserIcon size={18} color="var(--primary)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: '800', fontSize: '14px', margin: 0 }}>{report.driver?.name || 'Unknown'}</p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{report.driver?.mobile || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: '700', fontSize: '14px' }}>
                                                <Car size={16} style={{ color: 'var(--primary)' }} />
                                                <span>{report.vehicle?.carNumber}</span>
                                            </div>
                                            <span style={{
                                                fontSize: '9px',
                                                color: report.vehicle?.isOutsideCar ? '#f59e0b' : (report.driver?.isFreelancer ? '#f43f5e' : '#10b981'),
                                                background: report.vehicle?.isOutsideCar ? 'rgba(245, 158, 11, 0.1)' : (report.driver?.isFreelancer ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                fontWeight: '800',
                                                marginTop: '6px',
                                                display: 'inline-block',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.4px'
                                            }}>
                                                {report.vehicle?.isOutsideCar ? 'OUTSIDE' : (report.driver?.isFreelancer ? 'FREELANCER' : 'STAFF')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '800' }}>
                                                <ArrowUpRight size={14} />
                                                <span>{new Date(report.punchIn?.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: '600' }}>{report.punchIn?.km?.toLocaleString()} KM</p>
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            {report.punchOut?.time ? (
                                                <>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontWeight: '800' }}>
                                                        <ArrowDownLeft size={14} />
                                                        <span>{new Date(report.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: '600' }}>{report.punchOut.km?.toLocaleString()} KM</p>
                                                </>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800', width: 'fit-content' }}>
                                                    <div className="pulse-dot"></div>
                                                    ON DUTY
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <span style={{ color: showSalary > 0 ? '#10b981' : 'rgba(255,255,255,0.1)', fontWeight: '900', fontSize: '15px' }}>
                                                {showSalary > 0 ? `₹${showSalary.toLocaleString()}` : '--'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 25px' }}>
                                            <span style={{ fontWeight: '900', fontSize: '18px', color: report.totalKM ? '#10b981' : 'rgba(255,255,255,0.1)', letterSpacing: '-0.5px' }}>
                                                {report.totalKM ? `${report.totalKM.toLocaleString()} KM` : '--'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => setSelectedItem(report)}
                                                className="glass-card"
                                                style={{ padding: '10px 18px', color: 'var(--primary)', border: '1px solid rgba(14, 165, 233, 0.1)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
                                            >
                                                <Eye size={16} /> <span className="tablet-hide">View Logs</span><span className="mobile-only">Log</span>
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            });
                        })()}
                    </tbody>
                </table>
            </div>

            {/* BORDER TAX SECTION */}
            {borderTaxRecords.length > 0 && (
                <div style={{ marginTop: '50px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                        <div style={{ width: '6px', height: '24px', background: 'var(--primary)', borderRadius: '10px', boxShadow: '0 0 15px var(--primary)' }}></div>
                        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Border Tax Ledger</h2>
                    </div>
                    <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '900px' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Date</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Vehicle No</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Border Point</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Tax Amount</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Operator</th>
                                    <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Audit Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {borderTaxRecords.map((b) => (
                                    <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '18px 25px', fontSize: '14px', fontWeight: '600' }}>{b.date.split('-').reverse().join('-')}</td>
                                        <td style={{ padding: '18px 25px', fontWeight: '800', fontSize: '15px' }}>{b.vehicle?.carNumber}</td>
                                        <td style={{ padding: '18px 25px', fontSize: '14px' }}>{b.borderName}</td>
                                        <td style={{ padding: '18px 25px', color: '#10b981', fontWeight: '900', fontSize: '16px' }}>₹{b.amount.toLocaleString()}</td>
                                        <td style={{ padding: '18px 25px', fontSize: '14px' }}>{b.driver?.name || 'N/A'}</td>
                                        <td style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>{b.remarks || '---'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {selectedItem && (
                    <AttendanceModal
                        item={selectedItem}
                        onClose={() => setSelectedItem(null)}
                        borderTaxRecords={borderTaxRecords}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reports;
