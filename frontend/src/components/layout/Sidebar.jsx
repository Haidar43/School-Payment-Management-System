import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  UserCircle,
  BookOpen,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/payment-status', icon: CreditCard, label: 'Payment Status' },
    { path: '/admin/students', icon: Users, label: 'Students' },
    { path: '/admin/parents', icon: UserCircle, label: 'Parents' },
    { path: '/admin/classes', icon: BookOpen, label: 'Classes' },
    { path: '/admin/sessions', icon: Calendar, label: 'Sessions' },
    { path: '/admin/payments', icon: FileText, label: 'Payments' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { path: '/admin/fees', icon: CreditCard, label: 'Fee Structures' },
    { path: '/admin/enrollments', icon: BookOpen, label: 'Enrollments' },
  ];

  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-screen">
      <div className="p-6 border-b border-primary-light">
        <h1 className="text-xl font-bold tracking-tight">SchoolPay</h1>
        <p className="text-sm text-white/60">Payment Management</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-primary-light p-4 space-y-1">
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-sm text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;