import React from 'react';
import { NavLink } from 'react-router-dom';

const VendorSidebar = () => {
  const linkClass = ({ isActive }) => `block px-4 py-2 rounded-lg mb-2 ${isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

  return (
    <aside className="w-64 p-4 bg-white rounded-lg shadow">
      <nav>
        <NavLink to="/dashboard/vendor" end className={linkClass}>Overview</NavLink>
        <NavLink to="/dashboard/vendor/products" className={linkClass}>Products</NavLink>
        <NavLink to="/dashboard/vendor/orders" className={linkClass}>Orders</NavLink>
      </nav>
    </aside>
  );
};

export default VendorSidebar;
