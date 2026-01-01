/**
 * Unified API Client - Single Source of Truth for All API Communication
 * 
 * Features:
 * - Centralized request/response handling
 * - Automatic retry logic with exponential backoff
 * - Request/response interceptors
 * - Consistent error handling
 * - Built-in timeout management
 * - Authentication token injection
 * - Response validation
 * - Request deduplication
 * - Loading state management
 * 
 * Usage:
 * const result = await apiClient.post('/vendor/products', { title: 'Product' });
 * const result = await apiClient.patch('/products/123', { price: 99.99 });
 */

import { supabase } from '../lib/customSupabaseClient.js';
import { API_CONFIG } from '../config/environment.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG = {
  timeout: API_CONFIG.timeout || 30000,
  retries: 3,
  retryDelay: 1000, // ms
  debug: API_CONFIG.debug || false
};

// Request deduplication - prevent duplicate requests
const pendingRequests = new Map();

// ============================================================================
// ERROR CLASSES
// ============================================================================

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

class TimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a request key for deduplication
 */
const getRequestKey = (method, url, data) => {
  // Only deduplicate GET requests (safe to retry)
  if (method !== 'GET') return null;
  return `${method}:${url}`;
};

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt, baseDelay = 1000) => {
  return baseDelay * Math.pow(2, attempt - 1);
};

/**
 * Validate required fields
 */
const validateRequired = (data, fields) => {
  const errors = {};
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors[field] = `${field} is required`;
    }
  }
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Missing required fields', errors);
  }
};

/**
 * Validate data constraints
 */
const validateConstraints = (data, constraints) => {
  const errors = {};
  
  for (const [field, rules] of Object.entries(constraints)) {
    const value = data[field];
    if (value === undefined || value === null) continue;
    
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      errors[field] = `Must be at least ${rules.minLength} characters`;
    }
    
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors[field] = `Must not exceed ${rules.maxLength} characters`;
    }
    
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      errors[field] = `Must be at least ${rules.min}`;
    }
    
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
      errors[field] = `Must not exceed ${rules.max}`;
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || `Invalid format for ${field}`;
    }
    
    if (rules.enum && !rules.enum.includes(value)) {
      errors[field] = `Must be one of: ${rules.enum.join(', ')}`;
    }
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors);
  }
};

/**
 * Get auth token from Supabase session
 */
const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

/**
 * Build full URL from endpoint
 */
const buildUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.baseURL}/${cleanEndpoint}`;
};

/**
 * Parse error response
 */
const parseErrorResponse = async (response) => {
  try {
    const data = await response.json();
    return data.error || data.message || response.statusText || 'Unknown error';
  } catch {
    return response.statusText || 'Unknown error';
  }
};

// ============================================================================
// MAIN API CLIENT
// ============================================================================

class ApiClient {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.interceptors = {
      request: [],
      response: [],
      error: []
    };
  }

  /**
   * Register a request interceptor
   */
  addRequestInterceptor(fn) {
    this.interceptors.request.push(fn);
  }

  /**
   * Register a response interceptor
   */
  addResponseInterceptor(fn) {
    this.interceptors.response.push(fn);
  }

  /**
   * Register an error interceptor
   */
  addErrorInterceptor(fn) {
    this.interceptors.error.push(fn);
  }

  /**
   * Execute request interceptors
   */
  async executeRequestInterceptors(config) {
    let result = config;
    for (const interceptor of this.interceptors.request) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Execute response interceptors
   */
  async executeResponseInterceptors(response) {
    let result = response;
    for (const interceptor of this.interceptors.response) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Execute error interceptors
   */
  async executeErrorInterceptors(error) {
    let result = error;
    for (const interceptor of this.interceptors.error) {
      result = await interceptor(result);
    }
    return result;
  }

  /**
   * Make a request with retry logic
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = buildUrl(endpoint);
    const requestKey = getRequestKey(method, url, data);
    
    // Check for duplicate request
    if (requestKey && pendingRequests.has(requestKey)) {
      if (this.config.debug) console.log(`[ApiClient] Returning cached pending request for ${requestKey}`);
      return pendingRequests.get(requestKey);
    }

    const requestPromise = this._makeRequestWithRetry(method, url, data, options);
    
    // Store pending request for deduplication
    if (requestKey) {
      pendingRequests.set(requestKey, requestPromise);
      requestPromise.finally(() => pendingRequests.delete(requestKey));
    }

    return requestPromise;
  }

  /**
   * Make request with automatic retry
   */
  async _makeRequestWithRetry(method, url, data, options, attempt = 1) {
    try {
      return await this._makeRequest(method, url, data, options);
    } catch (error) {
      // Don't retry on validation or auth errors
      if (error instanceof ValidationError || error.status === 401 || error.status === 403) {
        throw error;
      }

      // Retry on network/timeout errors
      if (attempt < this.config.retries) {
        const delay = getRetryDelay(attempt, this.config.retryDelay);
        if (this.config.debug) {
          console.log(`[ApiClient] Retry attempt ${attempt}/${this.config.retries} after ${delay}ms for ${method} ${url}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._makeRequestWithRetry(method, url, data, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Make single request
   */
  async _makeRequest(method, url, data, options) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add auth token
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let config = {
      method,
      headers,
      timeout: options.timeout || this.config.timeout
    };

    // Execute request interceptors
    config = await this.executeRequestInterceptors(config);

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    if (this.config.debug) {
      console.log(`[ApiClient] ${method} ${url}`, data ? { data } : '');
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Parse response
      const responseData = response.ok 
        ? await response.json() 
        : { error: await parseErrorResponse(response) };

      // Execute response interceptors
      let finalResponse = { data: responseData, status: response.status, ok: response.ok };
      finalResponse = await this.executeResponseInterceptors(finalResponse);

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || 'Request failed';
        const error = new ApiError(errorMessage, response.status, responseData);
        await this.executeErrorInterceptors(error);
        throw error;
      }

      if (this.config.debug) {
        console.log(`[ApiClient] ${method} ${url} → ${response.status}`, responseData);
      }

      return finalResponse.data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        const timeoutError = new TimeoutError(`Request timeout after ${config.timeout}ms`);
        await this.executeErrorInterceptors(timeoutError);
        throw timeoutError;
      }

      await this.executeErrorInterceptors(error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  /**
   * POST with automatic validation
   */
  async postValidated(endpoint, data, requiredFields = [], constraints = {}, options = {}) {
    validateRequired(data, requiredFields);
    validateConstraints(data, constraints);
    return this.post(endpoint, data, options);
  }

  /**
   * PATCH with automatic validation
   */
  async patchValidated(endpoint, data, constraints = {}, options = {}) {
    validateConstraints(data, constraints);
    return this.patch(endpoint, data, options);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

const apiClient = new ApiClient({
  debug: API_CONFIG.debug || false
});

// Add default error interceptor
apiClient.addErrorInterceptor(async (error) => {
  if (error.status === 401) {
    console.warn('[ApiClient] Unauthorized - user may need to login');
  }
  return error;
});

// ============================================================================
// EXPORTS
// ============================================================================

export { apiClient, ApiError, ValidationError, TimeoutError, validateRequired, validateConstraints };
export default apiClient;
