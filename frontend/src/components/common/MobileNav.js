import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiSettings, FiUser } from 'react-icons/fi';

const MobileNav = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Invoices', href: '/invoices', icon: FiFileText },
    { name: 'Settings', href: '/settings', icon: FiSettings },
    { name: 'Profile', href: '/profile', icon: FiUser },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-40">
      <div className="flex justify-around">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center py-3 px-4 transition-all duration-200 ${
                isActive(item.href)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
