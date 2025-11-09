import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/useInventory';

const LoginPage = () => {
  const navigate = useNavigate();
  const { loginUser, error, loading } = useInventory();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!username || !password) {
      setLocalError('Please enter username and password');
      return;
    }

    const result = await loginUser(username, password, rememberMe);
    if (result.success) {
      navigate('/pos');
    } else {
      setLocalError(result.error || 'Login failed');
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
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">👤</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔒</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
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

            {/* Error Message */}
            {(localError || error) && (
              <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-lg flex items-start gap-3">
                <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-800 text-sm font-medium m-0">{localError || error}</p>
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!username || !password || loading}
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
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
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

