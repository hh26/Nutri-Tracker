import React, { useState } from 'react';
import { supabase } from '../db/supabase';

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
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center px-6 animate-in fade-in">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
        <h1 className="text-2xl font-bold text-stone-800 text-center mb-6">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 bg-stone-50 border border-stone-200 py-3 px-4 rounded-xl outline-none focus:border-amber-500 font-bold text-stone-700"
              placeholder="e.g. foodie123"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-stone-50 border border-stone-200 py-3 px-4 rounded-xl outline-none focus:border-amber-500 font-bold text-stone-700"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-amber-500 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-4 text-stone-500 font-semibold text-sm py-2 hover:text-stone-700 transition-colors"
        >
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}