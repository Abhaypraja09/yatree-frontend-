import axios from '../api/axios';
import { ShieldAlert, Upload, CheckCircle, AlertCircle, Calendar as CalendarIcon, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCompany } from '../context/CompanyContext';
import SEO from '../components/SEO';

const BorderTax = () => {
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState({
        vehicleId: '',
        borderName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        remarks: ''
    });
    const [receiptPhoto, setReceiptPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedCompany) {
            fetchData();
            fetchEntries();
        }
    }, [selectedCompany]);

    const fetchData = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const vehRes = await axios.get(`/api/admin/vehicles/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setVehicles(vehRes.data.vehicles || []);
        } catch (err) {
            console.error('Error fetching vehicles', err);
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const { data } = await axios.get(`/api/admin/border-tax/${selectedCompany._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEntries(data);
        } catch (err) {
            console.error('Error fetching border tax entries', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReceiptPhoto(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const token = JSON.parse(localStorage.getItem('userInfo')).token;
            const data = new FormData();
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            data.append('companyId', selectedCompany._id);
            if (receiptPhoto) data.append('receiptPhoto', receiptPhoto);

            await axios.post('/api/admin/border-tax', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage({ type: 'success', text: 'Border Tax recorded successfully!' });
            setFormData({
                vehicleId: '',
                borderName: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                remarks: ''
            });
            setReceiptPhoto(null);
            setPreview(null);
            fetchEntries();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to record entry' });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEntries = entries.filter(e =>
        e.borderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.vehicle?.carNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px' }}>
            <SEO title="Border Tax Records" description="Maintain accurate records of border crossing taxes and receipts for all fleet vehicles." />
            <header style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '30px 0',
                marginBottom: '10px'
            }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>Border Tax Management</h1>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>Record and manage border crossing expenses for {selectedCompany?.name}</p>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '30px',
                alignItems: 'start'
            }}>
                {/* Left Side: Form */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card"
                    style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '700', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShieldAlert size={20} color="var(--primary)" />
                        Record New Entry
                    </h2>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Select Vehicle</label>
                            <select
                                className="input-field"
                                required
                                value={formData.vehicleId}
                                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                            >
                                <option value="">Select Car</option>
                                {vehicles.map(v => <option key={v._id} value={v._id}>{v.carNumber}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Border Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. Delhi-Haryana Border"
                                required
                                value={formData.borderName}
                                onChange={(e) => setFormData({ ...formData, borderName: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Amount (₹)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="Amount"
                                    required
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Date</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Receipt Photo (Optional)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                                />
                                <div style={{
                                    border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px',
                                    textAlign: 'center', background: 'rgba(255,255,255,0.02)'
                                }}>
                                    {preview ? (
                                        <img src={preview} style={{ height: '80px', borderRadius: '8px', margin: '0 auto' }} />
                                    ) : (
                                        <>
                                            <Upload size={24} color="var(--primary)" style={{ margin: '0 auto 10px' }} />
                                            <p style={{ color: 'white', fontSize: '13px' }}>Click to upload receipt</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {message.text && (
                            <div style={{
                                padding: '12px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                color: message.type === 'success' ? '#10b981' : '#f43f5e'
                            }}>
                                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                {message.text}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary"
                            style={{ width: '100%', padding: '15px' }}
                        >
                            {submitting ? 'Recording...' : 'Record Border Tax Entry'}
                        </button>
                    </form>
                </motion.div>

                {/* Right Side: List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: '25px', border: '1px solid rgba(255,255,255,0.05)', minHeight: '600px' }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '30px',
                        flexWrap: 'wrap',
                        gap: '15px'
                    }}>
                        <div>
                            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '800', margin: 0 }}>Recent Entries</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Last {filteredEntries.length} operational records</p>
                        </div>
                        <div style={{ position: 'relative', flex: 1, maxWidth: '350px', minWidth: '200px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search border or car..."
                                className="input-field"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '40px', width: '100%', height: '48px', fontSize: '14px', marginBottom: 0 }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {loading ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0' }}>
                                <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                                <p style={{ color: 'var(--text-muted)' }}>Fetching records...</p>
                            </div>
                        ) : filteredEntries.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                <ShieldAlert size={64} style={{ opacity: 0.1, margin: '0 auto 20px', color: 'var(--primary)' }} />
                                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No records found</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Try adjusting your search or add a new entry.</p>
                            </div>
                        ) : filteredEntries.map(entry => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                key={entry._id}
                                className="glass-card"
                                style={{
                                    padding: '20px',
                                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.4))',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    transition: 'transform 0.2s ease',
                                    cursor: 'default'
                                }}
                                whileHover={{ transform: 'translateY(-4px)', borderColor: 'rgba(14, 165, 233, 0.3)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div>
                                        <span style={{
                                            background: 'rgba(14, 165, 233, 0.15)',
                                            color: 'var(--primary)',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {entry.vehicle?.carNumber || 'N/A'}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                                            <CalendarIcon size={13} color="var(--text-muted)" />
                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '500' }}>
                                                {new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    {entry.receiptPhoto ? (
                                        <a href={entry.receiptPhoto} target="_blank" rel="noreferrer" style={{ position: 'relative', display: 'block' }}>
                                            <img
                                                src={entry.receiptPhoto}
                                                alt="Receipt"
                                                style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    borderRadius: '10px',
                                                    objectFit: 'cover',
                                                    border: '2px solid rgba(255,255,255,0.1)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                }}
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=Err'; }}
                                            />
                                            <div style={{
                                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                borderRadius: '10px', opacity: 0, transition: 'opacity 0.2s'
                                            }} className="img-overlay">
                                                <Search size={14} color="white" />
                                            </div>
                                        </a>
                                    ) : (
                                        <div style={{
                                            width: '60px', height: '60px', borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Upload size={18} style={{ opacity: 0.2 }} />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '6px', letterSpacing: '-0.2px' }}>{entry.borderName}</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            {entry.remarks && (
                                                <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0, fontStyle: 'italic', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    "{entry.remarks}"
                                                </p>
                                            )}
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '4px' }}>
                                                ID: {entry._id.toString().slice(-6).toUpperCase()}
                                            </p>
                                        </div>
                                        <p style={{ color: '#10b981', fontWeight: '900', fontSize: '22px', margin: 0, letterSpacing: '-1px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '600', verticalAlign: 'middle', marginRight: '2px' }}>₹</span>
                                            {entry.amount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BorderTax;
