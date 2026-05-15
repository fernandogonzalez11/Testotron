document.addEventListener('DOMContentLoaded', async () => {
  if (!window.apiClient) return;
  try {
    const me = await (window.apiClient.fetchCurrentUser ? window.apiClient.fetchCurrentUser() : null);
    const user = me && me.user ? me.user : (window.apiClient.getUser ? window.apiClient.getUser() : null);
    if (!user) return;
    // update elements
    const nameEls = document.querySelectorAll('[data-user-name]');
    nameEls.forEach(e => e.textContent = user.name || '');
    const initialsEls = document.querySelectorAll('[data-user-initials]');
    initialsEls.forEach(e => e.textContent = (user.initials || (user.name||'').split(' ').map(s=>s[0]).slice(0,2).join('')).toUpperCase());
  } catch (err) {
    // ignore
  }
});
