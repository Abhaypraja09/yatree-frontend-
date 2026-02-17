import React from 'react';
import { NavLink } from 'react-router-dom';
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
    CreditCard,
    MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';

const Sidebar = ({ isOpen, onClose }) => {
    const { logout, user } = useAuth();
    const { companies, selectedCompany, setSelectedCompany } = useCompany();

    const allMenuItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/drivers', icon: Users, label: 'Drivers' },
        { path: '/admin/freelancers', icon: Users, label: 'Freelancers' },
        { path: '/admin/advances', icon: CreditCard, label: 'Advances' },
        { path: '/admin/vehicles', icon: Car, label: 'Vehicles' },
        { path: '/admin/outside-cars', icon: Car, label: 'Outside Cars' },
        { path: '/admin/border-tax', icon: ShieldAlert, label: 'Border Tax' },
        { path: '/admin/fastag', icon: ClipboardList, label: 'Fastag' },
        { path: '/admin/maintenance', icon: Wrench, label: 'Maintenance' },
        { path: '/admin/fuel', icon: Fuel, label: 'Fuel' },
        { path: '/admin/parking', icon: MapPin, label: 'Parking' },
        { path: '/admin/staff', icon: Users, label: 'Staff Management' },
        { path: '/admin/reports', icon: ClipboardList, label: 'Daily Reports' },
        { path: '/admin/admins', icon: ShieldAlert, label: 'Manage Admins' },
    ];

    const menuItems = user.role === 'Executive'
        ? allMenuItems.filter(item => ['Freelancers', 'Outside Cars', 'Maintenance', 'Fuel', 'Parking', 'Daily Reports', 'Staff Management'].includes(item.label))
        : allMenuItems;

    const logoMap = {
        'YatreeDestination': '/logos/logo.png',
        'Yatree Destination': '/logos/logo.png',
        'GoGetGo': '/logos/gogetgo.webp'
    };

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
                borderRight: '1px solid var(--border)',
                background: 'var(--bg-dark)',
                backdropFilter: 'blur(20px)',
                zIndex: 100,
                transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isOpen ? '20px 0 50px rgba(0,0,0,0.5)' : 'none'
            }}
        >
            {/* Desktop Sidebar always visible on large screens */}
            <style>
                {`
                    @media (min-width: 1025px) {
                        .sidebar {
                            left: 0 !important;
                            box-shadow: none !important;
                        }
                    }
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
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', margin: 0 }}>Yatree Destination</h2>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Automotive Excellence</p>
                    </div>
                </div>
                {/* Close Button for Mobile */}
                <button
                    onClick={onClose}
                    className="mobile-only"
                    style={{ background: 'none', color: 'var(--text-muted)' }}
                >
                    <ChevronRight style={{ transform: 'rotate(180deg)' }} />
                </button>
            </div>

            {/* Active Company section removed */}

            <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }} className="sidebar-nav-scroll">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin'}
                        onClick={() => { if (window.innerWidth < 1025) onClose(); }}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '12px',
                            marginBottom: '6px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            background: isActive ? 'rgba(14, 165, 233, 0.12)' : 'transparent',
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            border: isActive ? '1px solid rgba(14, 165, 233, 0.25)' : '1px solid transparent'
                        })}
                    >
                        <item.icon size={20} />
                        <span style={{ fontWeight: '600', fontSize: '15px' }}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
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
                        background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '18px',
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                    }}>
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                        <p style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{user.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>{user.role}</p>
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
