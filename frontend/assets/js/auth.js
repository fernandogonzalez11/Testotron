document.addEventListener('DOMContentLoaded', () => {

  const loginForm = document.getElementById('loginForm');

  if (loginForm) {

    loginForm.addEventListener('submit', async (e) => {

      if (!window.apiClient) return;

      e.preventDefault();

      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const password = loginForm.querySelector('input[name="password"]').value.trim();

      try {
        const response = await window.apiClient.login(email, password);
	const me = await window.apiClient.fetchCurrentUser();
        let role = response?.user?.role;

        if (!role) {
          const user = window.apiClient.getUser();
          role = user?.role;
        }

        if (!role) {
          role = 'student';
        }
	
        console.log('Logged in as:', role);
        window.location.href = `/dashboard`;  

      } catch (err) {

        console.error(err);

        const msg =
          (err && (err.error || err.message))
            ? (err.error || err.message)
            : 'Login failed';

        alert(msg);
      }

    });

  }

  // Register form
  const registerForm =
    document.querySelector('form[action="/auth/register"]') ||
    document.querySelector('form[action="auth/register"]');
  if (registerForm && window.apiClient) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = registerForm;
      const name = form.querySelector('input[name="name"]').value.trim();
      const email = form.querySelector('input[name="email"]').value.trim();
      const password = form.querySelector('input[name="password"]').value.trim();
      const roleField = form.querySelector('select[name="role"]');
      const role = roleField ? roleField.value : 'student';
      try {
        await window.apiClient.register(name, email, password, role);
        window.location.href = '/auth/login';
      } catch (err) {
        console.error(err);
        const msg =
          (err && (err.error || err.message))
            ? (err.error || err.message)
            : 'Registration failed';

        alert(msg);
      }

    });

  }

});
