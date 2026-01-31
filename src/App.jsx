import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DriverPortal from './pages/DriverPortal';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Reports from './pages/Reports';
import Freelancers from './pages/Freelancers';
import OutsideCars from './pages/OutsideCars';
import Fastag from './pages/Fastag';
import BorderTax from './pages/BorderTax';
import Sidebar from './components/Sidebar';
import { CompanyProvider } from './context/CompanyContext';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'Admin' ? '/admin' : '/driver'} />;
  }

  return children;
};

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="with-sidebar" style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Mobile Header */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(15px)',
        borderBottom: '1px solid var(--border)',
        zIndex: 90,
        padding: '0 15px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }} className="mobile-only-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '6px' }}></div>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>FleetCRM</h2>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '6px', borderRadius: '8px' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="mobile-only"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 95
          }}
        />
      )}

      <main
        className="main-content"
        style={{
          transition: 'margin 0.3s ease'
        }}
      >
        <div style={{ padding: '0' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

const Placeholder = ({ title }) => (
  <div style={{ padding: '40px', color: 'white' }}>
    <h1 className="animate-fade">{title}</h1>
    <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>This section is under construction.</p>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/admin/*" element={
            <ProtectedRoute role="Admin">
              <CompanyProvider>
                <AdminLayout>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="drivers" element={<Drivers />} />
                    <Route path="freelancers" element={<Freelancers />} />
                    <Route path="vehicles" element={<Vehicles />} />
                    <Route path="outside-cars" element={<OutsideCars />} />
                    <Route path="fastag" element={<Fastag />} />
                    <Route path="border-tax" element={<BorderTax />} />
                    <Route path="reports" element={<Reports />} />
                  </Routes>
                </AdminLayout>
              </CompanyProvider>
            </ProtectedRoute>
          } />

          <Route path="/driver/*" element={
            <ProtectedRoute role="Driver">
              <DriverPortal />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
