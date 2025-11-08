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
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4 sm:p-8">
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-[420px] shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
        <h1 className="text-2xl sm:text-3xl text-center text-gray-800 m-0 mb-1">Free POS PH</h1>
        <p className="text-center text-gray-600 m-0 mb-6 text-sm sm:text-base">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-4">
            <label htmlFor="username" className="block mb-2 font-semibold text-gray-800">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              className="w-full px-3 py-2.5 sm:py-3 text-[15px] sm:text-base border-2 border-gray-200 rounded-lg transition-colors focus:outline-none focus:border-[#667eea]"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block mb-2 font-semibold text-gray-800">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              className="w-full px-3 py-2.5 sm:py-3 text-[15px] sm:text-base border-2 border-gray-200 rounded-lg transition-colors focus:outline-none focus:border-[#667eea]"
            />
          </div>

          <div className="my-2 mb-4">
            <label className="inline-flex items-center gap-2 text-gray-700 select-none text-sm sm:text-base">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>
          </div>

          {(localError || error) && (
            <div className="bg-red-50 text-red-800 border border-red-200 px-3 py-3 rounded-lg mb-4">
              {localError || error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-3 sm:py-3.5 text-base sm:text-lg font-bold text-white bg-gradient-to-br from-green-500 to-green-400 border-none rounded-xl cursor-pointer transition-all shadow-[0_8px_25px_rgba(0,200,83,0.35)] hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_12px_30px_rgba(0,200,83,0.45)] disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!username || !password || loading}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

