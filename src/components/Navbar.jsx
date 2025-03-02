import React from "react";
import { Bell, Settings, BringToFront, LogOut  } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from "../supabase/supabaseClient";
const Navbar = ({ userName, dashboardName, onLogout }) => {
  
  return (
    <>
    <nav className="flex justify-between items-center bg-gray-800 text-white p-4 sticky top-0">
      {/* Left side: Dashboard component name */}
      <div className="text-xl font-bold flex items-center gap-2 md:ml-0 ml-13 cursor-pointer">
        <BringToFront /> Ortobre
      </div>
      {/* Right side: User name and logout button */}
      <div className="flex items-center space-x-4">
        {/* <button className="p-2 rounded-full hover:bg-accent transition-colors duration-200">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-full hover:bg-accent transition-colors duration-200">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button> */}
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center cursor-pointer">
          <span className="text-md font-bold text-gray-900">{userName.charAt(0).toUpperCase()}</span>
        </div>
        <button
            onClick={onLogout}
            className="hidden md:flex items-center px-3 py-2 rounded-md text-sm cursor-pointer font-medium text-destructive hover:bg-destructive/10 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
      </div>
    </nav>
    <Toaster position="top-right" />
    </>
  );
};

export default Navbar;
