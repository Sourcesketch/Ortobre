// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';
import UserDashboard from '../components/UserDashboard';
import Navbar from '../components/Navbar';


const Dashboard = ({ session }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the user's profile from the profiles table
  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) {
        console.error('Error fetching profile:', error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [session.user.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div className="p-4">Loading...</div>;

  // Get role from the fetched profile (default to 'user' if not found)
  const role = profile?.role || 'user';
  // Prefer username from profile; fallback to email from session
  const userName = profile?.username || session.user.email;
  const dashboardName = role === 'admin' ? 'Admin Dashboard' : 'User Dashboard';

  return (
    <div>
      {/* Navbar with dashboard name on the left and user name with logout button on the right */}
      <Navbar
        userName={userName}
        dashboardName={dashboardName}
        onLogout={handleLogout}
      />

      {/* Render the appropriate dashboard view based on the user's role */}
      {role === 'admin' ? <AdminDashboard session = {session} onLogout={handleLogout}/> : <UserDashboard session = {session} onLogout={handleLogout}/>}
    </div>
  );
};

export default Dashboard;
