import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../../hooks/useFormValidation';

describe('useFormValidation Hook', () => {
  const initialValues = {
    name: '',
    email: '',
    password: '',
  };

  const validationRules = (values) => {
    const errors = {};
    
    if (!values.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!values.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    return errors;
  };

  it('should initialize with empty values and no errors', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
  });

  it('should update values when handleChange is called', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John Doe' }
      });
    });

    expect(result.current.values.name).toBe('John Doe');
  });

  it('should mark field as touched on blur', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleBlur({
        target: { name: 'email' }
      });
    });

    // handleBlur only marks field as touched, doesn't validate
    expect(result.current.touched.email).toBe(true);
  });

  it('should clear error when user types in a field', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    // First validate to set errors
    act(() => {
      result.current.validate();
    });

    expect(result.current.errors.email).toBe('Email is required');

    // Typing in field should clear the error
    act(() => {
      result.current.handleChange({
        target: { name: 'email', value: 'user@example.com' }
      });
    });

    // Error should be cleared
    expect(result.current.errors.email).toBe('');
  });

  it('should validate all fields when validate is called', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    let isValid;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.name).toBeTruthy();
    expect(result.current.errors.email).toBeTruthy();
    expect(result.current.errors.password).toBeTruthy();
  });

  it('should return true when all fields are valid', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.setFormValues({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
    });

    let isValid;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(true);
    expect(Object.keys(result.current.errors)).toHaveLength(0);
  });

  it('should reset form to initial values', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'John' }
      });
      result.current.handleChange({
        target: { name: 'email', value: 'john@example.com' }
      });
    });

    expect(result.current.values.name).toBe('John');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
  });

  it('should update single field value with setFieldValue', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    act(() => {
      result.current.setFieldValue('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('should update all values with setFormValues', () => {
    const { result } = renderHook(() => 
      useFormValidation(initialValues, validationRules)
    );

    const newValues = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'secure123',
    };

    act(() => {
      result.current.setFormValues(newValues);
    });

    expect(result.current.values).toEqual(newValues);
  });

  it('should handle validation with multiple errors', () => {
    const { result } = renderHook(() => 
      useFormValidation(
        { name: '', email: 'invalid', password: '123' },
        validationRules
      )
    );

    act(() => {
      result.current.validate();
    });

    expect(result.current.errors.name).toBe('Name is required');
    expect(result.current.errors.email).toBe('Email is invalid');
    expect(result.current.errors.password).toBe('Password must be at least 6 characters');
  });
});
