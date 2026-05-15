document.addEventListener('DOMContentLoaded', () => {
  const logoutForm = document.querySelector('form[action="/logout"]');
  if (!logoutForm) return;
  logoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      // Clear local storage token
      if (window.apiClient) {
        window.apiClient.clearToken && window.apiClient.clearToken();
      }
      // Post to server to clear cookie
      await fetch('/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      // ignore
    }
    window.location.href = '/auth/login';
  });
});
