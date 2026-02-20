const { getDefaultConfig } = require('expo/metro-config');

// Load polyfills for localStorage and sessionStorage
if (typeof window === 'undefined') {
  global.localStorage = {
    getItem: function(key) {
      return this.data[key] || null;
    },
    setItem: function(key, value) {
      this.data[key] = value.toString();
    },
    removeItem: function(key) {
      delete this.data[key];
    },
    clear: function() {
      this.data = {};
    },
    data: {}
  };

  global.sessionStorage = {
    getItem: function(key) {
      return this.data[key] || null;
    },
    setItem: function(key, value) {
      this.data[key] = value.toString();
    },
    removeItem: function(key) {
      delete this.data[key];
    },
    clear: function() {
      this.data = {};
    },
    data: {}
  };
}

const config = getDefaultConfig(__dirname);

module.exports = config;
