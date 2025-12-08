import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TransactionHistoryPage from '../../pages/TransactionHistoryPage';
import useAppStore from '../../store/useAppStore';

// Mock the useAppStore
vi.mock('../../store/useAppStore');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('TransactionHistoryPage', () => {
  const mockTransactions = [
    {
      id: 1,
      store_id: 1,
      user_id: 1,
      total_amount: 100.0,
      amount_paid: 100.0,
      change: 0,
      payment_method: 'cash',
      status: 'completed',
      created_at: '2025-12-06T10:00:00Z',
      items: [
        {
          id: 1,
          transaction_id: 1,
          product_id: 1,
          product_name: 'Test Product',
          quantity: 1,
          unit_price: 100.0,
          subtotal: 100.0,
        },
      ],
    },
    {
      id: 2,
      store_id: 1,
      user_id: 1,
      total_amount: 200.0,
      amount_paid: 250.0,
      change: 50.0,
      payment_method: 'card',
      status: 'completed',
      created_at: '2025-12-06T11:00:00Z',
      items: [
        {
          id: 2,
          transaction_id: 2,
          product_id: 2,
          product_name: 'Another Product',
          quantity: 2,
          unit_price: 100.0,
          subtotal: 200.0,
        },
      ],
    },
  ];

  const mockStats = {
    total_sales: 300.0,
    total_transactions: 2,
    average_transaction: 150.0,
    total_cash: 100.0,
    total_card: 200.0,
    total_online: 0,
  };

  const mockPagination = {
    page: 1,
    limit: 20,
    total: 2,
    total_pages: 1,
  };

  const defaultStoreState = {
    transactions: mockTransactions,
    transactionsLoading: false,
    transactionStats: mockStats,
    transactionPagination: mockPagination,
    loadTransactions: vi.fn(),
    loadTransactionStats: vi.fn(),
    cancelTransaction: vi.fn(),
    currentStore: { id: 1, name: 'Test Store' },
    userStores: [{ id: 1, name: 'Test Store', is_active: true }],
    storesLoading: false,
    user: { username: 'testuser', role: 'OWNER' },
    logout: vi.fn(),
  };

  beforeEach(() => {
    useAppStore.mockImplementation((selector) => {
      return selector(defaultStoreState);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders transaction history page', () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Transaction History/)).toBeInTheDocument();
  });

  it('displays stats cards', () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    // Stats section removed from Transaction History page
    expect(screen.queryByText('Total Sales')).not.toBeInTheDocument();
    // Stats cards no longer exist in Transaction History
  });

  it('displays transactions list', () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('expands transaction details on click', async () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    const firstTransaction = screen.getByText('#1').closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstTransaction);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Items')).toBeInTheDocument();
    });
  });

  it('toggles filter panel', async () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    const filterButton = screen.getByText('Filters');
    
    // Initially collapsed - All Time button should not be visible
    expect(screen.queryByText('All Time')).not.toBeInTheDocument();
    
    // Expand filters
    fireEvent.click(filterButton);
    
    await waitFor(() => {
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });
  });

  it('applies date preset filters', async () => {
    const mockLoadTransactions = vi.fn();
    useAppStore.mockImplementation((selector) => {
      return selector({ ...defaultStoreState, loadTransactions: mockLoadTransactions });
    });

    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    // Open filters
    fireEvent.click(screen.getByText('Filters'));

    await waitFor(() => {
      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);
    });

    // Should call loadTransactions with date filter
    await waitFor(() => {
      expect(mockLoadTransactions).toHaveBeenCalled();
    });
  });

  it('handles pagination', async () => {
    const mockLoadTransactions = vi.fn();
    const paginationState = {
      ...defaultStoreState,
      loadTransactions: mockLoadTransactions,
      transactionPagination: {
        page: 1,
        limit: 20,
        total: 50,
        total_pages: 3,
      },
    };

    useAppStore.mockImplementation((selector) => selector(paginationState));

    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockLoadTransactions).toHaveBeenCalled();
    });
  });

  it('shows cancel button for admin/owner', () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    // Expand first transaction
    const firstTransaction = screen.getByText('#1').closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstTransaction);

    // Cancel button should be visible for completed transactions
    waitFor(() => {
      expect(screen.getByText('Cancel Transaction')).toBeInTheDocument();
    });
  });

  it('hides cancel button for non-admin users', () => {
    useAppStore.mockImplementation((selector) => {
      return selector({
        ...defaultStoreState,
        user: { username: 'testuser', role: 'STAFF' },
      });
    });

    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    // Expand first transaction
    const firstTransaction = screen.getByText('#1').closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstTransaction);

    // Cancel button should NOT be visible for staff
    expect(screen.queryByText('Cancel Transaction')).not.toBeInTheDocument();
  });

  it('opens cancel confirmation dialog', async () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    // Expand first transaction
    const firstTransaction = screen.getByText('#1').closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstTransaction);

    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel Transaction');
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Cancel Transaction?')).toBeInTheDocument();
    });
  });

  it('calls cancelTransaction when confirmed', async () => {
    const mockCancelTransaction = vi.fn().mockResolvedValue({});
    useAppStore.mockImplementation((selector) => {
      return selector({ ...defaultStoreState, cancelTransaction: mockCancelTransaction });
    });

    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    // Expand first transaction
    const firstTransaction = screen.getByText('#1').closest('div[class*="cursor-pointer"]');
    fireEvent.click(firstTransaction);

    // Click cancel button
    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel Transaction');
      fireEvent.click(cancelButton);
    });

    // Confirm cancellation
    await waitFor(() => {
      const confirmButton = screen.getAllByText('Cancel Transaction').find(
        (button) => button.closest('[role="dialog"]')
      );
      if (confirmButton) {
        fireEvent.click(confirmButton);
      }
    });

    await waitFor(() => {
      expect(mockCancelTransaction).toHaveBeenCalledWith(1);
    });
  });

  it('displays loading state', () => {
    useAppStore.mockImplementation((selector) => {
      return selector({ ...defaultStoreState, transactionsLoading: true, transactions: [] });
    });

    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
  });

  it('displays empty state when no transactions', () => {
    useAppStore.mockImplementation((selector) => {
      return selector({ ...defaultStoreState, transactions: [], transactionsLoading: false });
    });

    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    expect(screen.getByText('No transactions found')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    const mockLoadTransactions = vi.fn();
    useAppStore.mockImplementation((selector) => {
      return selector({ ...defaultStoreState, loadTransactions: mockLoadTransactions });
    });

    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    // Open filters
    fireEvent.click(screen.getByText('Filters'));

    await waitFor(() => {
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    // Find status select by its options
    const statusSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(statusSelect, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(mockLoadTransactions).toHaveBeenCalled();
    });
  });

  it('filters by payment method', async () => {
    const mockLoadTransactions = vi.fn();
    useAppStore.mockImplementation((selector) => {
      return selector({ ...defaultStoreState, loadTransactions: mockLoadTransactions });
    });

    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    // Open filters
    fireEvent.click(screen.getByText('Filters'));

    await waitFor(() => {
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });

    // Find payment select (second combobox)
    const paymentSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(paymentSelect, { target: { value: 'cash' } });

    await waitFor(() => {
      expect(mockLoadTransactions).toHaveBeenCalled();
    });
  });

  it('navigates back to POS on back button click', () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    const backButton = screen.getByLabelText('Back to POS');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/pos');
  });

  it('formats currency correctly', () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    // Check if amounts are formatted with currency symbol
    const amounts = screen.getAllByText(/₱/);
    expect(amounts.length).toBeGreaterThan(0);
  });

  it('displays transaction badges correctly', () => {
    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    expect(screen.getAllByText('completed').length).toBeGreaterThan(0);
    expect(screen.getByText('cash')).toBeInTheDocument();
    expect(screen.getByText('card')).toBeInTheDocument();
  });

  it('loads data on mount', async () => {
    const mockLoadTransactions = vi.fn().mockResolvedValue();
    const mockLoadTransactionStats = vi.fn().mockResolvedValue();

    useAppStore.mockImplementation((selector) => {
      return selector({
        ...defaultStoreState,
        loadTransactions: mockLoadTransactions,
        loadTransactionStats: mockLoadTransactionStats,
      });
    });

    render(
      <BrowserRouter>
        <TransactionHistoryPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockLoadTransactions).toHaveBeenCalled();
      // loadTransactionStats is no longer called from TransactionHistoryPage
    });
  });
});
