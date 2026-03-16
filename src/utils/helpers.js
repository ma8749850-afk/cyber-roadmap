/**
 * Utility functions for the Cyber Roadmap Platform
 */

/**
 * DOM manipulation utilities
 */
export const dom = {
  /**
   * Get element by ID with error handling
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} Element or null if not found
   */
  get(id) {
    return document.getElementById(id);
  },

  /**
   * Query selector with error handling
   * @param {string} selector - CSS selector
   * @param {HTMLElement} context - Context element (default: document)
   * @returns {Element|null} Element or null if not found
   */
  query(selector, context = document) {
    return context.querySelector(selector);
  },

  /**
   * Query selector all
   * @param {string} selector - CSS selector
   * @param {HTMLElement} context - Context element (default: document)
   * @returns {NodeList} NodeList of elements
   */
  queryAll(selector, context = document) {
    return context.querySelectorAll(selector);
  },

  /**
   * Create element with attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} attrs - Attributes object
   * @param {string|HTMLElement} content - Text content or child element
   * @returns {HTMLElement} Created element
   */
  create(tag, attrs = {}, content = '') {
    const element = document.createElement(tag);

    Object.keys(attrs).forEach(key => {
      if (key === 'className') {
        element.className = attrs[key];
      } else if (key === 'dataset') {
        Object.keys(attrs.dataset).forEach(dataKey => {
          element.dataset[dataKey] = attrs.dataset[dataKey];
        });
      } else {
        element.setAttribute(key, attrs[key]);
      }
    });

    if (typeof content === 'string') {
      element.textContent = content;
    } else if (content instanceof HTMLElement) {
      element.appendChild(content);
    }

    return element;
  }
};

/**
 * Local storage utilities with error handling
 */
export const storage = {
  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage: ${error.message}`);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage: ${error.message}`);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage: ${error.message}`);
      return false;
    }
  }
};

/**
 * Date and time utilities
 */
export const time = {
  /**
   * Format timestamp to readable time
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted time string
   */
  formatTime(timestamp) {
    if (!timestamp) return '';

    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Get relative time (e.g., "2 hours ago")
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Relative time string
   */
  getRelativeTime(timestamp) {
    if (!timestamp) return '';

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  }
};

/**
 * Validation utilities
 */
export const validate = {
  /**
   * Validate email format
   * @param {string} email - Email address
   * @returns {boolean} Is valid email
   */
  email(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Validate username (3-24 chars, alphanumeric + underscore)
   * @param {string} username - Username
   * @returns {boolean} Is valid username
   */
  username(username) {
    const regex = /^[a-zA-Z0-9_]{3,24}$/;
    return regex.test(username);
  },

  /**
   * Validate password (minimum 6 characters)
   * @param {string} password - Password
   * @returns {boolean} Is valid password
   */
  password(password) {
    return password && password.length >= 6;
  }
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit time in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}