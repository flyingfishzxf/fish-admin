// Loaded as a separate file rather than an inline <script> so production can
// ship `Content-Security-Policy: script-src 'self'`. It must stay a classic
// (non-module), synchronous script in <head>: the app bundle is far too late to
// pick the theme without a flash.
;(function () {
  try {
    var raw = localStorage.getItem('fish-admin:theme')
    var state = raw ? JSON.parse(raw).state : null
    var mode = (state && state.mode) || 'system'
    var accent = (state && state.accent) || 'violet'
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    var dark = mode === 'dark' || (mode === 'system' && prefersDark)
    var root = document.documentElement
    root.classList.toggle('dark', dark)
    root.dataset.accent = accent
    root.style.colorScheme = dark ? 'dark' : 'light'
  } catch (error) {
    /* ignore malformed preferences */
  }
})()
