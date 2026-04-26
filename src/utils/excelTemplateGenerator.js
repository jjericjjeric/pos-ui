import * as XLSX from 'xlsx';

/**
 * Generate and download a product import template Excel file
 * Users can fill this template and import it back into the system
 */
export const downloadProductTemplate = () => {
  // Sample data showing the expected format
  const template = [
    {
      'Product Name': 'Sample Product 1',
      'Category': 'Electronics',
      'Price': 99.99,
      'Cost Price': 50.00,
      'Stock Quantity': 100,
      'Low Stock Threshold': 10,
      'Description': 'This is a sample product description',
      'Barcode': '123456789012'
    },
    {
      'Product Name': 'Sample Product 2',
      'Category': 'Clothing',
      'Price': 29.99,
      'Cost Price': 15.00,
      'Stock Quantity': 50,
      'Low Stock Threshold': 5,
      'Description': 'Another sample product',
      'Barcode': '987654321098'
    },
    {
      'Product Name': 'Sample Product 3',
      'Category': 'Food',
      'Price': 4.99,
      'Cost Price': 2.00,
      'Stock Quantity': 200,
      'Low Stock Threshold': 20,
      'Description': 'Sample food item',
      'Barcode': ''
    }
  ];
  
  // Convert to worksheet
  const ws = XLSX.utils.json_to_sheet(template);
  
  // Set column widths for better readability
  ws['!cols'] = [
    { wch: 25 }, // Product Name
    { wch: 15 }, // Category
    { wch: 10 }, // Price
    { wch: 12 }, // Cost Price
    { wch: 15 }, // Stock Quantity
    { wch: 20 }, // Low Stock Threshold
    { wch: 40 }, // Description
    { wch: 15 }  // Barcode
  ];
  
  // Create workbook and add worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  
  // Add instructions sheet
  const instructions = [
    { 'Field': 'Product Name', 'Required': 'Yes', 'Description': 'Unique name for the product' },
    { 'Field': 'Category', 'Required': 'No', 'Description': 'Product category (default: Uncategorized)' },
    { 'Field': 'Price', 'Required': 'Yes', 'Description': 'Selling price (must be greater than 0)' },
    { 'Field': 'Cost Price', 'Required': 'No', 'Description': 'Cost price for profit calculation (default: 0)' },
    { 'Field': 'Stock Quantity', 'Required': 'No', 'Description': 'Initial stock quantity (default: 0)' },
    { 'Field': 'Low Stock Threshold', 'Required': 'No', 'Description': 'Alert when stock falls below this (default: 5)' },
    { 'Field': 'Description', 'Required': 'No', 'Description': 'Product description or notes' },
    { 'Field': 'Barcode', 'Required': 'No', 'Description': 'Product barcode/SKU (optional)' }
  ];
  
  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');
  
  // Generate file and trigger download
  XLSX.writeFile(wb, 'product_import_template.xlsx');
};

/**
 * Generate a blank template (without sample data)
 */
export const downloadBlankTemplate = () => {
  const template = [
    {
      'Product Name': '',
      'Category': '',
      'Price': '',
      'Cost Price': '',
      'Stock Quantity': '',
      'Low Stock Threshold': '',
      'Description': '',
      'Barcode': ''
    }
  ];
  
  const ws = XLSX.utils.json_to_sheet(template);
  ws['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 20 },
    { wch: 40 },
    { wch: 15 }
  ];
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  
  XLSX.writeFile(wb, 'product_import_blank_template.xlsx');
};
