import React from 'react';
import { motion } from 'framer-motion';
import {
    X, ArrowUpRight, ArrowDownLeft, MapPin, Car, Fuel, ParkingSquare,
    IndianRupee, TrendingUp, Moon, Zap, Camera, CheckCircle2, Clock
} from 'lucide-react';

/* ─── tiny helpers ─── */
const fmt = (d) => {
    if (!d) return '--';
    const s = typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
    const [y, m, dd] = s.split('-');
    return `${dd}/${m}/${y}`;
};
const fmtTime = (t) => t ? new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';

/* ─── Photo card ─── */
const PhotoCard = ({ url, label }) => {
    if (!url) return null;
    return (
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')}>
            <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2, background: 'rgba(0,0,0,0.7)', padding: '3px 8px', borderRadius: '6px', fontSize: '9px', color: 'rgba(255,255,255,0.8)', fontWeight: '800', textTransform: 'uppercase' }}>{label}</div>
            <img src={url} alt={label} style={{ width: '100%', height: '130px', objectFit: 'cover', transition: 'transform 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                loading="lazy" />
        </div>
    );
};

/* ─── Stat row ─── */
const Stat = ({ label, value, color = 'white', sub }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{label}</span>
        <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '13px', color, fontWeight: '800' }}>{value}</span>
            {sub && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>{sub}</div>}
        </div>
    </div>
);

