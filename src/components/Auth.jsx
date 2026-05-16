import React, { useState } from 'react';
import { supabase } from '../db/supabase';
import { User, Lock, LogIn, UserPlus, Utensils } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // THE TRICK: Silently format the username into a dummy email
    const fakeEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@foodapp.local`;

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password: password,
        });
        if (error) throw error;
        onLogin(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: fakeEmail,
          password: password,
        });
        if (error) throw error;
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message.includes('Credentials') ? 'Invalid username or password' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Aurora Greens gradient: Fresh, organic, and perfect for a health app
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-emerald-500 to-cyan-500 flex flex-col justify-center px-4 sm:px-6 animate-in fade-in duration-500">
      
      {/* Glassmorphism Card */}
      <div className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden">
        
        {/* Subtle decorative glow effect behind the form */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>

        {/* Header / Logo Area */}
        <div className="relative text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg transform rotate-3">
            <Utensils className="w-8 h-8 text-white -rotate-3" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
            {isLogin ? 'Welcome Back' : 'Join Us'}
          </h1>
          <p className="text-white/80 text-sm font-medium">
            {isLogin ? 'Log in to track your meals' : 'Create an account to start tracking'}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-rose-500/20 border border-rose-500/50 backdrop-blur-sm text-white p-3 rounded-xl text-sm font-medium mb-6 flex items-center justify-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5 relative">
          
          {/* Username Input */}
          <div>
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1 block mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-white/60" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 outline-none focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all font-semibold"
                placeholder="e.g. foodie123"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider ml-1 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-white/60" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 outline-none focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all font-semibold"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button (Deep Emerald Theme) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-900 text-emerald-50 font-extrabold text-lg py-4 rounded-xl shadow-lg hover:bg-emerald-800 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : isLogin ? (
              <>
                <LogIn className="w-5 h-5" /> Log In
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" /> Sign Up
              </>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-8 text-center relative">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-white/80 font-medium text-sm py-2 px-4 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
          >
            {isLogin ? (
              <span>Don't have an account? <strong className="text-white">Sign up</strong></span>
            ) : (
              <span>Already have an account? <strong className="text-white">Log in</strong></span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}