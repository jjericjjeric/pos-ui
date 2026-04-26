
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, register } from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: Set PIN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState(''); // For demo purposes
  const [otpVerified, setOtpVerified] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Call API to send OTP
      const result = await sendOTP(email);
      setGeneratedOTP(result.otp);
      setOtpSent(true);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      // Verify OTP with backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email,
          otp: otp 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid OTP');
      }

      // OTP verified, move to PIN setup
      setOtpVerified(true);
      setStep(3);
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPinAndRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!pin || pin.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);

    try {
      // Register user with email, OTP, PIN, and optional nickname
      await register(email, otp, pin, nickname || null);
      
      // Show success and redirect to login
      navigate('/login', { 
        state: { 
          message: 'Registration successful! You can now sign in with your email address and PIN.',
          email: email 
        } 
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await sendOTP(email);
      setGeneratedOTP(result.otp);
      setOtpSent(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen h-screen w-full flex items-center justify-center bg-gray-50 p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md my-auto">
        <div className="bg-white p-6 sm:p-8 text-center relative border-b border-gray-200">
          <button
            onClick={() => navigate('/login')}
            className="absolute left-4 top-4 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            aria-label="Back to login"
          >
            <span className="text-2xl">←</span>
          </button>
          
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">🎉</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold m-0 mb-2 text-gray-900">Register Your Account</h1>
          <p className="text-gray-600 m-0 text-sm sm:text-base">Enter your email address to get started</p>
        </div>

        <div className="p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all ${
                step >= 1 ? 'bg-[#667eea] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`h-1 w-12 rounded transition-all ${
                step >= 2 ? 'bg-[#667eea]' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all ${
                step >= 2 ? 'bg-[#667eea] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className={`h-1 w-12 rounded transition-all ${
                step >= 3 ? 'bg-[#667eea]' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all ${
                step >= 3 ? 'bg-[#667eea] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
            <p className="text-center text-sm text-gray-600">
              {step === 1 && 'Enter your email address'}
              {step === 2 && 'Verify your OTP'}
              {step === 3 && 'Set your 4-digit PIN'}
            </p>
          </div>

          {/* Step 1: Email Input */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
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
                <p className="text-xs text-gray-500 mt-2">
                  We'll send a one-time password (OTP) to this email
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="nickname" className="block text-sm font-semibold text-gray-700">
                  Nickname (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">👤</span>
                  <input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="What should we call you?"
                    maxLength="50"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This will be displayed in the header. Leave blank to use your email.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
                  <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium m-0">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!email || loading}
                className="w-full px-6 py-3.5 text-base font-semibold text-white bg-[#667eea] rounded-lg transition-all hover:bg-[#5568d3] active:bg-[#4557b8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>→</span>
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-5">
              {generatedOTP && (
                <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 text-xl mt-0.5">📋</span>
                    <div className="flex-1">
                      <p className="text-blue-800 text-sm font-medium m-0 mb-1">OTP Sent!</p>
                      <p className="text-blue-700 text-xs m-0">Check your email for the 6-digit verification code</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-700">
                  Enter OTP
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔑</span>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) setOtp(value);
                    }}
                    placeholder="000000"
                    maxLength="6"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 text-center text-2xl tracking-widest font-bold"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
                  <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium m-0">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={otp.length !== 6 || loading}
                className="w-full px-6 py-3.5 text-base font-semibold text-white bg-[#667eea] rounded-lg transition-all hover:bg-[#5568d3] active:bg-[#4557b8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Verify OTP</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-[#667eea] hover:text-[#5568d3] font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setError('');
                  }}
                  className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                >
                  ← Change email address
                </button>
              </div>
            </form>
          )}

          {/* Step 3: PIN Setup */}
          {step === 3 && (
            <form onSubmit={handleSetPinAndRegister} className="space-y-5">
              <div className="bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl mt-0.5">✓</span>
                  <div className="flex-1">
                    <p className="text-green-800 text-sm font-medium m-0">Email verified!</p>
                    <p className="text-green-700 text-xs mt-1 m-0">Now set up your 4-digit PIN</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="pin" className="block text-sm font-semibold text-gray-700">
                  Create 4-Digit PIN
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔒</span>
                  <input
                    id="pin"
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
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 text-center text-2xl tracking-widest font-bold"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This PIN will be used to login
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPin" className="block text-sm font-semibold text-gray-700">
                  Confirm PIN
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔒</span>
                  <input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) setConfirmPin(value);
                    }}
                    placeholder="••••"
                    maxLength="4"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-base transition-all focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20 text-center text-2xl tracking-widest font-bold"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
                  <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium m-0">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
                className="w-full px-6 py-3.5 text-base font-semibold text-white bg-[#667eea] rounded-lg transition-all hover:bg-[#5568d3] active:bg-[#4557b8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[#667eea] hover:text-[#5568d3] font-semibold transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
