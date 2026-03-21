import React, { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import { 
    ShieldAlert, Wallet, Droplets, Car, Search, ChevronRight, 
    X, Plus, CreditCard, Wrench, AlertCircle, CheckCircle2,
    Calendar, Filter, TrendingUp, History, MapPin, 
    AlertTriangle, Archive, RefreshCcw, Info, ArrowUpRight,
    XCircle, Trash2, Edit2, Camera, User, Download, FileText,
    ImageIcon, IndianRupee, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';
import { todayIST, formatDateIST, nowIST } from '../utils/istUtils';

const CarUtility = () => {
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [lowBalanceOnly, setLowBalanceOnly] = useState(false);
    
    // Filtering State
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [activeUtility, setActiveUtility] = useState(null); 
    const [viewingImage, setViewingImage] = useState(null);
    
    const [allBorderEntries, setAllBorderEntries] = useState([]);
    const [allServiceRecords, setAllServiceRecords] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    const selectedVehicle = vehicles.find(v => v._id === selectedVehicleId);

    useEffect(() => {
        if (selectedCompany) fetchAllData();
    }, [selectedCompany]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const headers = { Authorization: `Bearer ${token}` };
            const [vehRes, borderRes, serviceRes, dvrRes] = await Promise.all([
                axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=all`, { headers }),
                axios.get(`/api/admin/border-tax/${selectedCompany._id}`, { headers }),
                axios.get(`/api/admin/maintenance/${selectedCompany._id}?type=driver_services`, { headers }),
                axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false`, { headers })
            ]);
            setVehicles((vehRes.data.vehicles || []).filter(v => typeof v.carNumber === 'string' && !v.carNumber.includes('#')));
            setAllBorderEntries(borderRes.data || []);
            setAllServiceRecords(serviceRes.data || []);
            setDrivers(dvrRes.data.drivers || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleRecharge = async (rechargeData) => {
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            await axios.post(`/api/admin/vehicles/${selectedVehicleId}/fastag-recharge`, rechargeData, { headers: { Authorization: `Bearer ${token}` }});
            setMessage({ type: 'success', text: 'Recharge Recorded' });
            fetchAllData();
        } catch (err) { setMessage({ type: 'error', text: 'Failed to save' }); }
        finally { setSubmitting(false); }
    };

    const handleAddTax = async (formData) => {
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            await axios.post('/api/admin/border-tax', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
            setMessage({ type: 'success', text: 'Tax Recorded' });
            fetchAllData();
        } catch (err) { setMessage({ type: 'error', text: 'Failed to save' }); }
        finally { setSubmitting(false); }
    };

    const handleAddService = async (formData) => {
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            await axios.post('/api/admin/maintenance', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
            setMessage({ type: 'success', text: 'Service Recorded' });
            fetchAllData();
        } catch (err) { setMessage({ type: 'error', text: 'Failed to save' }); }
        finally { setSubmitting(false); }
    };

    const handleDeleteRecord = async (endpoint, id) => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            await axios.delete(`/api/admin/${endpoint}/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            fetchAllData();
        } catch (err) { alert('Failed'); }
    };

    // Global Stats Calculation
    const globalStats = useMemo(() => {
        let fastag = 0, border = 0, service = 0;
        
        vehicles.forEach(v => {
            (v.fastagHistory || []).forEach(h => {
                const d = nowIST(h.date);
                if (d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear) fastag += (Number(h.amount) || 0);
            });
        });

        allBorderEntries.forEach(e => {
            const d = nowIST(e.date);
            if (d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear) border += (Number(e.amount) || 0);
        });

        allServiceRecords.forEach(r => {
            const d = nowIST(r.billDate);
            if (d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear) service += (Number(r.amount) || 0);
        });

        return { fastag, border, service, total: fastag + border + service };
    }, [vehicles, allBorderEntries, allServiceRecords, selectedMonth, selectedYear]);

    const getVehicleActivity = (vId) => {
        const v = vehicles.find(v => v._id === vId);
        const fastagHistory = v ? (v.fastagHistory || []) : [];
        const filteredFastag = fastagHistory.filter(h => {
             const d = nowIST(h.date);
             return d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear;
        });
        const fastagSum = filteredFastag.reduce((s, h) => s + (Number(h.amount) || 0), 0);
        const filteredBorder = allBorderEntries.filter(e => {
            const d = nowIST(e.date);
            const isCar = (e.vehicle?._id === vId || e.vehicle === vId);
            return isCar && d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear;
        });
        const borderSum = filteredBorder.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const filteredService = allServiceRecords.filter(r => {
            const d = nowIST(r.billDate);
            const isCar = (r.vehicle?._id === vId || r.vehicle === vId);
            return isCar && d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear;
        });
        const serviceSum = filteredService.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        const washCount = filteredService.filter(r => String(r.category || r.description).toLowerCase().includes('wash')).length;
        return { fastag: fastagSum, border: borderSum, service: serviceSum, washCount, total: fastagSum + borderSum + serviceSum, allServices: filteredService, allBorders: filteredBorder, allFastags: filteredFastag };
    };

    const filteredVehicles = vehicles
        .filter(v => (v.carNumber + (v.model||'') + (v.fastagNumber||'')).toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(v => lowBalanceOnly ? (v.fastagBalance || 0) < 500 : true);

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '60px', background: '#0a101f' }}>
            <SEO title="Utility Center" description="Fleet Account Manager" />
            
            <div className="container-fluid" style={{ maxWidth: '1440px' }}>
                <header style={{ padding: '30px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '30px', fontWeight: '1000', color: 'white', letterSpacing: '-1px' }}>Monthly <span style={{ color: '#0ea5e9' }}>Account</span></h1>
                            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Fleet Operation Hub</p>
                        </div>

                        {/* GLOBAL TOTALS IN HEADER */}
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <HeadStat label="Fleet Fastag" val={globalStats.fastag} col="#0ea5e9" icon={Wallet} />
                            <HeadStat label="Fleet Border" val={globalStats.border} col="#fbbf24" icon={ShieldAlert} />
                            <HeadStat label="Fleet Service" val={globalStats.service} col="#a855f7" icon={Droplets} />
                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }}></div>
                            <HeadStat label="Grand Total" val={globalStats.total} col="#10b981" icon={IndianRupee} isTotal />
                        </div>

                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={{ background: 'none', border: 'none', color: 'white', padding: '10px 15px', fontWeight: '1000', fontSize: '13px', cursor: 'pointer' }}>{months.map((m, i) => <option key={m} value={i} style={{background:'#0a0f1c'}}>{m}</option>)}</select>
                                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={{ background: 'none', border: 'none', color: 'white', padding: '10px 15px', fontWeight: '1000', fontSize: '13px', cursor: 'pointer', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>{years.map(y => <option key={y} value={y} style={{background:'#0a0f1c'}}>{y}</option>)}</select>
                            </div>
                            <div style={{ position: 'relative', width: '220px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                <input type="text" placeholder="Search cars..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field" style={{ paddingLeft: '48px', marginBottom: 0, height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }} />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="glass-card" style={{ padding: 0, borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>{['VEHICLE', 'FASTAG LOAD', 'BORDER TAX', 'WASH & SERVICE', 'MONTHLY TOTAL', 'ACTION'].map(h => (<th key={h} style={{ padding: '20px 25px', textAlign: 'left', fontSize: '11px', fontWeight: '1000', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>))}</tr></thead>
                        <tbody>
                            {loading ? <tr><td colSpan="6" style={{padding:'50px', textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}}></div></td></tr> : filteredVehicles.map(v => {
                                const act = getVehicleActivity(v._id);
                                return (
                                    <tr key={v._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                                        <td style={{ padding: '20px 25px' }}><div style={{ fontWeight: '1000', fontSize: '17px', color: 'white' }}>{v.carNumber}</div><div style={{ fontSize: '12px', color: '#0ea5e9', fontWeight: '900' }}>Balance: ₹{v.fastagBalance || 0}</div></td>
                                        <td style={{ padding: '20px 25px' }}><div style={{ fontSize: '20px', fontWeight: '1000', color: '#0ea5e9' }}>₹{act.fastag.toLocaleString()}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>Loaded in {shortMonths[selectedMonth]}</div></td>
                                        <td style={{ padding: '20px 25px' }}><div style={{ fontSize: '20px', fontWeight: '1000', color: '#fbbf24' }}>₹{act.border.toLocaleString()}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>Permit Paid</div></td>
                                        <td style={{ padding: '20px 25px' }}><div style={{ fontSize: '20px', fontWeight: '1000', color: '#a855f7' }}>₹{act.service.toLocaleString()}</div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>{act.washCount} Washes</div></td>
                                        <td style={{ padding: '20px 25px' }}><div style={{ fontSize: '22px', fontWeight: '1000', color: 'white' }}>₹{act.total.toLocaleString()}</div><div style={{ fontSize: '13px', color: '#10b981', fontWeight: '1000' }}>{shortMonths[selectedMonth]} Total</div></td>
                                        <td style={{ padding: '20px 25px' }}><button onClick={() => { setSelectedVehicleId(v._id); setActiveUtility(null); }} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: '1000' }}>MANAGE HUB</button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedVehicleId && selectedVehicle && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2, 6, 23, 0.96)', backdropFilter: 'blur(15px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-glass" style={{ width: '100%', maxWidth: '1100px', maxHeight: '92vh', background: '#0a101f', borderRadius: '32px', overflowY: 'auto', border: '1.5px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ padding: '30px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}><div style={{ width: '50px', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Car size={26} color="#0ea5e9" /></div><div><h2 style={{ margin: 0, fontWeight: '1000', fontSize: '26px' }}>{selectedVehicle.carNumber} Hub</h2><span style={{ fontSize: '12px', fontWeight: '1000', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>{months[selectedMonth]} {selectedYear} Account Detail</span></div></div>
                                <button onClick={() => setSelectedVehicleId(null)} style={{ background: 'rgba(255,255,255,0.05)', width: '45px', height: '45px', borderRadius: '50%', border:'none', color:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><X size={24}/></button>
                            </div>
                            <div style={{ padding: '40px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '40px' }}>
                                    <MiniStat label="Fastag Loaded" val={getVehicleActivity(selectedVehicle._id).fastag} col="#0ea5e9" />
                                    <MiniStat label="Border Tax" val={getVehicleActivity(selectedVehicle._id).border} col="#fbbf24" />
                                    <MiniStat label="Extra Services" val={getVehicleActivity(selectedVehicle._id).service} col="#a855f7" />
                                    <MiniStat label="Monthly Total" val={getVehicleActivity(selectedVehicle._id).total} col="#10b981" />
                                </div>
                                {!activeUtility ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' }}>
                                        <ActionTile title="Fastag Wallet" meta="Load history & details" icon={Wallet} color="#0ea5e9" onClick={() => setActiveUtility('fastag')} />
                                        <ActionTile title="Border Permits" meta="Tax records & receipts" icon={ShieldAlert} color="#fbbf24" onClick={() => setActiveUtility('border')} />
                                        <ActionTile title="Service Records" meta="Washes & Manual Entry" icon={Droplets} color="#a855f7" onClick={() => setActiveUtility('services')} />
                                    </div>
                                ) : (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <button onClick={() => setActiveUtility(null)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px 24px', borderRadius: '14px', border: 'none', cursor: 'pointer', marginBottom: '30px', fontWeight: '1000', fontSize: '12px' }}>← Hub Overview</button>
                                        {message.text && <div style={{ marginBottom: '25px', padding: '18px', borderRadius: '16px', background: message.type==='success'?'#10b98115':'#f43f5e15', color: message.type==='success'?'#10b981':'#f43f5e', border: '1px solid currentColor', fontWeight: '1000' }}>{message.text}</div>}
                                        <UtilityCore type={activeUtility} color={activeUtility==='fastag'?'#0ea5e9':activeUtility==='border'?'#fbbf24':'#a855f7'} act={getVehicleActivity(selectedVehicleId)} drivers={drivers} onAdd={activeUtility==='fastag'?handleRecharge:activeUtility==='border'?handleAddTax:handleAddService} onDelete={id => handleDeleteRecord(activeUtility==='fastag' ? `vehicles/${selectedVehicleId}/fastag-recharge` : activeUtility==='border' ? 'border-tax' : 'maintenance', id)} setViewingImage={setViewingImage} submitting={submitting} vehicle={selectedVehicle} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>{viewingImage && (<div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '50px' }} onClick={() => setViewingImage(null)}><img src={viewingImage} style={{ maxWidth: '98%', maxHeight: '98%', borderRadius: '25px' }} /></div>)}</AnimatePresence>
        </div>
    );
};

const HeadStat = ({ label, val, col, icon: Icon, isTotal }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: isTotal ? `${col}15` : 'transparent', padding: isTotal ? '10px 20px' : '0', borderRadius: '14px', border: isTotal ? `1px solid ${col}30` : 'none' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${col}15`, color: col, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Icon size={18}/></div>
        <div>
            <div style={{ fontSize: '9px', fontWeight: '1000', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '1px' }}>{label}</div>
            <div style={{ fontSize: '18px', fontWeight: '1000', color: isTotal ? col : 'white' }}>₹{val.toLocaleString()}</div>
        </div>
    </div>
);

const MiniStat = ({ label, val, col }) => (
    <div style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(255,255,255,0.06)', borderRadius: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', fontWeight: '1000', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: '1000', color: col }}>₹{val.toLocaleString()}</div>
    </div>
);

const ActionTile = ({ title, meta, icon: Icon, color, onClick }) => (
    <div onClick={onClick} style={{ padding: '45px 30px', background: 'rgba(255,255,255,0.01)', border: '2px solid rgba(255,255,255,0.05)', borderRadius: '32px', cursor: 'pointer', transition: '0.2s', textAlign: 'center' }}>
        <div style={{ width: '55px', height: '55px', borderRadius: '18px', background: `${col}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 25px' }}><Icon size={28} /></div>
        <div style={{ fontSize: '20px', fontWeight: '1000', color: 'white', marginBottom: '10px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>{meta}</div>
    </div>
);

const UtilityCore = ({ type, color, act, drivers, onAdd, onDelete, setViewingImage, submitting, vehicle }) => {
    const [form, setForm] = useState({ amount: '', remarks: '', borderName: '', date: todayIST(), billDate: todayIST(), driverId: '', category: 'Car Wash' });
    const [file, setFile] = useState(null);
    const history = type === 'fastag' ? act.allFastags : type === 'border' ? act.allBorders : act.allServices;
    const handleSave = () => {
        if (type === 'fastag') onAdd({ amount: form.amount, remarks: form.remarks, method: 'UPI', date: todayIST() });
        else {
            const fd = new FormData(); Object.keys(form).forEach(k => fd.append(k, form[k]));
            if (file) fd.append(type==='border'?'receiptPhoto':'billPhoto', file);
            if (type==='service') { fd.append('vehicleId', vehicle._id); fd.append('maintenanceType', 'Car Service'); }
            onAdd(fd);
        }
        setForm({ amount: '', remarks: '', borderName: '', date: todayIST(), billDate: todayIST(), driverId: '', category: 'Car Wash' }); setFile(null);
    };
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '40px' }}>
            <div style={{ padding: '35px', background: `${color}08`, borderRadius: '28px', border: `1px solid ${color}20` }}>
                <h4 style={{ margin: '0 0 25px 0', fontSize: '16px', color: color, fontWeight: '1000', textTransform: 'uppercase' }}>Record New Entry</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div className="form-group"><label>Amount ₹</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="input-field" style={{height:'52px'}} /></div>
                    {type === 'fastag' && <div className="form-group"><label>Remarks</label><input type="text" value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} className="input-field" style={{height:'52px'}}/></div>}
                    {type === 'border' && <>
                        <div className="form-group"><label>Border Name</label><input type="text" value={form.borderName} onChange={e=>setForm({...form, borderName:e.target.value})} className="input-field" style={{height:'48px'}}/></div>
                        <div className="form-group"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="input-field" style={{height:'48px', colorScheme:'dark'}}/></div>
                    </>}
                    {type === 'service' && <div className="form-group"><label>Category</label><select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="input-field" style={{height:'48px'}}><option>Car Wash</option><option>Puncture</option><option>Tissue Box</option><option>Water Bottle</option><option>Other details</option></select></div>}
                    {(type === 'border' || type === 'service') && <><div className="form-group"><label>Driver</label><select value={form.driverId} onChange={e=>setForm({...form, driverId:e.target.value})} className="input-field" style={{height:'48px'}}><option value="">Manual Entry</option>{drivers.map(d=><option key={d._id} value={d._id}>{d.name}</option>)}</select></div><input type="file" onChange={e=>setFile(e.target.files[0])} /></>}
                    <button onClick={handleSave} className="btn-primary" style={{height:'56px', background:color, color: (type==='border'||type==='fastag')?'black':'white', fontWeight:'1000', fontSize:'15px' }} disabled={submitting}>SUBMIT ACCOUNT DATA</button>
                </div>
            </div>
            <div style={{ height: '520px', overflowY: 'auto' }} className="sidebar-nav-scroll">
                {history.sort((a,b)=>new Date(b.date||b.billDate)-new Date(a.date||a.billDate)).map((item, i) => (
                    <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                            {(item.receiptPhoto || item.billPhoto) && <div onClick={() => setViewingImage(`${axios.defaults.baseURL}${item.receiptPhoto || item.billPhoto}`)} style={{ width: '55px', height: '55px', borderRadius: '12px', background: 'white', cursor: 'pointer', overflow: 'hidden' }}><img src={`${axios.defaults.baseURL}${item.receiptPhoto || item.billPhoto}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                            <div>
                                <div style={{ fontSize: '17px', fontWeight: '1000', color: 'white' }}>₹{(item.amount || 0).toLocaleString()} — {item.borderName || item.category || 'Recharge'}</div>
                                <div style={{ fontSize: '13px', opacity: 0.5, fontWeight: '800' }}>{formatDateIST(item.date || item.billDate)} {item.remarks && `• ${item.remarks}`} {item.driver && `• ${item.driver.name}`}</div>
                            </div>
                        </div>
                        <button onClick={() => onDelete(item._id)} style={{ color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CarUtility;
