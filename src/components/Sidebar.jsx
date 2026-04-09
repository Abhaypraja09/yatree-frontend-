import React, { useState } from 'react';
import { NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Car,
    ClipboardList,
    Settings,
    LogOut,
    ChevronRight,
    Building2,
    ChevronDown,
    ShieldAlert,
    Wrench,
    Fuel,
    Droplets,
    IndianRupee,
    MapPin,
    AlertTriangle,
    ShieldCheck,
    Activity,
    Briefcase,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const NavItem = ({ item, onClick, isSubItem = false }) => {
    const { t } = useLanguage();
    return (
        <NavLink
            to={item.path}
            onClick={onClick}
            end={item.path === '/admin'}
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isSubItem ? '10px 14px 10px 44px' : '12px 14px',
                borderRadius: '12px',
                marginBottom: '4px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#000' : '#64748b',
                border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                textDecoration: 'none',
                boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.2)' : 'none',
            })}
        >
            {item.icon && <item.icon size={isSubItem ? 18 : 20} />}
            <span style={{ fontWeight: '600', fontSize: isSubItem ? '14px' : '15px' }}>{t(item.labelKey) || item.label}</span>
        </NavLink>
    );
};

const NavGroup = ({ title, labelKey, icon: Icon, children, isOpen, onToggle }) => {
    const { t } = useLanguage();
    return (
        <div style={{ marginBottom: '6px' }}>
            <button
                onClick={onToggle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isOpen ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    border: 'none',
                    color: isOpen ? 'white' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={20} />
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{t(labelKey) || title}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                    <ChevronDown size={18} />
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ paddingTop: '4px' }}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Sidebar = ({ isOpen, onClose }) => {
    const { logout, user } = useAuth();
    const { selectedCompany } = useCompany();
    const { language, setLanguage, t } = useLanguage();
    const { theme } = useTheme();
    const location = useLocation();

    const userRole = user?.role?.toLowerCase() || '';
    const isAdmin = userRole === 'admin' || userRole === 'superadmin' || (userRole.includes('admin') && userRole !== 'executive');
    const isYatree = selectedCompany?.name === 'YatreeDestination' || selectedCompany?.name === 'Yatree Destination';

    // Group state
    const [openGroups, setOpenGroups] = useState({
        drivers: location.pathname.includes('/admin/drivers') || location.pathname.includes('/admin/freelancers') || location.pathname.includes('/admin/driver-salaries') || location.pathname.includes('/admin/driver-duty') || location.pathname.includes('/admin/freelancer-duty'),
        buysell: location.pathname.includes('/admin/outside-cars') || location.pathname.includes('/admin/event-management'),
        maintenance: location.pathname.includes('/admin/maintenance') || location.pathname.includes('/admin/vehicle-month-details') || location.pathname.includes('/admin/vehicles') || location.pathname.includes('/admin/accident-logs') || location.pathname.includes('/admin/warranties'),
        vehicles: location.pathname.includes('/admin/fuel') || location.pathname.includes('/admin/border-tax') || location.pathname.includes('/admin/fastag') || location.pathname.includes('/admin/parking') || location.pathname.includes('/admin/driver-services') || location.pathname.includes('/admin/border-tax') || location.pathname.includes('/admin/fastag') || location.pathname.includes('/admin/accident-logs') || location.pathname.includes('/admin/warranties'),
        logbook: location.pathname.includes('/admin/log-book')
    });

    const toggleGroup = (group) => {
        setOpenGroups(prev => {
            const isOpening = !prev[group];
            if (isOpening) {
                // If we are opening a group, close all others
                const newState = {};
                Object.keys(prev).forEach(key => {
                    newState[key] = false;
                });
                newState[group] = true;
                return newState;
            } else {
                // If we are closing the current one, just close it
                return { ...prev, [group]: false };
            }
        });
    };

    const logoMap = {
        'YatreeDestination': '/logos/logo.png',
        'Yatree Destination': '/logos/logo.png',
        'GoGetGo': '/logos/gogetgo.webp'
    };

    const isExecutive = user.role === 'Executive';

    return (
        <div
            className="sidebar"
            style={{
                width: '280px',
                height: '100vh',
                position: 'fixed',
                left: isOpen ? '0' : '-280px',
                top: 0,
                padding: '30px 20px',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid rgba(148, 163, 184, 0.1)',
                background: 'linear-gradient(180deg, #0d1526 0%, #0f172a 100%)',
                backdropFilter: 'blur(20px)',
                zIndex: 100,
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isOpen ? '4px 0 30px rgba(0,0,0,0.4)' : 'none'
            }}
        >
            <style>
                {`
                    @media (min-width: 1025px) {
                        .sidebar {
                            left: 0 !important;
                            box-shadow: none !important;
                        }
                    }
                    .sidebar-nav-scroll::-webkit-scrollbar { width: 4px; }
                    .sidebar-nav-scroll::-webkit-scrollbar-track { background: transparent; }
                    .sidebar-nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); borderRadius: 10px; }
                `}
            </style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'white',
                        borderRadius: '8px',
                        padding: '4px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}>
                        <img
                            src={logoMap[selectedCompany?.name] || '/vite.svg'}
                            alt="Logo"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', margin: 0 }}>{selectedCompany?.name || 'Loading CRM...'}</h2>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>{t('automotive_excellence')}</p>
                    </div>
                </div>
            </div>

            {/* Language Toggle */}
            <div style={{ marginBottom: '20px', padding: '0 10px' }}>
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '4px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <button
                        onClick={() => setLanguage('en')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            background: language === 'en' ? 'var(--primary)' : 'transparent',
                            color: language === 'en' ? '#000' : '#64748b',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage('hi')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            background: language === 'hi' ? 'var(--primary)' : 'transparent',
                            color: language === 'hi' ? '#000' : '#64748b',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        हिन्दी
                    </button>
                </div>
            </div>

            <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }} className="sidebar-nav-scroll">
                {(isAdmin || user.permissions?.dashboard !== false) && (
                    <NavItem item={{ path: '/admin', icon: LayoutDashboard, label: 'Dashboard', labelKey: 'dashboard' }} onClick={onClose} />
                )}

                {(isAdmin || user.permissions?.liveFeed) && (
                    <NavItem item={{ path: '/admin/live-feed', icon: Activity, label: 'Live Feed', labelKey: 'live_feed' }} onClick={onClose} />
                )}

                {(isAdmin || user.permissions?.logBook) && (
                    <NavItem item={{ path: '/admin/log-book', icon: ClipboardList, label: 'Log Book', labelKey: 'log_book' }} onClick={onClose} />
                )}

                {(isAdmin || user.permissions?.driversService) && (
                    <NavGroup title="Drivers Services" labelKey="drivers_services" icon={Users} isOpen={openGroups.drivers} onToggle={() => toggleGroup('drivers')}>
                        <NavItem item={{ path: '/admin/drivers-panel', label: 'Drivers', labelKey: 'drivers' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/freelancers', label: 'Freelancers', labelKey: 'freelancers' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/parking', label: 'Parking', labelKey: 'parking' }} onClick={onClose} isSubItem />
                    </NavGroup>
                )}

                {(isAdmin || user.permissions?.fleetOperations) && (
                    <NavGroup title="Fleet Operations" labelKey="fleet_operations" icon={Settings} isOpen={openGroups.vehicles} onToggle={() => toggleGroup('vehicles')}>
                        <NavItem item={{ path: '/admin/fuel', label: 'Fuel', labelKey: 'fuel' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/car-utility', label: 'Car Utility', labelKey: 'car_utility' }} onClick={onClose} isSubItem />
                    </NavGroup>
                )}
                {(isAdmin || user.permissions?.vehiclesManagement) && (
                    <NavGroup title="Vehicles Maintenance" labelKey="vehicles_maintenance" icon={Wrench} isOpen={openGroups.maintenance} onToggle={() => toggleGroup('maintenance')}>
                        <NavItem item={{ path: '/admin/maintenance', label: 'Maintenance', labelKey: 'maintenance' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/vehicle-month-details', label: 'Car Logs', labelKey: 'car_logs' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/vehicles', label: 'Vehicles MGT', labelKey: 'vehicles_mgt' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/accident-logs', label: 'Active Logs', labelKey: 'active_logs' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/warranties', label: 'Parts Warranty', labelKey: 'parts_warranty' }} onClick={onClose} isSubItem />
                    </NavGroup>
                )}
                {(isAdmin || user.permissions?.buySell) && (
                    <NavGroup title="Buy/Sell" labelKey="buy_sell" icon={Briefcase} isOpen={openGroups.buysell} onToggle={() => toggleGroup('buysell')}>
                        <NavItem item={{ path: '/admin/outside-cars', label: 'Outside Cars', labelKey: 'outside_cars' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/event-management', label: 'Event Management', labelKey: 'event_management' }} onClick={onClose} isSubItem />
                    </NavGroup>
                )}



                <div style={{ height: '10px' }} />

                {(isAdmin || user.permissions?.staffManagement) && <NavItem item={{ path: '/admin/staff', icon: Users, label: 'Staff Management', labelKey: 'staff_management' }} onClick={onClose} />}
                {(isAdmin || user.permissions?.manageAdmins) && <NavItem item={{ path: '/admin/admins', icon: ShieldAlert, label: 'Manage Admins', labelKey: 'manage_admins' }} onClick={onClose} />}
            </nav>

            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                <div style={{ marginBottom: '10px', padding: '0 10px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px' }}>{t('current_profile')}</span>
                </div>

                <Link to="/admin/profile" style={{ textDecoration: 'none', display: 'block' }}>
                    <motion.div
                        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.06)' }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '20px',
                            padding: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'background 0.3s ease'
                        }}
                    >
                        {/* Add a subtle highlight */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: theme.primary }}></div>

                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary || theme.primary})`,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#000',
                            fontWeight: '1000',
                            fontSize: '20px',
                            boxShadow: `0 8px 16px ${theme.primary}20`
                        }}>
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '16px', fontWeight: '900', color: 'white', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', letterSpacing: '-0.5px' }}>{user.name}</p>
                            <p style={{ fontSize: '12px', color: theme.primary, fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.primary }}></span>
                                {user.role}
                            </p>
                        </div>
                    </motion.div>
                </Link>

                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        width: '100%',
                        borderRadius: '12px',
                        color: '#f43f5e',
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.15)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={20} />
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>{t('logout')}</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
