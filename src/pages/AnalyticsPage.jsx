import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import LowStockBanner from '../components/LowStockBanner';
import LowStockAlerts from '../components/LowStockAlerts';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { analyticsData, analyticsLoading, analyticsError, loadTransactionStats, products, appSettings } = useAppStore();
  
  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  // Auto-open low stock alerts if navigated from restock action
  useEffect(() => {
    if (location.state?.openLowStockAlerts) {
      setShowLowStockModal(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Calculate low stock metrics using dynamic threshold from settings
  const lowStockThreshold = appSettings.lowStockThreshold || 10;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const totalLowStockAlerts = lowStockProducts.length + outOfStockProducts.length;

  // Calculate date range based on selection
  const getDateRange = () => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];

    switch (dateRange) {
      case 'today':
        return { start_date: formatDate(today), end_date: formatDate(today) };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start_date: formatDate(yesterday), end_date: formatDate(yesterday) };
      case 'last7days':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 7);
        return { start_date: formatDate(last7), end_date: formatDate(today) };
      case 'last30days':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 30);
        return { start_date: formatDate(last30), end_date: formatDate(today) };
      case 'thisMonth':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start_date: formatDate(firstDay), end_date: formatDate(today) };
      case 'lastMonth':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start_date: formatDate(lastMonthStart), end_date: formatDate(lastMonthEnd) };
      case 'custom':
        return { start_date: customStartDate, end_date: customEndDate };
      default:
        return { start_date: formatDate(today), end_date: formatDate(today) };
    }
  };

  useEffect(() => {
    const range = getDateRange();
    if (range.start_date && range.end_date) {
      loadTransactionStats(range);
    }
  }, [dateRange, customStartDate, customEndDate]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(value || 0);
  };

  // Prepare payment method data for pie chart
  const getPaymentMethodData = () => {
    if (!analyticsData?.stats) return [];
    
    const { total_cash, total_card, total_online } = analyticsData.stats;
    return [
      { name: 'Cash', value: total_cash || 0, color: '#00C853' },
      { name: 'Card', value: total_card || 0, color: '#667eea' },
      { name: 'Online', value: total_online || 0, color: '#f97316' },
    ].filter(item => item.value > 0);
  };

  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📊 Analytics</h1>
            <p className="text-gray-600 text-sm mt-1">Loading insights...</p>
          </div>
        </div>
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Low Stock Banner - Attention-grabbing alerts */}
      <LowStockBanner 
        onViewDetails={() => setShowLowStockModal(true)} 
      />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-3 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base"
          >
            ← Back
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📊 Analytics Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Sales insights and performance metrics</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="p-3 sm:p-4 bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'custom'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors min-h-11 ${
                dateRange === range
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'today' && 'Today'}
              {range === 'yesterday' && 'Yesterday'}
              {range === 'last7days' && 'Last 7 Days'}
              {range === 'last30days' && 'Last 30 Days'}
              {range === 'thisMonth' && 'This Month'}
              {range === 'lastMonth' && 'Last Month'}
              {range === 'custom' && 'Custom Range'}
            </button>
          ))}
        </div>
        
        {dateRange === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-11"
            />
            <span className="text-gray-500 flex items-center justify-center sm:justify-start text-sm">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-11"
            />
          </div>
        )}
      </div>

      {analyticsError && (
        <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {analyticsError}
        </div>
      )}

      {analyticsData && (
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-green-600">
              <div className="text-gray-500 text-xs sm:text-sm font-medium">Total Revenue</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1 truncate">
                {formatCurrency(analyticsData.stats?.total_sales)}
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-blue-600">
              <div className="text-gray-500 text-xs sm:text-sm font-medium">Transactions</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">
                {analyticsData.stats?.total_transactions || 0}
              </div>
            </div>
            
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-purple-600">
              <div className="text-gray-500 text-xs sm:text-sm font-medium">Average Sale</div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1 truncate">
                {formatCurrency(analyticsData.stats?.average_transaction)}
              </div>
            </div>
            
            {/* Low Stock Alert KPI - Click to view details */}
            <div 
              className={`bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 cursor-pointer transition-all hover:shadow-md ${
                outOfStockProducts.length > 0 
                  ? 'border-red-600 hover:border-red-700' 
                  : totalLowStockAlerts > 0 
                  ? 'border-amber-500 hover:border-amber-600' 
                  : 'border-green-600'
              }`}
              onClick={() => totalLowStockAlerts > 0 && setShowLowStockModal(true)}
              role={totalLowStockAlerts > 0 ? "button" : undefined}
              aria-label={totalLowStockAlerts > 0 ? "View low stock alerts" : undefined}
            >
              <div className="text-gray-500 text-xs sm:text-sm font-medium flex items-center gap-1">
                Inventory Alerts
                {totalLowStockAlerts > 0 && (
                  <span className="animate-pulse text-base" aria-hidden="true">⚠️</span>
                )}
              </div>
              <div className={`text-lg sm:text-xl md:text-2xl font-bold mt-1 ${
                outOfStockProducts.length > 0 
                  ? 'text-red-600' 
                  : totalLowStockAlerts > 0 
                  ? 'text-amber-600' 
                  : 'text-green-600'
              }`}>
                {totalLowStockAlerts > 0 ? totalLowStockAlerts : '✓'}
              </div>
              {totalLowStockAlerts > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {outOfStockProducts.length > 0 && `${outOfStockProducts.length} out of stock`}
                  {outOfStockProducts.length > 0 && lowStockProducts.length > 0 && ', '}
                  {lowStockProducts.length > 0 && `${lowStockProducts.length} low`}
                </div>
              )}
            </div>
          </div>

          {/* Revenue Trend Chart */}
          {analyticsData.dailyRevenue && analyticsData.dailyRevenue.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">📈 Revenue Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '14px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#00C853" 
                    strokeWidth={3}
                    name="Revenue"
                    dot={{ fill: '#00C853', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top Products Chart */}
            {analyticsData.topProducts && analyticsData.topProducts.length > 0 && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">🏆 Top Selling Products</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.topProducts.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="product_name" 
                      tick={{ fontSize: 10 }} 
                      angle={-15} 
                      textAnchor="end" 
                      height={80}
                      stroke="#6b7280"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? formatCurrency(value) : value,
                        name === 'revenue' ? 'Revenue' : 'Quantity'
                      ]}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    <Bar dataKey="revenue" fill="#00C853" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Payment Methods Chart */}
            {getPaymentMethodData().length > 0 && (
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">💳 Payment Methods</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPaymentMethodData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getPaymentMethodData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {getPaymentMethodData().map((method) => (
                    <div key={method.name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: method.color }}></div>
                        <span className="text-xs sm:text-sm text-gray-700 font-medium">{method.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">{formatCurrency(method.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Empty State */}
          {(!analyticsData.dailyRevenue || analyticsData.dailyRevenue.length === 0) && (
            <div className="bg-white p-8 sm:p-12 rounded-lg shadow-sm text-center">
              <div className="text-5xl sm:text-6xl mb-4">📊</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No Data Available</h3>
              <p className="text-sm sm:text-base text-gray-500">
                No transactions found for the selected date range.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Low Stock Alerts Modal */}
      <LowStockAlerts 
        isOpen={showLowStockModal}
        onClose={() => setShowLowStockModal(false)}
      />
    </div>
  );
};

export default AnalyticsPage;