/* ─── Section header ─── */
const SH = ({ color, icon: Icon, title, time }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}20`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Icon size={14} color={color} />
            </div>
            <span style={{ color, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
        </div>
        {time && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{time}</span>}
    </div>
);

/* ═══════════════════════════════ MAIN MODAL */
const AttendanceModal = ({ item, onClose }) => {
    if (!item) return null;
    const isAttendance = item.entryType === 'attendance';

    const openKM = item.punchIn?.km;
    const closeKM = item.punchOut?.km;
    const totalKM = item.totalKM ?? (typeof openKM === 'number' && typeof closeKM === 'number' ? closeKM - openKM : null);

    const salary = Number(item.dailyWage) || 0;
    const allowanceTA = Number(item.punchOut?.allowanceTA) || 0;
    const nightStay = Number(item.punchOut?.nightStayAmount) || 0;
    const outsideBonus = Number(item.outsideTrip?.bonusAmount) || 0;
    const bonus = allowanceTA + nightStay + outsideBonus;

    const fuelAmt = Number(item.fuel?.amount) || 0;
    const fuelEntries = item.fuel?.entries || [];
    const parkingAmt = Number(item.punchOut?.tollParkingAmount) || 0;
    const parkingBy = item.punchOut?.parkingPaidBy || 'Self';

    const isCompleted = item.status === 'completed';
    const totalPayable = salary + bonus + (parkingBy !== 'Office' ? parkingAmt : 0);

    /* render per entry-type */
    const renderBody = () => {
        if (isAttendance) return renderAttendance();
        if (item.entryType === 'fuel') return renderFuel();
        if (item.entryType === 'advance') return renderAdvance();
        if (item.entryType === 'parking') return renderParking();
        if (item.entryType === 'maintenance') return renderMaintenance();
        if (item.entryType === 'borderTax') return renderBorderTax();
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <p>Details for <strong>{item.entryType}</strong> record.</p>
                <pre style={{ fontSize: '10px', textAlign: 'left', overflow: 'auto', maxHeight: '300px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '15px' }}>
                    {JSON.stringify(item, null, 2)}
                </pre>
            </div>
        );
    };

    const renderAttendance = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding: '24px' }}>

            {/* ── LEFT: Punch In ── */}
            <div style={{ background: 'rgba(16,185,129,0.04)', borderRadius: '18px', padding: '22px', border: '1px solid rgba(16,185,129,0.1)' }}>
                <SH color="#10b981" icon={ArrowUpRight} title="Punch-In Proof" time={fmtTime(item.punchIn?.time)} />
                {(item.punchIn?.selfie || item.punchIn?.kmPhoto || item.punchIn?.carSelfie) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                        <PhotoCard url={item.punchIn?.selfie} label="Driver Selfie" />
                        <PhotoCard url={item.punchIn?.kmPhoto} label="Start KM" />
                        {item.punchIn?.carSelfie && <div style={{ gridColumn: '1/-1' }}><PhotoCard url={item.punchIn.carSelfie} label="Vehicle" /></div>}
                    </div>
                )}
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px' }}>
                    <Stat label="Opening KM" value={openKM != null ? `${openKM} km` : '--'} color="#38bdf8" />
                    <Stat label="Date" value={fmt(item.date)} />
                    <Stat label="Pickup Location" value={item.pickUpLocation || 'N/A'} color="rgba(255,255,255,0.7)" />
                </div>
            </div>

            {/* ── MIDDLE: Punch Out ── */}
            <div style={{ background: isCompleted ? 'rgba(244,63,94,0.04)' : 'rgba(245,158,11,0.03)', borderRadius: '18px', padding: '22px', border: `1px solid ${isCompleted ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)'}` }}>
                <SH color={isCompleted ? '#f43f5e' : '#f59e0b'} icon={ArrowDownLeft} title={isCompleted ? 'Punch-Out Proof' : 'On Duty'} time={fmtTime(item.punchOut?.time)} />
                {isCompleted ? (
                    <>
                        {(item.punchOut?.selfie || item.punchOut?.kmPhoto || item.punchOut?.carSelfie) && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                                <PhotoCard url={item.punchOut?.selfie} label="Driver Selfie" />
                                <PhotoCard url={item.punchOut?.kmPhoto} label="Close KM" />
                                {item.punchOut?.carSelfie && <div style={{ gridColumn: '1/-1' }}><PhotoCard url={item.punchOut.carSelfie} label="Vehicle" /></div>}
                            </div>
                        )}
                        <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px' }}>
                            <Stat label="Closing KM" value={closeKM != null ? `${closeKM} km` : '--'} color="#f43f5e" />
                            <Stat label="Total KM Run" value={totalKM != null ? `${totalKM} km` : '--'} color="white"
                                sub={openKM != null && closeKM != null ? `${openKM} → ${closeKM}` : undefined} />
                            <Stat label="Drop Location" value={item.dropLocation || 'N/A'} color="rgba(255,255,255,0.7)" />
                            {item.punchOut?.otherRemarks && <Stat label="Remarks" value={item.punchOut.otherRemarks} color="#f59e0b" />}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(245,158,11,0.03)', borderRadius: '14px', border: '1px dashed rgba(245,158,11,0.15)' }}>
                        <Clock size={32} color="rgba(245,158,11,0.4)" style={{ marginBottom: '10px' }} />
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: '700', margin: 0 }}>Duty still in progress…</p>
                    </div>
                )}
            </div>

            {/* ── RIGHT: Expenses + Salary ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* KM Summary */}
                <div style={{ background: 'rgba(56,189,248,0.05)', borderRadius: '18px', padding: '20px', border: '1px solid rgba(56,189,248,0.1)' }}>
                    <SH color="#38bdf8" icon={TrendingUp} title="KM Summary" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                        {[
                            { label: 'Open KM', val: openKM, color: '#38bdf8' },
                            { label: 'Close KM', val: closeKM, color: '#f43f5e' },
                            { label: 'Total Run', val: totalKM, color: 'white' },
                        ].map(({ label, val, color }) => (
                            <div key={label} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '12px 6px' }}>
                                <div style={{ color, fontWeight: '900', fontSize: '18px' }}>{val ?? '--'}</div>
                                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '800', marginTop: '3px' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fuel */}
                {(fuelAmt > 0 || fuelEntries.length > 0) && (
                    <div style={{ background: 'rgba(245,158,11,0.05)', borderRadius: '18px', padding: '20px', border: '1px solid rgba(245,158,11,0.1)' }}>
                        <SH color="#f59e0b" icon={Fuel} title="Fuel" />
                        <Stat label="Total Fuel Cost" value={`₹${fuelAmt}`} color="#f59e0b" />
                        {fuelEntries.map((fe, i) => (
                            <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '10px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Fill #{i + 1} · {fe.fuelType || 'Diesel'}</span>
                                    <span style={{ color: '#f59e0b' }}>₹{fe.amount}</span>
                                </div>
                                {fe.km && <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>At {fe.km} KM · {fe.quantity || '--'} L</div>}
                                {fe.slipPhoto && (
                                    <div style={{ marginTop: '8px' }}>
                                        <PhotoCard url={fe.slipPhoto} label="Fuel Slip" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {/* Legacy single entry */}
                        {fuelEntries.length === 0 && item.fuel?.slipPhoto && <PhotoCard url={item.fuel.slipPhoto} label="Fuel Slip" />}
                    </div>
                )}

                {/* Parking */}
                {parkingAmt > 0 && (
                    <div style={{ background: 'rgba(129,140,248,0.05)', borderRadius: '18px', padding: '20px', border: '1px solid rgba(129,140,248,0.1)' }}>
                        <SH color="#818cf8" icon={MapPin} title="Parking / Toll" />
                        <Stat label="Amount" value={`₹${parkingAmt}`} color="#818cf8" />
                        <Stat label="Paid By" value={parkingBy}
                            color={parkingBy === 'Office' ? '#10b981' : '#a78bfa'}
                            sub={parkingBy === 'Self' ? 'Will be reimbursed to driver' : 'Company expense'} />
                        {(item.parking || []).map((p, i) => (
                            p.slipPhoto && <div key={i} style={{ marginTop: '8px' }}><PhotoCard url={p.slipPhoto} label={`Parking Slip #${i + 1}`} /></div>
                        ))}
                    </div>
                )}

                {/* Bonuses */}
                {(allowanceTA > 0 || nightStay > 0 || outsideBonus > 0) && (
                    <div style={{ background: 'rgba(34,197,94,0.05)', borderRadius: '18px', padding: '20px', border: '1px solid rgba(34,197,94,0.1)' }}>
                        <SH color="#22c55e" icon={Zap} title="Bonuses" />
                        {allowanceTA > 0 && <Stat label="TA Allowance (Same Day Return)" value={`+₹${allowanceTA}`} color="#22c55e" />}
                        {nightStay > 0 && <Stat label="Night Stay Allowance" value={`+₹${nightStay}`} color="#fbbf24" sub="Night shift duty" />}
                        {outsideBonus > 0 && <Stat label="Outside Trip Bonus" value={`+₹${outsideBonus}`} color="#38bdf8" sub={item.outsideTrip?.tripType} />}
                    </div>
                )}

                {/* Salary Summary */}
                <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: '18px', padding: '20px', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <SH color="#10b981" icon={IndianRupee} title="Settlement" />
                    <Stat label="Daily Wage" value={`₹${salary}`} color="white" />
                    {bonus > 0 && <Stat label="Total Bonus" value={`+₹${bonus}`} color="#22c55e" />}
                    {parkingBy !== 'Office' && parkingAmt > 0 && <Stat label="Parking (Reimburse)" value={`+₹${parkingAmt}`} color="#818cf8" />}
                    <div style={{ borderTop: '1px solid rgba(16,185,129,0.2)', marginTop: '8px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#10b981', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}>Total Payable</span>
                        <span style={{ color: '#10b981', fontWeight: '900', fontSize: '22px' }}>₹{totalPayable.toLocaleString()}</span>
                    </div>
                    {isCompleted
                        ? <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '11px', fontWeight: '800' }}><CheckCircle2 size={14} /> Duty Completed</div>
                        : <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '11px', fontWeight: '800' }}><Clock size={14} /> Duty In Progress</div>
                    }
                </div>
            </div>
        </div>
    );

    const renderFuel = () => (
        <div style={{ padding: '24px' }}>
            <div style={{ background: 'rgba(34,197,94,0.06)', borderRadius: '18px', padding: '22px', border: '1px solid rgba(34,197,94,0.12)' }}>
                <SH color="#22c55e" icon={Fuel} title="Fuel Log Details" />
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px' }}>
                    <Stat label="Date" value={fmt(item.date)} />
                    <Stat label="Vehicle" value={item.vehicle?.carNumber?.split('#')[0] || '--'} color="#38bdf8" />
                    <Stat label="Driver" value={item.driver?.name || '--'} />
                    <Stat label="Fuel Type" value={item.fuelType || 'Diesel'} color="#22c55e" />
                    <Stat label="Quantity" value={item.quantity ? `${item.quantity} L` : '--'} color="#f59e0b" />
                    <Stat label="Amount" value={`₹${item.amount || 0}`} color="#22c55e" />
                    <Stat label="Odometer" value={item.odometer ? `${item.odometer} KM` : '--'} />
                    <Stat label="Payment" value={item.paymentMethod || item.paymentSource || '--'} />
                </div>
                {item.slipPhoto && <div style={{ marginTop: '16px' }}><PhotoCard url={item.slipPhoto} label="Fuel Slip" /></div>}
            </div>
        </div>
    );

    const renderAdvance = () => (
        <div style={{ padding: '24px' }}>
            <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: '18px', padding: '22px', border: '1px solid rgba(99,102,241,0.12)' }}>
                <SH color="#6366f1" icon={IndianRupee} title="Advance Record" />
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px' }}>
                    <Stat label="Date" value={fmt(item.date)} />
                    <Stat label="Driver" value={item.driver?.name || '--'} color="white" />
                    <Stat label="Amount" value={`₹${item.amount || 0}`} color="#6366f1" />
                    <Stat label="Type" value={item.advanceType || 'Office'} />
                    <Stat label="Given By" value={item.givenBy || '--'} />
                    <Stat label="Remark" value={item.remark || '--'} color="rgba(255,255,255,0.6)" />
                    <Stat label="Status" value={item.status || 'Pending'} color={item.status === 'Settled' ? '#10b981' : '#f59e0b'} />
                </div>
            </div>
        </div>
    );

    const renderParking = () => (
        <div style={{ padding: '24px' }}>
            <div style={{ background: 'rgba(6,182,212,0.06)', borderRadius: '18px', padding: '22px', border: '1px solid rgba(6,182,212,0.12)' }}>
                <SH color="#06b6d4" icon={MapPin} title="Parking Record" />
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px' }}>
                    <Stat label="Date" value={fmt(item.date)} />
                    <Stat label="Vehicle" value={item.vehicle?.carNumber?.split('#')[0] || '--'} color="#38bdf8" />
                    <Stat label="Driver" value={item.driver || '--'} />
                    <Stat label="Amount" value={`₹${item.amount || 0}`} color="#06b6d4" />
                    <Stat label="Location" value={item.location || item.notes || '--'} />
                    <Stat label="Source" value={item.source || 'Admin'} />
                    <Stat label="Status" value={item.isReimbursable ? 'Reimbursable' : 'Office Cost'} color={item.isReimbursable ? '#10b981' : '#f59e0b'} />
                </div>
                {item.slipPhoto && <div style={{ marginTop: '16px' }}><PhotoCard url={item.slipPhoto} label="Parking Slip" /></div>}
            </div>
        </div>
    );

    const renderMaintenance = () => (
        <div style={{ padding: '24px' }}>
            <div style={{ background: 'rgba(239,68,68,0.06)', borderRadius: '18px', padding: '22px', border: '1px solid rgba(239,68,68,0.12)' }}>
                <SH color="#ef4444" icon={Car} title="Maintenance Record" />
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px' }}>
                    <Stat label="Bill Date" value={fmt(item.billDate || item.date)} />
                    <Stat label="Vehicle" value={item.vehicle?.carNumber?.split('#')[0] || '--'} color="#38bdf8" />
                    <Stat label="Type" value={item.maintenanceType || '--'} color="#ef4444" />
                    <Stat label="Description" value={item.description || '--'} />
                    <Stat label="Amount" value={`₹${item.cost || 0}`} color="#ef4444" />
                    <Stat label="Vendor" value={item.vendor || '--'} />
                </div>
                {item.receiptPhoto && <div style={{ marginTop: '16px' }}><PhotoCard url={item.receiptPhoto} label="Bill / Receipt" /></div>}
            </div>
        </div>
    );

    const renderBorderTax = () => (
        <div style={{ padding: '24px' }}>
            <div style={{ background: 'rgba(168,85,247,0.06)', borderRadius: '18px', padding: '22px', border: '1px solid rgba(168,85,247,0.12)' }}>
                <SH color="#a855f7" icon={MapPin} title="Border Tax Record" />
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '14px' }}>
                    <Stat label="Date" value={fmt(item.date)} />
                    <Stat label="Vehicle" value={item.vehicle?.carNumber?.split('#')[0] || '--'} color="#38bdf8" />
                    <Stat label="Border Name" value={item.borderName || '--'} color="#a855f7" />
                    <Stat label="Amount" value={`₹${item.amount || 0}`} color="#a855f7" />
                    <Stat label="Remarks" value={item.remarks || '--'} />
                </div>
                {item.receiptPhoto && <div style={{ marginTop: '16px' }}><PhotoCard url={item.receiptPhoto} label="Receipt" /></div>}
            </div>
        </div>
    );

    /* ── modal title ── */
    const titleMap = {
        attendance: 'Duty Evidence Report',
        fuel: 'Fuel Log Details',
        advance: 'Advance Record',
        parking: 'Parking Record',
        maintenance: 'Maintenance Record',
        borderTax: 'Border Tax Record',
        accidentLog: 'Accident Log',
        partsWarranty: 'Parts Warranty',
        fastag: 'Fastag Recharge',
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                style={{ width: '100%', maxWidth: isAttendance ? '1100px' : '600px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(145deg, #0f172a, #080c14)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
            >
                {/* Header */}
                <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, background: 'linear-gradient(to right, #1e293b, #0f172a)', borderRadius: '28px 28px 0 0' }}>
                    <div>
                        <h2 style={{ color: 'white', fontSize: '20px', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>{titleMap[item.entryType] || 'Record Details'}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: '700', margin: '3px 0 0', textTransform: 'uppercase' }}>
                            {item.driver?.name || item.driverName || ''}{(item.driver?.name || item.driverName) && item.vehicle?.carNumber ? ' · ' : ''}{item.vehicle?.carNumber?.split('#')[0] || ''}
                            {fmt(item.date) !== '--' ? ` · ${fmt(item.date)}` : ''}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                {renderBody()}

                {/* Footer */}
                <div style={{ padding: '18px 28px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '10px 26px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default AttendanceModal;
