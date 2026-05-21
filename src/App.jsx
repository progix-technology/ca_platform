import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminAdmins from './pages/SuperAdminAdmins';
import SuperAdminPlans from './pages/SuperAdminPlans';
import SuperAdminAllUsers from './pages/SuperAdminAllUsers';
import SuperAdminSettings from './pages/SuperAdminSettings';
import PendingAssignment from './pages/PendingAssignment';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { background: '#1e293b', color: '#f8fafc', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }, success: { iconTheme: { primary: '#10b981', secondary: '#fff' } }, error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } } }} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<Services />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/pending" element={<PendingAssignment />} />
          <Route path="/superadmin" element={<ProtectedRoute superAdminOnly><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/admins" element={<ProtectedRoute superAdminOnly><SuperAdminAdmins /></ProtectedRoute>} />
          <Route path="/superadmin/plans" element={<ProtectedRoute superAdminOnly><SuperAdminPlans /></ProtectedRoute>} />
          <Route path="/superadmin/all-users" element={<ProtectedRoute superAdminOnly><SuperAdminAllUsers /></ProtectedRoute>} />
          <Route path="/superadmin/settings" element={<ProtectedRoute superAdminOnly><SuperAdminSettings /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
