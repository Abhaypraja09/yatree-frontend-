import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const EditAttendanceModal = ({ item, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        allowanceTA: item.punchOut?.allowanceTA || 0,
        nightStayAmount: item.punchOut?.nightStayAmount || 0,
        // Calculate the 'extra' part of the bonus for the form
        bonusAmount: Math.max(0, (item.outsideTrip?.bonusAmount || 0) - (item.punchOut?.allowanceTA || 0) - (item.punchOut?.nightStayAmount || 0)),
        remarks: item.punchOut?.remarks || '',
        status: item.status || 'incomplete',
        startKm: item.punchIn?.km || 0,
        endKm: item.punchOut?.km || 0
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Sum it up so backend receives the TOTAL in bonusAmount
        const finalData = {
            ...formData,
            bonusAmount: Number(formData.allowanceTA) + Number(formData.nightStayAmount) + Number(formData.bonusAmount)
        };
        onUpdate(item._id, finalData);
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card modal-content"
                style={{ width: '100%', maxWidth: '450px', padding: '25px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>Edit Report</h2>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', display: 'flex', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>

                {item.outsideTrip?.tripType && (
                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '12px', borderRadius: '12px', marginBottom: '20px' }}>
                        <p style={{ margin: 0, fontSize: '10px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase' }}>Driver's Selection</p>
                        <p style={{ margin: '4px 0 0', color: 'white', fontSize: '14px', fontWeight: '700' }}>{item.outsideTrip.tripType}</p>
                        <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Please enter the amounts below based on this selection.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Start KM</label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.startKm}
                                onChange={(e) => setFormData({ ...formData, startKm: e.target.value })}
                                style={{ width: '100%', marginBottom: 0, height: '48px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>End KM</label>
                            <input
                                type="number"
                                className="input-field"
                                value={formData.endKm}
                                onChange={(e) => setFormData({ ...formData, endKm: e.target.value })}
                                style={{ width: '100%', marginBottom: 0, height: '48px' }}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Same Day Allowance (TA)</label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.allowanceTA}
                            onChange={(e) => setFormData({ ...formData, allowanceTA: e.target.value })}
                            style={{ width: '100%', marginBottom: 0, height: '48px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Night Stay Amount</label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.nightStayAmount}
                            onChange={(e) => setFormData({ ...formData, nightStayAmount: e.target.value })}
                            style={{ width: '100%', marginBottom: 0, height: '48px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Other Bonus / Trip Incentive</label>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.bonusAmount}
                            onChange={(e) => setFormData({ ...formData, bonusAmount: e.target.value })}
                            style={{ width: '100%', marginBottom: 0, height: '48px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Duty Remarks / Destination</label>
                        <textarea
                            className="input-field"
                            value={formData.remarks}
                            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                            style={{ width: '100%', minHeight: '100px', marginBottom: 0, paddingTop: '12px' }}
                        />
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <input
                            type="checkbox"
                            id="statusComplete"
                            checked={formData.status === 'completed'}
                            onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'completed' : 'incomplete' })}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <label htmlFor="statusComplete" style={{ color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Mark Duty as Completed</label>
                    </div>

                    <button type="submit" className="btn-primary" style={{ height: '52px', fontWeight: '900', marginTop: '10px', fontSize: '14px' }}>
                        SAVE UPDATED DETAILS
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default EditAttendanceModal;
