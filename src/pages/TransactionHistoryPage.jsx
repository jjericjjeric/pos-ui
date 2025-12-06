import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { useClickOutside } from '../hooks/useClickOutside';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';
import MenuDropdown from '../components/MenuDropdown';
import ConfirmDialog from '../components/ConfirmDialog';

const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  
  // Zustand selectors
  const transactions = useAppStore((state) => state.transactions);
  const transactionsLoading = useAppStore((state) => state.transactionsLoading);
  const transactionStats = useAppStore((state) => state.transactionStats);
  const transactionPagination = useAppStore((state) => state.transactionPagination);
  const loadTransactions = useAppStore((state) => state.loadTransactions);
  const loadTransactionStats = useAppStore((state) => state.loadTransactionStats);
  const cancelTransaction = useAppStore((state) => state.cancelTransaction);
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  
  const { toasts, addToast, removeToast } = useToast();
  
  // Local state
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    status: '',
    payment_method: '',
    page: 1,
    limit: 20,
  });
  const [datePreset, setDatePreset] = useState('all');
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, transactionId: null });
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  
  const mobileMenuRef = useRef(null);
  const desktopMenuRef = useRef(null);

  
  // Check if user can cancel transactions (admin or owner)
  const canCancelTransactions = user?.role === 'OWNER' || user?.role === 'ADMIN';

  // Close menus when clicking outside
  useClickOutside(mobileMenuRef, () => setShowMobileMenu(false), showMobileMenu);
  useClickOutside(desktopMenuRef, () => setShowDesktopMenu(false), showDesktopMenu);

  // Load transactions and stats on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadTransactions(filters);
        await loadTransactionStats({
          start_date: filters.start_date,
          end_date: filters.end_date,
        });
      } catch (error) {
        addToast(error.message, 'error');
      }
    };
    loadData();
  }, [filters.start_date, filters.end_date, filters.status, filters.payment_method, filters.page]);  // Date preset handlers
  const applyDatePreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    let start_date = '';
    let end_date = '';

    switch (preset) {
      case 'today':
        start_date = today.toISOString().split('T')[0];
        end_date = start_date;
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        start_date = weekAgo.toISOString().split('T')[0];
        end_date = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        start_date = monthAgo.toISOString().split('T')[0];
        end_date = today.toISOString().split('T')[0];
        break;
      case 'all':
      default:
        start_date = '';
        end_date = '';
        break;
    }

    setFilters((prev) => ({ ...prev, start_date, end_date, page: 1 }));
  };

  // Filter handlers
  const handleStatusChange = (status) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handlePaymentMethodChange = (method) => {
    setFilters((prev) => ({ ...prev, payment_method: method, page: 1 }));
  };

  const handleCustomDateChange = (field, value) => {
    setDatePreset('custom');
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= transactionPagination.total_pages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Transaction item toggle
  const toggleTransactionDetails = (id) => {
    setExpandedTransaction(expandedTransaction === id ? null : id);
  };

  // Cancel transaction handler
  const handleCancelClick = (transactionId) => {
    setCancelDialog({ isOpen: true, transactionId });
  };

  const confirmCancelTransaction = async () => {
    try {
      await cancelTransaction(cancelDialog.transactionId);
      addToast('Transaction cancelled successfully', 'success');
      setCancelDialog({ isOpen: false, transactionId: null });
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Matches POSPage style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="flex items-center justify-between px-2 sm:px-3 py-2.5 sm:py-3">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/pos')}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Back to POS"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              📊 Transaction History
            </h1>
          </div>

          {/* Right: Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop Menu (hidden on mobile) */}
            <div className="hidden sm:block relative" ref={desktopMenuRef}>
              <button
                onClick={() => setShowDesktopMenu(!showDesktopMenu)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <MenuDropdown
                isOpen={showDesktopMenu}
                onClose={() => setShowDesktopMenu(false)}
                logoutUser={logout}
                user={user}
              />
            </div>
            
            {/* Mobile Menu */}
            <div className="sm:hidden relative" ref={mobileMenuRef}>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <MenuDropdown
                isOpen={showMobileMenu}
                onClose={() => setShowMobileMenu(false)}
                logoutUser={logout}
                user={user}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        
        {/* Stats Cards - Compact Grid */}
        {transactionStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-3.5">
              <p className="text-xs text-gray-600 mb-1">Total Sales</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {formatCurrency(transactionStats.total_sales || 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-3.5">
              <p className="text-xs text-gray-600 mb-1">Transactions</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {transactionStats.total_transactions || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-3.5">
              <p className="text-xs text-gray-600 mb-1">Average</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {formatCurrency(transactionStats.average_transaction || 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-3.5">
              <p className="text-xs text-gray-600 mb-1">Cash</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {formatCurrency(transactionStats.total_cash || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Compact Filter Bar */}
        <div className="bg-white rounded-lg border border-gray-200 mb-3 sm:mb-4">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-3 sm:p-3.5 hover:bg-gray-50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-medium text-gray-700">Filters</span>
              {(filters.start_date || filters.status || filters.payment_method) && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 p-3 sm:p-4 space-y-3">
              {/* Date Presets - Horizontal Scroll on Mobile */}
              <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
                  {['all', 'today', 'week', 'month'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyDatePreset(preset)}
                      className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors whitespace-nowrap border ${
                        datePreset === preset
                          ? 'bg-[#00C853] text-white border-[#00C853]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {preset === 'all' ? 'All Time' : preset === 'today' ? 'Today' : preset === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => handleCustomDateChange('start_date', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00C853] focus:border-[#00C853]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => handleCustomDateChange('end_date', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00C853] focus:border-[#00C853]"
                  />
                </div>
              </div>

              {/* Status and Payment Method */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00C853] focus:border-[#00C853]"
                  >
                    <option value="">All</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment</label>
                  <select
                    value={filters.payment_method}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00C853] focus:border-[#00C853]"
                  >
                    <option value="">All</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transactions List */}
        {transactionsLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C853] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-xl text-gray-700 font-medium">No transactions found</p>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or make a sale to see transactions here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {/* Transaction Header - Clickable */}
                <div
                  className="p-3 sm:p-3.5 cursor-pointer"
                  onClick={() => toggleTransactionDetails(transaction.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: ID + Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs sm:text-sm font-mono font-semibold text-gray-700">
                          #{transaction.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            transaction.status === 'completed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {transaction.status}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full uppercase">
                          {transaction.payment_method}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {formatDate(transaction.created_at)}
                      </p>
                    </div>

                    {/* Right: Amount + Items */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-base sm:text-lg font-bold text-gray-800">
                        {formatCurrency(transaction.total_amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.items?.length || 0} item{transaction.items?.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Expand Icon */}
                    <svg 
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                        expandedTransaction === transaction.id ? 'rotate-180' : ''
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Transaction Details (Expandable) */}
                {expandedTransaction === transaction.id && (
                  <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50/50">
                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      <h3 className="font-semibold text-gray-700 text-sm mb-2">Items</h3>
                      {transaction.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center bg-white p-2 rounded text-sm"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.product_name}</p>
                            <p className="text-xs text-gray-500">
                              {item.quantity} × {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                          <p className="font-semibold text-gray-700">{formatCurrency(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Payment Summary */}
                    <div className="space-y-1 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{formatCurrency(transaction.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid:</span>
                        <span className="font-medium">{formatCurrency(transaction.amount_paid)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Change:</span>
                        <span className="font-semibold">{formatCurrency(transaction.change)}</span>
                      </div>
                    </div>

                    {/* Notes */}
                    {transaction.notes && (
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-700 text-sm mb-1">Notes</h3>
                        <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                          {transaction.notes}
                        </p>
                      </div>
                    )}

                    {/* Cancel Button */}
                    {canCancelTransactions && transaction.status === 'completed' && (
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelClick(transaction.id);
                          }}
                          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium border border-red-600"
                        >
                          Cancel Transaction
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!transactionsLoading && transactions.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing {(transactionPagination.page - 1) * transactionPagination.limit + 1} to{' '}
                {Math.min(
                  transactionPagination.page * transactionPagination.limit,
                  transactionPagination.total
                )}{' '}
                of {transactionPagination.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(transactionPagination.page - 1)}
                  disabled={transactionPagination.page === 1}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 bg-[#00C853] text-white text-sm rounded-lg font-medium">
                  {transactionPagination.page}
                </span>
                <button
                  onClick={() => handlePageChange(transactionPagination.page + 1)}
                  disabled={transactionPagination.page === transactionPagination.total_pages}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false, transactionId: null })}
        title="Cancel Transaction?"
        message="This will restore the inventory for all items in this transaction. This action cannot be undone."
        confirmText="Cancel Transaction"
        cancelText="Keep Transaction"
        onConfirm={confirmCancelTransaction}
        variant="danger"
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default TransactionHistoryPage;
