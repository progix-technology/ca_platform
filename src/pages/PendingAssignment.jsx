import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import Button from '../components/Button';

export default function PendingAssignment() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin' || user.adminAssigned) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="pending-page min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">Work assignment pending</h1>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Your account is configured as an admin, but work has not been assigned to you yet.
            Until a superadmin assigns work, you will not be able to access the admin panel.
          </p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Please contact your superadmin for assignment. Once work is assigned, you can return and access the admin dashboard.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => navigate('/')}>Go to home</Button>
            <Button variant="primary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
