import * as XLSX from 'xlsx';

/**
 * Parse an Excel file and extract data
 * @param {File} file - The Excel file to parse
 * @returns {Promise<Object>} - Parsed data with headers and rows
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }
        
        resolve({
          headers: Object.keys(jsonData[0] || {}),
          data: jsonData,
          rowCount: jsonData.length,
          sheetName: firstSheetName
        });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
};

/**
 * Auto-detect column mapping based on common header names
 * @param {Array<string>} headers - Column headers from Excel
 * @returns {Object} - Mapping of field names to Excel column names
 */
export const autoDetectColumns = (headers) => {
  const mapping = {
    name: null,
    category: null,
    price: null,
    cost_price: null,
    stock_quantity: null,
    low_stock_threshold: null,
    description: null,
    barcode: null
  };
  
  // Lowercase headers for case-insensitive matching
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  // Name field patterns
  const namePatterns = ['product name', 'name', 'product', 'item name', 'item'];
  mapping.name = headers[lowerHeaders.findIndex(h => namePatterns.some(p => h.includes(p)))] || null;
  
  // Category field patterns
  const categoryPatterns = ['category', 'type', 'group'];
  mapping.category = headers[lowerHeaders.findIndex(h => categoryPatterns.some(p => h.includes(p)))] || null;
  
  // Price field patterns
  const pricePatterns = ['price', 'selling price', 'sale price', 'retail price'];
  mapping.price = headers[lowerHeaders.findIndex(h => pricePatterns.some(p => h.includes(p)) && !h.includes('cost'))] || null;
  
  // Cost price field patterns
  const costPricePatterns = ['cost price', 'cost', 'purchase price', 'wholesale price'];
  mapping.cost_price = headers[lowerHeaders.findIndex(h => costPricePatterns.some(p => h.includes(p)))] || null;
  
  // Stock quantity field patterns
  const stockPatterns = ['stock quantity', 'quantity', 'stock', 'qty', 'inventory'];
  mapping.stock_quantity = headers[lowerHeaders.findIndex(h => stockPatterns.some(p => h.includes(p)))] || null;
  
  // Low stock threshold field patterns
  const thresholdPatterns = ['low stock threshold', 'threshold', 'minimum stock', 'reorder level'];
  mapping.low_stock_threshold = headers[lowerHeaders.findIndex(h => thresholdPatterns.some(p => h.includes(p)))] || null;
  
  // Description field patterns
  const descPatterns = ['description', 'desc', 'details', 'notes'];
  mapping.description = headers[lowerHeaders.findIndex(h => descPatterns.some(p => h.includes(p)))] || null;
  
  // Barcode field patterns
  const barcodePatterns = ['barcode', 'sku', 'code', 'product code'];
  mapping.barcode = headers[lowerHeaders.findIndex(h => barcodePatterns.some(p => h.includes(p)))] || null;
  
  return mapping;
};

/**
 * Map Excel row data to product fields based on column mapping
 * @param {Object} row - Excel row data
 * @param {Object} mapping - Column mapping
 * @returns {Object} - Mapped product data
 */
export const mapRowToProduct = (row, mapping) => {
  const product = {
    name: '',
    category: 'Uncategorized',
    price: 0,
    cost_price: 0,
    stock_quantity: 0,
    low_stock_threshold: 5,
    description: '',
    barcode: ''
  };
  
  // Map each field
  if (mapping.name && row[mapping.name]) {
    product.name = String(row[mapping.name]).trim();
  }
  
  if (mapping.category && row[mapping.category]) {
    product.category = String(row[mapping.category]).trim();
  }
  
  if (mapping.price && row[mapping.price]) {
    product.price = parseFloat(row[mapping.price]) || 0;
  }
  
  if (mapping.cost_price && row[mapping.cost_price]) {
    product.cost_price = parseFloat(row[mapping.cost_price]) || 0;
  }
  
  if (mapping.stock_quantity && row[mapping.stock_quantity]) {
    product.stock_quantity = parseInt(row[mapping.stock_quantity]) || 0;
  }
  
  if (mapping.low_stock_threshold && row[mapping.low_stock_threshold]) {
    product.low_stock_threshold = parseInt(row[mapping.low_stock_threshold]) || 5;
  }
  
  if (mapping.description && row[mapping.description]) {
    product.description = String(row[mapping.description]).trim();
  }
  
  if (mapping.barcode && row[mapping.barcode]) {
    product.barcode = String(row[mapping.barcode]).trim();
  }
  
  return product;
};

/**
 * Validate a single product record
 * @param {Object} product - Product data to validate
 * @param {number} rowNumber - Row number in Excel (for error reporting)
 * @returns {Array<Object>} - Array of validation errors
 */
export const validateProduct = (product, rowNumber) => {
  const errors = [];
  
  // Required: Product name
  if (!product.name || product.name.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'name',
      message: 'Product name is required'
    });
  }
  
  // Required: Price must be greater than 0
  if (product.price <= 0) {
    errors.push({
      row: rowNumber,
      field: 'price',
      message: 'Price must be greater than 0'
    });
  }
  
  // Price must be a valid number
  if (isNaN(product.price)) {
    errors.push({
      row: rowNumber,
      field: 'price',
      message: 'Price must be a valid number'
    });
  }
  
  // Cost price cannot be negative
  if (product.cost_price < 0) {
    errors.push({
      row: rowNumber,
      field: 'cost_price',
      message: 'Cost price cannot be negative'
    });
  }
  
  // Stock quantity cannot be negative
  if (product.stock_quantity < 0) {
    errors.push({
      row: rowNumber,
      field: 'stock_quantity',
      message: 'Stock quantity cannot be negative'
    });
  }
  
  // Low stock threshold cannot be negative
  if (product.low_stock_threshold < 0) {
    errors.push({
      row: rowNumber,
      field: 'low_stock_threshold',
      message: 'Low stock threshold cannot be negative'
    });
  }
  
  return errors;
};

/**
 * Process Excel data and prepare for import
 * @param {Array} excelData - Raw data from Excel
 * @param {Object} mapping - Column mapping
 * @returns {Object} - Validation result with products and errors
 */
export const processImportData = (excelData, mapping) => {
  const validProducts = [];
  const errors = [];
  
  excelData.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because Excel is 1-indexed and row 1 is header
    
    // Map row to product
    const product = mapRowToProduct(row, mapping);
    
    // Validate product
    const productErrors = validateProduct(product, rowNumber);
    
    if (productErrors.length === 0) {
      validProducts.push(product);
    } else {
      errors.push(...productErrors);
    }
  });
  
  return {
    validProducts,
    errors,
    totalRows: excelData.length,
    validCount: validProducts.length,
    errorCount: errors.length
  };
};

/**
 * Validate file type
 * @param {File} file - File to validate
 * @returns {boolean} - True if valid Excel file
 */
export const isValidExcelFile = (file) => {
  const validTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  
  const validExtensions = ['.xls', '.xlsx', '.csv'];
  
  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  return hasValidType || hasValidExtension;
};
