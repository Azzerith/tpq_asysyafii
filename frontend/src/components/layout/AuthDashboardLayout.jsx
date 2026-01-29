import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AuthDashboardLayout = ({ children, title }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthDashboardLayout;