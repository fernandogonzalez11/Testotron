document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('section[aria-label="Listado de cuestionarios"]');
  if (!container) return;

  const loading = document.createElement('div');
  loading.className = 'col-12';
  loading.innerHTML = '<p class="text-muted">Cargando cuestionarios...</p>';
  container.appendChild(loading);

  try {
    const res = await window.apiClient.fetchTests(); // expects { tests: [...] }
    const tests = res && res.tests ? res.tests : [];
    container.innerHTML = '';
    if (tests.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'col-12';
      empty.innerHTML = '<p class="text-muted">No hay cuestionarios disponibles.</p>';
      container.appendChild(empty);
      return;
    }

    for (const t of tests) {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6';
      const title = t.name || t.title || 'Sin título';
      const group = t.group_name || t.group_code || t.group || '';
      const questions = t.questions || t.count_questions || 0;
      const timeLimit = t.timeLimit || t.time_limit || '-';
      const dueDate = t.dueDate || t.due_date || '';
      const attempts = t.attempts || '';
      const score = t.score || null;

      col.innerHTML = `
        <article class="card border-0 shadow-sm h-100">
          <div class="card-body d-flex flex-column justify-content-between">
            <header class="mb-3">
              <h2 class="h5 fw-bold mb-1">${escapeHtml(title)}</h2>
              <p class="text-muted small mb-0">${escapeHtml(group)}</p>
            </header>
            <ul class="list-unstyled mb-3">
              <li><strong>Preguntas:</strong> ${escapeHtml(String(questions))}</li>
              <li><strong>Tiempo límite:</strong> ${escapeHtml(String(timeLimit))} min</li>
              <li><strong>Fecha límite:</strong> ${escapeHtml(dueDate)}</li>
              <li><strong>Intentos:</strong> ${escapeHtml(attempts)}</li>
              ${score ? `<li><strong>Puntuación obtenida:</strong> ${escapeHtml(String(score))}</li>` : ''}
            </ul>
            <div class="d-flex gap-2">
              <button class="btn btn-primary flex-fill start-quiz-btn" data-code="${encodeURIComponent(t.code || t.id || '')}">
                <i class="bi bi-play-fill me-1"></i> Comenzar cuestionario
              </button>
            </div>
          </div>
        </article>
      `;

      container.appendChild(col);
    }

    // attach start handlers
    document.querySelectorAll('.start-quiz-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const code = btn.getAttribute('data-code');
        // navigate to student quiz page; backend expects /student/quiz/:id
        // If code is a test code, navigate to /student/quiz/:code
        if (code) window.location.href = '/student/quiz/' + code; // navigate within frontend only (3001)
      });
    });
  } catch (err) {
    container.innerHTML = '';
    const errEl = document.createElement('div');
    errEl.className = 'col-12';
    errEl.innerHTML = '<p class="text-danger">Error cargando cuestionarios.</p>';
    container.appendChild(errEl);
    console.error('fetchTests error', err);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
