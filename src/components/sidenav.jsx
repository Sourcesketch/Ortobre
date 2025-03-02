import React, { useState } from "react";
import { Menu, X, Home, User, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";

const Sidebar = ({ userName }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Desktop Sidebar (Visible on ≥ 768px) */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-gray-800 text-white p-5 fixed">
        <h1 className="text-2xl font-bold mb-5">Ortobre</h1>
        <nav className="space-y-4">
          <a href="/" className="flex items-center p-3 hover:bg-gray-700 rounded cursor-pointer">
            <Home className="w-5 h-5 mr-3" /> Dashboard
          </a>
          <a href="/profile" className="flex items-center p-3 hover:bg-gray-700 rounded cursor-pointer">
            <User className="w-5 h-5 mr-3" /> Profile
          </a>
          <a href="/settings" className="flex items-center p-3 hover:bg-gray-700 rounded cursor-pointer">
            <Settings className="w-5 h-5 mr-3" /> Settings
          </a>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center p-3 text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </aside>

      {/* Mobile Menu Button (Visible on < 768px) */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 bg-gray-800 text-white p-3 rounded-full shadow-lg z-50"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar & Overlay (Visible when open) */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Sidebar */}
          <aside className="fixed top-0 left-0 w-64 h-screen bg-gray-800 text-white p-5 z-50 transition-transform transform translate-x-0">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold mb-5">Ortobre</h1>
            <nav className="space-y-4">
              <a href="/" className="flex items-center p-3 hover:bg-gray-700 rounded cursor-pointer">
                <Home className="w-5 h-5 mr-3" /> Dashboard
              </a>
              <a href="/profile" className="flex items-center p-3 hover:bg-gray-700 rounded cursor-pointer">
                <User className="w-5 h-5 mr-3" /> Profile
              </a>
              <a href="/settings" className="flex items-center p-3 hover:bg-gray-700 rounded cursor-pointer">
                <Settings className="w-5 h-5 mr-3" /> Settings
              </a>
            </nav>
            <button
              onClick={handleLogout}
              className="mt-auto flex items-center p-3 text-red-400 hover:bg-red-500/10 rounded cursor-pointer"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </aside>
        </>
      )}
    </>
  );
};

export default Sidebar;
