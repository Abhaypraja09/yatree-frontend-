import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../api/axios';
import { 
    ShieldAlert, Wallet, Droplets, Car, Search, ChevronRight, ChevronLeft,
    X, Plus, CreditCard, Wrench, AlertCircle, CheckCircle2,
    Calendar, Filter, TrendingUp, Zap, Layers, Trash2, Edit3, Eye, FileText, ExternalLink, ArrowRight, Image
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
    const [viewMode, setViewMode] = useState('fleet'); // 'fleet' or 'detail'
    const [detailVehicleId, setDetailVehicleId] = useState(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [activeUtility, setActiveUtility] = useState('fastag'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [lowBalanceOnly, setLowBalanceOnly] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [submitting, setSubmitting] = useState(false);
    const [viewingImage, setViewingImage] = useState(null);

    const [selectedMonth, setSelectedMonth] = useState(nowIST().getUTCMonth());
    const [selectedYear, setSelectedYear] = useState(nowIST().getUTCFullYear());

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
        if (vehicleIdParam) {
            setSelectedVehicleId(vehicleIdParam);
        }
    }, [location.search]);

    useEffect(() => {
        setSearchTerm('');
        setDetailVehicleId(null);
        setViewMode('fleet');
        setActiveUtility(null);
        const istNow = nowIST();
        setSelectedMonth(istNow.getUTCMonth());
        setSelectedYear(istNow.getUTCFullYear());
    }, [location.pathname, location.key]);

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

    const handleRecharge = async (vId, data) => {
        const targetId = vId || selectedVehicleId;
        if (!targetId || targetId === 'new') return alert('Please select a vehicle');
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const headers = { 
                Authorization: `Bearer ${token}`,
                companyid: selectedCompany._id
            };
            
            let payload = data;
            if (data instanceof FormData) {
                if (!data.get('vehicleId')) data.append('vehicleId', targetId);
            } else {
                payload = { ...data, vehicleId: targetId };
            }

            await axios.post(`/api/admin/vehicles/${targetId}/fastag-recharge`, payload, { headers });
            setMessage({ type: 'success', text: 'Recharge Logged' });
            setTimeout(() => { setMessage({ type: '', text: '' }); fetchAllData(); }, 1500);
            setSelectedVehicleId(null);
        } catch (err) { setMessage({ type: 'error', text: 'Error' }); }
        finally { setSubmitting(false); }
    };

    const handleAddTax = async (vId, formData) => {
        const targetId = vId || selectedVehicleId;
        if (!targetId || targetId === 'new') return alert('Please select a vehicle');
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            // Ensure vehicleId is in the form data
            if (formData instanceof FormData && !formData.get('vehicleId')) {
                formData.append('vehicleId', targetId);
            }
            await axios.post('/api/admin/border-tax', formData, { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    companyid: selectedCompany._id
                } 
            });
            setMessage({ type: 'success', text: 'Tax Recorded' });
            setTimeout(() => { setMessage({ type: '', text: '' }); fetchAllData(); }, 1500);
            setSelectedVehicleId(null);
        } catch (err) { setMessage({ type: 'error', text: 'Error' }); }
        finally { setSubmitting(false); }
    };

    const handleAddService = async (vId, formData) => {
        const targetId = vId || selectedVehicleId;
        if (!targetId || targetId === 'new') return alert('Please select a vehicle');
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            // Ensure vehicleId is in the form data
            if (formData instanceof FormData && !formData.get('vehicleId')) {
                formData.append('vehicleId', targetId);
            }
            await axios.post('/api/admin/maintenance', formData, { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    companyid: selectedCompany._id
                } 
            });
            setMessage({ type: 'success', text: 'Trans Recorded' });
            setTimeout(() => { setMessage({ type: '', text: '' }); fetchAllData(); }, 1500);
            setSelectedVehicleId(null);
        } catch (err) { console.error('Service add error:', err.response?.data || err.message); setMessage({ type: 'error', text: err.response?.data?.message || 'Error' }); }
        finally { setSubmitting(false); }
    };

    const handleDeleteRecord = async (endpoint, id) => {
        if (!window.confirm('Delete entry?')) return;
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const headers = { 
                Authorization: `Bearer ${token}`,
                companyid: selectedCompany._id
            };
            await axios.delete(`/api/admin/${endpoint}/${id}`, { headers });
            fetchAllData();
        } catch (err) { alert('Fail'); }
    };

    const handleUpdateRecord = async (endpoint, id, data) => {
        setSubmitting(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const headers = { 
                Authorization: `Bearer ${token}`,
                companyid: selectedCompany?._id
            };
            
            await axios.put(`/api/admin/${endpoint}/${id}`, data, { headers });
            setMessage({ type: 'success', text: 'Entry Updated Successfully' });
            setTimeout(() => { setMessage({ type: '', text: '' }); fetchAllData(); }, 1500);
            return true;
        } catch (err) { 
            console.error('Update failed:', err.response?.data || err.message);
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update Failed' }); 
            return false;
        } finally { setSubmitting(false); }
    };

    const getVehicleActivity = (vId) => {
        const v = vehicles.find(v => v._id === vId);
        const fHist = v ? (v.fastagHistory || []) : [];
        
        const fFilt = fHist.filter(h => { 
            const d = nowIST(h.date || new Date()); 
            return d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear; 
        });
        const bFilt = allBorderEntries.filter(e => { 
            const d = nowIST(e.date || new Date()); 
            return (e.vehicle?._id === vId || e.vehicle === vId) && d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear; 
        });
        const sFilt = allServiceRecords.filter(r => { 
            const d = nowIST(r.billDate || r.date || new Date()); 
            return (r.vehicle?._id === vId || r.vehicle === vId) && d.getUTCMonth() === selectedMonth && d.getUTCFullYear() === selectedYear; 
        });
        
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

    const detailVehicle = useMemo(() => vehicles.find(v => v._id === detailVehicleId), [vehicles, detailVehicleId]);

    return (
        <div key={location.key} style={{ minHeight: '100vh', background: 'transparent', color: '#fff', padding: '40px' }}>
            <SEO title="Car Utility" description="Fleet Accounts Hub" />
            
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
                <AnimatePresence mode="wait">
                    {viewMode === 'fleet' ? (
                        <motion.div 
                            key="fleet-list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <header className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap:'20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: 'clamp(40px,10vw,50px)', height: 'clamp(40px,10vw,50px)', background: 'var(--primary)', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 20px rgba(14, 165, 233, 0.2)' }}>
                                        <Wrench size={24} color="white" />
                                    </div>
                                    <div>
                                        <h1 style={{ margin: 0, fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: '900', letterSpacing: '-1px' }}>Fleet <span className="theme-gradient-text">Utility</span></h1>
                                        <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>Operational Maintenance & Expense</p>
                                    </div>
                                </div>

                                <div className="flex-resp" style={{ gap: '15px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', fontWeight: '900', outline: 'none', cursor: 'pointer' }}>
                                                {[{n:0,m:'Jan'},{n:1,m:'Feb'},{n:2,m:'Mar'},{n:3,m:'Apr'},{n:4,m:'May'},{n:5,m:'Jun'},{n:6,m:'Jul'},{n:7,m:'Aug'},{n:8,m:'Sep'},{n:9,m:'Oct'},{n:10,m:'Nov'},{n:11,m:'Dec'}].map(item => (<option key={item.n} value={item.n} style={{ background: '#0f172a' }}>{item.m}</option>))}
                                            </select>
                                            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', fontWeight: '900', outline: 'none', cursor: 'pointer' }}>
                                                {[2024, 2025, 2026, 2027].map(y => (<option key={y} value={y} style={{ background: '#0f172a' }}>{y}</option>))}
                                            </select>
                                        </div>
                                    </div>

                                    <button onClick={() => { setSelectedVehicleId('new'); setActiveUtility('fastag'); }} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '15px', fontWeight: '1000' }}>
                                        <Plus size={18} /> <span className="hide-mobile">QUICK ADD</span>
                                    </button>
                                </div>
                            </header>

                            <div className="grid-1-2-2-4" style={{ marginBottom: '40px' }}>
                                <SummaryStat label="Fastag Paid" val={globalStats.f} col="var(--primary)" icon={Zap} />
                                <SummaryStat label="Border Taxes" val={globalStats.b} col="var(--primary)" icon={Layers} />
                                <SummaryStat label="Service Exp" val={globalStats.s} col="#a855f7" icon={Droplets} />
                                <SummaryStat label="Month Total" val={globalStats.t} col="#10b981" icon={TrendingUp} isDark />
                            </div>

                            <div style={{ position: 'relative', marginBottom: '30px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
                                <input type="text" placeholder="Search by vehicle number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field" style={{ paddingLeft: '45px', marginBottom: 0 }} />
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                <div className="table-responsive-wrapper">
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                                <th style={{ padding: '20px 30px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Vehicle</th>
                                                <th style={{ padding: '20px 30px', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Fastag Balance</th>
                                                <th style={{ padding: '20px 30px', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Month Total</th>
                                                <th style={{ padding: '20px 30px', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="4" style={{padding:'100px', textAlign:'center'}}><div className="spinner" style={{margin:'0 auto'}}></div></td></tr>
                                            ) : filteredVehicles.map(v => {
                                                const act = getVehicleActivity(v._id);
                                                return (
                                                    <tr key={v._id} 
                                                        onClick={() => { setDetailVehicleId(v._id); setViewMode('detail'); setActiveUtility('fastag'); }}
                                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }} 
                                                        className="table-row-hover"
                                                    >
                                                        <td style={{ padding: '20px 30px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Car size={18} color="rgba(255,255,255,0.4)" /></div>
                                                                <div>
                                                                    <div style={{ fontWeight: '900', fontSize: '17px' }}>{v.carNumber}</div>
                                                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700' }}>{v.model}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                                                            <div style={{ fontSize: '16px', fontWeight: '900', color: (v.fastagBalance||0)<500 ? '#f43f5e' : '#fff' }}>₹{(v.fastagBalance||0).toLocaleString()}</div>
                                                        </td>
                                                        <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                                                            <div style={{ fontSize: '16px', fontWeight: '1000', color: '#10b981' }}>₹{act.total.toLocaleString()}</div>
                                                        </td>
                                                        <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                                                            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', color:'var(--primary)', fontWeight:'900', fontSize:'11px' }}>
                                                                VIEW DETAILS <ArrowRight size={14} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="vehicle-detail"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <nav style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <button onClick={() => setViewMode('fleet')} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '10px 15px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900' }}>
                                    <ChevronLeft size={18} /> BACK TO FLEET
                                </button>
                            </nav>

                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '35px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', marginBottom: '40px' }}>
                                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 15px 35px rgba(14, 165, 233, 0.3)' }}><Car size={40} color="white" /></div>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '36px', fontWeight: '1000' }}>{detailVehicle?.carNumber}</h2>
                                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>{detailVehicle?.model}</span>
                                                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                                                <span style={{ fontSize: '13px', color: (detailVehicle?.fastagBalance||0)<500?'#f43f5e':'var(--primary)', fontWeight: '900' }}>FASTAG BAL: ₹{detailVehicle?.fastagBalance||0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedVehicleId(detailVehicleId)} 
                                        className="btn-primary" 
                                        style={{ height: '50px', padding: '0 30px', borderRadius: '15px', fontWeight: '1000', gap: '10px' }}
                                    >
                                        <Plus size={18} /> ADD NEW LOG
                                    </button>
                                </header>

                                <div className="grid-1-2-2-4" style={{ marginBottom: '40px' }}>
                                    {detailVehicle && (
                                        <>
                                            <DetailStat label="Fastag Paid" val={getVehicleActivity(detailVehicleId).fastag} icon={Zap} col="var(--primary)" />
                                            <DetailStat label="Border Permit" val={getVehicleActivity(detailVehicleId).border} icon={Layers} col="var(--primary)" />
                                            <DetailStat label="Extra Service" val={getVehicleActivity(detailVehicleId).service} icon={Wrench} col="#a855f7" />
                                            <DetailStat label="Total Current" val={getVehicleActivity(detailVehicleId).total} icon={TrendingUp} col="#10b981" isDark />
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '18px', width: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {[
                                        { id: 'fastag', label: 'Fastag Logs', icon: Zap },
                                        { id: 'border', label: 'Border Permits', icon: Layers },
                                        { id: 'services', label: 'Extra Services', icon: Wrench }
                                    ].map(t => (
                                        <button 
                                            key={t.id} 
                                            onClick={() => setActiveUtility(t.id)} 
                                            style={{ 
                                                padding: '12px 25px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                                                background: activeUtility === t.id ? 'rgba(255, 191, 36, 0.1)' : 'transparent',
                                                color: activeUtility === t.id ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                                                fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s', textTransform: 'uppercase'
                                            }}
                                        >
                                            <t.icon size={14} /> {t.label}
                                        </button>
                                    ))}
                                </div>

                                {detailVehicle && (
                                    <ManagerHub 
                                        key={activeUtility}
                                        type={activeUtility} 
                                        color={activeUtility==='fastag'?'var(--primary)':activeUtility==='border'?'#0ea5e9':'#a855f7'} 
                                        act={getVehicleActivity(detailVehicleId)} 
                                        drivers={drivers} 
                                        getImageUrl={getImageUrl}
                                        hideForm={true}
                                        onAdd={(vId, data, file) => activeUtility==='fastag'?handleRecharge(vId, data, file):activeUtility==='border'?handleAddTax(vId, data, file):handleAddService(vId, data, file)} 
                                        onUpdate={(id, data) => handleUpdateRecord(activeUtility==='fastag' ? `vehicles/${detailVehicleId}/fastag-recharge` : activeUtility==='border' ? 'border-tax' : 'maintenance', id, data)}
                                        onDelete={id => handleDeleteRecord(activeUtility==='fastag' ? `vehicles/${detailVehicleId}/fastag-recharge` : activeUtility==='border' ? 'border-tax' : 'maintenance', id)} 
                                        setViewingImage={setViewingImage} 
                                        submitting={submitting} 
                                        vehicle={detailVehicle} 
                                        companyId={selectedCompany?._id}
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {selectedVehicleId && (selectedVehicleId === 'new' || vehicles.find(v=>v._id===selectedVehicleId)) && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 15 }}
                            className="modal-content-wrapper" style={{ maxWidth: '1000px', height: '90vh', padding: '0' }}
                        >
                            <div style={{ padding: '30px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                <h3 style={{ margin: 0, fontWeight: '1000', fontSize: '22px', letterSpacing: '-0.5px' }}>
                                    {selectedVehicleId === 'new' ? 'Quick Utility Entry' : 'Manual Utility Entry'}
                                </h3>
                                <button 
                                    onClick={() => setSelectedVehicleId(null)} 
                                    style={{ 
                                        width: '40px', height: '40px', borderRadius: '14px', 
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', transition: '0.2s'
                                    }}
                                    className="table-row-hover"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                                <ManagerHub 
                                    key={activeUtility || 'fastag'}
                                    type={activeUtility || 'fastag'} color="var(--primary)" 
                                    act={selectedVehicleId === 'new' ? { items: { fastag: [], border: [], service: [] } } : getVehicleActivity(selectedVehicleId)} 
                                    drivers={drivers} getImageUrl={getImageUrl}
                                    onAdd={(vId, data, file) => (activeUtility || 'fastag')==='fastag'?handleRecharge(vId, data, file):(activeUtility || 'fastag')==='border'?handleAddTax(vId, data, file):handleAddService(vId, data, file)} 
                                    onUpdate={(id, data) => handleUpdateRecord((activeUtility || 'fastag')==='fastag' ? `vehicles/${selectedVehicleId}/fastag-recharge` : (activeUtility || 'fastag')==='border' ? 'border-tax' : 'maintenance', id, data)}
                                    onDelete={id => handleDeleteRecord((activeUtility || 'fastag')==='fastag' ? `vehicles/${selectedVehicleId}/fastag-recharge` : (activeUtility || 'fastag')==='border' ? 'border-tax' : 'maintenance', id)} 
                                    setViewingImage={setViewingImage} submitting={submitting} vehicle={vehicles.find(v=>v._id===selectedVehicleId)} allVehicles={vehicles} companyId={selectedCompany?._id}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>{viewingImage && (<div style={{ position: 'fixed', inset: 0, zIndex: 2005, background: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setViewingImage(null)}><motion.img initial={{scale:0.95}} animate={{scale:1}} src={viewingImage} style={{ maxWidth: '95%', maxHeight: '95%', borderRadius: '20px' }} /></div>)}</AnimatePresence>
        </div>
    );
};

const DetailStat = ({ label, val, icon: Icon, col, isDark }) => (
    <div style={{ padding: '25px', background: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: `${col}15`, color: col, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Icon size={22} /></div>
        <div>
            <div style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
            <div style={{ fontSize: '22px', fontWeight: '1000', color: isDark ? col : '#fff' }}>₹{val.toLocaleString()}</div>
        </div>
    </div>
);

const SummaryStat = ({ label, val, col, icon: Icon, isDark }) => (
    <div style={{ padding: '24px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '13px', background: `${col}15`, color: col, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Icon size={24} /></div>
        <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: '1000', color: isDark ? col : '#fff' }}>₹{val.toLocaleString()}</div>
        </div>
    </div>
);

const ManagerHub = ({ type, color, act, drivers, onAdd, onUpdate, onDelete, setViewingImage, submitting, vehicle, getImageUrl, companyId, hideForm = false, allVehicles = [] }) => {
    const [form, setForm] = useState({ amount: '', remarks: '', borderName: '', date: todayIST(), billDate: todayIST(), driverId: '', category: 'Car Wash', vehicleId: vehicle?._id || '', paymentSource: 'Office' });
    const [file, setFile] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    
    useEffect(() => {
        if (vehicle) setForm(prev => ({ ...prev, vehicleId: vehicle._id }));
    }, [vehicle]);

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
            setForm({ amount: '', remarks: '', borderName: '', date: todayIST(), billDate: todayIST(), driverId: '', category: 'Car Wash', vehicleId: vehicle?._id || '', paymentSource: 'Office' });
            setFile(null);
        }
    }, [editingItem, type, vehicle]);
    
    const handleSave = async () => {
        const targetVehicleId = vehicle?._id || form.vehicleId;
        if (!targetVehicleId) return alert('Please select a vehicle');
        if (!form.amount) return alert('Amount is required');
        
        let success = false;
        if (type === 'fastag') {
            const formData = new FormData();
            formData.append('amount', form.amount);
            formData.append('method', 'UPI');
            formData.append('remarks', form.remarks);
            formData.append('date', form.date || todayIST());
            if (file) formData.append('receiptPhoto', file);

            if (editingItem) success = await onUpdate(editingItem._id, formData);
            else { await onAdd(targetVehicleId, formData); success = true; }
        } else {
            const fd = new FormData(); 
            Object.keys(form).forEach(k => {
                if (form[k] && !['date', 'billDate', 'vehicleId'].includes(k)) {
                    fd.append(k, form[k]);
                }
            });
            
            const finalDate = form.date || form.billDate || todayIST();
            fd.append('date', finalDate);
            fd.append('billDate', finalDate);

            if (companyId) fd.append('companyId', companyId);
            fd.append('vehicleId', targetVehicleId);
            
            if (file) fd.append(type === 'border' ? 'receiptPhoto' : 'billPhoto', file);
            if (type === 'services') { 
                fd.append('maintenanceType', 'Driver Services'); 
            }
            
            if (editingItem) success = await onUpdate(editingItem._id, fd);
            else { await onAdd(targetVehicleId, fd); success = true; }
        }
        
        if (success || !editingItem) {
            setForm({ amount: '', remarks: '', borderName: '', date: todayIST(), billDate: todayIST(), driverId: '', category: 'Car Wash', vehicleId: vehicle?._id || '', paymentSource: 'Office' }); 
            setFile(null);
            setEditingItem(null);
        }
    };

    const showForm = !hideForm || editingItem;

    return (
        <div style={{ width: '100%' }}>
            {showForm && (
                <div style={{ padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}20`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{editingItem ? <Edit3 size={20}/> : <Plus size={20}/>}</div>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>{editingItem ? 'Edit Log Entry' : 'Add New Record'}</h4>
                    </div>
                    <div className="modal-form-grid">
                        {!vehicle && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label">Select Vehicle</label>
                                <select 
                                    value={form.vehicleId} 
                                    onChange={e => setForm({...form, vehicleId: e.target.value})} 
                                    className="input-field" 
                                >
                                    <option value="">Select a car...</option>
                                    {allVehicles.map(v => (
                                        <option key={v._id} value={v._id}>{v.carNumber}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="input-label">Date</label>
                            <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="input-field" />
                        </div>
                        <div>
                            <label className="input-label">Amount (₹)</label>
                            <input type="number" placeholder="0.00" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="input-field" style={{ fontSize: '18px', fontWeight: '900' }} />
                        </div>
                        
                        {type === 'fastag' && (
                            <div style={{ gridColumn: '1 / -1' }}><label className="input-label">Recharge Remarks</label><input type="text" placeholder="e.g. ICICI Bank Recharge" value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} className="input-field" /></div>
                        )}
                        {type === 'border' && (
                            <div style={{ gridColumn: '1 / -1' }}><label className="input-label">Border Station / Permit Name</label><input type="text" placeholder="e.g. DL-HR Border" value={form.borderName} onChange={e=>setForm({...form, borderName:e.target.value})} className="input-field" /></div>
                        )}
                        {type === 'services' && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="input-label">Service Category</label>
                                <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="input-field">
                                    <option>Car Wash</option>
                                    <option>Puncture / Tyre</option>
                                    <option>Cleaning Supplies</option>
                                    <option>Other Misc</option>
                                </select>
                            </div>
                        )}

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Payment Source</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['Office', 'Guest'].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setForm({ ...form, paymentSource: s })}
                                        style={{
                                            flex: 1, height: '48px', borderRadius: '12px',
                                            background: form.paymentSource === s ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255,255,255,0.02)',
                                            color: form.paymentSource === s ? '#0ea5e9' : 'rgba(255,255,255,0.4)',
                                            border: form.paymentSource === s ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                                            fontWeight: '800', fontSize: '13px', cursor: 'pointer'
                                        }}
                                    >
                                        {s.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="input-label">Reciept / Bill Photo</label>
                            <label style={{ 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
                                padding: '20px', borderRadius: '15px', border: '1px dashed rgba(255,255,255,0.1)', 
                                background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: '0.3s' 
                            }} className="table-row-hover">
                                <input type="file" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])}/>
                                <Image size={24} color="rgba(255,255,255,0.3)" />
                                <span style={{ fontSize: '13px', fontWeight: '800', color: file ? color : 'rgba(255,255,255,0.4)' }}>{file ? file.name : 'Click to upload receipt photo'}</span>
                            </label>
                        </div>
                        
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button onClick={handleSave} className="btn-primary" style={{ flex: 1, height: '52px', borderRadius: '14px', fontWeight: '950' }} disabled={submitting}>
                                {submitting ? 'SAVING...' : (editingItem ? 'UPDATE RECORD' : 'SAVE LOG ENTRY')}
                            </button>
                            {editingItem && (
                                <button onClick={() => setEditingItem(null)} className="glass-card" style={{ padding: '0 25px', borderRadius: '14px', fontWeight: '900' }}>CANCEL</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <th style={{ padding: '15px 25px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Date</th>
                            <th style={{ padding: '15px 25px', textAlign: 'left', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Details / Remark</th>
                            <th style={{ padding: '15px 25px', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ padding: '15px 25px', textAlign: 'center', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Reciept</th>
                            <th style={{ padding: '15px 25px', textAlign: 'right', fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hist.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontWeight: '800' }}>No history records found...</td></tr>
                        ) : hist.sort((a,b)=>new Date(b.date||b.billDate)-new Date(a.date||a.billDate)).map((item, i) => (
                            <tr key={item._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="table-row-hover">
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Calendar size={14} color="rgba(255,255,255,0.3)" />
                                        <span style={{ fontSize: '13px', fontWeight: '850', color: 'rgba(255,255,255,0.8)' }}>{formatDateIST(item.date || item.billDate)}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '18px 25px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{item.borderName || item.category || 'Fastag Recharge'}</div>
                                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>{item.remarks || '--'}</div>
                                </td>
                                <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                    <div style={{ color: color, fontWeight: '1000', fontSize: '15px' }}>₹{(item.amount || 0).toLocaleString()}</div>
                                    <div style={{ 
                                        fontSize: '8px', padding: '1px 4px', borderRadius: '3px', display: 'inline-block',
                                        background: item.paymentSource === 'Guest' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(14, 165, 233, 0.1)',
                                        color: item.paymentSource === 'Guest' ? '#10b981' : '#0ea5e9',
                                        fontWeight: '900', textTransform: 'uppercase', marginTop: '2px'
                                    }}>{item.paymentSource || 'Office'}</div>
                                </td>
                                <td style={{ padding: '18px 25px', textAlign: 'center' }}>
                                    {(item.receiptPhoto || item.billPhoto) ? (
                                        <button 
                                            onClick={() => setViewingImage(getImageUrl(item.receiptPhoto || item.billPhoto))}
                                            style={{ 
                                                width: '36px', height: '36px', borderRadius: '10px', 
                                                background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                margin: '0 auto'
                                            }}
                                        >
                                            <Eye size={18} color="#10b981" />
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.1)', fontWeight: '900' }}>N/A</span>
                                    )}
                                </td>
                                <td style={{ padding: '18px 25px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setEditingItem(item)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}><Edit3 size={16}/></button>
                                        <button onClick={() => onDelete(item._id)} style={{ background: 'transparent', border: 'none', color: 'rgba(244,63,94,0.4)', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        )) }
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CarUtility;
