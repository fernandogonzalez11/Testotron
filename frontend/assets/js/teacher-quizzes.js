document.addEventListener('DOMContentLoaded', async () => {
  if (!window.apiClient) return;
  try {
    const resp = await window.apiClient.fetchTests();
    const tests = resp && resp.tests ? resp.tests : [];
    const tbody = document.querySelector('table[aria-label="Lista de cuestionarios"] tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (tests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted"><i class="bi bi-folder-x h3 d-block mb-3"></i>Aún no has creado ningún cuestionario.</td></tr>';
      return;
    }
    for (const t of tests) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="ps-4 py-3">
          <p class="fw-bold mb-0 text-capitalize">${escapeHtml(t.name || t.title || '')}</p>
          <p class="small text-muted mb-0">Creado: ${escapeHtml(t.created_at || t.createdAt || '')}</p>
        </td>
        <td class="text-capitalize">${escapeHtml(t.group_code || t.group || '')}</td>
        <td>${escapeHtml(String(t.total_questions || t.questions || 0))}</td>
        <td>${escapeHtml(String(t.total_responses || t.responses || 0))}</td>
        <td>${escapeHtml((t.status || 'draft'))}</td>
        <td class="font-monospace fw-bold">${escapeHtml(t.code || '')}</td>
        <td class="pe-4 text-end">${actionButtonsHTML(t)}</td>
      `;
      tbody.appendChild(tr);
    }
  } catch (err) {
    console.error('Error loading teacher quizzes:', err);
  }

  function actionButtonsHTML(t){
    const code = encodeURIComponent(t.code || t.id || '');
    return `
      <a href="/teacher/quizzes/view/${code}" class="btn btn-sm btn-outline-secondary me-2">Ver</a>
      <a href="/teacher/quizzes/edit/${code}" class="btn btn-sm btn-outline-primary">Editar</a>
    `;
  }

  function escapeHtml(s){ if (s == null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
});
