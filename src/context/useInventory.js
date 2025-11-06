import { useContext } from 'react';
import { InventoryContext } from './InventoryContextObject';

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within InventoryProvider');
  }
  return context;
};


