import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for handling image upload and compression
 * Provides camera capture and file upload functionality with automatic compression
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.maxSize - Maximum dimension in pixels (default: 400)
 * @param {number} options.quality - JPEG compression quality 0-1 (default: 0.7)
 * @param {number} options.maxFileSize - Maximum file size in bytes (default: 5MB)
 * @returns {Object} Hook utilities and state
 */
export const useImageCompression = (options = {}) => {
  const {
    maxSize = 400,
    quality = 0.7,
    maxFileSize = 5 * 1024 * 1024 // 5MB
  } = options;

  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  /**
   * Compress and resize image to specified dimensions
   * @param {string} base64 - Base64 encoded image
   * @returns {Promise<string>} Compressed base64 image
   */
  const compressImage = (base64) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Resize to max dimension while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with specified quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    });
  };

  /**
   * Handle image file selection and compression
   * @param {File} file - Image file from input
   * @param {Function} onSuccess - Callback with compressed image
   * @param {Function} onError - Callback with error message
   */
  const handleImageChange = async (file, onSuccess, onError) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      onError?.(`Image size should be less than ${maxFileSize / (1024 * 1024)}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressedImage = await compressImage(reader.result);
          setImagePreview(compressedImage);
          onSuccess?.(compressedImage);
        } catch (error) {
          onError?.(error.message);
        }
      };
      reader.onerror = () => {
        onError?.('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      onError?.(error.message);
    }
  };

  /**
   * Open camera for photo capture (mobile)
   */
  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  }, []);

  /**
   * Open file picker for image selection
   */
  const handleFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  }, []);

  /**
   * Remove current image preview
   */
  const removeImage = useCallback(() => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * Set image preview manually (useful for editing existing products)
   */
  const setImage = useCallback((imageUrl) => {
    setImagePreview(imageUrl);
  }, []);

  return {
    imagePreview,
    fileInputRef,
    handleImageChange,
    handleCameraCapture,
    handleFileSelect,
    removeImage,
    setImage,
    compressImage
  };
};
