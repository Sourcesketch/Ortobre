import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import { motion } from "framer-motion";

import toast from "react-hot-toast";

const UserProfile = ({ session }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  const fetchProfile = async () => {
    setLoading(true);
    try {
      // Fetch authentication data from auth.users
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      // Fetch additional profile data from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) throw profileError;

      // Combine data from auth.users and profiles
      setProfile({
        ...authData.user,
        ...profileData,
      });
    } catch (error) {
      toast.error(`Error fetching profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session]);

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (!profile) {
    return <p>No profile data found.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Profile
        </h3>
        {profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-semibold text-gray-700">
                Username
              </span>
              <span className="text-gray-600">{profile.username}</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-700">
                Name
              </span>
              <span className="text-gray-600">{profile.name || "-"}</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-700">
                Surname
              </span>
              <span className="text-gray-600">{profile.surname || "-"}</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-700">
                Email
              </span>
              <span className="text-gray-600">{profile.email}</span>
            </div>
            <div>
              <span className="block text-sm font-semibold text-gray-700">
                Phone
              </span>
              <span className="text-gray-600">{profile.phone || "-"}</span>
            </div>
          </div>
        ) : (
          <p>No Profile Exist</p>
        )}

        
      </div>
    </motion.div>
  );
};
export default UserProfile;
