import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
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
    <>
      {/* --- MOBILE COMPACT HEADER (Only visible on small screens) --- */}
      <div className="md:hidden flex items-center justify-between bg-primary text-white px-4 py-3 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold tracking-tight">SchoolPay</h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-white/90 hover:text-white rounded-md bg-white/10 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* --- MOBILE CORNER DROPDOWN MENU --- */}
        {isOpen && (
          <div className="absolute top-full right-4 mt-2 w-64 bg-primary text-white rounded-lg shadow-xl border border-primary-light z-50 overflow-hidden flex flex-col">
            <nav className="p-2 space-y-1 max-h-[60vh] overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-primary-light p-2 space-y-1 bg-primary-dark/20">
              <NavLink
                to="/admin/settings"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Settings className="w-4 h-4" />
                Settings
              </NavLink>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- DESKTOP PERSISTENT SIDEBAR (Hidden on mobile) --- */}
      <aside className="hidden md:flex w-64 bg-primary text-white flex-col h-screen flex-shrink-0">
        <div className="p-6 border-b border-primary-light">
          <h1 className="text-xl font-bold tracking-tight">SchoolPay</h1>
          <p className="text-sm text-white/60">Payment Management</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
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
    </>
  );
};

export default Sidebar;
