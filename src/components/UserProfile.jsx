import React, { useState, useEffect } from "react";
import { supabase } from "../supabase/supabaseClient";
import { motion } from "framer-motion";

const UserProfile = ({ session }) => {
  const [profile, setProfile] = useState(null);

  // Fetch profile from profiles table
  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (error) {
        console.error("Error fetching profile:", error.message);
      } else {
        setProfile(data);
      }
    };
    fetchProfile();
  }, [session.user.id]);

 

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
