/**
 * ============================================================================
 * VALIDATION SCHEMAS
 * ============================================================================
 * 
 * Centralized validation schemas for all entities
 * Use these across the app to ensure consistency
 */

/**
 * Product validation schema
 */
export const productSchema = {
  title: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 255,
    error: 'Title must be between 3 and 255 characters'
  },
  description: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 5000,
    error: 'Description must be between 10 and 5000 characters'
  },
  base_price: {
    type: 'number',
    required: true,
    min: 0.01,
    error: 'Price must be greater than 0'
  },
  category_id: {
    type: 'string',
    required: true,
    error: 'Category is required'
  },
  vendor_id: {
    type: 'string',
    required: true,
    error: 'Vendor is required'
  },
  inventory_quantity: {
    type: 'number',
    required: true,
    min: 0,
    error: 'Inventory quantity cannot be negative'
  },
  image_url: {
    type: 'string',
    required: false,
    maxLength: 2048,
    error: 'Image URL is too long'
  },
  sku: {
    type: 'string',
    required: false,
    maxLength: 100,
    error: 'SKU is too long'
  }
};

/**
 * Vendor validation schema
 */
export const vendorSchema = {
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 255,
    error: 'Name must be between 2 and 255 characters'
  },
  description: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 1000,
    error: 'Description must be between 10 and 1000 characters'
  },
  location: {
    type: 'string',
    required: false,
    maxLength: 255,
    error: 'Location is too long'
  },
  phone: {
    type: 'string',
    required: false,
    pattern: /^\+?[\d\s\-\(\)]{10,}$/,
    error: 'Invalid phone number'
  },
  email: {
    type: 'string',
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    error: 'Invalid email address'
  },
  website: {
    type: 'string',
    required: false,
    pattern: /^https?:\/\/.+\..+/,
    error: 'Invalid website URL'
  }
};

/**
 * Order validation schema
 */
export const orderSchema = {
  status: {
    type: 'string',
    required: true,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    error: 'Invalid order status'
  },
  tracking_number: {
    type: 'string',
    required: false,
    maxLength: 100,
    error: 'Tracking number is too long'
  },
  notes: {
    type: 'string',
    required: false,
    maxLength: 1000,
    error: 'Notes are too long'
  }
};

/**
 * User profile validation schema
 */
export const userProfileSchema = {
  full_name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 255,
    error: 'Name must be between 2 and 255 characters'
  },
  email: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    error: 'Invalid email address'
  },
  phone: {
    type: 'string',
    required: false,
    pattern: /^\+?[\d\s\-\(\)]{10,}$/,
    error: 'Invalid phone number'
  },
  address: {
    type: 'string',
    required: false,
    maxLength: 500,
    error: 'Address is too long'
  },
  city: {
    type: 'string',
    required: false,
    maxLength: 100,
    error: 'City is too long'
  },
  country: {
    type: 'string',
    required: false,
    maxLength: 100,
    error: 'Country is too long'
  },
  postal_code: {
    type: 'string',
    required: false,
    maxLength: 20,
    error: 'Postal code is too long'
  }
};

/**
 * Validator utility
 */
export class Validator {
  constructor(schema) {
    this.schema = schema;
    this.errors = {};
  }

  /**
   * Validate data against schema
   */
  validate(data) {
    this.errors = {};

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        this.errors[field] = `${field} is required`;
        continue;
      }

      // Skip validation if not required and not provided
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Check type
      if (rules.type && typeof value !== rules.type) {
        this.errors[field] = `${field} must be ${rules.type}`;
        continue;
      }

      // Check string length
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          this.errors[field] = `${field} must be at least ${rules.minLength} characters`;
          continue;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          this.errors[field] = `${field} cannot exceed ${rules.maxLength} characters`;
          continue;
        }
      }

      // Check number range
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          this.errors[field] = `${field} must be at least ${rules.min}`;
          continue;
        }
        if (rules.max !== undefined && value > rules.max) {
          this.errors[field] = `${field} cannot exceed ${rules.max}`;
          continue;
        }
      }

      // Check pattern (regex)
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        this.errors[field] = rules.error || `${field} format is invalid`;
        continue;
      }

      // Check enum
      if (rules.enum && !rules.enum.includes(value)) {
        this.errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
        continue;
      }

      // Custom validation function
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(value);
        if (customError) {
          this.errors[field] = customError;
        }
      }
    }

    return Object.keys(this.errors).length === 0;
  }

  /**
   * Get all errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get error for specific field
   */
  getError(field) {
    return this.errors[field];
  }

  /**
   * Check if there are any errors
   */
  hasErrors() {
    return Object.keys(this.errors).length > 0;
  }

  /**
   * Get errors as array
   */
  getErrorsArray() {
    return Object.entries(this.errors).map(([field, message]) => ({
      field,
      message
    }));
  }

  /**
   * Clear errors
   */
  clear() {
    this.errors = {};
  }
}

/**
 * Quick validation helper
 */
export function validateData(data, schema) {
  const validator = new Validator(schema);
  const isValid = validator.validate(data);
  return {
    isValid,
    errors: validator.getErrors(),
    errorsArray: validator.getErrorsArray(),
    hasErrors: validator.hasErrors()
  };
}

/**
 * Export validators for each entity type
 */
export const validators = {
  product: (data) => validateData(data, productSchema),
  vendor: (data) => validateData(data, vendorSchema),
  order: (data) => validateData(data, orderSchema),
  userProfile: (data) => validateData(data, userProfileSchema)
};

/**
 * Sanitizer utilities
 */
export const sanitizers = {
  /**
   * Trim strings and remove null/undefined
   */
  cleanObject(obj) {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'string') {
        cleaned[key] = value.trim();
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  },

  /**
   * Convert string numbers to actual numbers
   */
  normalizeNumbers(obj, numberFields) {
    const normalized = { ...obj };
    for (const field of numberFields) {
      if (field in normalized && normalized[field] !== null) {
        normalized[field] = Number(normalized[field]);
      }
    }
    return normalized;
  },

  /**
   * Convert strings to booleans
   */
  normalizeBooleans(obj, booleanFields) {
    const normalized = { ...obj };
    for (const field of booleanFields) {
      if (field in normalized) {
        const value = normalized[field];
        if (typeof value === 'string') {
          normalized[field] = value.toLowerCase() === 'true';
        }
      }
    }
    return normalized;
  },

  /**
   * Format data for submission
   */
  formatForSubmit(obj, { numberFields = [], booleanFields = [] } = {}) {
    let result = sanitizers.cleanObject(obj);
    if (numberFields.length) result = sanitizers.normalizeNumbers(result, numberFields);
    if (booleanFields.length) result = sanitizers.normalizeBooleans(result, booleanFields);
    return result;
  }
};

export default {
  productSchema,
  vendorSchema,
  orderSchema,
  userProfileSchema,
  Validator,
  validateData,
  validators,
  sanitizers
};
