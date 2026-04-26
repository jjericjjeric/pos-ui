#!/usr/bin/env python3
"""
Convert inventory Excel file to POS import template format
"""
import pandas as pd
import sys
from pathlib import Path

def convert_inventory_to_template(input_file, output_file):
    """
    Convert inventory Excel file to POS template format
    
    Expected template columns:
    - Product Name (required)
    - Category
    - Price (required)
    - Cost Price
    - Stock Quantity
    - Low Stock Threshold
    - Description
    - Barcode
    """
    try:
        # Read the Inventory sheet
        print(f"Reading {input_file}...")
        df = pd.read_excel(input_file, sheet_name='Inventory')
        
        print(f"Found {len(df)} rows in Inventory sheet")
        print(f"Columns: {list(df.columns)}")
        
        # Display first few rows to understand structure
        print("\nFirst 5 rows:")
        print(df.head())
        
        # Create template DataFrame
        # We'll need to map the columns from the inventory sheet
        # Let's detect common column patterns
        
        template_df = pd.DataFrame()
        
        # Try to find and map columns
        column_mapping = {}
        
        # Common patterns for each field
        name_patterns = ['name', 'product', 'item', 'description', 'title']
        category_patterns = ['category', 'type', 'group', 'class']
        price_patterns = ['price', 'sell', 'retail', 'selling price']
        cost_patterns = ['cost', 'purchase', 'wholesale']
        stock_patterns = ['stock', 'quantity', 'qty', 'inventory', 'units', 'on hand']
        barcode_patterns = ['barcode', 'sku', 'code', 'upc']
        
        # Find matching columns (case-insensitive)
        for col in df.columns:
            col_lower = str(col).lower()
            
            # Match product name
            if not column_mapping.get('name') and any(p in col_lower for p in name_patterns):
                column_mapping['name'] = col
            
            # Match category
            if not column_mapping.get('category') and any(p in col_lower for p in category_patterns):
                column_mapping['category'] = col
            
            # Match price (excluding cost)
            if not column_mapping.get('price') and any(p in col_lower for p in price_patterns) and 'cost' not in col_lower:
                column_mapping['price'] = col
            
            # Match cost price
            if not column_mapping.get('cost_price') and any(p in col_lower for p in cost_patterns):
                column_mapping['cost_price'] = col
            
            # Match stock quantity
            if not column_mapping.get('stock') and any(p in col_lower for p in stock_patterns):
                column_mapping['stock'] = col
            
            # Match barcode/SKU
            if not column_mapping.get('barcode') and any(p in col_lower for p in barcode_patterns):
                column_mapping['barcode'] = col
        
        print(f"\nDetected column mappings:")
        for key, value in column_mapping.items():
            print(f"  {key} -> {value}")
        
        # Build template DataFrame
        template_df['Product Name'] = df[column_mapping['name']] if column_mapping.get('name') else ''
        template_df['Category'] = df[column_mapping['category']] if column_mapping.get('category') else 'Uncategorized'
        template_df['Price'] = df[column_mapping['price']] if column_mapping.get('price') else 0
        template_df['Cost Price'] = df[column_mapping['cost_price']] if column_mapping.get('cost_price') else 0
        template_df['Stock Quantity'] = df[column_mapping['stock']] if column_mapping.get('stock') else 0
        template_df['Low Stock Threshold'] = 5  # Default
        template_df['Description'] = ''  # Empty by default
        template_df['Barcode'] = df[column_mapping['barcode']] if column_mapping.get('barcode') else ''
        
        # Clean data
        template_df['Product Name'] = template_df['Product Name'].fillna('').astype(str).str.strip()
        template_df['Category'] = template_df['Category'].fillna('Uncategorized').astype(str).str.strip()
        template_df['Price'] = pd.to_numeric(template_df['Price'], errors='coerce').fillna(0)
        template_df['Cost Price'] = pd.to_numeric(template_df['Cost Price'], errors='coerce').fillna(0)
        template_df['Stock Quantity'] = pd.to_numeric(template_df['Stock Quantity'], errors='coerce').fillna(0).astype(int)
        template_df['Barcode'] = template_df['Barcode'].fillna('').astype(str).str.strip()
        
        # Remove rows with empty product names
        template_df = template_df[template_df['Product Name'] != '']
        
        print(f"\nConverted {len(template_df)} valid products")
        
        # Create Excel writer with multiple sheets
        with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
            # Write products sheet
            template_df.to_excel(writer, sheet_name='Products', index=False)
            
            # Write instructions sheet
            instructions = pd.DataFrame({
                'Field': ['Product Name', 'Category', 'Price', 'Cost Price', 'Stock Quantity', 'Low Stock Threshold', 'Description', 'Barcode'],
                'Required': ['Yes', 'No', 'Yes', 'No', 'No', 'No', 'No', 'No'],
                'Description': [
                    'Unique name for the product',
                    'Product category (default: Uncategorized)',
                    'Selling price (must be greater than 0)',
                    'Cost price for profit calculation (default: 0)',
                    'Initial stock quantity (default: 0)',
                    'Alert when stock falls below this (default: 5)',
                    'Product description or notes',
                    'Product barcode/SKU (optional)'
                ]
            })
            instructions.to_excel(writer, sheet_name='Instructions', index=False)
            
            # Adjust column widths
            worksheet = writer.sheets['Products']
            for idx, col in enumerate(template_df.columns):
                max_length = max(
                    template_df[col].astype(str).map(len).max(),
                    len(col)
                ) + 2
                worksheet.column_dimensions[chr(65 + idx)].width = min(max_length, 50)
        
        print(f"\n✅ Successfully created: {output_file}")
        print(f"Ready to import into POS system!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    # Input file (the uploaded file)
    input_file = '777 PERFORMANCES INVENTORY (1).xlsx'
    
    # Output file
    output_file = 'POS_Import_Ready.xlsx'
    
    # Convert
    success = convert_inventory_to_template(input_file, output_file)
    
    if success:
        print(f"\n🎉 Conversion complete! Use '{output_file}' for import.")
    else:
        print(f"\n❌ Conversion failed. Please check the error messages above.")
        sys.exit(1)
