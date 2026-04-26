/**
 * Convert 777 PERFORMANCES INVENTORY to POS Import Template format
 *
 * Data sources:
 *   Inventory sheet  → Part Name, Selling Price, Opening Cost, Current Stock
 *   Parts_List sheet → Category (exact), Reorder Level (Low Stock Threshold)
 *
 * Target template columns:
 *   Product Name | Category | Price | Cost Price | Stock Quantity |
 *   Low Stock Threshold | Description | Barcode
 */

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

function parseCurrency(val) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[,"]/g, '').trim());
  return isNaN(num) ? 0 : num;
}

function readSheetFromXlsx(xlsxPath, sheetKeyword) {
  const wb = XLSX.readFile(xlsxPath);
  const sheetName = wb.SheetNames.find(s =>
    s.toLowerCase().includes(sheetKeyword.toLowerCase())
  ) || wb.SheetNames[0];
  console.log(`  Reading "${sheetName}" from xlsx`);
  return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
}

function readCsv(csvPath) {
  const wb = XLSX.readFile(csvPath);
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
}

function convertInventory() {
  const xlsxPath      = path.join(__dirname, '../external/777 PERFORMANCES INVENTORY (1).xlsx');
  const invCsvPath    = path.join(__dirname, '../external/777 PERFORMANCES INVENTORY.xlsx - Inventory.csv');
  const partsCsvPath  = path.join(__dirname, '../external/777 PERFORMANCES INVENTORY.xlsx - Parts_List.csv');
  const outputPath    = path.join(__dirname, '../777_PERFORMANCES_POS_IMPORT.xlsx');

  // ── 1. Load Parts_List (Category + Reorder Level per Part ID) ────────────
  console.log('\n📋 Loading Parts_List...');
  let partsList = [];
  if (fs.existsSync(xlsxPath)) {
    try { partsList = readSheetFromXlsx(xlsxPath, 'parts'); } catch (e) { /* fall back */ }
  }
  if (partsList.length === 0 && fs.existsSync(partsCsvPath)) {
    console.log('  Falling back to Parts_List CSV');
    partsList = readCsv(partsCsvPath);
  }
  console.log(`  ${partsList.length} parts found`);

  // Build lookup map: partId → { category, reorderLevel }
  const partsMap = new Map();
  for (const row of partsList) {
    const id = String(row['Part ID'] || '').trim();
    if (!id || id.startsWith('#')) continue;
    partsMap.set(id, {
      category:     String(row['Category'] || '').trim() || 'Uncategorized',
      reorderLevel: parseCurrency(row['Reorder Level']) || 5,
    });
  }
  console.log(`  ${partsMap.size} unique Part IDs indexed`);

  // ── 2. Load Inventory sheet ───────────────────────────────────────────────
  console.log('\n📦 Loading Inventory sheet...');
  let invRows = [];
  if (fs.existsSync(xlsxPath)) {
    try { invRows = readSheetFromXlsx(xlsxPath, 'inventory'); } catch (e) { /* fall back */ }
  }
  if (invRows.length === 0 && fs.existsSync(invCsvPath)) {
    console.log('  Falling back to Inventory CSV');
    invRows = readCsv(invCsvPath);
  }
  console.log(`  ${invRows.length} rows found`);
  console.log('  Columns:', Object.keys(invRows[0] || {}));

  // ── 3. Map to template ────────────────────────────────────────────────────
  const products = [];
  let skipped = 0;

  for (const row of invRows) {
    const partName = String(row['Part Name'] || '').trim();

    // Skip invalid / formula-error rows
    if (!partName || partName.startsWith('#') || partName === 'nan') {
      skipped++;
      continue;
    }

    const partId      = String(row['Part ID'] || '').trim();
    const sellingPrice = parseCurrency(row['Selling Price']);
    const openingCost  = parseCurrency(row['Opening Cost']);
    const currentStock = Math.max(0, Math.round(parseCurrency(row['Current Stock'])));

    // Skip rows without a valid selling price
    if (sellingPrice <= 0) {
      skipped++;
      continue;
    }

    // Pull category & threshold from Parts_List; fall back gracefully
    const partsInfo  = partsMap.get(partId) || {};
    const category   = partsInfo.category     || 'Uncategorized';
    const threshold  = partsInfo.reorderLevel || 5;

    products.push({
      'Product Name':        partName,
      'Category':            category,
      'Price':               sellingPrice,
      'Cost Price':          openingCost,
      'Stock Quantity':      currentStock,
      'Low Stock Threshold': threshold,
      'Description':         partId ? `Part ID: ${partId}` : '',
      'Barcode':             partId,
    });
  }

  console.log(`\n✅ Converted: ${products.length} products`);
  console.log(`⏭  Skipped:   ${skipped} rows (missing price / invalid data)`);

  // Category breakdown
  const byCat = {};
  for (const p of products) byCat[p.Category] = (byCat[p.Category] || 0) + 1;
  console.log('\nProducts by category:');
  Object.entries(byCat).sort((a, b) => b[1] - a[1]).forEach(([cat, n]) =>
    console.log(`  ${String(n).padStart(3)}  ${cat}`)
  );

  // ── 4. Write Excel output ─────────────────────────────────────────────────
  const wb  = XLSX.utils.book_new();

  // Products sheet
  const ws = XLSX.utils.json_to_sheet(products);
  ws['!cols'] = [
    { wch: 48 }, // Product Name
    { wch: 28 }, // Category
    { wch: 10 }, // Price
    { wch: 12 }, // Cost Price
    { wch: 16 }, // Stock Quantity
    { wch: 22 }, // Low Stock Threshold
    { wch: 32 }, // Description
    { wch: 28 }, // Barcode
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  // Instructions sheet
  const instructions = [
    { Field: 'Product Name',        Required: 'Yes', Notes: 'Unique product name' },
    { Field: 'Category',            Required: 'No',  Notes: 'From Parts_List sheet (exact category name)' },
    { Field: 'Price',               Required: 'Yes', Notes: 'Selling price — must be > 0' },
    { Field: 'Cost Price',          Required: 'No',  Notes: 'Opening cost / purchase price' },
    { Field: 'Stock Quantity',      Required: 'No',  Notes: 'Current stock level from Inventory sheet' },
    { Field: 'Low Stock Threshold', Required: 'No',  Notes: 'Reorder Level from Parts_List sheet' },
    { Field: 'Description',         Required: 'No',  Notes: 'Part ID stored here for reference' },
    { Field: 'Barcode',             Required: 'No',  Notes: 'Part ID used as barcode / SKU' },
  ];
  const wsInstr = XLSX.utils.json_to_sheet(instructions);
  wsInstr['!cols'] = [{ wch: 24 }, { wch: 10 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  XLSX.writeFile(wb, outputPath);
  console.log(`\n🎉 File saved: ${outputPath}`);
  console.log('   Go to: Products Management → Import → Upload this file');
}

convertInventory();
