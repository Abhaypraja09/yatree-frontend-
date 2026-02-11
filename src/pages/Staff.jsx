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
    Filter
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
        try {
            // Updated to support date filtering if backend provides it, otherwise filter frontend
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
        <div className="container-fluid" style={{ padding: '30px' }}>
            <SEO title="Staff Management" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '900', margin: 0 }}>Staff Management</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manage office staff and monitor attendance</p>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', display: 'flex' }}>
                        <button
                            onClick={() => setView('list')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: view === 'list' ? 'var(--primary)' : 'transparent',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            Staff List
                        </button>
                        <button
                            onClick={() => setView('attendance')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: view === 'attendance' ? 'var(--primary)' : 'transparent',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }}
                        >
                            Attendance Logs
                        </button>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '45px' }}
                    >
                        <Plus size={18} /> Add Staff
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Search staff by name or mobile..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                        style={{ width: '100%', paddingLeft: '45px', marginBottom: 0, height: '50px' }}
                    />
                    <Search size={20} style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-muted)' }} />
                </div>

                {view === 'attendance' && (
                    <>
                        <div style={{ width: '200px', position: 'relative' }}>
                            <input
                                type="date"
                                className="input-field"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ width: '100%', marginBottom: 0, height: '50px', paddingLeft: '45px' }}
                            />
                            <Calendar size={20} style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--primary)' }} />
                        </div>

                        <button
                            onClick={exportToExcel}
                            className="btn-primary"
                            style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', height: '50px', padding: '0 20px' }}
                        >
                            <Download size={18} /> Export Excel
                        </button>
                    </>
                )}
            </div>

            {view === 'list' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredStaff.map(staff => (
                        <motion.div
                            key={staff._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{ padding: '20px', position: 'relative' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '15px',
                                    background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white',
                                    fontSize: '20px',
                                    fontWeight: '800'
                                }}>
                                    {staff.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: 'white', fontSize: '18px' }}>{staff.name}</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>{staff.mobile}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 5px 0', textTransform: 'uppercase', fontWeight: '800' }}>Username</p>
                                    <p style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '14px' }}>{staff.username || 'Not Set'}</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '0 0 5px 0', textTransform: 'uppercase', fontWeight: '800' }}>Monthly Salary</p>
                                    <p style={{ margin: 0, color: '#10b981', fontWeight: '900', fontSize: '14px' }}>₹{staff.salary?.toLocaleString()}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '15px 20px', fontSize: '12px', textTransform: 'uppercase' }}>Staff Member</th>
                                    <th style={{ padding: '15px 20px', fontSize: '12px', textTransform: 'uppercase' }}>Punch In</th>
                                    <th style={{ padding: '15px 20px', fontSize: '12px', textTransform: 'uppercase' }}>Punch Out</th>
                                    <th style={{ padding: '15px 20px', fontSize: '12px', textTransform: 'uppercase' }}>Location (In)</th>
                                    <th style={{ padding: '15px 20px', fontSize: '12px', textTransform: 'uppercase' }}>Location (Out)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAttendance.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No attendance records found for {filterDate}
                                        </td>
                                    </tr>
                                ) : filteredAttendance.map(record => (
                                    <tr key={record._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '15px 20px' }}>
                                            <p style={{ fontWeight: '800', margin: 0 }}>{record.staff?.name}</p>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{record.staff?.mobile}</span>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontWeight: '800' }}>
                                                <ArrowUpRight size={14} />
                                                {new Date(record.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            {record.punchOut?.time ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f43f5e', fontWeight: '800' }}>
                                                    <ArrowDownLeft size={14} />
                                                    {new Date(record.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>On Duty</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    <MapPin size={14} />
                                                    <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {record.punchIn.location?.address}
                                                    </span>
                                                </div>
                                                {record.punchIn.location?.latitude && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${record.punchIn.location.latitude},${record.punchIn.location.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '800', textDecoration: 'none' }}
                                                    >
                                                        VIEW ON MAP
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            {record.punchOut?.time ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        <MapPin size={14} />
                                                        <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {record.punchOut.location?.address}
                                                        </span>
                                                    </div>
                                                    {record.punchOut.location?.latitude && (
                                                        <a
                                                            href={`https://www.google.com/maps?q=${record.punchOut.location.latitude},${record.punchOut.location.longitude}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ fontSize: '10px', color: '#f43f5e', fontWeight: '800', textDecoration: 'none' }}
                                                        >
                                                            VIEW ON MAP
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>--</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Staff Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="modal-overlay">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card modal-content"
                            style={{
                                maxWidth: '450px',
                                background: '#111827',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">Add New Staff</h2>
                                <button onClick={() => setShowAddModal(false)} className="modal-close-btn">&times;</button>
                            </div>

                            <form onSubmit={handleAddStaff}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mobile Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Username (Login)</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        required
                                        className="input-field"
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
                                        value={formData.salary}
                                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%', height: '50px', fontSize: '16px', fontWeight: '800' }}>
                                    Register Staff Member
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
