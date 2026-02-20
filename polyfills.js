// Polyfill localStorage for Node.js environment
if (typeof localStorage === 'undefined') {
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
}

// Polyfill sessionStorage for Node.js environment
if (typeof sessionStorage === 'undefined') {
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
