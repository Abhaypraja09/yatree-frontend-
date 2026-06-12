import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Plus, X } from 'lucide-react';
import CameraModal from './CameraModal';

const ImageUploader = ({ file, onChange, label = 'Attach Receipt / Bill', color = '#0ea5e9' }) => {
    const [activeCamera, setActiveCamera] = useState(false);

    // Create an object URL for preview if the file is a File object,
    // or use the string directly if it's already an uploaded URL
    const previewUrl = file ? (typeof file === 'string' ? file : URL.createObjectURL(file)) : null;

    const handleGallerySelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            onChange(e.target.files[0]);
        }
    };

    const handleCameraCapture = (capturedFile) => {
        onChange(capturedFile);
        setActiveCamera(false);
    };

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {label}
            </label>

            {file ? (
                <div style={{ position: 'relative', width: '100%' }}>
                    <div style={{ 
                        width: '100%', height: '140px', borderRadius: '16px', overflow: 'hidden', 
                        border: `1px solid ${color}40`, position: 'relative' 
                    }}>
                        <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button 
                            type="button" 
                            onClick={() => onChange(null)} 
                            style={{ 
                                position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', 
                                color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', 
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(4px)'
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button 
                            type="button" 
                            onClick={() => setActiveCamera(true)} 
                            style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <Camera size={16} /> Retake
                        </button>
                        <label style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <ImageIcon size={16} /> Replace
                            <input type="file" accept="image/*" onChange={handleGallerySelect} style={{ display: 'none' }} />
                        </label>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div 
                        onClick={() => setActiveCamera(true)} 
                        style={{ 
                            flex: 1, height: '100px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.4)', 
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
                            cursor: 'pointer', border: '1px dashed rgba(255,255,255,0.15)', transition: 'all 0.3s ease' 
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}10`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)'; }}
                    >
                        <Camera size={26} color={color} style={{ marginBottom: '10px' }} />
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>Camera</span>
                    </div>

                    <label 
                        style={{ 
                            flex: 1, height: '100px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.4)', 
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
                            cursor: 'pointer', border: '1px dashed rgba(255,255,255,0.15)', transition: 'all 0.3s ease' 
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}10`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)'; }}
                    >
                        <ImageIcon size={26} color={color} style={{ marginBottom: '10px' }} />
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '800' }}>Gallery</span>
                        <input type="file" accept="image/*" onChange={handleGallerySelect} style={{ display: 'none' }} />
                    </label>
                </div>
            )}

            {activeCamera && (
                <CameraModal
                    onCapture={handleCameraCapture}
                    onClose={() => setActiveCamera(false)}
                />
            )}
        </div>
    );
};

export default ImageUploader;
