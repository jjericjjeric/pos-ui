import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import ImportResultsModal from '../components/ImportResultsModal';
import { downloadProductTemplate, downloadBlankTemplate } from '../utils/excelTemplateGenerator';
import {
  parseExcelFile,
  autoDetectColumns,
  processImportData,
  isValidExcelFile
} from '../services/importService';

const ImportProductsPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const bulkImportProducts = useAppStore((state) => state.bulkImportProducts);
  const importLoading = useAppStore((state) => state.importLoading);
  const importProgress = useAppStore((state) => state.importProgress);
  
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Columns, 3: Preview & Validate, 4: Import
  const [dragActive, setDragActive] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Handle file selection
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;
    
    // Validate file type
    if (!isValidExcelFile(selectedFile)) {
      alert('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit');
      return;
    }
    
    setFile(selectedFile);
    
    try {
      // Parse Excel file
      const parsed = await parseExcelFile(selectedFile);
      setExcelData(parsed);
      
      // Auto-detect columns
      const mapping = autoDetectColumns(parsed.headers);
      setColumnMapping(mapping);
      
      // Show preview (first 10 rows)
      setPreviewData(parsed.data.slice(0, 10));
      
      // Move to column mapping step
      setStep(2);
    } catch (error) {
      alert(`Error parsing file: ${error.message}`);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle column mapping change
  const handleMappingChange = (field, excelColumn) => {
    setColumnMapping({
      ...columnMapping,
      [field]: excelColumn || null
    });
  };

  // Validate and preview
  const handleValidateData = () => {
    if (!excelData || !columnMapping.name) {
      alert('Please map at least the Product Name column');
      return;
    }
    
    // Process and validate data
    const result = processImportData(excelData.data, columnMapping);
    setValidationResult(result);
    setImportErrors(result.errors);
    
    // Move to preview step
    setStep(3);
  };

  // Perform import
  const handleImport = async () => {
    if (!validationResult || validationResult.validCount === 0) {
      alert('No valid products to import');
      return;
    }
    
    const result = await bulkImportProducts(validationResult.validProducts);
    
    // Store result and show modal with detailed information
    setImportResult(result);
    setShowResultsModal(true);
    
    // Update error list in case user closes modal and wants to review
    setImportErrors(result.errors || []);
  };
  
  // Close results modal
  const handleCloseResultsModal = () => {
    setShowResultsModal(false);
    // If import was successful or partially successful, optionally reset
    if (importResult && importResult.imported > 0) {
      // Don't auto-navigate, let user click "View Products" button
    }
  };

  // Reset import
  const handleReset = () => {
    setFile(null);
    setExcelData(null);
    setColumnMapping({});
    setPreviewData([]);
    setValidationResult(null);
    setImportErrors([]);
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-screen bg-gray-50 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/products-management')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-900">Import Products from Excel</h1>
            </div>
            <div className="text-sm text-gray-600">
              Step {step} of 3
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: File Upload */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Template Download Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📥 Download Template</h3>
              <p className="text-sm text-blue-800 mb-3">
                New to bulk import? Download our Excel template to get started.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={downloadProductTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  Download Template (with samples)
                </button>
                <button
                  onClick={downloadBlankTemplate}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-600 hover:bg-blue-50 text-sm"
                >
                  Download Blank Template
                </button>
              </div>
            </div>

            {/* File Upload Zone */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Upload Excel File</h3>
              
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-3">
                  <div className="text-4xl">📄</div>
                  <div>
                    <p className="text-gray-700 font-medium mb-1">
                      Drag and drop your Excel file here
                    </p>
                    <p className="text-sm text-gray-500">or</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <span className="bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 inline-block">
                      Browse Files
                    </span>
                  </label>
                  <p className="text-xs text-gray-500">
                    Supported formats: .xlsx, .xls, .csv (Max 5MB, up to 5000 products)
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-3">📋 Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Download the template and fill in your product data</li>
                <li>Ensure <strong>Product Name</strong> and <strong>Price</strong> are filled (required)</li>
                <li>Upload the completed Excel file</li>
                <li>Review and map columns if auto-detection is incorrect</li>
                <li>Validate data and fix any errors</li>
                <li>Click Import to add products to your store</li>
              </ol>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && excelData && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Map Excel Columns to Product Fields</h3>
              <p className="text-sm text-gray-600 mb-4">
                We've auto-detected columns, but you can adjust the mapping below.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.name || ''}
                    onChange={(e) => handleMappingChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">-- Select Column --</option>
                    {excelData.headers.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnMapping.price || ''}
                    onChange={(e) => handleMappingChange('price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">-- Select Column --</option>
                    {excelData.headers.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={columnMapping.category || ''}
                    onChange={(e) => handleMappingChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">-- Select Column --</option>
                    {excelData.headers.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Cost Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost Price
                  </label>
                  <select
                    value={columnMapping.cost_price || ''}
                    onChange={(e) => handleMappingChange('cost_price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">-- Select Column --</option>
                    {excelData.headers.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <select
                    value={columnMapping.stock_quantity || ''}
                    onChange={(e) => handleMappingChange('stock_quantity', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">-- Select Column --</option>
                    {excelData.headers.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Low Stock Threshold */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <select
                    value={columnMapping.low_stock_threshold || ''}
                    onChange={(e) => handleMappingChange('low_stock_threshold', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">-- Select Column --</option>
                    {excelData.headers.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <select
                    value={columnMapping.description || ''}
                    onChange={(e) => handleMappingChange('description', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">-- Select Column --</option>
                    {excelData.headers.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode/SKU
                  </label>
                  <select
                    value={columnMapping.barcode || ''}
                    onChange={(e) => handleMappingChange('barcode', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">-- Select Column --</option>
                    {excelData.headers.map((header, idx) => (
                      <option key={idx} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Start Over
                </button>
                <button
                  onClick={handleValidateData}
                  disabled={!columnMapping.name || !columnMapping.price}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue to Preview
                </button>
              </div>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Data Preview (First 10 Rows)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {excelData.headers.map((header, idx) => (
                          <th key={idx} className="px-4 py-2 text-left font-medium text-gray-700">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {previewData.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-gray-50">
                          {excelData.headers.map((header, colIdx) => (
                            <td key={colIdx} className="px-4 py-2 text-gray-900">
                              {row[header] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Validation & Import */}
        {step === 3 && validationResult && (
          <div className="space-y-4">
            {/* Validation Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Validation Results</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{validationResult.totalRows}</div>
                  <div className="text-sm text-blue-900">Total Rows</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">{validationResult.validCount}</div>
                  <div className="text-sm text-green-900">Valid Products</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{validationResult.errorCount}</div>
                  <div className="text-sm text-red-900">Errors</div>
                </div>
              </div>

              {/* Error List */}
              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h4 className="font-semibold text-red-900 mb-2">❌ Validation Errors</h4>
                  <ul className="space-y-1 text-sm">
                    {importErrors.map((error, idx) => (
                      <li key={idx} className="text-red-700">
                        <strong>Row {error.row}:</strong> {error.field} - {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={importLoading}
                >
                  ← Back to Mapping
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={importLoading}
                >
                  Start Over
                </button>
                <button
                  onClick={handleImport}
                  disabled={importLoading || validationResult.validCount === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex-1"
                >
                  {importLoading
                    ? '⏳ Importing...'
                    : `Import ${validationResult.validCount} Products`}
                </button>
              </div>

              {/* Progress Bar */}
              {importLoading && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-900">
                      Uploading products in chunks...
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {importProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Processing {validationResult.validCount} products in batches of 50...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Import Results Modal */}
      <ImportResultsModal
        isOpen={showResultsModal}
        onClose={handleCloseResultsModal}
        result={importResult}
      />
    </div>
  );
};

export default ImportProductsPage;
