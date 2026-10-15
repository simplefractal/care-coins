(function () {
  const config = window.DEMO_CONFIG;

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  // Reading window.localStorage can itself throw when storage is blocked.
  function getStorage() {
    try {
      return window.localStorage;
    } catch (error) {
      return { getItem: () => null, setItem: () => {} };
    }
  }

  document.documentElement.style.setProperty('--accent', config.accent);
  document.querySelectorAll('[data-brand]').forEach((el) => (el.textContent = config.brand));
  document.querySelectorAll('[data-currency]').forEach((el) => (el.textContent = config.currency));

  window.DemoUI = { esc, config, storage: getStorage() };
})();
