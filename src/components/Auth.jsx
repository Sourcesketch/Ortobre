import { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { motion } from 'framer-motion';
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPhoneLogin, setIsPhoneLogin] = useState(false);
  const [otp, setOtp] = useState('123456');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false); // Track if OTP is verified

  const checkEmailExists = async (email) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error checking email:', error);
      return false;
    }
    return !!data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      if (isSignup) {
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          setMessage('Email already exists. Please use a different email.');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, name, surname, phone }
          }
        });

        if (error) {
          setMessage(error.message);
        } else {
          if (data.user) {
            const { error: profileError } = await supabase.from('profiles').insert([
              {
                id: data.user.id,
                username,
                email,
                role: 'user',
                name,
                surname,
                phone,
              }
            ]);

            if (profileError) {
              setMessage(profileError.message);
            } else {
              setMessage('Signup successful!');
              navigate('/dashboard');
            }
          } else {
            setMessage('Signup initiated!');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
        } else {
          navigate('/dashboard');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/dashboard`, queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'email profile', // Explicitly request email and profile scopes
        }, }
      });

      if (error) {
        setMessage(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+${phone}`,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('OTP sent to your phone!');
        setOtpSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+${phone}`,
        token: otp,
        type: 'sms',
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('OTP verified! Please complete your profile.');
        setOtpVerified(true); // Set OTP verification to true
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const { data: user, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;

      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.user.id,
          email,
          username,
          name,
          surname,
          phone,
          role: 'user',
        },
      ]);

      if (profileError) throw profileError;

      setMessage('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      setMessage(`Error updating profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { id, email, user_metadata, phone } = session.user;

        // Log the user's Google profile data
        console.log('Google Profile Data:', session.user);

        // Extract user data from Google
        const { given_name: name, family_name: surname } = user_metadata || {};

        // Log extracted data
        console.log('Extracted Data:', { name, surname });

        // Check if the user already exists in the profiles table
        const { data: existingUser, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', id)
          .single();

        if (fetchError || !existingUser) {
          // If the user doesn't exist, insert their data into the profiles table
          const { error: insertError } = await supabase.from('profiles').insert([
            {
              id,
              email,
              username: email.split('@')[0], // Default username
              name: name || '', // Use Google's given_name
              surname: surname || '', // Use Google's family_name
              phone: phone || '', // Use Google's phone number (if available)
              role: 'user',
            },
          ]);

          if (insertError) {
            console.error('Error saving social login user:', insertError);
            setMessage('Error saving profile data.');
          } else {
            setMessage('Profile updated with Google data!');
          }
        } else {
          setMessage('Welcome back!');
        }

        navigate('/dashboard'); // Redirect to dashboard after successful sign-in
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen p-6 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-panel w-full max-w-md p-8 space-y-6 rounded-lg shadow-lg"
      >
        <div className="text-center space-y-2">
          <h2 className="heading text-3xl text-dark">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-500">
            {isSignup
              ? 'Sign up to get started with our platform'
              : 'Sign in to continue your journey'}
          </p>
        </div>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel bg-accent/10 text-accent p-4 text-sm text-center rounded"
          >
            {message}
          </motion.div>
        )}
        {!isPhoneLogin ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm text-gray-500">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm text-gray-500">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="surname" className="block text-sm text-gray-500">
                    Surname
                  </label>
                  <input
                    type="text"
                    id="surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm text-gray-500">
                    Phone (optional)
                  </label>
                  <input
                    type="text"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm text-gray-500">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm text-gray-500">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="glass-button w-full flex items-center justify-center gap-2 text-dark py-2 rounded hover:bg-opacity-80 transition"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignup ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
        ) : (
          <>
            {!otpVerified ? (
              <>
                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm text-gray-500">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                    <button
                      onClick={handlePhoneLogin}
                      disabled={isLoading}
                      className="glass-button w-full flex items-center justify-center gap-2 text-dark py-2 rounded hover:bg-opacity-80 transition"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Send OTP
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="otp" className="block text-sm text-gray-500">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                        placeholder="Enter the OTP sent to your phone"
                        required
                      />
                    </div>
                    <button
                      onClick={verifyOtp}
                      disabled={isLoading}
                      className="glass-button w-full flex items-center justify-center gap-2 text-dark py-2 rounded hover:bg-opacity-80 transition"
                    >
                      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Verify OTP
                    </button>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm text-gray-500">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm text-gray-500">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="surname" className="block text-sm text-gray-500">
                    Surname
                  </label>
                  <input
                    type="text"
                    id="surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm text-gray-500">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-panel px-4 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="glass-button w-full flex items-center justify-center gap-2 text-dark py-2 rounded hover:bg-opacity-80 transition"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Complete Profile
                </button>
              </form>
            )}
          </>
        )}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-glass-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-dark">Or continue with</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="glass-panel bg-google-btn text-white flex-1 py-2.5 hover:text-dark transition rounded"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading}
            className="glass-panel bg-fb-btn flex-1 py-2.5 text-white hover:text-dark transition rounded"
          >
            Facebook
          </button>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignup(!isSignup)}
            className="text-accent hover:text-accent/80 text-sm"
          >
            {isSignup
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsPhoneLogin(!isPhoneLogin);
              setOtpSent(false); // Reset OTP sent state
              setOtpVerified(false); // Reset OTP verified state
            }}
            className="text-accent hover:text-accent/80 text-sm underline"
          >
            {isPhoneLogin ? 'Use Email/Password' : 'Continue with Phone'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;