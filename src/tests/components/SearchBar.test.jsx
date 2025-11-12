import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../../components/SearchBar';

describe('SearchBar Component', () => {
  it('should render with placeholder text', () => {
    const mockOnChange = vi.fn();
    render(
      <SearchBar 
        value="" 
        onChange={mockOnChange} 
        placeholder="Search products..."
      />
    );
    
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('should call onChange when user types', () => {
    const mockOnChange = vi.fn();
    render(
      <SearchBar 
        value="" 
        onChange={mockOnChange} 
        placeholder="Search..."
      />
    );
    
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'coffee' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('coffee');
  });

  it('should display the current value', () => {
    const mockOnChange = vi.fn();
    render(
      <SearchBar 
        value="test query" 
        onChange={mockOnChange} 
        placeholder="Search..."
      />
    );
    
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('should clear search when clear button is clicked', () => {
    const mockOnChange = vi.fn();
    render(
      <SearchBar 
        value="search text" 
        onChange={mockOnChange} 
        placeholder="Search..."
      />
    );
    
    // Find and click clear button by aria-label
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should not show clear button when value is empty', () => {
    const mockOnChange = vi.fn();
    render(
      <SearchBar 
        value="" 
        onChange={mockOnChange} 
        placeholder="Search..."
      />
    );
    
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  it('should show clear button when value has text', () => {
    const mockOnChange = vi.fn();
    render(
      <SearchBar 
        value="some text" 
        onChange={mockOnChange} 
        placeholder="Search..."
      />
    );
    
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('should accept inputRef prop', () => {
    const mockOnChange = vi.fn();
    const inputRef = { current: null };
    
    render(
      <SearchBar 
        value="" 
        onChange={mockOnChange} 
        placeholder="Search..."
        inputRef={inputRef}
      />
    );
    
    expect(inputRef.current).toBeTruthy();
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
  });
});
