'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmationModal from './ConfirmationModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login } = useAuth();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    onConfirm: undefined as (() => void) | undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    if (isRegister) {
      if (!firstName.trim() || !lastName.trim()) {
        setError('Please enter your first and last name');
        setLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            confirmPassword,
            firstName,
            lastName,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Registration failed');
          setLoading(false);
          return;
        }

        // Registration successful, show success message
        setError('');
        setLoading(false);
        
        if (data.requiresVerification) {
          setModalConfig({
            title: 'Registration Successful!',
            message: 'Please check your email to verify your account, then login.',
            type: 'success',
            onConfirm: () => setIsRegister(false)
          });
        } else {
          const message = data.usingFallback 
            ? 'Registration successful using local authentication. You can now login with your credentials.'
            : 'You can now login with your credentials.';
          
          setModalConfig({
            title: 'Registration Successful!',
            message: message,
            type: 'success',
            onConfirm: () => setIsRegister(false)
          });
        }
        setShowModal(true);
        return;
      } catch (error) {
        setError('Registration failed');
        setLoading(false);
        setModalConfig({
          title: 'Registration Failed',
          message: 'An unexpected error occurred during registration. Please try again.',
          type: 'error',
          onConfirm: undefined
        });
        setShowModal(true);
      }
    } else {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Login failed');
          setLoading(false);
          return;
        }

        login(data.token, data.user);
      } catch (error) {
        setError('Login failed');
        setLoading(false);
        setModalConfig({
          title: 'Login Failed',
          message: 'An unexpected error occurred during login. Please try again.',
          type: 'error',
          onConfirm: undefined
        });
        setShowModal(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 flex items-center justify-center p-4">
      <div className="bg-stone-800 border border-stone-700 rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 593 181" 
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-4"
          >
            <g transform="matrix(1,0,0,1,-52.2572,-165.86)">
              <g transform="matrix(0.1,0,0,-0.1,0,1715)">
                    <path 
                      d="M824,15376C655,15291 581,15145 608,14954C623,14856 659,14733 701,14642C717,14607 730,14577 730,14575C730,14564 810,14436 858,14370C1047,14110 1342,13925 1710,13836C2073,13749 2618,13749 3070,13836C3168,13855 3362,13916 3422,13946C3479,13975 3490,13975 3539,13950C3849,13792 4584,13724 5105,13806C5713,13902 6135,14233 6315,14755C6382,14948 6386,15099 6328,15214C6280,15308 6125,15410 6028,15410C5987,15410 5978,15406 5956,15378C5942,15359 5927,15319 5921,15286C5900,15173 5912,15143 5943,15230C5954,15259 5971,15287 5987,15297C6026,15323 6057,15299 6103,15211C6136,15147 6140,15130 6140,15067C6140,14949 6092,14868 5975,14784C5860,14703 5735,14658 5616,14657C5535,14656 5487,14674 5155,14830C5111,14851 5017,14896 4945,14930C4803,14998 4686,15053 4570,15107C4472,15152 4347,15193 4235,15215C4164,15229 4118,15231 4015,15227C3844,15219 3727,15185 3600,15107C3470,15027 3493,15030 3411,15084C3323,15143 3200,15193 3090,15216C2944,15245 2748,15229 2565,15172C2491,15149 2351,15085 1975,14905C1744,14794 1569,14715 1490,14684C1391,14646 1309,14647 1187,14688C1041,14737 924,14823 865,14924C806,15025 825,15177 910,15272C945,15311 949,15314 973,15303C999,15291 1040,15225 1040,15195C1040,15186 1045,15182 1050,15185C1075,15201 1050,15337 1013,15380C977,15423 916,15422 824,15376Z" 
                      fill="#F97316" 
                      stroke="#FB923C" 
                      strokeWidth="16"
                    />              </g>
            </g>
          </svg>
          <h1 className="text-2xl font-bold text-white">
            {isRegister ? 'Create Account' : 'Login to Stash'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                    disabled={loading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
              disabled={loading}
              required
            />
          </div>

          {isRegister && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className="w-full px-3 py-2 bg-stone-700 border border-stone-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder-stone-400"
                disabled={loading}
                required
              />
            </div>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading}
          >
            {loading ? (isRegister ? 'Creating Account...' : 'Logging in...') : (isRegister ? 'Create Account' : 'Login')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                setFirstName('');
                setLastName('');
                setConfirmPassword('');
              }}
              className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
            >
              {isRegister ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        showConfirmButton={!!modalConfig.onConfirm}
      />
    </div>
  );
};

export default Login;