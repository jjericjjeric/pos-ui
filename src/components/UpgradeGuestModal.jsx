import { useState } from 'react';
import Modal from './Modal';
import FormField from './FormField';
import useAppStore from '../store/useAppStore';

/**
 * UpgradeGuestModal - Allows guest users to convert their account to a registered account
 * Follows the same registration flow: Mobile Number → OTP → PIN
 * Preserves all existing products, transactions, and store data
 */
const UpgradeGuestModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: PIN
  const [formData, setFormData] = useState({
    mobileNumber: '',
    otp: '',
    pin: '',
    confirmPin: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [receivedOTP, setReceivedOTP] = useState(''); // Store OTP from server for display

  // Fixed: Use stable selectors to prevent infinite loops
  const upgradeGuestAccount = useAppStore(state => state.upgradeGuestAccount);
  const sendOTP = useAppStore(state => state.sendOTP);
  const verifyOTP = useAppStore(state => state.verifyOTP);

  const formatMobileNumber = (value) => {
    // Remove non-digits
    let cleaned = value.replace(/\D/g, '');
    // Limit to 11 digits
    if (cleaned.length > 11) {
      cleaned = cleaned.slice(0, 11);
    }
    return cleaned;
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (formData.mobileNumber.length !== 11) {
      newErrors.mobileNumber = 'Mobile number must be 11 digits';
    } else if (!formData.mobileNumber.startsWith('09')) {
      newErrors.mobileNumber = 'Mobile number must start with 09';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!formData.otp) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    if (!formData.pin) {
      newErrors.pin = 'PIN is required';
    } else if (formData.pin.length !== 4) {
      newErrors.pin = 'PIN must be 4 digits';
    } else if (!/^\d+$/.test(formData.pin)) {
      newErrors.pin = 'PIN must contain only numbers';
    }

    if (!formData.confirmPin) {
      newErrors.confirmPin = 'Please confirm your PIN';
    } else if (formData.pin !== formData.confirmPin) {
      newErrors.confirmPin = 'PINs do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Format mobile number
    if (name === 'mobileNumber') {
      newValue = formatMobileNumber(value);
    }
    // Format OTP (6 digits)
    else if (name === 'otp') {
      newValue = value.replace(/\D/g, '').slice(0, 6);
    }
    // Format PIN (4 digits)
    else if (name === 'pin' || name === 'confirmPin') {
      newValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateStep1()) {
      return;
    }

    setLoading(true);

    try {
      const result = await sendOTP(formData.mobileNumber);
      
      if (result.success) {
        setOtpSent(true);
        // Store OTP from response for display (demo only)
        if (result.data && result.data.otp) {
          setReceivedOTP(result.data.otp);
        }
        setStep(2);
      } else {
        setServerError(result.error || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setServerError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(formData.mobileNumber, formData.otp);
      
      if (result.success) {
        setStep(3);
      } else {
        setServerError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setServerError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateStep3()) {
      return;
    }

    setLoading(true);

    try {
      const result = await upgradeGuestAccount(
        formData.mobileNumber,
        formData.otp,
        formData.pin
      );

      if (result.success) {
        onSuccess?.({
          mobileNumber: formData.mobileNumber,
          message: 'Account upgraded successfully! You can now login with your mobile number and PIN.',
        });
        onClose();
      } else {
        setServerError(result.error || 'Failed to upgrade account. Please try again.');
      }
    } catch (error) {
      setServerError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStep(1);
      setFormData({ mobileNumber: '', otp: '', pin: '', confirmPin: '' });
      setErrors({});
      setServerError('');
      setOtpSent(false);
      onClose();
    }
  };

  const handleBack = () => {
    setErrors({});
    setServerError('');
    if (step === 2) {
      setStep(1);
      setOtpSent(false);
    } else if (step === 3) {
      setStep(2);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            🎉 Register Your Account
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {step === 1 && 'Enter your mobile number to get started'}
            {step === 2 && 'Enter the OTP sent to your mobile number'}
            {step === 3 && 'Set your 4-digit PIN'}
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
            <div className={`flex-1 h-1.5 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        {/* Step 1: Mobile Number */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <FormField
              label="Mobile Number"
              name="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={handleChange}
              error={errors.mobileNumber}
              placeholder="09XXXXXXXXX"
              autoComplete="tel"
              disabled={loading}
              required
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-blue-800">
                📱 <strong>Next steps:</strong>
              </p>
              <ul className="text-xs sm:text-sm text-blue-700 mt-2 ml-4 space-y-1 list-disc">
                <li>We'll send an OTP to verify your number</li>
                <li>Set a 4-digit PIN for secure login</li>
                <li>All your products and data will be preserved</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>📱</span>
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800">
                ✅ OTP sent to <strong>{formData.mobileNumber}</strong>
              </p>
            </div>

            {/* Demo OTP Display */}
            {receivedOTP && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-2">
                  🔐 Demo Mode - Your OTP Code:
                </p>
                <div className="bg-white border-2 border-yellow-400 rounded-lg p-3 text-center">
                  <p className="text-3xl font-mono font-bold text-yellow-900 tracking-widest">
                    {receivedOTP}
                  </p>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  ⚠️ In production, this will be sent via SMS
                </p>
              </div>
            )}

            <FormField
              label="Enter OTP"
              name="otp"
              type="text"
              value={formData.otp}
              onChange={handleChange}
              error={errors.otp}
              placeholder="6-digit code"
              autoComplete="one-time-code"
              disabled={loading}
              required
              maxLength={6}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
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
            </div>
          </form>
        )}

        {/* Step 3: Set PIN */}
        {step === 3 && (
          <form onSubmit={handleUpgrade} className="space-y-4">
            <FormField
              label="Create 4-Digit PIN"
              name="pin"
              type="password"
              value={formData.pin}
              onChange={handleChange}
              error={errors.pin}
              placeholder="••••"
              autoComplete="new-password"
              disabled={loading}
              required
              maxLength={4}
              inputMode="numeric"
            />

            <FormField
              label="Confirm PIN"
              name="confirmPin"
              type="password"
              value={formData.confirmPin}
              onChange={handleChange}
              error={errors.confirmPin}
              placeholder="••••"
              autoComplete="new-password"
              disabled={loading}
              required
              maxLength={4}
              inputMode="numeric"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs sm:text-sm text-blue-800">
                ✨ <strong>Almost done!</strong>
              </p>
              <ul className="text-xs sm:text-sm text-blue-700 mt-2 ml-4 space-y-1 list-disc">
                <li>Your account will be upgraded to a registered account</li>
                <li>Login with: <strong>{formData.mobileNumber}</strong> + your PIN</li>
                <li>All products and store data will be preserved</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Upgrading...</span>
                  </>
                ) : (
                  <>
                    <span>🎉</span>
                    <span>Complete Registration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default UpgradeGuestModal;
