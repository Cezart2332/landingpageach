// Environment Configuration Utility
// This file helps manage environment variables

class EnvConfig {
  constructor() {
    // In a browser environment, you would typically load these from a server endpoint
    // or have them injected during build time for security
    this.config = {
      API_BASE_URL: 'https://api.acoomh.ro',
      DEBUG: false
    };
  }

  get(key) {
    return this.config[key];
  }

  // For server-side usage (if you add Node.js later)
  static loadFromEnv() {
    if (typeof process !== 'undefined' && process.env) {
      return {
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        API_BASE_URL: process.env.API_BASE_URL || 'https://api.acoomh.ro',
        DEBUG: process.env.DEBUG === 'true'
      };
    }
    return null;
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnvConfig;
} else {
  window.EnvConfig = EnvConfig;
}