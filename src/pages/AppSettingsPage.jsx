import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';

const AppSettingsPage = () => {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  
  const appSettings = useAppStore((state) => state.appSettings);
  const updateAppSettings = useAppStore((state) => state.updateAppSettings);
  
  const [cacheDuration, setCacheDuration] = useState(appSettings.cacheDuration || 30);
  const [lowStockThreshold, setLowStockThreshold] = useState(appSettings.lowStockThreshold || 10);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const cacheOptions = [
    { value: 2, label: '2 minutes (Fast refresh)', description: 'Frequently updated data' },
    { value: 10, label: '10 minutes (Balanced)', description: 'Good for active sessions' },
    { value: 30, label: '30 minutes (Recommended)', description: 'Typical work session' },
    { value: 60, label: '1 hour (Performance)', description: 'Minimal API calls' },
    { value: 180, label: '3 hours (Maximum)', description: 'All-day caching' },
  ];

  const handleSave = () => {
    updateAppSettings({ cacheDuration, lowStockThreshold });
    setSaveSuccess(true);
    addToast('Settings saved successfully', 'success');
    
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col pb-20 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-2 sm:px-3 py-2.5 sm:py-3 border-b border-gray-200 z-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors min-w-11 min-h-11 flex items-center justify-center"
            aria-label="Go back"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 flex-1">
            ⚙️ App Settings
          </h1>
          <div className="w-11"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2 sm:p-3 overflow-auto">
        <div className="max-w-2xl mx-auto space-y-3">
          
          {/* Performance Settings Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>⚡</span>
                <span>Performance Settings</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Optimize app speed and data usage
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Cache Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Cache Duration
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  How long to keep product data in memory before refreshing. Longer cache = faster store switching but may show outdated data if products are changed externally.
                </p>
                
                <div className="space-y-2">
                  {cacheOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        cacheDuration === option.value
                          ? 'border-[#00C853] bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cacheDuration"
                        value={option.value}
                        checked={cacheDuration === option.value}
                        onChange={(e) => setCacheDuration(parseInt(e.target.value))}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 text-sm">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-600">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 shrink-0">ℹ️</span>
                    <div className="text-xs text-blue-800">
                      <p className="font-semibold mb-1">Cache automatically clears when you:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Add, edit, or delete products</li>
                        <li>Use "Refresh" or pull-to-refresh</li>
                        <li>Logout and login again</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Settings Card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>📦</span>
                <span>Inventory Settings</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Configure inventory alerts and thresholds
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Low Stock Threshold */}
              <div>
                <label htmlFor="lowStockThreshold" className="block text-sm font-semibold text-gray-700 mb-2">
                  Low Stock Alert Threshold
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  You'll receive alerts when product stock falls below this level. Set it based on your typical sales velocity.
                </p>
                
                <div className="flex items-center gap-3">
                  <input
                    id="lowStockThreshold"
                    type="number"
                    min="1"
                    max="100"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 10)}
                    className="w-24 px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-lg font-bold focus:outline-none focus:border-[#00C853] focus:ring-2 focus:ring-[#00C853]/20"
                  />
                  <span className="text-sm text-gray-600">units or less</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setLowStockThreshold(5)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      lowStockThreshold === 5
                        ? 'bg-[#00C853] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    5 (Low)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLowStockThreshold(10)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      lowStockThreshold === 10
                        ? 'bg-[#00C853] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    10 (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLowStockThreshold(20)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      lowStockThreshold === 20
                        ? 'bg-[#00C853] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    20 (High)
                  </button>
                </div>

                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 shrink-0">⚠️</span>
                    <div className="text-xs text-amber-800">
                      <p className="font-semibold mb-1">Low stock alerts will trigger when:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Product stock ≤ {lowStockThreshold} units (warning banner)</li>
                        <li>Product stock = 0 units (critical alert)</li>
                        <li>Shown on POS page and Analytics dashboard</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Future Settings Placeholder */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden opacity-50">
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>🎨</span>
                <span>Appearance</span>
                <span className="text-xs bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full ml-auto">Coming Soon</span>
              </h2>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-sm text-gray-500">
                Dark mode, theme colors, and display preferences will be available in a future update.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-white text-gray-700 rounded-lg text-sm font-semibold transition-all hover:bg-gray-50 active:bg-gray-100 border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-[#00C853] text-white rounded-lg text-sm font-bold transition-all hover:bg-[#00B548] active:bg-[#009E42] border border-[#00C853] flex items-center justify-center gap-2"
            >
              {saveSuccess && <span>✓</span>}
              <span>{saveSuccess ? 'Saved!' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default AppSettingsPage;
