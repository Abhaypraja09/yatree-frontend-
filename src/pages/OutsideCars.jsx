import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Plus, Search, Trash2, Car, X, Save, ChevronLeft, ChevronRight, Calendar, Edit, MapPin, Briefcase, Layers, ShoppingCart, TrendingUp, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCompany } from '../context/CompanyContext';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';
import { todayIST, toISTDateString, firstDayOfMonthIST, formatDateIST, nowIST } from '../utils/istUtils';

const OutsideCars = () => {
    const { theme } = useTheme();
    const { selectedCompany } = useCompany();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDay, setSelectedDay] = useState('All'); // 'All' or 1-31
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('All');
    const [propertyFilter, setPropertyFilter] = useState('All');
    const [transactionFilter, setTransactionFilter] = useState('Buy');
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' or 'range'

    useEffect(() => {
        if (viewMode === 'monthly') {
            if (selectedDay === 'All') {
                const start = toISTDateString(new Date(selectedYear, selectedMonth, 1));
                const end = toISTDateString(new Date(selectedYear, selectedMonth + 1, 0));
                setFromDate(start);
                setToDate(end);
            } else {
                const d = toISTDateString(new Date(selectedYear, selectedMonth, parseInt(selectedDay)));
                setFromDate(d);
                setToDate(d);
            }
        }
    }, [selectedMonth, selectedYear, selectedDay, viewMode]);

    /* navigate dates */
    const shiftDays = (n) => {
        let baseDate;
        if (selectedDay === 'All') {
            const today = new Date();
            // If the selected month/year is the current one, start navigation from TODAY
            if (selectedMonth === today.getMonth() && selectedYear === today.getFullYear()) {
                baseDate = today;
            } else {
                // Otherwise start from the 1st of that month
                baseDate = new Date(selectedYear, selectedMonth, 1);
            }
        } else {
            baseDate = new Date(selectedYear, selectedMonth, parseInt(selectedDay));
        }

        baseDate.setDate(baseDate.getDate() + n);

        setSelectedYear(baseDate.getFullYear());
        setSelectedMonth(baseDate.getMonth());
        setSelectedDay(baseDate.getDate().toString());
    };

    // Modal & Editing State
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        carNumber: '',
        model: '',
        property: '',
        dutyType: '',
        ownerName: '',
        dutyAmount: '',
        dropLocation: '',
        transactionType: 'Buy',
        date: todayIST()
    });

    useEffect(() => {
        if (selectedCompany) {
            fetchOutsideVehicles();
        }
    }, [selectedCompany]);

    const fetchOutsideVehicles = async () => {
        if (!selectedCompany?._id) return;
        setLoading(true);
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.get(`/api/admin/vehicles/${selectedCompany._id}?usePagination=false&type=outside`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setVehicles(data.vehicles?.filter(v => v.isOutsideCar && !v.eventId) || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const loadImage = (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    };

    const handleExportPDF = async () => {
        try {
            if (filtered.length === 0) {
                alert("No data available to export.");
                return;
            }

            // Load assets
            const logo = await loadImage(selectedCompany?.logoUrl || '/logos/yatree_logo.png').catch(() => null);
            const signature = await loadImage(selectedCompany?.ownerSignatureUrl || '/logos/kavish_sign.png').catch(() => null);

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // 1. HEADER
            doc.setFillColor(15, 23, 42); // Navy Dark
            doc.rect(0, 0, pageWidth, 50, 'F');

            if (logo) {
                doc.addImage(logo, 'PNG', 12, 8, 30, 30);
            }

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(selectedCompany?.name || 'FLEET MANAGEMENT', 45, 22);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 200, 200);
            doc.text('Premium Fleet Management & Travel Solutions', 45, 30);
            doc.setTextColor(14, 165, 233);
            doc.text(selectedCompany?.website || 'www.yatreedestination.com', 45, 37);

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('OUTSIDE FLEET REPORT', pageWidth - 15, 22, { align: 'right' });
            doc.setFontSize(9);
            doc.text(`PERIOD: ${fromDate} TO ${toDate}`, pageWidth - 15, 30, { align: 'right' });

            // 2. SUMMARY STATS
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('REPORT SUMMARY', 15, 65);
            doc.setDrawColor(14, 165, 233);
            doc.setLineWidth(0.5);
            doc.line(15, 68, 50, 68);

            const totalAmount = filtered.reduce((sum, v) => sum + (Number(v.dutyAmount) || 0), 0);

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Total Duties: ${filtered.length}`, 15, 76);
            doc.text(`Total Payable: Rs. ${totalAmount.toLocaleString('en-IN')}`, 15, 84);
            doc.text(`Vendor: ${ownerFilter}`, 15, 92);

            // 3. TABLE
            const body = filtered.map(v => [
                formatDateIST(v.carNumber?.split('#')[1] || v.createdAt),
                v.ownerName,
                `${v.model} - ${v.carNumber?.split('#')[0]}`,
                v.property || 'Direct',
                v.dutyType || 'Standard',
                `Rs. ${Number(v.dutyAmount || 0).toLocaleString('en-IN')}`
            ]);

            autoTable(doc, {
                head: [['DATE', 'VENDOR', 'VEHICLE', 'PROPERTY', 'DUTY TYPE', 'AMOUNT']],
                body: body,
                startY: 100,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], fontSize: 8, halign: 'center' },
                bodyStyles: { fontSize: 8, halign: 'center' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 15, right: 15 }
            });

            // 4. SIGNATURE
            let footerY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 100) + 35;
            if (footerY > pageHeight - 60) { doc.addPage(); footerY = 30; }

            const sigX = pageWidth - 75;
            if (signature) {
                doc.addImage(signature, 'PNG', sigX, footerY - 20, 55, 22);
            }
            doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.6);
            doc.line(sigX - 5, footerY + 5, pageWidth - 15, footerY + 5);
            doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42); doc.text((selectedCompany?.ownerName || 'AUTHORISED SIGNATORY').toUpperCase(), sigX - 2, footerY + 12);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
            doc.text('Operations Controller', sigX - 2, footerY + 17);
            doc.text(selectedCompany?.name || 'Fleet CRM', sigX - 2, footerY + 21);

            doc.save(`Outside_Fleet_Report_${fromDate}_to_${toDate}.pdf`);
        } catch (error) {
            console.error(error);
            alert("Error exporting PDF: " + error.message);
        }
    };

    const handleOwnerChange = (val) => {
        setOwnerFilter(val);
        setPropertyFilter('All'); // Reset property when owner changes
    };

    const handleOpenLogDuty = () => {
        setEditMode(false);
        setSelectedId(null);

        // Intelligence: Default the form date to the viewed month
        const now = new Date();
        let defaultDate = todayIST();
        if (selectedMonth !== now.getMonth() || selectedYear !== now.getFullYear()) {
            const dayToUse = selectedDay === 'All' ? 1 : parseInt(selectedDay);
            defaultDate = toISTDateString(new Date(selectedYear, selectedMonth, dayToUse));
        } else if (selectedDay !== 'All' && parseInt(selectedDay) !== now.getDate()) {
            defaultDate = toISTDateString(new Date(selectedYear, selectedMonth, parseInt(selectedDay)));
        }

        setFormData({
            carNumber: '',
            model: '',
            property: propertyFilter !== 'All' ? propertyFilter : '',
            dutyType: '',
            ownerName: ownerFilter !== 'All' ? ownerFilter : '',
            dutyAmount: '',
            dropLocation: '',
            transactionType: 'Buy',
            date: defaultDate,
            isDuplicateToday: false
        });
        setShowModal(true);
    };

    const handleCarNumberChange = (val) => {
        const upVal = val.toUpperCase();
        // Just find any existing vehicle with this number to auto-fill common fields
        const overallExisting = vehicles.find(v => v.carNumber?.split('#')[0] === upVal);

        if (overallExisting) {
            setFormData(prev => ({
                ...prev,
                carNumber: upVal,
                model: overallExisting.model || prev.model,
                ownerName: overallExisting.ownerName || prev.ownerName,
                isDuplicateToday: false // Never block duplicates now
            }));
        } else {
            setFormData(prev => ({ ...prev, carNumber: upVal, isDuplicateToday: false }));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this outside car?')) return;
        try {
            await axios.delete(`/api/admin/vehicles/${id}`, {
                headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` }
            });
            fetchOutsideVehicles();
        } catch (err) { alert('Error deleting'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!selectedCompany?._id) return alert("Select a company first!");

            let internalCarNumber = `${formData.carNumber}#${formData.date}`;

            // Add a unique suffix for new entries or when carNumber/date changes in edit mode to avoid collisions
            if (!editMode) {
                internalCarNumber += `#${Math.random().toString(36).substring(2, 7)}`;
            } else if (selectedId) {
                const originalVehicle = vehicles.find(v => v._id === selectedId);
                const oldParts = originalVehicle?.carNumber?.split('#') || [];
                // If the plate and date are the same as before, keep the old unique suffix
                if (formData.carNumber === oldParts[0] && formData.date === oldParts[1] && oldParts[2]) {
                    internalCarNumber += `#${oldParts[2]}`;
                } else {
                    // Plate or date changed, generate new suffix to be safe
                    internalCarNumber += `#${Math.random().toString(36).substring(2, 7)}`;
                }
            }

            let payload = {
                carNumber: internalCarNumber,
                model: formData.model?.trim(),
                property: formData.property?.trim(),
                dutyType: formData.dutyType?.trim() || '',
                ownerName: formData.ownerName?.trim(),
                dutyAmount: Number(formData.dutyAmount) || 0,
                dropLocation: formData.dropLocation?.trim() || '',
                companyId: selectedCompany._id,
                isOutsideCar: true,
                status: 'active',
                transactionType: formData.transactionType || 'Buy',
                createdAt: formData.date
            };

            if (editMode && selectedId) {
                await axios.put(`/api/admin/vehicles/${selectedId}`, payload, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
            } else {
                // Always create a new entry for outside cars now (no merging)
                const data = new FormData();
                Object.keys(payload).forEach(key => data.append(key, payload[key]));
                data.append('permitType', 'Contract');
                data.append('carType', 'Other');
                await axios.post('/api/admin/vehicles', data, {
                    headers: {
                        Authorization: `Bearer ${userInfo.token}`
                    }
                });
            }

            setShowModal(false);
            setEditMode(false);
            setSelectedId(null);
            setFormData({ ...formData, carNumber: '', dutyAmount: '', dropLocation: '', dutyType: '' });
            fetchOutsideVehicles();
        } catch (err) {
            alert(err.response?.data?.message || 'Error processing duty');
        }
    };

    const handleEdit = (vehicle) => {
        setFormData({
            carNumber: vehicle.carNumber?.split('#')[0] || '',
            model: vehicle.model,
            property: vehicle.property || '',
            dutyType: vehicle.dutyType,
            ownerName: vehicle.ownerName,
            dutyAmount: vehicle.dutyAmount,
            dropLocation: vehicle.dropLocation,
            transactionType: vehicle.transactionType || 'Buy',
            date: vehicle.carNumber?.split('#')[1] || toISTDateString(vehicle.createdAt)
        });
        setSelectedId(vehicle._id);
        setEditMode(true);
        setShowModal(true);
    };

    const filtered = vehicles.filter(v => {
        const cleanCarNumber = v.carNumber?.split('#')[0] || '';
        const matchesSearch = cleanCarNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.property?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesOwner = ownerFilter === 'All' || v.ownerName?.trim() === ownerFilter?.trim();
        const currentProperty = v.property?.trim().toLowerCase().replace(/\s+/g, ' ');
        const filterProperty = propertyFilter === 'All' ? 'All' : propertyFilter.trim().toLowerCase().replace(/\s+/g, ' ');
        const matchesProperty = propertyFilter === 'All' || currentProperty === filterProperty;

        // Date Range Logic
        const dutyTagDateStr = v.carNumber?.split('#')[1];
        if (!dutyTagDateStr) return false;

        const matchesDate = dutyTagDateStr >= fromDate && dutyTagDateStr <= toDate;
        const matchesTransaction = (v.transactionType || 'Buy') === transactionFilter;

        return matchesSearch && matchesOwner && matchesProperty && matchesDate && matchesTransaction;
    }).sort((a, b) => {
        const dateA = a.carNumber?.split('#')[1] || '';
        const dateB = b.carNumber?.split('#')[1] || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const totalPayable = filtered.reduce((sum, v) => sum + (v ? (Number(v.dutyAmount) || 0) : 0), 0);
    const totalDutiesCount = filtered.reduce((sum, v) => sum + (v?.dutyType ? v.dutyType.split(' + ').filter(Boolean).length : 0), 0);

    // Cascading unique drivers based on proprietor selection
    const uniqueOwners = [...new Set(vehicles.map(v => v.ownerName?.trim()).filter(Boolean))].sort();

    // Create unique properties list, normalizing to avoid duplicates in dropdown but keeping original casing for display
    const uniqueProperties = Object.values(vehicles
        .filter(v => {
            const ownerMatch = ownerFilter === 'All' || v.ownerName?.trim() === ownerFilter?.trim();
            const dutyDate = v.carNumber?.split('#')[1];
            const dateMatch = dutyDate >= fromDate && dutyDate <= toDate;
            return ownerMatch && dateMatch;
        })
        .reduce((acc, v) => {
            const prop = v.property?.trim();
            if (prop) {
                const key = prop.toLowerCase().replace(/\s+/g, ' ');
                if (!acc[key]) acc[key] = prop;
            }
            return acc;
        }, {})).sort();

    const carNumberSuggestions = [...new Set(vehicles.map(v => v.carNumber?.split('#')[0]).filter(Boolean))];

    const getDynamicSuggestions = () => {
        if (!formData.date) return { types: [], locations: [] };

        const fDate = new Date(formData.date);
        const day = fDate.getDate();
        const formDateObj = new Date(formData.date);
        const targetYearMonth = `${formDateObj.getFullYear()}-${String(formDateObj.getMonth() + 1).padStart(2, '0')}`;

        // If it's the 1st of the month, return empty arrays (no reminders)
        if (day === 1) return { types: [], locations: [], properties: [] };

        // Filter all vehicles to find entries from the EXACT SAME month and year as the form date
        const sameMonthData = vehicles.filter(v => {
            const parts = v.carNumber?.split('#');
            if (!parts || !parts[1]) return false;
            // Date is stored as YYYY-MM-DD
            const vYearMonth = parts[1].substring(0, 7); // Extracts "YYYY-MM"
            return vYearMonth === targetYearMonth;
        });

        return {
            types: [...new Set(sameMonthData.map(v => v.dutyType).filter(Boolean))],
            locations: [...new Set(sameMonthData.map(v => v.dropLocation).filter(Boolean))],
            properties: [...new Set(sameMonthData.map(v => v.property).filter(Boolean))]
        };
    };

    const dynamicSuggestions = getDynamicSuggestions();
    const dutyTypeSuggestions = dynamicSuggestions.types;
    const dropLocationSuggestions = dynamicSuggestions.locations;
    const propertySuggestions = dynamicSuggestions.properties || [];

    const formatDateDisplay = (dateStr) => {
        return formatDateIST(dateStr);
    };

    return (
        <div className="container-fluid" style={{ paddingBottom: '60px' }}>
            <SEO title="Outside Fleet Command" description="Manage external vehicles and freelancer drivers for specific duties." />

            <style>{`
                .bg-buy { 
                    background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(20, 83, 45, 0.2) 100%) !important; 
                    color: #4ade80 !important; 
                    border: 1px solid rgba(34, 197, 94, 0.25) !important;
                    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
                }
                .bg-sell { 
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(127, 29, 29, 0.2) 100%) !important; 
                    color: #f87171 !important; 
                    border: 1px solid rgba(239, 68, 68, 0.25) !important;
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
                }
                .badge-ext { 
                    padding: 3px 10px; 
                    border-radius: 8px; 
                    font-size: 9px; 
                    font-weight: 950; 
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
                .stat-circle-svg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    transform: rotate(-90deg);
                }
                .stat-circle-bg {
                    fill: none;
                    stroke: rgba(255, 255, 255, 0.03);
                    stroke-width: 4;
                }
                .stat-circle-progress {
                    fill: none;
                    stroke-width: 4;
                    stroke-linecap: round;
                    transition: stroke-dashoffset 1s ease-out;
                }
                .payout-glow { filter: drop-shadow(0 0 4px ${theme.primary}); }
                .logs-glow { filter: drop-shadow(0 0 4px #10b981); }
            `}</style>

            {/* ═══ PREMIUM DYNAMIC HEADER ═══ */}
            <header style={{
                padding: 'clamp(20px, 4vw, 40px) 0',
                position: 'relative'
            }}>
                <div className="flex-resp" style={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '24px',
                    marginBottom: 'clamp(20px, 4vw, 32px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 3vw, 20px)' }}>
                        <div style={{
                            width: 'clamp(48px, 10vw, 64px)',
                            height: 'clamp(48px, 10vw, 64px)',
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            borderRadius: 'clamp(12px, 3vw, 20px)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            flexShrink: 0
                        }}>
                            <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', background: `radial-gradient(circle at 30% 30%, ${theme.primary}33, transparent 70%)` }}></div>
                            <Car size={28} color={theme.primary} style={{ filter: `drop-shadow(0 0 10px ${theme.primary}66)` }} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}></motion.div>
                                <span style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Vendor Command</span>
                            </div>
                            <h1 style={{ color: 'white', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: '950', margin: 0, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                                Outside <span className="theme-gradient-text">Fleet</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex-resp" style={{ gap: '24px', alignItems: 'center', flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                        {/* CIRCULAR STATS */}
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{
                                width: 'clamp(80px, 15vw, 110px)', height: 'clamp(80px, 15vw, 110px)', borderRadius: '50%',
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(251, 191, 36, 0.1)',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                position: 'relative'
                            }}>
                                <svg className="stat-circle-svg" viewBox="0 0 100 100">
                                    <circle className="stat-circle-bg" cx="50" cy="50" r="45" />
                                    <motion.circle
                                        className="stat-circle-progress payout-glow"
                                        cx="50" cy="50" r="45"
                                        stroke={theme.primary}
                                        initial={{ strokeDasharray: "283 283", strokeDashoffset: 283 }}
                                        animate={{ strokeDashoffset: 0 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                </svg>
                                <span style={{ fontSize: '7px', fontWeight: '950', color: theme.primary, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px', position: 'relative', zIndex: 1 }}>Payout</span>
                                <span style={{ color: 'white', fontSize: 'clamp(12px, 3vw, 15px)', fontWeight: '950', position: 'relative', zIndex: 1 }}>₹{totalPayable.toLocaleString()}</span>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} style={{
                                width: 'clamp(80px, 15vw, 110px)', height: 'clamp(80px, 15vw, 110px)', borderRadius: '50%',
                                background: 'rgba(15, 23, 42, 0.6)',
                                border: '1px solid rgba(16, 185, 129, 0.1)',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                position: 'relative'
                            }}>
                                <svg className="stat-circle-svg" viewBox="0 0 100 100">
                                    <circle className="stat-circle-bg" cx="50" cy="50" r="45" />
                                    <motion.circle
                                        className="stat-circle-progress logs-glow"
                                        cx="50" cy="50" r="45"
                                        stroke="#10b981"
                                        initial={{ strokeDasharray: "283 283", strokeDashoffset: 283 }}
                                        animate={{ strokeDashoffset: -200 }}
                                        transition={{ duration: 1.8, ease: "easeOut" }}
                                    />
                                </svg>
                                <span style={{ fontSize: '7px', fontWeight: '950', color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px', position: 'relative', zIndex: 1 }}>Vehicles</span>
                                <span style={{ color: 'white', fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: '950', position: 'relative', zIndex: 1 }}>{totalDutiesCount}</span>
                            </motion.div>
                        </div>

                        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                            {/* CIRCULAR STATS */}

                            {/* TOP RIGHT BUTTONS */}
                            <div className="flex-resp" style={{ gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={handleOpenLogDuty}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        height: '50px',
                                        padding: '0 24px',
                                        borderRadius: '14px',
                                        fontWeight: '900',
                                        background: theme.primary,
                                        color: 'black',
                                        border: 'none',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        flex: 1,
                                        maxWidth: '240px',
                                        boxShadow: `0 8px 20px ${theme.primary}40`
                                    }}
                                >
                                    <Plus size={18} strokeWidth={3} /> Add Duty Entry
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    style={{
                                        height: '50px',
                                        padding: '0 16px',
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        color: '#f87171',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        borderRadius: '14px',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <FileText size={16} /> <span className="hide-mobile">Export PDF</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        const XLSX = await import('xlsx-js-style');
                                        const reportData = filtered.map(v => ({
                                            'Property': v.property || '',
                                            'Owner': v.ownerName || '',
                                            'Date': (() => {
                                                const rawDate = v.carNumber?.split('#')[1] || v.createdAt;
                                                if (!rawDate) return '';
                                                return formatDateIST(rawDate);
                                            })(),
                                            'Vehicle Details': `${v.model || ''} - ${v.carNumber?.split('#')[0] || ''}`,
                                            'Drop Location': v.dropLocation?.replace(/ \| /g, ' ➜ ') || '',
                                            'Service Type': v.dutyType || '',
                                            'Amount': Number(v.dutyAmount) || 0
                                        }));
                                        const totalAmount = reportData.reduce((sum, row) => sum + row.Amount, 0);
                                        reportData.push({
                                            'Property': '', 'Owner': '', 'Date': '', 'Vehicle Details': '', 'Drop Location': '', 'Service Type': 'TOTAL PAYABLE', 'Amount': totalAmount
                                        });
                                        const ws = XLSX.utils.json_to_sheet(reportData);
                                        const range = XLSX.utils.decode_range(ws['!ref']);
                                        for (let C = range.s.c; C <= range.e.c; ++C) {
                                            let maxWidth = 10;
                                            for (let R = range.s.r; R <= range.e.r; ++R) {
                                                const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                                                if (!cell) continue;
                                                cell.s = { alignment: { horizontal: 'center', vertical: 'center' }, font: { name: 'Arial', sz: 10 } };
                                                if (R === 0) { cell.s.font.bold = true; cell.s.fill = { fgColor: { rgb: "4F46E5" } }; cell.s.font.color = { rgb: "FFFFFF" }; }
                                                if (C === 6) cell.s.alignment.horizontal = 'right';
                                                if (R === range.e.r) { cell.s.font.bold = true; cell.s.fill = { fgColor: { rgb: "E0E7FF" } }; }
                                                if (cell.v) maxWidth = Math.max(maxWidth, cell.v.toString().length + 5);
                                            }
                                            if (!ws['!cols']) ws['!cols'] = [];
                                            ws['!cols'][C] = { wch: maxWidth };
                                        }
                                        const wb = XLSX.utils.book_new();
                                        XLSX.utils.book_append_sheet(wb, ws, "Outside Fleet Log");
                                        XLSX.writeFile(wb, `Outside_Fleet_Report_${fromDate}_to_${toDate}.xlsx`);
                                    }}
                                    style={{
                                        height: '50px',
                                        padding: '0 16px',
                                        background: 'rgba(16, 185, 129, 0.08)',
                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                        color: '#34d399',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        borderRadius: '14px',
                                        fontSize: '11px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Save size={16} /> <span className="hide-mobile">Export Excel</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ DYNAMIC INTEGRATED CONTROL BAR ═══ */}
                <div className="glass-card" style={{
                    padding: 'clamp(10px, 2vw, 12px)',
                    marginBottom: 'clamp(24px, 4vw, 32px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '24px'
                }}>
                    <div className="flex-resp" style={{ gap: '12px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: '1.5', minWidth: '0' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(251, 191, 36, 0.4)', zIndex: 1 }} />
                            <input
                                type="text"
                                placeholder="Universal Search..."
                                className="premium-compact-input"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: '48px', height: '52px' }}
                            />
                        </div>

                        <div className="flex-resp" style={{ gap: '8px', flex: '2', minWidth: '0' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <select value={ownerFilter} onChange={e => handleOwnerChange(e.target.value)} className="premium-compact-input" style={{ height: '52px', appearance: 'none' }}>
                                    <option value="All">All Vendors</option>
                                    {uniqueOwners.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <ChevronRight size={14} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                            </div>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="premium-compact-input" style={{ height: '52px', appearance: 'none' }}>
                                    <option value="All">All Properties</option>
                                    {uniqueProperties.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <ChevronRight size={14} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                            </div>
                        </div>
                    </div>

                    <div className="flex-resp" style={{ gap: '12px', alignItems: 'center' }}>
                        {/* TRANSACTION FILTERS SCROLLABLE */}
                        <div className="premium-scroll" style={{
                            display: 'flex',
                            background: 'rgba(15, 23, 42, 0.6)',
                            padding: '6px',
                            borderRadius: '18px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            gap: '6px',
                            overflowX: 'auto',
                            flex: '1.5'
                        }}>
                            {[
                                { id: 'Buy', label: 'Buy', icon: ShoppingCart, color: '#22c55e' },
                                { id: 'Sell', label: 'Sell', icon: TrendingUp, color: '#ef4444' }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setTransactionFilter(type.id)}
                                    style={{
                                        padding: '8px 24px',
                                        borderRadius: '14px',
                                        border: '1px solid ' + (transactionFilter === type.id ? type.color + '40' : 'transparent'),
                                        fontSize: '11px',
                                        fontWeight: '950',
                                        cursor: 'pointer',
                                        background: transactionFilter === type.id ? type.color + '15' : 'transparent',
                                        color: transactionFilter === type.id ? type.color : 'rgba(255,255,255,0.3)',
                                        textTransform: 'uppercase',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <type.icon size={16} />
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

                                    {/* PREMIUM DAY NAV PILL */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'rgba(0,0,0,0.4)',
                                        padding: '4px',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255,0.06)'
                                    }}>
                                        <button onClick={() => shiftDays(-1)} style={{
                                            width: '42px', height: '42px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s'
                                        }}> <ChevronLeft size={18} /> </button>

                                        <div
                                            onClick={(e) => { const i = e.currentTarget.querySelector('input'); if (i.showPicker) i.showPicker(); else i.click(); }}
                                            style={{ height: '42px', minWidth: '140px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '16px', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', margin: '0 6px' }}
                                        >
                                            <span style={{ fontSize: '13px', fontWeight: '950', color: 'white', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>
                                                {selectedDay === 'All' ?
                                                    ` ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][selectedMonth]} ${selectedYear}` :
                                                    formatDateIST(toISTDateString(new Date(selectedYear, selectedMonth, parseInt(selectedDay))))}
                                            </span>
                                            <input
                                                type="date"
                                                value={toISTDateString(new Date(selectedYear, selectedMonth, selectedDay === 'All' ? 1 : parseInt(selectedDay)))}
                                                onChange={e => {
                                                    const d = new Date(e.target.value);
                                                    setSelectedYear(d.getFullYear());
                                                    setSelectedMonth(d.getMonth());
                                                    setSelectedDay(d.getDate().toString());
                                                }}
                                                style={{ position: 'absolute', inset: 0, opacity: 0 }}
                                            />
                                        </div>

                                        <button onClick={() => shiftDays(1)} style={{
                                            width: '42px', height: '42px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s'
                                        }}> <ChevronRight size={18} /> </button>
                                    </div>

                                    {/* DYNAMIC "SHOW FULL MONTH" TAB */}
                                    {selectedDay !== 'All' && (
                                        <motion.button
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            onClick={() => setSelectedDay('All')}
                                            style={{
                                                height: '50px',
                                                padding: '0 20px',
                                                borderRadius: '16px',
                                                background: 'rgba(251, 191, 36, 0.1)',
                                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                                color: 'var(--primary)',
                                                fontSize: '11px',
                                                fontWeight: '950',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            <Calendar size={14} /> View Full Month
                                        </motion.button>
                                    )}

                                    <select
                                        value={selectedMonth}
                                        onChange={e => {
                                            setSelectedMonth(Number(e.target.value));
                                            setSelectedDay('All'); // Show full month on change
                                        }}
                                        className="premium-compact-input"
                                        style={{ height: '50px', padding: '0 12px', fontSize: '12px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontWeight: '800', width: '90px' }}
                                    >
                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                                            <option key={m} value={idx}>{m}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={selectedYear}
                                        onChange={e => {
                                            setSelectedYear(Number(e.target.value));
                                            setSelectedDay('All'); // Show full month on change
                                        }}
                                        className="premium-compact-input"
                                        style={{ height: '50px', padding: '0 12px', fontSize: '12px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontWeight: '800', width: '80px' }}
                                    >
                                        {[2024, 2025, 2026, 2027].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                        </div>
                    </div>
                </div>


            </header>

            {/* ═══ CLEAN PREMIUM DESKTOP TABLE ═══ */}
            <div className="glass-card hide-mobile scroll-x" style={{
                padding: 0,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(8, 14, 26, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ minWidth: '1000px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ width: '120px', padding: '18px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Timeline</th>
                                <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Resource Identification</th>
                                <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Service Detail</th>
                                <th style={{ padding: '18px 24px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Entities</th>
                                <th style={{ padding: '18px 24px', textAlign: 'right', width: '160px', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Duty Settlement</th>
                                <th style={{ padding: '18px 24px', textAlign: 'right', width: '120px', fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px 0' }}>
                                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '40px', height: '40px', border: '3px solid rgba(251, 191, 36, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto 16px' }}></motion.div>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>SYNCHRONIZING FLEET DATA...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '120px 0' }}>
                                    <Car size={48} style={{ opacity: 0.1, color: 'var(--primary)', marginBottom: '24px' }} />
                                    <h3 style={{ color: 'white', fontWeight: '900', marginBottom: '8px', letterSpacing: '-0.5px' }}>Registry Empty</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>No external duties match the current filter selection.</p>
                                </td></tr>
                            ) : filtered.map((v, idx) => (
                                <motion.tr
                                    key={v._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="table-row-hover"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                >
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                {(() => {
                                                    const parts = v.carNumber?.split('#');
                                                    if (parts && parts[1]) {
                                                        const date = new Date(parts[1]);
                                                        return date.toLocaleDateString('en-US', { weekday: 'short' });
                                                    }
                                                    return 'DUTY';
                                                })()}
                                            </span>
                                            <span style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>
                                                {(() => {
                                                    const parts = v.carNumber?.split('#');
                                                    if (parts && parts[1]) {
                                                        const [y, m, d] = parts[1].split('-');
                                                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                        return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
                                                    }
                                                    return 'Manual';
                                                })()}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(129, 140, 248, 0.1)', border: '1px solid rgba(129, 140, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Car size={20} color="#818cf8" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '900', fontSize: '16px', color: 'white', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {v.carNumber?.split('#')[0]}
                                                    <span className={`badge-ext ${v.transactionType === 'Buy' ? 'bg-buy' : v.transactionType === 'Sell' ? 'bg-sell' : ''}`}>
                                                        {v.transactionType || 'EXTERNAL'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', marginTop: '2px', textTransform: 'uppercase' }}>{v.model}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                            <span className="badge-duty">{v.dutyType || 'Standard Duty'}</span>
                                            {v.dropLocation && (
                                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <ChevronRight size={14} style={{ opacity: 0.3 }} />
                                                    {v.dropLocation}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>{v.property || 'Direct Order'}</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '600' }}>Vendor: {v.ownerName}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'inline-block', padding: '10px 18px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                                            <span style={{ color: '#10b981', fontWeight: '950', fontSize: '17px', letterSpacing: '-0.5px' }}>₹{v.dutyAmount?.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleEdit(v)} className="action-btn-hover" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Log"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(v._id)} className="action-btn-hover-del" style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.1)', color: '#f43f5e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Delete Log"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ═══ PREMIUM MOBILE DUTY CARDS ═══ */}
            <div className="show-mobile">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: '16px' }}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: '32px', height: '32px', border: '3px solid rgba(251, 191, 36, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></motion.div>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '900', letterSpacing: '2px' }}>LOADING FLEET...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed rgba(255,255,255,0.1)', background: 'transparent' }}>
                        <Car size={32} style={{ opacity: 0.2, color: 'var(--primary)', marginBottom: '16px' }} />
                        <h3 style={{ color: 'white', fontWeight: '800', fontSize: '15px' }}>No Data Available</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>Try adjusting your filters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filtered.map((v, idx) => (
                            <motion.div
                                key={v._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    padding: '20px',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Car size={18} color="#38bdf8" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: '950', color: 'white', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {v.carNumber?.split('#')[0]}
                                                <span className={`badge-ext ${v.transactionType === 'Buy' ? 'bg-buy' : v.transactionType === 'Sell' ? 'bg-sell' : ''}`} style={{ fontSize: '7px', padding: '2px 6px' }}>
                                                    {v.transactionType || 'EXT'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', textTransform: 'uppercase' }}>{v.model}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '16px', fontWeight: '950', color: '#10b981' }}>₹{v.dutyAmount?.toLocaleString()}</div>
                                        <div style={{ fontSize: '8px', color: 'rgba(16, 185, 129, 0.5)', fontWeight: '900', textTransform: 'uppercase' }}>Payout</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '2px' }}>Log Date</label>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)' }}>
                                            {(() => {
                                                const parts = v.carNumber?.split('#');
                                                if (parts && parts[1]) {
                                                    const [y, m, d] = parts[1].split('-');
                                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
                                                }
                                                return 'Manual';
                                            })()}
                                        </span>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '2px' }}>Property</label>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{v.property || 'Direct'}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <Briefcase size={12} color="#38bdf8" style={{ opacity: 0.6 }} />
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.8)' }}>{v.dutyType || 'Standard Duty'}</span>
                                    {v.dropLocation && (
                                        <>
                                            <ChevronRight size={10} style={{ opacity: 0.3 }} />
                                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{v.dropLocation}</span>
                                        </>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                                        Vendor: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{v.ownerName}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEdit(v)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={14} /></button>
                                        <button onClick={() => handleDelete(v._id)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f43f5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* ═══ PREMIUM OUTSIDE FLEET LOG MODAL ═══ */}
            {/* ═══ PREMIUM OUTSIDE FLEET LOG MODAL ═══ */}
            <AnimatePresence>
                {showModal && (
                    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.7)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="modal-container"
                            style={{
                                background: 'linear-gradient(165deg, #0f172a 0%, #020617 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
                                borderRadius: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: '92vh',
                                width: '95%',
                                maxWidth: '700px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            {/* Decorative Background Elements */}
                            <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(251, 191, 36, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }}></div>
                            <div style={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }}></div>

                            {/* Modal Header */}
                            <div style={{
                                padding: '32px 40px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '18px',
                                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)',
                                        border: '1px solid rgba(251, 191, 36, 0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                    }}>
                                        <Car size={26} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.3))' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '24px', fontWeight: '950', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
                                            {editMode ? 'Edit Duty Log' : 'External Fleet Log'}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></div>
                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Operational Registry</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{
                                    background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)',
                                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                                    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: '0.2s hover'
                                }}><X size={20} /></button>
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: '0 40px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative', zIndex: 1 }} className="premium-scroll">

                                <div style={{ height: '24px' }}></div> {/* Spacer */}

                                {/* SECTION 1: CORE LOGISTICS */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div className="form-grid-2" style={{ gap: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', display: 'block' }}>LOG DATE *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.6, zIndex: 2 }} />
                                                <input
                                                    type="date"
                                                    className="premium-compact-input"
                                                    required
                                                    value={formData.date}
                                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                    style={{
                                                        background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.06)',
                                                        borderRadius: '16px', height: '56px', width: '100%', color: 'white', padding: '0 16px 0 48px',
                                                        fontSize: '14px', fontWeight: '700'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', display: 'block' }}>CLIENT PROPERTY *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Plus size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.6, zIndex: 2 }} />
                                                <input
                                                    type="text" list="propList" className="premium-compact-input"
                                                    required value={formData.property}
                                                    onChange={e => setFormData({ ...formData, property: e.target.value })}
                                                    placeholder="Select or Type..."
                                                    style={{
                                                        background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.06)',
                                                        borderRadius: '16px', height: '56px', width: '100%', color: 'white', padding: '0 16px 0 48px',
                                                        fontSize: '14px', fontWeight: '700'
                                                    }}
                                                />
                                                <datalist id="propList">
                                                    {propertySuggestions.map(p => <option key={p} value={p} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 2: RESOURCE DATA */}
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#38bdf8' }}></div>
                                        <span style={{ fontSize: '11px', fontWeight: '950', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px' }}>Resource Identification</span>
                                    </div>

                                    <div className="form-grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', display: 'block' }}>VEHICLE PLATE *</label>
                                            <div style={{ position: 'relative' }}>
                                                <Car size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8', opacity: 0.6, zIndex: 2 }} />
                                                <input
                                                    type="text" list="plateList" className="premium-compact-input"
                                                    required value={formData.carNumber}
                                                    onChange={e => handleCarNumberChange(e.target.value)}
                                                    placeholder="RJ-XX-XX-XXXX"
                                                    style={{
                                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                                                        borderRadius: '16px', height: '56px', width: '100%', color: 'white', padding: '0 16px 0 48px',
                                                        fontSize: '16px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px'
                                                    }}
                                                />
                                                <datalist id="plateList">
                                                    {carNumberSuggestions.map(s => <option key={s} value={s} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', display: 'block' }}>ASSET MODEL *</label>
                                            <input
                                                type="text" className="premium-compact-input"
                                                required value={formData.model}
                                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                                placeholder="e.g. Innova Crysta"
                                                style={{
                                                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '16px', height: '56px', width: '100%', color: 'white', padding: '0 20px',
                                                    fontSize: '14px', fontWeight: '700'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-grid-2" style={{ gap: '20px' }}>
                                        <div className="premium-input-group">
                                            <label className="premium-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', display: 'block' }}>VENDOR NAME *</label>
                                            <input
                                                type="text" className="premium-compact-input"
                                                required value={formData.ownerName}
                                                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                                placeholder="Proprietor Name"
                                                style={{
                                                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '16px', height: '56px', width: '100%', color: 'white', padding: '0 20px',
                                                    fontSize: '14px', fontWeight: '700'
                                                }}
                                            />
                                        </div>
                                        <div className="premium-input-group">
                                            <label className="premium-label" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', display: 'block' }}>TRANSACTION MODE *</label>
                                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', gap: '6px', height: '56px' }}>
                                                {[
                                                    { id: 'Buy', label: 'Buy', icon: ShoppingCart, color: '#22c55e' },
                                                    { id: 'Sell', label: 'Sell', icon: TrendingUp, color: '#ef4444' }
                                                ].map(t => (
                                                    <button
                                                        key={t.id} type="button"
                                                        onClick={() => setFormData({ ...formData, transactionType: t.id })}
                                                        style={{
                                                            flex: 1, borderRadius: '14px', cursor: 'pointer', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none',
                                                            background: formData.transactionType === t.id ? t.color : 'transparent',
                                                            color: formData.transactionType === t.id ? 'black' : 'rgba(255,255,255,0.3)',
                                                            boxShadow: formData.transactionType === t.id ? `0 4px 12px ${t.color}40` : 'none'
                                                        }}
                                                    >
                                                        <t.icon size={16} strokeWidth={formData.transactionType === t.id ? 3 : 2} />
                                                        <span style={{ fontSize: '11px', fontWeight: '950', textTransform: 'uppercase' }}>{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: SERVICE DETAILS */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981' }}></div>
                                        <span style={{ fontSize: '11px', fontWeight: '950', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px' }}>Service Settlement</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div className="form-grid-2" style={{ gap: '24px' }}>
                                            <div className="premium-input-group">
                                                <label className="premium-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', display: 'block' }}>SERVICE CATEGORY</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Briefcase size={18} style={{ position: 'absolute', left: '16px', top: '28px', transform: 'translateY(-50%)', color: '#10b981', opacity: 0.6, zIndex: 2 }} />
                                                    <input
                                                        type="text" list="catList" className="premium-compact-input"
                                                        value={formData.dutyType}
                                                        onChange={e => setFormData({ ...formData, dutyType: e.target.value })}
                                                        placeholder="e.g. Airport Transfer"
                                                        style={{
                                                            background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.06)',
                                                            borderRadius: '16px', height: '56px', width: '100%', color: 'white', padding: '0 16px 0 48px',
                                                            fontSize: '14px', fontWeight: '700', marginBottom: '12px'
                                                        }}
                                                    />
                                                    <datalist id="catList">
                                                        {dutyTypeSuggestions.map(s => <option key={s} value={s} />)}
                                                    </datalist>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {['Airport PickUp', 'Airport Drop', 'Local Duty', 'Outstation'].map(t => (
                                                            <button
                                                                key={t} type="button"
                                                                onClick={() => setFormData({ ...formData, dutyType: t })}
                                                                style={{
                                                                    fontSize: '10px', fontWeight: '800', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', transition: '0.2s',
                                                                    background: formData.dutyType === t ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
                                                                    border: `1px solid ${formData.dutyType === t ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                                                                    color: formData.dutyType === t ? '#10b981' : 'rgba(255,255,255,0.4)'
                                                                }}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="premium-input-group">
                                                <label className="premium-label" style={{ fontSize: '11px', color: '#10b981', fontWeight: '900', marginBottom: '12px', display: 'block' }}>PAYOUT AMOUNT (₹) *</label>
                                                <div style={{
                                                    position: 'relative', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '20px',
                                                    border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 24px',
                                                    display: 'flex', alignItems: 'center', gap: '16px', height: '80px',
                                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                                }}>
                                                    <span style={{ fontSize: '24px', fontWeight: '950', color: '#10b981' }}>₹</span>
                                                    <input
                                                        type="number" className="premium-compact-input"
                                                        required value={formData.dutyAmount}
                                                        onChange={e => setFormData({ ...formData, dutyAmount: e.target.value })}
                                                        placeholder="0.00"
                                                        style={{
                                                            background: 'transparent', border: 'none', color: '#10b981',
                                                            fontSize: '32px', fontWeight: '950', outline: 'none', width: '100%',
                                                            letterSpacing: '-1px'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="premium-input-group">
                                            <label className="premium-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', display: 'block' }}>OPERATIONAL DESTINATION</label>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8', opacity: 0.6, zIndex: 2 }} />
                                                <input
                                                    type="text" list="locList" className="premium-compact-input"
                                                    value={formData.dropLocation}
                                                    onChange={e => setFormData({ ...formData, dropLocation: e.target.value })}
                                                    placeholder="Enter destination details..."
                                                    style={{
                                                        background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.06)',
                                                        borderRadius: '16px', height: '56px', width: '100%', color: 'white', padding: '0 16px 0 48px',
                                                        fontSize: '14px', fontWeight: '700'
                                                    }}
                                                />
                                                <datalist id="locList">
                                                    {dropLocationSuggestions.map(item => <option key={item} value={item} />)}
                                                </datalist>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: '32px 40px', background: 'rgba(0,0,0,0.4)',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', gap: '16px', position: 'relative', zIndex: 1
                            }}>
                                <button onClick={() => setShowModal(false)} style={{
                                    flex: 1, height: '60px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)',
                                    fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: '0.2s'
                                }}>Dismiss</button>
                                <button onClick={handleSubmit} style={{
                                    flex: 2, height: '60px', borderRadius: '18px', border: 'none',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #d97706 100%)',
                                    color: 'black', fontWeight: '950', fontSize: '15px', textTransform: 'uppercase',
                                    letterSpacing: '1px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(217, 119, 6, 0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                                }}>
                                    <Save size={20} />
                                    {editMode ? 'Synchronize Record' : 'Submit'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default OutsideCars;
