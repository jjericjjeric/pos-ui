import { useNavigate } from 'react-router-dom';

/**
 * ImportResultsModal - Shows detailed results after bulk import
 * Displays success/failure counts, error details, and action buttons
 */
const ImportResultsModal = ({ isOpen, onClose, result }) => {
  const navigate = useNavigate();

  if (!isOpen || !result) return null;

  const { imported, failed, total, errors = [], hasPartialSuccess, success } = result;
  const successRate = total > 0 ? ((imported / total) * 100).toFixed(1) : 0;

  // Categorize errors by type
  const errorsByType = errors.reduce((acc, error) => {
    const type = error.field || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(error);
    return acc;
  }, {});

  const getStatusColor = () => {
    if (success) return 'green';
    if (hasPartialSuccess) return 'yellow';
    return 'red';
  };

  const getStatusIcon = () => {
    if (success) return '✅';
    if (hasPartialSuccess) return '⚠️';
    return '❌';
  };

  const getStatusMessage = () => {
    if (success) return 'All Products Imported Successfully!';
    if (hasPartialSuccess) return 'Import Completed with Some Errors';
    return 'Import Failed';
  };

  const downloadErrorReport = () => {
    // Create CSV content
    const headers = ['Row Number', 'Field', 'Error Message'];
    const rows = errors.map(err => [
      err.row_number || 'N/A',
      err.field || 'Unknown',
      err.message || 'No details'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download as file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const statusColor = getStatusColor();
  const statusBgColor = `bg-${statusColor}-50`;
  const statusBorderColor = `border-${statusColor}-200`;
  const statusTextColor = `text-${statusColor}-900`;
  const statusIconBgColor = `bg-${statusColor}-100`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`${statusBgColor} ${statusBorderColor} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`${statusIconBgColor} rounded-full p-2 text-2xl`}>
                {getStatusIcon()}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${statusTextColor}`}>
                  {getStatusMessage()}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Import completed on {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <div className="text-sm text-blue-900">Total Rows</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{imported}</div>
              <div className="text-sm text-green-900">✅ Imported</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{failed}</div>
              <div className="text-sm text-red-900">❌ Failed</div>
            </div>
          </div>

          {/* Success Rate Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Success Rate</span>
              <span className="font-semibold">{successRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${success ? 'bg-green-500' : hasPartialSuccess ? 'bg-yellow-500' : 'bg-red-500'} transition-all duration-500`}
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error Details */}
        {errors.length > 0 && (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                ❌ Error Details ({errors.length} errors)
              </h3>
              {errors.length > 0 && (
                <button
                  onClick={downloadErrorReport}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <span>📥</span>
                  <span>Download CSV</span>
                </button>
              )}
            </div>

            {/* Group errors by type */}
            <div className="space-y-3">
              {Object.entries(errorsByType).map(([type, typeErrors]) => (
                <div key={type} className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="font-medium text-red-900 mb-2 capitalize">
                    {type === 'name' && '📝 Product Name Errors'}
                    {type === 'database' && '💾 Database Errors'}
                    {type === 'savepoint' && '🔄 Transaction Errors'}
                    {type !== 'name' && type !== 'database' && type !== 'savepoint' && `${type} Errors`}
                    <span className="ml-2 text-sm font-normal">({typeErrors.length})</span>
                  </div>
                  <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                    {typeErrors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="text-red-700 flex items-start">
                        <span className="font-semibold mr-2 shrink-0">
                          Row {error.row_number}:
                        </span>
                        <span className="flex-1">{error.message}</span>
                      </li>
                    ))}
                    {typeErrors.length > 10 && (
                      <li className="text-red-600 italic">
                        ... and {typeErrors.length - 10} more errors. Download CSV for full details.
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Message (no errors) */}
        {errors.length === 0 && success && (
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Perfect Import!
              </h3>
              <p className="text-green-700">
                All {imported} products were imported successfully without any errors.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
            >
              Close
            </button>
            {imported > 0 && (
              <button
                onClick={() => {
                  onClose();
                  navigate('/products-management');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                View Products
              </button>
            )}
            {!success && (
              <button
                onClick={() => {
                  onClose();
                  // Stay on import page for retry
                }}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportResultsModal;
