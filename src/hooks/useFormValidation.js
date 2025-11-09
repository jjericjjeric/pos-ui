import { useState, useCallback } from 'react';

/**
 * useFormValidation Hook
 * 
 * Manages form state, validation errors, and change handlers
 * Automatically clears errors when user types in a field
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Function} validationRules - Function that returns validation errors
 * 
 * @returns {Object} Form state and handlers
 * 
 * @example
 * const { values, errors, handleChange, validate, resetForm, setFieldError } = useFormValidation(
 *   { name: '', price: '', stock: '' },
 *   (values) => {
 *     const errors = {};
 *     if (!values.name.trim()) errors.name = 'Name is required';
 *     if (!values.price || values.price < 0) errors.price = 'Invalid price';
 *     return errors;
 *   }
 * );
 * 
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   if (validate()) {
 *     // Form is valid, submit data
 *   }
 * };
 */
export const useFormValidation = (initialValues = {}, validationRules = () => ({})) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /**
   * Handle input change
   * Automatically clears error for the changed field
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  /**
   * Handle field blur - mark as touched
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  /**
   * Validate the form
   * @returns {boolean} True if valid, false if errors exist
   */
  const validate = useCallback(() => {
    const newErrors = validationRules(values);
    setErrors(newErrors);
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    return Object.keys(newErrors).length === 0;
  }, [values, validationRules]);

  /**
   * Set a specific field error manually
   */
  const setFieldError = useCallback((fieldName, errorMessage) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));
  }, []);

  /**
   * Set a specific field value manually
   */
  const setFieldValue = useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Set multiple values at once
   */
  const setFormValues = useCallback((newValues) => {
    setValues(prev => ({
      ...prev,
      ...newValues
    }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    resetForm,
    setFieldError,
    setFieldValue,
    setFormValues
  };
};
