// components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoCircle from "../../assets/logo-circle.png";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Set submenu terbuka berdasarkan path yang aktif
    const newOpenSubmenus = {};
    menuItems.forEach(item => {
      if (item.submenu && item.submenu.length > 0) {
        // Cek apakah salah satu submenu aktif
        const isSubmenuActive = item.submenu.some(subItem => 
          isActive(subItem.path)
        );
        if (isSubmenuActive) {
          newOpenSubmenus[item.path] = true;
        }
      }
    });
    setOpenSubmenus(newOpenSubmenus);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/super-admin' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const toggleSubmenu = (path) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // SVG Icons (tetap sama seperti sebelumnya)
  const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );

  const ContentIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12m0-12a2 2 0 012-2h2a2 2 0 012 2m-6 9v2m0-4v2" />
    </svg>
  );

  const DataIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const SystemIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const StudentIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const PaymentIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const DonationIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );

  const FinanceIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const ReportIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const SwitchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const FacilityIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  const ChevronDownIcon = ({ isOpen }) => (
    <svg 
      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const CollapseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
  );

  // Menu untuk Super Admin
  const superAdminMenu = [
    {
      title: 'Dashboard',
      path: '/super-admin',
      icon: <DashboardIcon />,
      submenu: []
    },
    {
      title: 'Manajemen User',
      path: '/super-admin/users',
      icon: <UsersIcon />,
      submenu: []
    },
    {
      title: 'Konten & Informasi',
      path: '/super-admin/konten',
      icon: <ContentIcon />,
      submenu: [
        { title: 'Data Program Unggulan', path: '/super-admin/program-unggulan' },
        { title: 'Data Berita', path: '/super-admin/berita' },
        { title: 'Data Fasilitas', path: '/super-admin/fasilitas' },
        { title: 'Data Testimoni', path: '/super-admin/testimoni' }, 
        { title: 'Informasi TPQ', path: '/super-admin/informasi-tpq' }
      ]
    },
    {
      title: 'Data Master',
      path: '/super-admin/data',
      icon: <DataIcon />,
      submenu: [
        { title: 'Data Keluarga Wali', path: '/super-admin/keluarga-wali' },
        { title: 'Data Santri', path: '/super-admin/santri' },
        { title: 'Data Syahriah', path: '/admin/syahriah' },
        { title: 'Data Donasi', path: '/admin/donasi' },
        { title: 'Rekap Keuangan', path: '/admin/keuangan' }
      ]
    },
    // {
    //   title: 'System',
    //   path: '/super-admin/system',
    //   icon: <SystemIcon />,
    //   submenu: []
    // }
  ];

  // Menu untuk Admin
  const adminMenu = [
    {
      title: 'Dashboard',
      path: '/admin',
      icon: <DashboardIcon />,
      submenu: []
    },
    {
      title: 'Data Syahriah',
      path: '/admin/syahriah',
      icon: <PaymentIcon />,
      submenu: []
    },
    {
      title: 'Data Donasi',
      path: '/admin/donasi',
      icon: <DonationIcon />,
      submenu: []
    },
    {
      title: 'Keuangan',
      path: '/admin/keuangan',
      icon: <FinanceIcon />,
      submenu: []
    }
  ];

  const menuItems = isSuperAdmin ? superAdminMenu : adminMenu;

  const MenuItem = ({ item, level = 0 }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = openSubmenus[item.path];
    const isItemActive = isActive(item.path) || (hasSubmenu && item.submenu.some(subItem => isActive(subItem.path)));

    // Handler untuk menu item tanpa submenu
    const handleMenuItemClick = () => {
      if (!hasSubmenu && item.path) {
        navigate(item.path);
      } else if (hasSubmenu) {
        toggleSubmenu(item.path);
      }
    };

    // Handler untuk submenu item
    const handleSubmenuItemClick = (subItemPath) => {
      navigate(subItemPath);
    };

    return (
      <div>
        <div
          onClick={handleMenuItemClick}
          className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group cursor-pointer ${
            isItemActive
              ? 'bg-green-100 text-green-700 border-r-2 border-green-600'
              : 'text-gray-600 hover:bg-green-50 hover:text-green-900'
          } ${level > 0 ? 'pl-8' : ''}`}
        >
          <span className={`flex-shrink-0 ${isItemActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'}`}>
            {item.icon}
          </span>
          {!isCollapsed && (
            <>
              <span className="flex-1">{item.title}</span>
              {hasSubmenu && <ChevronDownIcon isOpen={isSubmenuOpen} />}
            </>
          )}
        </div>
        
        {hasSubmenu && isSubmenuOpen && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.submenu.map((subItem, index) => (
              <div
                key={index}
                onClick={() => handleSubmenuItemClick(subItem.path)}
                className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group pl-12 cursor-pointer ${
                  isActive(subItem.path)
                    ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-900'
                }`}
              >
                <span className={`flex-shrink-0 ${isActive(subItem.path) ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'}`}>
                  •
                </span>
                <span>{subItem.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Menu Item Collapsed - untuk sidebar yang diperkecil
  const MenuItemCollapsed = ({ item }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isItemActive = isActive(item.path) || (hasSubmenu && item.submenu.some(subItem => isActive(subItem.path)));

    const handleCollapsedClick = () => {
      if (!hasSubmenu && item.path) {
        navigate(item.path);
      }
      // Untuk menu dengan submenu di mode collapsed, kita tidak menampilkan submenu
      // User harus expand sidebar dulu untuk melihat submenu
    };

    return (
      <div className="relative group">
        <div
          onClick={handleCollapsedClick}
          className={`flex items-center justify-center p-3 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer ${
            isItemActive
              ? 'bg-green-100 text-green-700'
              : 'text-gray-600 hover:bg-green-50 hover:text-green-900'
          }`}
          title={item.title}
        >
          <span className={`${isItemActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'}`}>
            {item.icon}
          </span>
        </div>

        {/* Tooltip untuk menu collapsed */}
        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
          {item.title}
          {hasSubmenu && item.submenu.length > 0 && (
            <div className="mt-1">
              {item.submenu.map((subItem, index) => (
                <div 
                  key={index}
                  className={`px-2 py-1 rounded ${
                    isActive(subItem.path) ? 'bg-green-600' : 'hover:bg-gray-700'
                  }`}
                >
                  {subItem.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white border-r border-green-200 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-green-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <img 
                src={logoCircle} 
                alt="TPQ Asy-Syafi'i Logo" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            <div>
              <h1 className="font-bold text-green-800">System TPQ</h1>
              <p className="text-xs text-green-600 capitalize">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
              </p>
            </div>
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto">
            <img 
              src={logoCircle} 
              alt="TPQ Asy-Syafi'i Logo" 
              className="w-full h-full object-cover rounded-full" 
            />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-lg hover:bg-green-100 transition-colors duration-200 text-green-600"
        >
          <CollapseIcon />
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
              <UserIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900 truncate">
                {user?.nama_lengkap || 'User'}
              </p>
              <p className="text-xs text-green-600 truncate capitalize">
                {user?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
          </div>
        </div>
      )}

      {isCollapsed && (
        <div className="p-4 border-b border-green-200 flex justify-center">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            <UserIcon />
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-2'}`}>
          {menuItems.map((item, index) => (
            isCollapsed ? (
              <MenuItemCollapsed key={index} item={item} />
            ) : (
              <MenuItem key={index} item={item} />
            )
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-green-200">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Keluar' : ''}
        >
          <span className="text-red-500">
            <LogoutIcon />
          </span>
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;