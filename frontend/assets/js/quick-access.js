document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quickAccessForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    // Progressive enhancement: intercept to prevent navigation to API host
    e.preventDefault();
    const input = form.querySelector('input[name="code"]');
    const code = input ? input.value.trim() : '';
    if (!code) return; // required
    // navigate within frontend
    window.location.href = '/student/quiz/' + encodeURIComponent(code);
  });
});
