import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const AttendanceModal = ({ item, onClose }) => (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <style>{`
            .grid-1-2-2-3 { display: grid; grid-template-columns: 1fr; }
            @media(min-width: 768px) { .grid-1-2-2-3 { grid-template-columns: 1fr 1fr; } }
            
            .grid-1-2-3-4 { display: grid; grid-template-columns: 1fr; }
            @media(min-width: 640px) { .grid-1-2-3-4 { grid-template-columns: 1fr 1fr; } }
            @media(min-width: 1024px) { .grid-1-2-3-4 { grid-template-columns: 1fr 1fr 1fr; } }
            
            .modal-content::-webkit-scrollbar { width: 8px; }
            .modal-content::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
            .modal-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
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
                </>
            ) : item.entryType === 'fuel' ? (
                <div>
                    <h3 className="modal-section-title">Fuel Record Details</h3>
                    <div className="grid-1-2-3-4" style={{ gap: '15px' }}>
                        <div className="summary-field"><p className="label">DATE</p><p className="val">{new Date(item.date).toLocaleDateString()}</p></div>
                        <div className="summary-field"><p className="label">CAR</p><p className="val">{item.vehicle?.carNumber || 'N/A'}</p></div>
                        <div className="summary-field"><p className="label">QUANTITY</p><p className="val">{item.quantity} Ltr</p></div>
                        <div className="summary-field"><p className="label">AMOUNT</p><p className="val">₹{item.amount}</p></div>
                    </div>
                    {item.receiptPhoto && (
                        <div style={{ marginTop: '20px' }}>
                            <p className="photo-label">RECEIPT PHOTO</p>
                            <img src={item.receiptPhoto} style={{ width: '100%', borderRadius: '12px', cursor: 'zoom-in' }} onClick={() => window.open(item.receiptPhoto)} loading="lazy" />
                        </div>
                    )}
                </div>
            ) : null}
            <div className="modal-footer" style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                <button onClick={onClose} className="btn-secondary" style={{ width: '100%', height: '50px' }}>CLOSE REPORT</button>
            </div>
        </motion.div>
    </div>
);

export default AttendanceModal;
