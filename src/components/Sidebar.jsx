import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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

const NavItem = ({ item, onClick, isSubItem = false }) => (
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
            background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: isActive ? '#a5b4fc' : '#64748b',
            border: isActive ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
            textDecoration: 'none',
        })}
    >
        {item.icon && <item.icon size={isSubItem ? 18 : 20} />}
        <span style={{ fontWeight: '600', fontSize: isSubItem ? '14px' : '15px' }}>{item.label}</span>
    </NavLink>
);

const NavGroup = ({ title, icon: Icon, children, isOpen, onToggle }) => (
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
                <span style={{ fontWeight: '700', fontSize: '15px' }}>{title}</span>
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

const Sidebar = ({ isOpen, onClose }) => {
    const { logout, user } = useAuth();
    const { selectedCompany } = useCompany();
    const location = useLocation();

    // Group state
    const [openGroups, setOpenGroups] = useState({
        drivers: location.pathname.includes('/admin/drivers') || location.pathname.includes('/admin/freelancers') || location.pathname.includes('/admin/driver-salaries') || location.pathname.includes('/admin/driver-duty') || location.pathname.includes('/admin/freelancer-duty'),
        buysell: location.pathname.includes('/admin/outside-cars') || location.pathname.includes('/admin/event-management'),
        maintenance: location.pathname.includes('/admin/maintenance') || location.pathname.includes('/admin/vehicle-month-details') || location.pathname.includes('/admin/vehicles') || location.pathname.includes('/admin/accident-logs') || location.pathname.includes('/admin/warranties'),
        vehicles: location.pathname.includes('/admin/fuel') || location.pathname.includes('/admin/border-tax') || location.pathname.includes('/admin/fastag') || location.pathname.includes('/admin/parking') || location.pathname.includes('/admin/driver-services') || location.pathname.includes('/admin/border-tax') || location.pathname.includes('/admin/fastag') || location.pathname.includes('/admin/accident-logs') || location.pathname.includes('/admin/warranties'),
        logbook: location.pathname.includes('/admin/log-book')
    });

    const toggleGroup = (group) => {
        setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
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
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', margin: 0 }}>{selectedCompany?.name || 'Yatree Destination'}</h2>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Automotive Excellence</p>
                    </div>
                </div>
            </div>

            <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }} className="sidebar-nav-scroll">
                <NavItem item={{ path: '/admin', icon: LayoutDashboard, label: 'Dashboard' }} onClick={onClose} />
                {(user.role === 'Admin' || user.permissions?.driversService) && (
                    <NavItem item={{ path: '/admin/live-feed', icon: Activity, label: 'Live Feed' }} onClick={onClose} />
                )}

                {(user.role === 'Admin' || user.permissions?.driversService) && (
                    <NavItem item={{ path: '/admin/log-book', icon: ClipboardList, label: 'Log Book' }} onClick={onClose} />
                )}

                {(user.role === 'Admin' || user.permissions?.driversService) && (
                    <NavGroup title="Drivers Services" icon={Users} isOpen={openGroups.drivers} onToggle={() => toggleGroup('drivers')}>
                        <NavItem item={{ path: '/admin/drivers-panel', label: 'Drivers' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/freelancers', label: 'Freelancers' }} onClick={onClose} isSubItem />
                    </NavGroup>
                )}

                {(user.role === 'Admin' || user.permissions?.buySell) && (
                    <NavGroup title="Buy/Sell" icon={Briefcase} isOpen={openGroups.buysell} onToggle={() => toggleGroup('buysell')}>
                        <NavItem item={{ path: '/admin/outside-cars', label: 'Outside Cars' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/event-management', label: 'Event Management' }} onClick={onClose} isSubItem />
                    </NavGroup>
                )}

                {(user.role === 'Admin' || user.permissions?.vehiclesManagement) && (
                    <NavGroup title="Vehicles Maintenance" icon={Wrench} isOpen={openGroups.maintenance} onToggle={() => toggleGroup('maintenance')}>
                        <NavItem item={{ path: '/admin/maintenance', label: 'Maintenance' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/vehicle-month-details', label: 'Car Logs' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/vehicles', label: 'Vehicles MGT' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/accident-logs', label: 'Active Logs' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/warranties', label: 'Parts Warranty' }} onClick={onClose} isSubItem />
                    </NavGroup>
                )}

                {(user.role === 'Admin' || user.permissions?.fleetOperations) && (
                    <NavGroup title="Fleet Operations" icon={Settings} isOpen={openGroups.vehicles} onToggle={() => toggleGroup('vehicles')}>
                        <NavItem item={{ path: '/admin/fuel', label: 'Fuel' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/border-tax', label: 'Border Tax' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/fastag', label: 'Fastag' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/parking', label: 'Parking' }} onClick={onClose} isSubItem />
                        <NavItem item={{ path: '/admin/driver-services', label: 'Driver Services' }} onClick={onClose} isSubItem />
                    </NavGroup>
                )}

                <div style={{ height: '10px' }} />

                {(user.role === 'Admin' || user.permissions?.driversService) && <NavItem item={{ path: '/admin/staff', icon: Users, label: 'Staff Management' }} onClick={onClose} />}
                {user.role === 'Admin' && <NavItem item={{ path: '/admin/admins', icon: ShieldAlert, label: 'Manage Admins' }} onClick={onClose} />}
            </nav>

            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '16px'
                }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '18px',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
                    }}>
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '15px', fontWeight: '700', color: 'white', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.name}</p>
                        <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', margin: 0 }}>{user.role}</p>
                    </div>
                </div>

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
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;