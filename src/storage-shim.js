const storage = {
  async get(key) {
    const raw = localStorage.getItem(key);
    return raw == null ? null : { value: raw };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return true;
  },
  async delete(key) {
    localStorage.removeItem(key);
    return true;
  },
};

window.storage = window.storage || storage;
