import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, sendOTP } from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1: Enter mobile, 2: Enter OTP, 3: Set PIN
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState(''); // For demo purposes
  const [otpVerified, setOtpVerified] = useState(false);

  // Format mobile number as user types (e.g., 09XX-XXX-XXXX)
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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    
    // Validate Philippine mobile number
    if (cleanMobile.length !== 11) {
      setError('Please enter a valid 11-digit mobile number');
      return;
    }

    if (!cleanMobile.startsWith('09')) {
      setError('Mobile number must start with 09');
      return;
    }

    setLoading(true);

    try {
      // Call API to send OTP
      const result = await sendOTP(cleanMobile);
      setGeneratedOTP(result.otp); // Store for display (in production, this would be sent via SMS)
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
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      // Verify OTP with backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mobile_number: cleanMobile,
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
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      
      // Register user with mobile number and PIN as password
      await register(cleanMobile, pin);
      
      // Show success and redirect to login
      navigate('/login', { 
        state: { 
          message: 'Registration successful! You can now sign in with your mobile number and PIN.',
          mobile: cleanMobile 
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
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      const result = await sendOTP(cleanMobile);
      setGeneratedOTP(result.otp);
      setOtpSent(true);
      // Show success message briefly
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 sm:p-8 text-white text-center relative">
          <button
            onClick={() => navigate('/login')}
            className="absolute left-4 top-4 w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-all"
            aria-label="Back to login"
          >
            <span className="text-2xl">←</span>
          </button>
          
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
            <span className="text-5xl">📱</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold m-0 mb-2">Register</h1>
          <p className="text-white/90 m-0 text-sm sm:text-base">Create your Pinoy POS account</p>
        </div>

        {/* Form Section */}
        <div className="p-6 sm:p-8">
          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all ${
                step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`h-1 w-12 rounded transition-all ${
                step >= 2 ? 'bg-primary' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all ${
                step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className={`h-1 w-12 rounded transition-all ${
                step >= 3 ? 'bg-primary' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all ${
                step >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
            <p className="text-center text-sm text-gray-600">
              {step === 1 ? 'Enter your mobile number' : step === 2 ? 'Verify OTP' : 'Set your PIN'}
            </p>
          </div>

          {/* Step 1: Mobile Number */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">📱</span>
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
                  We'll send a one-time password (OTP) to this number
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-lg flex items-start gap-3">
                  <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium m-0">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || mobileNumber.replace(/\D/g, '').length !== 11}
                className="w-full px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
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
              {/* Demo OTP Display - Remove in production */}
              {generatedOTP && (
                <div className="bg-blue-50 border-l-4 border-blue-500 px-4 py-3 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-500 text-xl mt-0.5">ℹ️</span>
                    <div className="flex-1">
                      <p className="text-blue-800 text-sm font-medium m-0 mb-1">Demo Mode</p>
                      <p className="text-blue-700 text-xs m-0">
                        Your OTP is: <span className="font-bold text-lg">{generatedOTP}</span>
                      </p>
                      <p className="text-blue-600 text-xs mt-1 m-0">
                        In production, this will be sent via SMS
                      </p>
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
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-center text-2xl tracking-widest font-bold"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Sent to {mobileNumber}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-lg flex items-start gap-3">
                  <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium m-0">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
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
                  className="text-primary hover:text-primary-dark font-semibold text-sm transition-colors disabled:opacity-50"
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
                  ← Change mobile number
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Set PIN */}
          {step === 3 && (
            <form onSubmit={handleSetPinAndRegister} className="space-y-5">
              <div className="bg-green-50 border-l-4 border-green-500 px-4 py-3 rounded-lg mb-5">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl mt-0.5">✓</span>
                  <div className="flex-1">
                    <p className="text-green-800 text-sm font-medium m-0">Mobile number verified!</p>
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
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) setPin(value);
                    }}
                    placeholder="••••"
                    maxLength="4"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-center text-2xl tracking-widest font-bold"
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
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 4) setConfirmPin(value);
                    }}
                    placeholder="••••"
                    maxLength="4"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-base transition-all focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-center text-2xl tracking-widest font-bold"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3 rounded-lg flex items-start gap-3">
                  <span className="text-red-500 text-xl mt-0.5">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-800 text-sm font-medium m-0">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
                className="w-full px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
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

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:text-primary-dark font-semibold transition-colors"
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
