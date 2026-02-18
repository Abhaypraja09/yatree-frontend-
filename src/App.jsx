import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const DriverPortal = lazy(() => import('./pages/DriverPortal'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const Reports = lazy(() => import('./pages/Reports'));
const Freelancers = lazy(() => import('./pages/Freelancers'));
const OutsideCars = lazy(() => import('./pages/OutsideCars'));
const Fastag = lazy(() => import('./pages/Fastag'));
const BorderTax = lazy(() => import('./pages/BorderTax'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Fuel = lazy(() => import('./pages/Fuel'));
const Parking = lazy(() => import('./pages/Parking'));
const Advances = lazy(() => import('./pages/Advances'));
const Admins = lazy(() => import('./pages/Admins'));
const Staff = lazy(() => import('./pages/Staff'));
const StaffPortal = lazy(() => import('./pages/StaffPortal'));
const AccidentLogs = lazy(() => import('./pages/AccidentLogs'));
import Sidebar from './components/Sidebar';
import { CompanyProvider } from './context/CompanyContext';

const LoadingFallback = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at top right, #1e293b, #0f172a)',
    color: 'white'
  }}>
    <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#0ea5e9', borderRadius: '50%' }}></div>
    <p style={{ marginTop: '16px', fontWeight: '600', opacity: 0.6 }}>Loading...</p>
    <style>{`
            .spinner { animation: spin 0.8s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  const isAdminOrExecutive = user.role === 'Admin' || user.role === 'Executive';

  if (role === 'Admin') {
    if (!isAdminOrExecutive) return <Navigate to="/driver" />;
  } else if (role === 'Driver') {
    if (user.role !== 'Driver') return <Navigate to="/admin" />;
  } else if (role === 'Staff') {
    if (user.role !== 'Staff') return <Navigate to="/admin" />;
  }

  return children;
};

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="with-sidebar" style={{ display: 'flex', minHeight: '100vh', position: 'relative', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Mobile Top Bar */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 90,
        padding: '0 20px',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100vw'
      }} className="show-mobile-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logos/logo.png" alt="Logo" style={{ width: '30px', height: 'auto' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px', margin: 0 }}>Yatree Destination</h2>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="show-mobile"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 95
          }}
        />
      )}

      <main
        className="main-content"
        style={{
          flex: '1',
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
          transition: 'padding 0.3s ease',
          padding: '0'
        }}
      >
        <div className="responsive-main-padding" style={{ width: '100%', maxWidth: '100%' }}>
          {children}
        </div>
      </main>

      <style>
        {`
          @media (max-width: 1024px) {
            .responsive-main-padding {
              padding-top: 84px !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            .show-mobile-flex { display: flex !important; }
            .main-content { margin-left: 0 !important; width: 100% !important; }
          }
        `}
      </style>
    </div>
  );
};

const AdminRoutes = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="outside-cars" element={<OutsideCars />} />
      <Route path="maintenance" element={<Maintenance />} />
      <Route path="parking" element={<Parking />} />
      <Route path="freelancers" element={<Freelancers />} />
      <Route path="reports" element={<Reports />} />
      <Route path="accident-logs" element={<AccidentLogs />} />

      <Route path="fuel" element={<Fuel />} />

      {isAdmin && (
        <>
          <Route path="drivers" element={<Drivers />} />
          <Route path="advances" element={<Advances />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="fastag" element={<Fastag />} />
          <Route path="border-tax" element={<BorderTax />} />
          <Route path="admins" element={<Admins />} />
        </>
      )}

      <Route path="staff" element={<Staff />} />

      {/* Redirect unauthorized access */}
      {!isAdmin && (
        <>
          <Route path="drivers" element={<Navigate to="/admin" />} />
          <Route path="advances" element={<Navigate to="/admin" />} />
          <Route path="vehicles" element={<Navigate to="/admin" />} />
          <Route path="fastag" element={<Navigate to="/admin" />} />
          <Route path="border-tax" element={<Navigate to="/admin" />} />
        </>
      )}
    </Routes>
  );
};

const Placeholder = ({ title }) => (
  <div style={{ padding: '40px', color: 'white' }}>
    <h1 className="animate-fade">{title}</h1>
    <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>This section is under construction.</p>
  </div>
);

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/admin/*" element={
                <ProtectedRoute role="Admin">
                  <CompanyProvider>
                    <AdminLayout>
                      <AdminRoutes />
                    </AdminLayout>
                  </CompanyProvider>
                </ProtectedRoute>
              } />

              <Route path="/driver/*" element={
                <ProtectedRoute role="Driver">
                  <DriverPortal />
                </ProtectedRoute>
              } />

              <Route path="/staff/*" element={
                <ProtectedRoute role="Staff">
                  <StaffPortal />
                </ProtectedRoute>
              } />

              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
