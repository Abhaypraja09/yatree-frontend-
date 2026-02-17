import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import {
    Users,
    Plus,
    Search,
    Clock,
    MapPin,
    User,
    MoreVertical,
    IndianRupee,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Download,
    Filter,
    Trash2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO';
import * as XLSX from 'xlsx';

const Staff = () => {
    const { user } = useAuth();
    const { selectedCompany } = useCompany();

    const [staffList, setStaffList] = useState([]);
    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'attendance'
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterStaff, setFilterStaff] = useState('all');

    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        username: '',
        password: '',
        salary: 0
    });

    useEffect(() => {
        if (selectedCompany) {
            fetchStaff();
            fetchAttendance();
        }
    }, [selectedCompany, filterDate]);

    const fetchStaff = async () => {
        try {
            const { data } = await axios.get(`/api/admin/staff/${selectedCompany._id}`);
            setStaffList(data);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchAttendance = async () => {
        if (!selectedCompany?._id) return;
        try {
            const { data } = await axios.get(`/api/admin/staff-attendance/${selectedCompany._id}`);
            setAttendanceList(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching staff attendance:', error);
        }
    };

    const exportToExcel = () => {
        const dataToExport = filteredAttendance.map(record => ({
            'Date': record.date,
            'Staff Name': record.staff?.name || 'Unknown',
            'Mobile': record.staff?.mobile || 'N/A',
            'Punch In Time': new Date(record.punchIn.time).toLocaleTimeString(),
            'Punch In Location': record.punchIn.location?.address || 'N/A',
            'Punch Out Time': record.punchOut?.time ? new Date(record.punchOut.time).toLocaleTimeString() : 'On Duty',
            'Punch Out Location': record.punchOut?.location?.address || 'N/A',
            'Status': record.status || 'Present'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Staff Attendance");
        XLSX.writeFile(wb, `Staff_Attendance_${filterDate}.xlsx`);
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/staff', {
                ...formData,
                companyId: selectedCompany._id
            });
            setShowAddModal(false);
            setFormData({ name: '', mobile: '', username: '', password: '', salary: 0 });
            fetchStaff();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding staff');
        }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;
        try {
            await axios.delete(`/api/admin/staff/${id}`);
            fetchStaff();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting staff');
        }
    };

    const filteredStaff = staffList.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.mobile.includes(searchTerm)
    );

    const filteredAttendance = attendanceList.filter(record => {
        const matchesDate = record.date === filterDate;
        const matchesStaff = filterStaff === 'all' || record.staff?._id === filterStaff;
        return matchesDate && matchesStaff;
    });

    return (
        <div className="container-fluid" style={{ paddingBottom: '40px', color: 'white' }}>
            <SEO title="Staff Management" />

            <header style={{
                padding: '25px 0',
                marginBottom: '30px',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="flex-resp" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                    <div style={{ minWidth: '200px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 10px #6366f1' }}></div>
                            <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase' }}>Internal Asset Operations</span>
                        </div>
                        <h1 className="resp-title" style={{ margin: 0, fontWeight: '900', letterSpacing: '-1.5px' }}>
                            Staff <span style={{ color: 'var(--secondary)' }}>Management</span>
                        </h1>
                        <p className="resp-subtitle" style={{ marginTop: '8px' }}>
                            Manage office personnel and monitoring records
                        </p>
                    </div>

                    <div className="flex-resp" style={{ gap: '15px', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '14px', padding: '4px', display: 'flex', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                                onClick={() => setView('list')}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '11px',
                                    border: 'none',
                                    background: view === 'list' ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    fontWeight: '800',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: '0.3s'
                                }}
                            >
                                LIST
                            </button>
                            <button
                                onClick={() => setView('attendance')}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '11px',
                                    border: 'none',
                                    background: view === 'attendance' ? 'var(--primary)' : 'transparent',
                                    color: 'white',
                                    fontWeight: '800',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    transition: '0.3s'
                                }}
                            >
                                LOGS
                            </button>
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '50px', padding: '0 20px', fontSize: '14px', fontWeight: '800' }}
                        >
                            <Plus size={20} /> <span className="hide-mobile">ADD STAFF</span><span className="show-mobile">ADD</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="flex-resp" style={{ gap: '20px', marginBottom: '30px' }}>
                <div style={{ flex: 1, minWidth: '0', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '45px', marginBottom: 0, height: '52px', fontSize: '14px' }}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>

                {view === 'attendance' && (
                    <div className="flex-resp" style={{ gap: '10px', width: '100%', flex: 1, justifyContent: 'flex-end' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '0' }}>
                            <input
                                type="date"
                                className="input-field"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ width: '100%', marginBottom: 0, height: '52px', paddingLeft: '45px', fontSize: '14px' }}
                            />
                            <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                        </div>

                        <button
                            onClick={exportToExcel}
                            className="btn-primary"
                            style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', gap: '8px', height: '52px', padding: '0 20px', fontSize: '12px', fontWeight: '900' }}
                        >
                            <Download size={20} /> <span className="hide-mobile">EXPORT EXCEL</span><span className="show-mobile">EXCEL</span>
                        </button>
                    </div>
                )}
            </div>

            {view === 'list' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filteredStaff.map(staff => (
                        <motion.div
                            key={staff._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            className="glass-card"
                            style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.05)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '54px',
                                    height: '54px',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white',
                                    fontSize: '22px',
                                    fontWeight: '900',
                                    boxShadow: '0 8px 16px rgba(14, 165, 233, 0.2)'
                                }}>
                                    {staff.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '800' }}>{staff.name}</h3>
                                    <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>{staff.mobile}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.5px' }}>Login ID</p>
                                    <p style={{ margin: 0, color: 'white', fontWeight: '800', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.username || 'Not Set'}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <p style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.5px' }}>Salary</p>
                                    <p style={{ margin: 0, color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹{staff.salary?.toLocaleString()}</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => handleDeleteStaff(staff._id)}
                                    style={{
                                        background: 'rgba(244, 63, 94, 0.1)',
                                        color: '#f43f5e',
                                        border: 'none',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '11px',
                                        fontWeight: '800'
                                    }}
                                >
                                    <Trash2 size={14} /> DELETE STAFF
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                        <h2 style={{ color: 'white', fontSize: '15px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attendance Log ({filteredAttendance.length})</h2>
                    </div>

                    {/* Desktop Table View */}
                    <div className="glass-card hide-mobile" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="scroll-x">
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', minWidth: '900px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.04)', textAlign: 'left' }}>
                                        <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Staff Member</th>
                                        <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Punch In</th>
                                        <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Punch Out</th>
                                        <th style={{ padding: '18px 25px', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Work Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttendance.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No attendance records found for {filterDate}
                                            </td>
                                        </tr>
                                    ) : filteredAttendance.map(record => (
                                        <tr key={record._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '18px 25px' }}>
                                                <div style={{ fontWeight: '800', color: 'white', fontSize: '15px' }}>{record.staff?.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{record.staff?.mobile}</div>
                                            </td>
                                            <td style={{ padding: '18px 25px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '900', fontSize: '14px' }}>
                                                    <ArrowUpRight size={16} />
                                                    {new Date(record.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 25px' }}>
                                                {record.punchOut?.time ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e', fontWeight: '900', fontSize: '14px' }}>
                                                        <ArrowDownLeft size={16} />
                                                        {new Date(record.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '800', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '30px' }}>ON DUTY</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '18px 25px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                                        <MapPin size={14} style={{ color: 'var(--primary)' }} />
                                                        <span style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>
                                                            {record.punchIn.location?.address || 'Location Hidden'}
                                                        </span>
                                                    </div>
                                                    {record.punchIn.location?.latitude && (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${record.punchIn.location.latitude},${record.punchIn.location.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '900', letterSpacing: '0.5px' }}
                                                        >
                                                            OPEN IN GOOGLE MAPS
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="show-mobile">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {filteredAttendance.map(record => (
                                <motion.div
                                    key={record._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card"
                                    style={{ padding: '20px', background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', color: 'white', fontSize: '16px' }}>{record.staff?.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{record.staff?.mobile}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#10b981', fontWeight: '900', fontSize: '18px' }}>P</div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800' }}>PRESENT</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>In Time</div>
                                            <div style={{ color: '#10b981', fontWeight: '900' }}>{new Date(record.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Out Time</div>
                                            <div style={{ color: record.punchOut?.time ? '#f43f5e' : 'var(--text-muted)', fontWeight: '900' }}>
                                                {record.punchOut?.time ? new Date(record.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'ON DUTY'}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <MapPin size={14} style={{ marginTop: '2px', color: 'var(--primary)' }} />
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                            {record.punchIn.location?.address}
                                            {record.punchIn.location?.latitude && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${record.punchIn.location.latitude},${record.punchIn.location.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'block', marginTop: '6px', color: 'var(--primary)', fontWeight: '900', fontSize: '10px' }}
                                                >
                                                    VIEW ON MAP
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {filteredAttendance.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                                    No records found for today.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showAddModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card modal-content"
                            style={{
                                maxWidth: '550px',
                                width: '100%',
                                background: '#0f172a',
                                padding: '30px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Add New Staff</h2>
                                <button onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '10px', borderRadius: '50%', display: 'flex', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddStaff}>
                                <div className="form-group">
                                    <label>Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        placeholder="Enter staff name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Mobile Number *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            placeholder="10-digit number"
                                            value={formData.mobile}
                                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Identity / Username *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field"
                                            placeholder="Unique username"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-group">
                                        <label>Security Password *</label>
                                        <input
                                            type="password"
                                            required
                                            className="input-field"
                                            placeholder="Min. 6 chars"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Monthly Salary (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            className="input-field"
                                            placeholder="Amount in INR"
                                            value={formData.salary}
                                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%', height: '52px', marginTop: '10px', fontSize: '15px', fontWeight: '900' }}>
                                    ONBOARD NEW STAFF
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Staff;
