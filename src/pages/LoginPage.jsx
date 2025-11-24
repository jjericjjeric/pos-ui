import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAppStore();

  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for registration success message
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state?.mobile) {
        setMobileNumber(location.state.mobile);
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Format mobile number as user types
  const formatMobileNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleMobileChange = (e) => {
    const formatted = formatMobileNumber(e.target.value);
    if (formatted.replace(/\D/g, '').length <= 11) {
      setMobileNumber(formatted);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const cleanMobile = mobileNumber.replace(/\D/g, '');

    if (!cleanMobile || cleanMobile.length !== 11) {
      setLocalError('Please enter a valid 11-digit mobile number');
      return;
    }

    if (!cleanMobile.startsWith('09')) {
      setLocalError('Mobile number must start with 09');
      return;
    }

    if (!pin || pin.length !== 4) {
      setLocalError('Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);
    const result = await login(cleanMobile, pin, rememberMe);
    setLoading(false);
    
    if (result.success) {
      navigate('/pos');
    } else {
      setLocalError(result.error || 'Login failed. Please check your mobile number and PIN.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 sm:p-8 text-white text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
            <span className="text-5xl">🛒</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold m-0 mb-2">Pinoy POS</h1>
          <p className="text-white/90 m-0 text-sm sm:text-base">Point of Sale System</p>
        </div>

        {/* Form Section */}
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 m-0 mb-1">Welcome Back</h2>
            <p className="text-gray-600 text-sm">Sign in to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mobile Number Field */}
            <div className="space-y-2">
              <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">�</span>
                <input
                  id="mobile"
                  type="tel"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  placeholder="09XX-XXX-XXXX"
                  autoComplete="tel"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter the mobile number you registered with
              </p>
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
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 4) setPin(value);
                  }}
                  placeholder="••••"
                  maxLength="4"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-center text-2xl tracking-widest font-bold"
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
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-primary transition-all"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5 shadow-md"></div>
                </div>
                <span className="text-sm text-gray-700 select-none group-hover:text-gray-900">Remember me</span>
              </label>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 px-4 py-3 rounded-lg flex items-start gap-3 mb-5">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <div className="flex-1">
                  <p className="text-green-800 text-sm font-medium m-0">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {localError && (
              <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-lg flex items-start gap-3">
                <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium m-0">{localError}</p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!mobileNumber || mobileNumber.replace(/\D/g, '').length !== 11 || pin.length !== 4 || loading}
              className="w-full px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 mt-6"
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
          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-primary hover:text-primary-dark font-semibold transition-colors"
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

