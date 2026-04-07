import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { 
    ShieldAlert, Wallet, Droplets, Car, Search, ChevronRight, ChevronLeft,
    X, Plus, CreditCard, Wrench, AlertCircle, CheckCircle2,
    Calendar, Filter, TrendingUp, Zap, Layers, Trash2, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';
import { todayIST, formatDateIST, nowIST } from '../utils/istUtils';

const CarUtility = () => {
    const { selectedCompany } = useCompany();
    const location = useLocation();
    const [vehicles, setVehicles] = useState([]);
    const [allBorderEntries, setAllBorderEntries] = useState([]);
    const [allServiceRecords, setAllServiceRecords] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [activeUtility, setActiveUtility] = useState(null); // 'fastag', 'border', 'services'
    const [searchTerm, setSearchTerm] = useState('');
    const [lowBalanceOnly, setLowBalanceOnly] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [submitting, setSubmitting] = useState(false);
    const [viewingImage, setViewingImage] = useState(null);

    const [selectedMonth, setSelectedMonth] = useState(new Date().getUTCMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getUTCFullYear());

    const shiftMonth = (amount) => {
        let newMonth = selectedMonth + amount;
        let newYear = selectedYear;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newMonth > 11) { newMonth = 0; newYear++; }
        setSelectedMonth(newMonth);
        setSelectedYear(newYear);
    };

    useEffect(() => {
        if (selectedCompany) fetchAllData();
    }, [selectedCompany]);

    // ── AI AGENT SEARCH INTEGRATION ──
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchParam = params.get('search') || params.get('vehicle');
        const utilityParam = params.get('utility') || params.get('type');
        const monthParam = params.get('month');
        const yearParam = params.get('year');
        const vehicleIdParam = params.get('vehicleId');

        if (searchParam) setSearchTerm(searchParam);
        if (utilityParam) setActiveUtility(utilityParam);
        if (monthParam) setSelectedMonth(parseInt(monthParam) - 1); // 0-indexed
        if (yearParam) setSelectedYear(parseInt(yearParam));
        if (vehicleIdParam) setSelectedVehicleId(vehicleIdParam);
    }, [location.search]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const headers = { Authorization: `Bearer ${token}` };
            const [vehRes, borderRes, serviceRes, dvrRes] = await Promise.all([
                axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=fleet`, { headers }),
                axios.get(`/api/admin/border-tax/${selectedCompany._id}`, { headers }),
                axios.get(`/api/admin/maintenance/${selectedCompany._id}?type=driver_services`, { headers }),
                axios.get(`/api/admin/drivers/${selectedCompany._id}?usePagination=false`, { headers })
            ]);
            
            const targetCompanyId = String(selectedCompany._id);
            const filteredVehs = (vehRes.data.vehicles || []).filter(v => {
                const vCompId = String(v.company?._id || v.company || '');
                return vCompId === targetCompanyId && v.isOutsideCar !== true && typeof v.carNumber === 'string' && !v.carNumber.includes('#');
            });
            
            setVehicles(filteredVehs);
            setAllBorderEntries(borderRes.data || []);
            setAllServiceRecords(serviceRes.data || []);
            setDrivers(dvrRes.data.drivers || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const selectedVehicle = useMemo(() => vehicles.find(v => v._id === selectedVehicleId), [vehicles, selectedVehicleId]);

    const handleRecharge = async (data) => {
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            await axios.post(`/api/admin/vehicles/${selectedVehicleId}/fastag-recharge`, data, { headers: { Authorization: `Bearer ${token}` } });
            setMessage({ type: 'success', text: 'Recharge Logged' });
            setTimeout(() => { setMessage({ type: '', text: '' }); fetchAllData(); }, 1500);
        } catch (err) { setMessage({ type: 'error', text: 'Error' }); }
        finally { setSubmitting(false); }
    };

    const handleAddTax = async (formData) => {
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            await axios.post('/api/admin/border-tax', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
            setMessage({ type: 'success', text: 'Tax Recorded' });
            setTimeout(() => { setMessage({ type: '', text: '' }); fetchAllData(); }, 1500);
        } catch (err) { setMessage({ type: 'error', text: 'Error' }); }
        finally { setSubmitting(false); }
    };

    const handleAddService = async (formData) => {
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            await axios.post('/api/admin/maintenance', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
            setMessage({ type: 'success', text: 'Trans Recorded' });
            setTimeout(() => { setMessage({ type: '', text: '' }); fetchAllData(); }, 1500);
        } catch (err) { setMessage({ type: 'error', text: 'Error' }); }
        finally { setSubmitting(false); }
    };

    const handleDeleteRecord = async (endpoint, id) => {
        if (!window.confirm('Delete entry?')) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            await axios.delete(`/api/admin/${endpoint}/${id}`, { headers: { Authorization: `Bearer ${token}` }});
            fetchAllData();
        } catch (err) { alert('Fail'); }
    };

    const handleUpdateRecord = async (endpoint, id, data) => {
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const headers = { Authorization: `Bearer ${token}` };
            if (data instanceof FormData) headers['Content-Type'] = 'multipart/form-data';
            
            await axios.put(`/api/admin/${endpoint}/${id}`, data, { headers });
            setMessage({ type: 'success', text: 'Entry Updated Successfully' });
            setTimeout(() => { setMessage({ type: '', text: '' }); fetchAllData(); }, 1500);
            return true;
        } catch (err) { 
            setMessage({ type: 'error', text: 'Update Failed' }); 
            return false;
        } finally { setSubmitting(false); }
    };

    const getVehicleActivity = (vId) => {
        const v = vehicles.find(v => v._id === vId);
        const fHist = v ? (v.fastagHistory || []) : [];
        
        const fFilt = fHist.filter(h => { const d = nowIST(h.date); return d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear; });
        const bFilt = allBorderEntries.filter(e => { const d = nowIST(e.date); return (e.vehicle?._id === vId || e.vehicle === vId) && d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear; });
        const sFilt = allServiceRecords.filter(r => { const d = nowIST(r.billDate); return (r.vehicle?._id === vId || r.vehicle === vId) && d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear; });
        
        const bAll = allBorderEntries.filter(e => (e.vehicle?._id === vId || e.vehicle === vId));
        const sAll = allServiceRecords.filter(r => (r.vehicle?._id === vId || r.vehicle === vId));

        return { 
            fastag: fFilt.reduce((s, h) => s + (Number(h.amount) || 0), 0),
            border: bFilt.reduce((s, e) => s + (Number(e.amount) || 0), 0),
            service: sFilt.reduce((s, r) => s + (Number(r.amount) || 0), 0),
            total: fFilt.reduce((s, h) => s + (Number(h.amount) || 0), 0) + bFilt.reduce((s, e) => s + (Number(e.amount) || 0), 0) + sFilt.reduce((s, r) => s + (Number(r.amount) || 0), 0),
            items: { fastag: fFilt, border: bFilt, service: sFilt }
        };
    };

    const globalStats = useMemo(() => {
        let f = 0, b = 0, s = 0;
        vehicles.forEach(v => {
            const act = getVehicleActivity(v._id);
            f += act.fastag; b += act.border; s += act.service;
        });
        return { f, b, s, t: f + b + s };
    }, [vehicles, allBorderEntries, allServiceRecords, selectedMonth, selectedYear]);

    const filteredVehicles = vehicles
        .filter(v => (v.carNumber + (v.model||'')).toLowerCase().includes(searchTerm.toLowerCase()))
        .filter(v => lowBalanceOnly ? (v.fastagBalance || 0) < 500 : true);

    const getImageUrl = (p) => {
        if (!p) return ''; if (p.startsWith('http')) return p;
        return `${(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')}/${p.replace(/^\/+/, '')}`;
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0a101f', color: '#fff', padding: '40px' }}>
            <SEO title="Car Utility" description="Fleet Accounts Hub" />
            
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap:'wrap', gap:'20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '50px', height: '50px', background: 'linear-gradient(135deg, var(--primary), var(--primary))', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 20px rgba(14, 165, 233, 0.2)' }}>
                            <Wrench size={24} color="white" />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>Fleet <span style={{color:'var(--primary)'}}>Utility</span></h1>
                            <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '12px' }}>Operational Maintenance & Expense Hub</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* Premium Monthly Navigator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <button onClick={() => shiftMonth(-1)} style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} /></button>
                            <div style={{ padding: '0 24px', height: '42px', display: 'flex', alignItems: 'center', background: 'rgba(14, 165, 233, 0.05)', borderRadius: '14px', border: '1px solid rgba(14, 165, 233, 0.1)', cursor: 'pointer' }} onClick={() => setSelectedMonth(new Date().getUTCMonth())}>
                                <span style={{ color: 'white', fontSize: '15px', fontWeight: '950', letterSpacing: '0.5px' }}>{new Date(Date.UTC(selectedYear, selectedMonth)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase()}</span>
                            </div>
                            <button onClick={() => shiftMonth(1)} style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} /></button>
                        </div>

                        <button 
                            onClick={() => { setSelectedVehicleId(vehicles[0]?._id); setActiveUtility(null); }}
                            style={{ 
                                height: '54px', padding: '0 30px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary) 100%)', 
                                border: 'none', borderRadius: '16px', color: 'white', fontWeight: '1000', fontSize: '14px', 
                                display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)' 
                            }}
                        >
                            <Plus size={20} /> ADD UTILITY
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    <SummaryStat label="Fastag Paid" val={globalStats.f} col="var(--primary)" icon={Zap} />
                    <SummaryStat label="Border Taxes" val={globalStats.b} col="var(--primary)" icon={Layers} />
                    <SummaryStat label="Service Exp" val={globalStats.s} col="#a855f7" icon={Droplets} />
                    <SummaryStat label="Month Total" val={globalStats.t} col="#10b981" icon={TrendingUp} isDark />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                        <input type="text" placeholder="Search by vehicle number or model..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field" style={{ paddingLeft: '45px', borderRadius: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', height:'50px', marginBottom:0 }} />
                    </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div className="table-resp">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '20px 30px', textAlign: 'left', fontSize: '12px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Vehicle Details</th>
                                    <th style={{ padding: '20px 30px', textAlign: 'right', fontSize: '12px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Fastag Paid</th>
                                    <th style={{ padding: '20px 30px', textAlign: 'right', fontSize: '12px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Border Tax</th>
                                    <th style={{ padding: '20px 30px', textAlign: 'right', fontSize: '12px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Services</th>
                                    <th style={{ padding: '20px 30px', textAlign: 'right', fontSize: '12px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Current Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{padding:'80px', textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}}></div></td></tr>
                                ) : filteredVehicles.map(v => {
                                    const act = getVehicleActivity(v._id);
                                    const isLow = (v.fastagBalance || 0) < 500;
                                    return (
                                        <tr key={v._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: '0.2s' }} className="table-row-hover">
                                            <td style={{ padding: '22px 30px' }}>
                                                <div style={{ fontWeight: '900', fontSize: '18px', color: '#fff' }}>{v.carNumber}</div>
                                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{v.model || 'Standard Fleet'}</div>
                                            </td>
                                            <td style={{ padding: '22px 30px', textAlign: 'right' }}>
                                                <div style={{ fontSize: '18px', fontWeight: '900', color: isLow ? '#f43f5e' : 'var(--primary)' }}>₹{act.fastag.toLocaleString()}</div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: '800' }}>Bal: ₹{v.fastagBalance || 0}</div>
                                            </td>
                                            <td style={{ padding: '22px 30px', textAlign: 'right' }}>
                                                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary)' }}>₹{act.border.toLocaleString()}</div>
                                            </td>
                                            <td style={{ padding: '22px 30px', textAlign: 'right' }}>
                                                <div style={{ fontSize: '18px', fontWeight: '900', color: '#a855f7' }}>₹{act.service.toLocaleString()}</div>
                                            </td>
                                            <td style={{ padding: '22px 30px', textAlign: 'right' }}>
                                                <div style={{ fontSize: '20px', fontWeight: '1000', color: '#10b981' }}>₹{act.total.toLocaleString()}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedVehicleId && selectedVehicle && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2, 6, 23, 0.97)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} style={{ width: '100%', maxWidth: '1100px', height: '94vh', background: '#0a101f', borderRadius: '35px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '30px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:'25px' }}>
                                    <div style={{width:'50px', height:'50px', background:'linear-gradient(135deg, var(--primary)60, var(--primary)60)', color:'#fff', borderRadius:'15px', display:'flex', justifyContent:'center', alignItems:'center'}}><Zap size={26}/></div>
                                    <div>
                                        <h2 style={{ margin: 0, fontWeight: '950', fontSize: '26px', letterSpacing: '-0.5px' }}>Operational <span style={{color:'var(--primary)'}}>Workflow</span></h2>
                                        <p style={{ margin:'4px 0 0', color: 'rgba(255,255,255,0.3)', fontSize:'12px', fontWeight:'700' }}>Select vehicle and log utility expenses</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedVehicleId(null); setActiveUtility(null); }} style={{ background: 'rgba(255,255,255,0.05)', width: '40px', height: '40px', borderRadius: '50%', border:'1px solid rgba(255,255,255,0.1)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><X size={22}/></button>
                            </div>

                            {/* Vehicle Selector (Embedded in Modal) */}
                            {!activeUtility && (
                                <div style={{ padding: '30px 40px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'block' }}>TARGET VEHICLE</label>
                                            <select 
                                                value={selectedVehicleId} 
                                                onChange={e => setSelectedVehicleId(e.target.value)} 
                                                className="input-field" 
                                                style={{ height: '54px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', fontWeight: '900', fontSize: '15px' }}
                                            >
                                                {vehicles.map(v => <option key={v._id} value={v._id} style={{background:'#0a101f'}}>{v.carNumber} — {v.model}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                                {message.text && (
                                    <div style={{ marginBottom: '25px', padding: '12px 20px', borderRadius: '15px', background: message.type==='success'?'#10b98115':'#f43f5e15', color: message.type==='success'?'#10b981':'#f43f5e', border: '1px solid currentColor', fontWeight: '900', fontSize:'14px' }}>{message.text}</div>
                                )}

                                {!activeUtility ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' }}>
                                        <HubCard n="Fastag Accounts" i={Zap} col="var(--primary)" onClick={() => setActiveUtility('fastag')} v={getVehicleActivity(selectedVehicleId).fastag} m="Monthly Recharge Logs" />
                                        <HubCard n="Border Permits" i={Layers} col="var(--primary)" onClick={() => setActiveUtility('border')} v={getVehicleActivity(selectedVehicleId).border} m="Taxes & State Permits" />
                                        <HubCard n="Extra Services" i={Droplets} col="#a855f7" onClick={() => setActiveUtility('services')} v={getVehicleActivity(selectedVehicleId).service} m="Washes & Puctures" />
                                    </div>
                                ) : (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <button onClick={() => setActiveUtility(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', marginBottom: '30px', fontWeight: '900', fontSize: '13px' }}>← BACK TO HUB</button>
                                        <ManagerHub 
                                            type={activeUtility} 
                                            color={activeUtility==='fastag'?'var(--primary)':activeUtility==='border'?'var(--primary)':'#a855f7'} 
                                            act={getVehicleActivity(selectedVehicleId)} 
                                            drivers={drivers} 
                                            getImageUrl={getImageUrl}
                                            onAdd={activeUtility==='fastag'?handleRecharge:activeUtility==='border'?handleAddTax:handleAddService} 
                                            onUpdate={(id, data) => handleUpdateRecord(activeUtility==='fastag' ? `vehicles/${selectedVehicleId}/fastag-recharge` : activeUtility==='border' ? 'border-tax' : 'maintenance', id, data)}
                                            onDelete={id => handleDeleteRecord(activeUtility==='fastag' ? `vehicles/${selectedVehicleId}/fastag-recharge` : activeUtility==='border' ? 'border-tax' : 'maintenance', id)} 
                                            setViewingImage={setViewingImage} 
                                            submitting={submitting} 
                                            vehicle={selectedVehicle} 
                                            companyId={selectedCompany?._id}
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>{viewingImage && (<div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setViewingImage(null)}><motion.img initial={{scale:0.9}} animate={{scale:1}} src={viewingImage} style={{ maxWidth: '95%', maxHeight: '95%', borderRadius: '20px' }} /></div>)}</AnimatePresence>
        </div>
    );
};

const SummaryStat = ({ label, val, col, icon: Icon, isDark }) => (
    <div style={{ padding: '24px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: `${col}15`, color: col, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Icon size={24} /></div>
        <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: '1000', color: isDark ? col : '#fff' }}>₹{val.toLocaleString()}</div>
        </div>
    </div>
);

const HubCard = ({ n, i: Icon, col, onClick, v, m }) => (
    <div onClick={onClick} style={{ padding: '40px 30px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '30px', cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: `${col}15`, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Icon size={28} /></div>
        <div style={{ fontSize: '20px', fontWeight: '950', marginBottom: '8px' }}>{n}</div>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{m}</p>
        <div style={{ fontSize: '26px', fontWeight: '1000', color: col }}>₹{v.toLocaleString()}</div>
    </div>
);

const ManagerHub = ({ type, color, act, drivers, onAdd, onUpdate, onDelete, setViewingImage, submitting, vehicle, getImageUrl, companyId }) => {
    const [form, setForm] = useState({ amount: '', remarks: '', borderName: '', date: todayIST(), billDate: todayIST(), driverId: '', category: 'Car Wash' });
    const [file, setFile] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    
    const hist = type === 'fastag' ? act.items.fastag : type === 'border' ? act.items.border : act.items.service;

    // Reset form when type changes or editing starts/stops
    useEffect(() => {
        if (editingItem) {
            setForm({
                amount: editingItem.amount || '',
                remarks: editingItem.remarks || '',
                borderName: editingItem.borderName || '',
                date: (editingItem.date || editingItem.billDate || todayIST()).split('T')[0],
                billDate: (editingItem.billDate || editingItem.date || todayIST()).split('T')[0],
                driverId: editingItem.driver?._id || editingItem.driver || '',
                category: editingItem.category || 'Car Wash'
            });
        } else {
            setForm({ amount: '', remarks: '', borderName: '', date: todayIST(), billDate: todayIST(), driverId: '', category: 'Car Wash' });
            setFile(null);
        }
    }, [editingItem]);
    
    const handleSave = async () => {
        if (!form.amount) return alert('Amount is required');
        
        let success = false;
        if (type === 'fastag') {
            const data = { amount: form.amount, remarks: form.remarks, method: 'UPI', date: form.date || todayIST() };
            if (editingItem) success = await onUpdate(editingItem._id, data);
            else { await onAdd(data); success = true; }
        } else {
            const fd = new FormData(); 
            Object.keys(form).forEach(k => {
                if (form[k] && !['date', 'billDate'].includes(k)) {
                    fd.append(k, form[k]);
                }
            });
            
            // Send exactly one date value for both possible backend field names
            const finalDate = form.date || form.billDate || todayIST();
            fd.append('date', finalDate);
            fd.append('billDate', finalDate);

            if (companyId) fd.append('companyId', companyId);
            if (vehicle?._id) fd.append('vehicleId', vehicle._id);
            
            if (file) fd.append(type === 'border' ? 'receiptPhoto' : 'billPhoto', file);
            if (type === 'services') { 
                fd.append('maintenanceType', 'Driver Services'); 
            }
            
            if (editingItem) success = await onUpdate(editingItem._id, fd);
            else { await onAdd(fd); success = true; }
        }
        
        if (success || !editingItem) {
            setForm({ amount: '', remarks: '', borderName: '', date: todayIST(), billDate: todayIST(), driverId: '', category: 'Car Wash' }); 
            setFile(null);
            setEditingItem(null);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>
            <div style={{ padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ margin: '0 0 30px 0', fontSize: '17px', fontWeight: '900' }}>{editingItem ? 'Edit Entry' : 'Create Entry'}</h4>
                <div style={{ display: 'grid', gap: '22px' }}>
                    <div><label style={{fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.3)', marginBottom:'10px', display:'block'}}>AMOUNT (₹)</label><input type="number" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="input-field" style={{height:'54px', borderRadius:'14px', background:'rgba(0,0,0,0.3)', fontSize:'18px', border:'1px solid rgba(255,255,255,0.1)'}} /></div>
                    {type === 'fastag' && (
                        <>
                            <div><label style={{fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.3)', marginBottom:'10px', display:'block'}}>NOTE</label><input type="text" value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} className="input-field" style={{height:'50px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)'}} /></div>
                            <div><label style={{fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.3)', marginBottom:'10px', display:'block'}}>DATE</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="input-field" style={{height:'50px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', colorScheme:'dark', border:'1px solid rgba(255,255,255,0.1)'}} /></div>
                        </>
                    )}
                    {type === 'border' && <>
                        <div><label style={{fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.3)', marginBottom:'10px', display:'block'}}>STATE/BORDER</label><input type="text" value={form.borderName} onChange={e=>setForm({...form, borderName:e.target.value})} className="input-field" style={{height:'50px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)'}} /></div>
                        <div><label style={{fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.3)', marginBottom:'10px', display:'block'}}>DATE</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="input-field" style={{height:'50px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', colorScheme:'dark', border:'1px solid rgba(255,255,255,0.1)'}} /></div>
                        <div><label style={{fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.3)', marginBottom:'10px', display:'block'}}>REMARKS / NOTES</label><input type="text" value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} className="input-field" placeholder="Enter border tax notes..." style={{height:'50px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)'}} /></div>
                    </>}
                    {type === 'services' && (
                        <>
                            <div><label style={{fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.3)', marginBottom:'10px', display:'block'}}>SERVICE TYPE</label><select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="input-field" style={{height:'50px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', fontWeight:'800'}}><option style={{background:'#0a101f'}}>Car Wash</option><option style={{background:'#0a101f'}}>Puncture</option><option style={{background:'#0a101f'}}>Other</option></select></div>
                            <div><label style={{fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.3)', marginBottom:'10px', display:'block'}}>DATE</label><input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="input-field" style={{height:'50px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', colorScheme:'dark', border:'1px solid rgba(255,255,255,0.1)'}} /></div>
                            <div><label style={{fontSize:'12px', fontWeight:'800', color:'rgba(255,255,255,0.3)', marginBottom:'10px', display:'block'}}>REMARKS / NOTES</label><input type="text" value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} className="input-field" placeholder="Enter service description..." style={{height:'50px', borderRadius:'12px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)'}} /></div>
                        </>
                    )}
                    {(type === 'border' || type === 'services') && <div style={{background:'rgba(0,0,0,0.3)', padding:'20px', borderRadius:'15px', textAlign:'center', border:'1px dashed rgba(255,255,255,0.1)'}}><input type="file" id="sl-file" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])}/><label htmlFor="sl-file" style={{cursor:'pointer', color:color, fontSize:'14px', fontWeight:'900'}}>{file ? file.name : (editingItem ? 'Change Bill/Slip' : 'Upload Bill/Slip')}</label></div>}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {editingItem && <button onClick={() => setEditingItem(null)} style={{ flex: 1, height:'60px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'15px', fontWeight:'900', cursor:'pointer' }}>CANCEL</button>}
                        <button onClick={handleSave} style={{ flex: editingItem ? 2 : 1, height:'60px', background:color, color:'#fff', border:'none', borderRadius:'15px', fontWeight:'1000', cursor:'pointer' }} disabled={submitting}>{editingItem ? 'UPDATE RECORD' : 'SAVE RECORD'}</button>
                    </div>
                </div>
            </div>

            <div style={{ maxHeight: '650px', overflowY: 'auto' }} className="sidebar-nav-scroll">
                <div style={{ display: 'grid', gap: '15px' }}>
                    {hist.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px 40px', background: 'rgba(255,255,255,0.01)', borderRadius: '25px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                            <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <AlertCircle size={30} color="rgba(255,255,255,0.1)" />
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '800', margin: 0 }}>No records found for the selected period.</p>
                        </div>
                    ) : hist.sort((a,b)=>new Date(b.date||b.billDate)-new Date(a.date||a.billDate)).map((item, i) => (
                        <div key={item._id || i} style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '22px', border:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center', transition: '0.3s', outline: editingItem?._id === item._id ? `2px solid ${color}` : 'none' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flex: 1 }}>
                                {(item.receiptPhoto || item.billPhoto) ? (
                                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setViewingImage(getImageUrl(item.receiptPhoto || item.billPhoto))}>
                                        <img src={getImageUrl(item.receiptPhoto || item.billPhoto)} style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', border:'2px solid rgba(255,255,255,0.08)' }} />
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s', hover: { opacity: 1 } }}>
                                            <Search size={16} color="white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `${color}10`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Layers size={24} />
                                    </div>
                                )}
                                
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '20px', fontWeight: '1000', color: '#fff' }}>₹{(item.amount || 0).toLocaleString()}</span>
                                        <span style={{ padding: '4px 10px', borderRadius: '8px', background: `${color}15`, color: color, fontSize: '10px', fontWeight: '950', border: `1px solid ${color}30`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {item.borderName || item.category || 'RECHARGE'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>
                                            <Calendar size={13} />
                                            {formatDateIST(item.date || item.billDate)}
                                        </div>
                                        {item.remarks && (
                                            <div style={{ paddingLeft: '15px', borderLeft: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', fontStyle: 'italic' }}>
                                                "{item.remarks}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button onClick={() => setEditingItem(item)} style={{ width: '40px', height: '40px', borderRadius: '12px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><Edit3 size={18}/></button>
                                <button onClick={() => onDelete(item._id)} style={{ width: '40px', height: '40px', borderRadius: '12px', color: '#f43f5e', background: 'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.15)', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}><Trash2 size={18}/></button>
                            </div>
                        </div>
                    )) }
                </div>
            </div>
        </div>
    );
};

export default CarUtility;
