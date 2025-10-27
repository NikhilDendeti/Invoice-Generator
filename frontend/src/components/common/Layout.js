import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMenu, FiX, FiHome, FiFileText, FiSettings, FiUser, FiLogOut, FiDownload } from 'react-icons/fi';
import MobileNav from './MobileNav';
import ThemeToggle from './ThemeToggle';
import './Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Invoices', href: '/invoices', icon: FiFileText },
    { name: 'PDF Library', href: '/pdf-library', icon: FiDownload },
    { name: 'Settings', href: '/settings', icon: FiSettings },
    { name: 'Profile', href: '/profile', icon: FiUser },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="layout-container">
      {/* Enhanced Background Elements */}
      <div className="layout-background">
        <div className="layout-orb layout-orb-1"></div>
        <div className="layout-orb layout-orb-2"></div>
        <div className="layout-orb layout-orb-3"></div>
      </div>

      {/* Mobile sidebar */}
      <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        <div className="mobile-sidebar-content">
          <div className="mobile-sidebar-close">
            <button
              type="button"
              className="mobile-sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="logo-section">
              <div className="logo-icon">
                <span className="text-white font-bold text-lg">IG</span>
              </div>
              <div className="logo-text">
                <h1 className="logo-title">Invoice Generator</h1>
                <p className="logo-subtitle">Professional Invoicing</p>
              </div>
            </div>
            <nav className="navigation">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Icon className="nav-icon" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="user-section">
            <div className="user-avatar">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
            <div className="user-actions">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="user-action-btn"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="desktop-sidebar">
        <div className="desktop-sidebar-content">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <div className="logo-section">
              <div className="logo-icon">
                <span className="text-white font-bold text-lg">IG</span>
              </div>
              <div className="logo-text">
                <h1 className="logo-title">Invoice Generator</h1>
                <p className="logo-subtitle">Professional Invoicing</p>
              </div>
            </div>
            <nav className="navigation">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Icon className="nav-icon" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="user-section">
            <div className="user-avatar">
              <span className="text-sm font-medium text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
            <div className="user-actions">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="user-action-btn"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="content-area">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
};

export default Layout;
