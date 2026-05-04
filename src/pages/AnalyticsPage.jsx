import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import LowStockBanner from '../components/LowStockBanner';
import LowStockAlerts from '../components/LowStockAlerts';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * A single compact metric tile. Tiles with charts show a graph icon and open
 * a modal on click.
 *
 * @param {object}   props
 * @param {string}   props.label     - Display label.
 * @param {string}   props.value     - Formatted primary value.
 * @param {string}   [props.sub]     - Optional secondary line.
 * @param {string}   props.accent    - Tailwind border-color class for the left accent.
 * @param {boolean}  [props.hasChart] - Whether this tile opens a chart modal.
 * @param {Function} props.onClick   - Click handler.
 */
const MetricTile = ({ label, value, sub, accent, hasChart, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      bg-white rounded-lg shadow-sm border-l-4 ${accent}
      p-3 text-left w-full transition-all
      hover:shadow-md active:scale-95
      ${hasChart ? 'cursor-pointer' : 'cursor-default'}
    `}
  >
    <div className="text-gray-500 text-xs font-medium leading-tight flex items-center gap-1">
      {label}
      {hasChart && (
        <span className="ml-auto text-gray-300 text-xs" title="View chart">📈</span>
      )}
    </div>
    <div className="text-base sm:text-lg font-bold text-gray-900 mt-0.5 truncate">{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-0.5 truncate">{sub}</div>}
  </button>
);

/**
 * Centered modal overlay that renders a chart in a fixed panel.
 * Closes on backdrop click or Escape key.
 *
 * @param {string}    props.title    - Modal heading.
 * @param {Function}  props.onClose  - Called when the modal should close.
 * @param {ReactNode} props.children - The chart JSX.
 */
const ChartModal = ({ title, onClose, children }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Close chart"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    analyticsData,
    analyticsLoading,
    analyticsError,
    loadTransactionStats,
    profitData,
    profitError,
    loadProfitAnalytics,
    products,
    appSettings,
  } = useAppStore();

  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  /** ID of the chart modal currently open, or null. */
  const [chartModal, setChartModal] = useState(null);

  // Auto-open low stock alerts if navigated from restock action
  useEffect(() => {
    if (location.state?.openLowStockAlerts) {
      setShowLowStockModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // ── Date range helpers ────────────────────────────────────────────────────

  /** Builds the API date-range object for the current selector state. */
  const getDateRange = () => {
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];

    switch (dateRange) {
      case 'today':
        return { start_date: fmt(today), end_date: fmt(today) };
      case 'yesterday': {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return { start_date: fmt(d), end_date: fmt(d) };
      }
      case 'last7days': {
        const d = new Date(today);
        d.setDate(d.getDate() - 7);
        return { start_date: fmt(d), end_date: fmt(today) };
      }
      case 'last30days': {
        const d = new Date(today);
        d.setDate(d.getDate() - 30);
        return { start_date: fmt(d), end_date: fmt(today) };
      }
      case 'thisMonth': {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start_date: fmt(first), end_date: fmt(today) };
      }
      case 'lastMonth': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { start_date: fmt(start), end_date: fmt(end) };
      }
      case 'custom':
        return { start_date: customStartDate, end_date: customEndDate };
      default:
        return { start_date: fmt(today), end_date: fmt(today) };
    }
  };

  useEffect(() => {
    const range = getDateRange();
    if (range.start_date && range.end_date) {
      loadTransactionStats(range);
      loadProfitAnalytics(range);
    }
    // Close any open chart modal when date range changes
    setChartModal(null);
  }, [dateRange, customStartDate, customEndDate]);

  // ── Derived metrics ───────────────────────────────────────────────────────

  /** Formats a number as Philippine Peso currency. */
  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value || 0);

  const lowStockThreshold = appSettings.lowStockThreshold || 10;
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.track_inventory !== false && p.stock > 0 && p.stock <= lowStockThreshold),
    [products, lowStockThreshold],
  );
  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.track_inventory !== false && p.stock === 0),
    [products],
  );
  const totalLowStockAlerts = lowStockProducts.length + outOfStockProducts.length;

  /** Revenue attributed to products that do NOT track inventory (e.g. services) for the selected period. */
  const serviceRevenue = useMemo(() => {
    if (!analyticsData?.topProducts?.length || !products?.length) return 0;
    const serviceIds = new Set(
      products
        .filter((p) => p.track_inventory === false)
        .map((p) => p.id),
    );
    return analyticsData.topProducts
      .filter((tp) => serviceIds.has(tp.product_id))
      .reduce((sum, tp) => sum + (tp.revenue || 0), 0);
  }, [analyticsData?.topProducts, products]);

  const activeProducts = useMemo(() => products.filter((p) => !p.is_archived), [products]);

  /**
   * Inventory-tracked active products only.
   * Products with track_inventory=false (services, intangibles) are excluded
   * from inventory value and unit counts to avoid inflated numbers.
   */
  const physicalProducts = useMemo(
    () => activeProducts.filter((p) => p.track_inventory !== false),
    [activeProducts],
  );

  /** Current inventory value at selling price (stock × price), physical products only. */
  const stockValueSelling = useMemo(
    () => physicalProducts.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0),
    [physicalProducts],
  );

  /** Current inventory value at cost price (stock × cost_price), physical products only. */
  const stockValueCost = useMemo(
    () => physicalProducts.reduce((sum, p) => sum + (Number(p.cost_price) || 0) * Number(p.stock), 0),
    [physicalProducts],
  );

  /** Total units currently in stock across physical products only. */
  const totalStockUnits = useMemo(
    () => physicalProducts.reduce((sum, p) => sum + Number(p.stock), 0),
    [physicalProducts],
  );

  /** Builds the dataset for the payment-method pie chart from API stats. */
  const paymentMethodData = useMemo(() => {
    if (!analyticsData?.stats) return [];
    const { total_cash, total_gcash, total_gotyme } = analyticsData.stats;
    return [
      { name: 'Cash',   value: total_cash   || 0, color: '#00C853' },
      { name: 'GCash',  value: total_gcash  || 0, color: '#2563eb' },
      { name: 'GoTyme', value: total_gotyme || 0, color: '#7c3aed' },
    ].filter((item) => item.value > 0);
  }, [analyticsData?.stats]);

  // ── Chart modal handler ───────────────────────────────────────────────────

  /**
   * Opens the chart modal for a given tile ID.
   * @param {string} tileId
   */
  const openChart = (tileId) => setChartModal(tileId);

  /** Closes the chart modal. */
  const closeChart = () => setChartModal(null);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (analyticsLoading) {
    return (
      <div className="h-screen bg-gray-50 pb-20 overflow-y-auto">
        <div className="bg-white shadow-sm px-4 py-4">
          <h1 className="text-xl font-bold text-gray-800">📊 Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Loading insights…</p>
        </div>
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const stats = analyticsData?.stats;
  const hasRevenueTrend = analyticsData?.dailyRevenue?.length > 0;
  const hasProfitTrend  = profitData?.dailyProfit?.length > 0;
  const hasTopProducts  = analyticsData?.topProducts?.length > 0;
  const hasMostProfitable = profitData?.profitPerProduct?.length > 0;
  const hasPaymentMethods = paymentMethodData.length > 0;

  return (
    <div className="h-screen bg-gray-50 pb-20 overflow-y-auto">
      <LowStockBanner onViewDetails={() => setShowLowStockModal(true)} />

      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 text-sm mb-1"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-gray-800">📊 Analytics</h1>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 px-3 py-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'custom'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                dateRange === range
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === 'today'      && 'Today'}
              {range === 'yesterday'  && 'Yesterday'}
              {range === 'last7days'  && 'Last 7 Days'}
              {range === 'last30days' && 'Last 30 Days'}
              {range === 'thisMonth'  && 'This Month'}
              {range === 'lastMonth'  && 'Last Month'}
              {range === 'custom'     && 'Custom'}
            </button>
          ))}
        </div>

        {dateRange === 'custom' && (
          <div className="flex gap-2 mt-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-xs"
            />
            <span className="text-gray-400 text-xs self-center">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-xs"
            />
          </div>
        )}
      </div>

      {/* Error banners */}
      {analyticsError && (
        <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          <strong>Analytics Error:</strong> {analyticsError}
        </div>
      )}
      {profitError && (
        <div className="mx-3 mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-xs">
          <strong>Profit Error:</strong> {profitError}
        </div>
      )}

      <div className="p-3 space-y-3">

        {/* ── Sales tiles ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">

          <MetricTile
            label="Total Revenue"
            value={formatCurrency(stats?.total_sales)}
            accent="border-green-500"
            hasChart={hasRevenueTrend}
            onClick={() => hasRevenueTrend && openChart('revenue')}
          />

          <MetricTile
            label="Service Revenue"
            value={formatCurrency(serviceRevenue)}
            sub="Category: Service"
            accent="border-indigo-500"
            hasChart={false}
            onClick={() => {}}
          />

          <MetricTile
            label="Transactions"
            value={stats?.total_transactions ?? '—'}
            accent="border-blue-500"
            hasChart={false}
            onClick={() => {}}
          />

          <MetricTile
            label="Avg Sale"
            value={formatCurrency(stats?.average_transaction)}
            accent="border-sky-500"
            hasChart={false}
            onClick={() => {}}
          />

          <MetricTile
            label="Total Profit"
            value={
              profitData?.stats && typeof profitData.stats.total_profit === 'number'
                ? formatCurrency(profitData.stats.total_profit)
                : profitError ? '—' : formatCurrency(0)
            }
            accent="border-amber-500"
            hasChart={hasProfitTrend}
            onClick={() => hasProfitTrend && openChart('profit')}
          />

          <MetricTile
            label="Gross Margin"
            value={
              profitData?.stats && typeof profitData.stats.gross_margin === 'number'
                ? `${profitData.stats.gross_margin.toFixed(1)}%`
                : profitError ? '—' : '0.0%'
            }
            accent="border-teal-500"
            hasChart={false}
            onClick={() => {}}
          />

          <MetricTile
            label="Payment Methods"
            value={hasPaymentMethods ? `${paymentMethodData.length} methods` : '—'}
            sub={
              hasPaymentMethods
                ? paymentMethodData.map((m) => `${m.name}: ${formatCurrency(m.value)}`).join(' · ')
                : undefined
            }
            accent="border-purple-500"
            hasChart={hasPaymentMethods}
            onClick={() => hasPaymentMethods && openChart('payments')}
          />

          <MetricTile
            label="Top Products"
            value={hasTopProducts ? `${analyticsData.topProducts.length} items` : '—'}
            sub={hasTopProducts ? analyticsData.topProducts[0]?.product_name : undefined}
            accent="border-orange-500"
            hasChart={hasTopProducts}
            onClick={() => hasTopProducts && openChart('topProducts')}
          />

          <MetricTile
            label="Most Profitable"
            value={hasMostProfitable ? `${profitData.profitPerProduct.length} items` : '—'}
            sub={hasMostProfitable ? profitData.profitPerProduct[0]?.product_name : undefined}
            accent="border-rose-500"
            hasChart={hasMostProfitable}
            onClick={() => hasMostProfitable && openChart('mostProfitable')}
          />
        </div>

        {/* ── Inventory tiles ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">

          <MetricTile
            label="Total Stock Units"
            value={totalStockUnits.toLocaleString()}
            sub={`${physicalProducts.length} physical SKUs`}
            accent="border-gray-400"
            hasChart={false}
            onClick={() => {}}
          />

          <MetricTile
            label="Stock Value (Selling)"
            value={formatCurrency(stockValueSelling)}
            sub="At selling price"
            accent="border-emerald-500"
            hasChart={false}
            onClick={() => {}}
          />

          <MetricTile
            label="Stock Value (Cost)"
            value={formatCurrency(stockValueCost)}
            sub="At cost price"
            accent="border-slate-500"
            hasChart={false}
            onClick={() => {}}
          />

          <MetricTile
            label={`Inventory Alerts${totalLowStockAlerts > 0 ? ' ⚠️' : ''}`}
            value={
              outOfStockProducts.length > 0
                ? `${outOfStockProducts.length} out of stock`
                : totalLowStockAlerts > 0
                ? `${totalLowStockAlerts} alerts`
                : '✓ All stocked'
            }
            sub={
              totalLowStockAlerts > 0
                ? `${lowStockProducts.length} low · ${outOfStockProducts.length} empty`
                : undefined
            }
            accent={
              outOfStockProducts.length > 0
                ? 'border-red-500'
                : totalLowStockAlerts > 0
                ? 'border-amber-500'
                : 'border-green-500'
            }
            hasChart={false}
            onClick={() => totalLowStockAlerts > 0 && setShowLowStockModal(true)}
          />
        </div>

        {/* Empty state when no analytics data */}
        {!analyticsData && !analyticsLoading && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-base font-bold text-gray-700 mb-1">No Data Available</h3>
            <p className="text-xs text-gray-400">No transactions found for the selected period.</p>
          </div>
        )}
      </div>

      {/* ── Chart modals ─────────────────────────────────────────────────── */}
      {chartModal === 'revenue' && hasRevenueTrend && (
        <ChartModal title="📈 Revenue Trend" onClose={closeChart}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analyticsData.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <Tooltip
                formatter={(v) => formatCurrency(v)}
                contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#00C853" strokeWidth={2} name="Revenue" dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartModal>
      )}

      {chartModal === 'profit' && hasProfitTrend && (
        <ChartModal title="💰 Profit Trend" onClose={closeChart}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={profitData.dailyProfit}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <Tooltip
                formatter={(v, name) =>
                  name === 'Margin %' ? `${v.toFixed(1)}%` : formatCurrency(v)
                }
                contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="left"  type="monotone" dataKey="profit" stroke="#f59e0b" strokeWidth={2} name="Profit"   dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#14b8a6" strokeWidth={1.5} strokeDasharray="4 4" name="Margin %" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartModal>
      )}

      {chartModal === 'topProducts' && hasTopProducts && (
        <ChartModal title="🏆 Top Selling Products" onClose={closeChart}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analyticsData.topProducts.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="product_name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={60} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <Tooltip
                formatter={(v, name) => [name === 'revenue' ? formatCurrency(v) : v, name === 'revenue' ? 'Revenue' : 'Qty']}
                contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#00C853" name="Revenue" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartModal>
      )}

      {chartModal === 'mostProfitable' && hasMostProfitable && (
        <ChartModal title="💎 Most Profitable Products" onClose={closeChart}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={profitData.profitPerProduct.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="product_name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={60} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
              <Tooltip
                formatter={(v) => [formatCurrency(v), 'Profit']}
                contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="profit" fill="#f59e0b" name="Profit" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartModal>
      )}

      {chartModal === 'payments' && hasPaymentMethods && (
        <ChartModal title="💳 Payment Methods" onClose={closeChart}>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="w-full sm:w-44 space-y-2 shrink-0">
              {paymentMethodData.map((m) => (
                <li key={m.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    {m.name}
                  </span>
                  <span className="font-semibold text-gray-800">{formatCurrency(m.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </ChartModal>
      )}

      {/* Low Stock Alerts Modal */}
      <LowStockAlerts isOpen={showLowStockModal} onClose={() => setShowLowStockModal(false)} />
    </div>
  );
};

export default AnalyticsPage;
