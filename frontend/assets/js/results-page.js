document.addEventListener('DOMContentLoaded', async () => {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const id = pathParts[pathParts.length - 1];
  if (!id || !window.apiClient) return;

  const containerTitle = document.querySelector('main header h1');
  const resultBox = document.getElementById('resultBox');
  const groupStats = document.getElementById('groupStats');
  const answersList = document.getElementById('answersList');

  try {
    const data = await window.apiClient.getAnswer(id);
    if (!data) return;
    // API returns { answer: { ... } } or directly object
    const ans = data.answer || data;

    // Update header
    if (ans && ans.test_name) containerTitle.textContent = ans.test_name;

    // Render result box
    if (resultBox) {
      resultBox.innerHTML = '';
      const passed = ans.passed || (ans.score >= (ans.minScore || 0));
      const score = ans.score != null ? ans.score : (ans.total ? Math.round((ans.total_correct/ans.total)*100) : 0);
      const correctAnswers = ans.correctAnswers || ans.total_correct || 0;
      const totalQuestions = ans.totalQuestions || ans.total || 0;
      const timeSpent = ans.timeSpent || ans.time || '';
      const minScore = ans.minScore || ans.min || 0;
      const box = document.createElement('div');
      box.className = 'p-3 mb-4 rounded text-white ' + (passed ? 'bg-success' : 'bg-danger');
      box.innerHTML = `
        <h2 class="h5 mb-3">${passed ? '<i class="bi bi-check-circle-fill me-2"></i> ¡Aprobado!' : '<i class="bi bi-x-circle-fill me-2"></i> No aprobado'}</h2>
        <p class="mb-2">${passed ? 'Has superado el cuestionario exitosamente' : 'No alcanzaste la puntuación mínima'}</p>
        <div class="row">
          <div class="col-6 col-md-3 mb-2"><strong>Puntuación:</strong> ${escapeHtml(String(score))}%</div>
          <div class="col-6 col-md-3 mb-2"><strong>Correctas:</strong> ${escapeHtml(String(correctAnswers))} / ${escapeHtml(String(totalQuestions))}</div>
          <div class="col-6 col-md-3 mb-2"><strong>Tiempo:</strong> ${escapeHtml(String(timeSpent))}</div>
          <div class="col-6 col-md-3 mb-2"><strong>Mínimo:</strong> ${escapeHtml(String(minScore))}%</div>
        </div>
      `;
      resultBox.appendChild(box);
    }

    // Render group stats if present
    if (groupStats) {
      groupStats.innerHTML = '';
      if (ans.groupStats) {
        const gs = document.createElement('div');
        gs.innerHTML = `
          <div class="row">
            <div class="col-6 col-md-3 mb-2"><strong>Promedio:</strong> ${escapeHtml(String(ans.groupStats.average))}</div>
            <div class="col-6 col-md-3 mb-2"><strong>Posición:</strong> ${escapeHtml(String(ans.groupStats.position))}</div>
            <div class="col-6 col-md-3 mb-2"><strong>Estudiantes:</strong> ${escapeHtml(String(ans.groupStats.totalStudents))}</div>
            <div class="col-6 col-md-3 mb-2"><strong>Mejor:</strong> ${escapeHtml(String(ans.groupStats.highestScore))}</div>
          </div>
        `;
        groupStats.appendChild(gs);
      }
    }

    // Render answers list
    if (answersList) {
      answersList.innerHTML = '';
      const answers = ans.answers || ans.items || [];
      if (Array.isArray(answers) && answers.length > 0) {
        for (const a of answers) {
          const item = document.createElement('div');
          item.className = 'list-group-item d-flex justify-content-between align-items-start';
          item.innerHTML = `
            <div class="ms-2 me-auto">
              <div class="fw-bold">${escapeHtml(a.question || a.text || a.title || '')}</div>
              <span class="text-muted">Tu respuesta: ${escapeHtml(a.yourAnswer || a.answer_given || a.userAnswer || '')}</span>
              ${a.isCorrect || a.correct ? '' : ('<div class="text-danger">Respuesta correcta: ' + escapeHtml(a.correctAnswer || a.correct_answer || a.expected || '') + '</div>')}
            </div>
            ${ (a.isCorrect || a.correct) ? '<span class="badge bg-success rounded-pill" aria-label="Respuesta correcta"><i class="bi bi-check-lg"></i></span>' : '<span class="badge bg-danger rounded-pill" aria-label="Respuesta incorrecta"><i class="bi bi-x-lg"></i></span>' }
          `;
          answersList.appendChild(item);
        }
      } else {
        answersList.innerHTML = '<div class="p-3 text-muted">No hay respuestas para mostrar.</div>';
      }
    }

  } catch (err) {
    console.error('Error loading result:', err);
  }

  function escapeHtml(s) { if (s == null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
});
