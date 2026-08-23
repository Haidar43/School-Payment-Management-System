import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const AdminLayout = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Handles mobile corner dropdown & persistent desktop sidebar */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Full-width dashboard viewing area on mobile */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;