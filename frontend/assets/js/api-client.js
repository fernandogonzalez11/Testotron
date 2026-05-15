// frontend/assets/js/api-client.js
// Minimal centralized API client for Testotron frontend
(function(){
  const BASE = (window.__API_BASE__ || (window.__env && window.__env.API_BASE) || 'http://localhost:8080').replace(/\/$/, ''); // no trailing slash
  const TOKEN_KEY = 'testotron_token';
  const USER_KEY = 'testotron_user';

  function setToken(t){ if(t) localStorage.setItem(TOKEN_KEY, t); }
  function getToken(){ return localStorage.getItem(TOKEN_KEY); }
  function clearToken(){ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
  function setUser(u){ if(u) localStorage.setItem(USER_KEY, JSON.stringify(u)); }
  function getUser(){ const s = localStorage.getItem(USER_KEY); return s ? JSON.parse(s) : null; }

  async function safeJson(res){
    const txt = await res.text().catch(()=>'');
    try{ return txt ? JSON.parse(txt) : null; } catch(e){ return { raw: txt }; }
  }

  async function fetchWithAuth(path, opts = {}){
    const url = BASE + path;
    const headers = Object.assign({}, opts.headers || {});
    if (!headers['Content-Type'] && !(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    // Prefer cookie-based auth. Do not send Authorization header by default to avoid
    // conflicts between stored tokens and server HttpOnly cookie.
    // If a client script explicitly calls setToken(), it can still be used by direct APIs.
    const res = await fetch(url, Object.assign({}, opts, { headers, credentials: 'include' }));
    if (!res.ok) {
      const body = await safeJson(res).catch(()=>null);
      const err = (body && (body.error||body.message)) ? (body.error||body.message) : res.statusText || 'HTTP error';
      const errorObj = Object.assign({ status: res.status, message: err }, body || {});
      throw errorObj;
    }
    return safeJson(res);
  }

  // public API
  async function login(email, password){
    const res = await fetch(BASE + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw await safeJson(res) || { message: 'Login failed' };
    const body = await safeJson(res);
    // Do not store token in localStorage. Server sets HttpOnly cookie for auth.
    if (body.user) setUser(body.user);
    return body;
  }

  async function register(name, email, password, role){
    const res = await fetch(BASE + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({name, email, password, role })
    });
    if (!res.ok) throw await safeJson(res);
    return safeJson(res);
  }

  // Fetch current user from API. Will use Authorization header or cookie depending on setup
  async function fetchCurrentUser(){
    try {
      return await fetchWithAuth('/auth/me');
    } catch (err) {
      return null;
    }
  }

  // Tests
  async function fetchTests(query=''){
    const q = query ? ('?' + query) : '';
    return fetchWithAuth('/tests' + q);
  }
  async function getTest(code){ return fetchWithAuth('/tests/' + encodeURIComponent(code)); }

  // Sections & items
  async function fetchSections(testCode){ return fetchWithAuth('/sections?test=' + encodeURIComponent(testCode)); }
  async function fetchItems(sectionId){ return fetchWithAuth('/items?section=' + encodeURIComponent(sectionId)); }

  // Create
  async function createTest(payload){ return fetchWithAuth('/tests', { method: 'POST', body: JSON.stringify(payload) }); }
  async function createSection(payload){ return fetchWithAuth('/sections', { method: 'POST', body: JSON.stringify(payload) }); }
  async function createItem(payload){ return fetchWithAuth('/items', { method: 'POST', body: JSON.stringify(payload) }); }

  // Answers
  async function submitAnswers(payload){ return fetchWithAuth('/answers', { method: 'POST', body: JSON.stringify(payload) }); }
  async function getAnswer(id){ return fetchWithAuth('/answers/' + encodeURIComponent(id)); }
  async function listAnswers(query=''){ const q = query ? ('?' + query) : ''; return fetchWithAuth('/answers' + q); }

  // Expose
  window.apiClient = {
    BASE,
    login, register, setToken, getToken, clearToken, setUser, getUser,
    fetchTests, getTest, fetchSections, fetchItems,
    createTest, createSection, createItem,
    submitAnswers, getAnswer, listAnswers, fetchCurrentUser
  };
})();
