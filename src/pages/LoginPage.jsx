import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { getLastEmail, clearLastEmail } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsGuest } = useAppStore();
  const pinInputRef = useRef(null);

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasLastEmail, setHasLastEmail] = useState(false);

  useEffect(() => {
    // Load last email for quick login
    const lastEmail = getLastEmail();
    if (lastEmail) {
      setEmail(lastEmail);
      setHasLastEmail(true);
      // Auto-focus PIN field after a short delay
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    }

    // Check for registration success message
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state?.email) {
        setEmail(location.state.email);
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setHasLastEmail(false); // User is changing the email
  };

  const handleClearEmail = () => {
    setEmail('');
    setPin('');
    setHasLastEmail(false);
    clearLastEmail();
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (!pin || pin.length !== 4) {
      setLocalError('Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);
    const result = await login(email, pin, rememberMe);
    setLoading(false);
    
    if (result.success) {
      navigate('/pos');
    } else {
      setLocalError(result.error || 'Login failed. Please check your email and PIN.');
    }
  };

  const handleGuestLogin = async () => {
    setLocalError('');
    setLoading(true);
    
    const result = await loginAsGuest('Guest Store');
    setLoading(false);
    
    if (result.success) {
      navigate('/pos');
    } else {
      setLocalError(result.error || 'Failed to start guest session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen h-screen w-full flex items-center justify-center bg-gray-50 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md my-auto">
        {/* Header Section */}
        <div className="bg-white p-6 sm:p-8 text-center border-b border-gray-200 flex-shrink-0">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">🛒</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold m-0 mb-2 text-gray-900">Pinoy POS</h1>
          <p className="text-gray-600 m-0 text-sm sm:text-base">Point of Sale System</p>
        </div>

        {/* Form Section */}
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 m-0 mb-1">Welcome Back</h2>
            <p className="text-gray-600 text-sm">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                {hasLastEmail && (
                  <button
                    type="button"
                    onClick={handleClearEmail}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Not you?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">📧</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20"
                />
              </div>
              {!hasLastEmail && (
                <p className="text-xs text-gray-500 mt-2">
                  Enter the email address you registered with
                </p>
              )}
            </div>

            {/* PIN Field */}
            <div className="space-y-2">
              <label htmlFor="pin" className="block text-sm font-semibold text-gray-700">
                4-Digit PIN
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔒</span>
                <input
                  id="pin"
                  ref={pinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 4) setPin(value);
                  }}
                  placeholder="••••"
                  maxLength="4"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 text-center text-2xl tracking-widest font-bold"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-[#667eea] transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-md"></div>
                </div>
                <span className="text-sm text-gray-700 select-none group-hover:text-gray-900">Remember me</span>
              </label>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 px-4 py-3 rounded-lg flex items-start gap-3 mb-5">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <div className="flex-1">
                  <p className="text-green-800 text-sm font-medium m-0">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {localError && (
              <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
                <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium m-0">{localError}</p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!email || pin.length !== 4 || loading}
              className="w-full px-6 py-3.5 text-base font-bold text-white bg-[#00C853] rounded-lg transition-all hover:bg-[#00B548] active:bg-[#009E42] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>→</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-4">
            {/* Guest Login Option */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 font-medium mb-2">
                🎯 Want to try it first?
              </p>
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg transition-all hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Starting...' : '✨ Continue as Guest'}
              </button>
              <p className="text-xs text-blue-700 mt-2">
                No registration required • Quick demo access
              </p>
            </div>

            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-[#667eea] hover:text-[#5568d3] font-semibold transition-colors"
              >
                Register Now
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Secure login powered by Pinoy POS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

