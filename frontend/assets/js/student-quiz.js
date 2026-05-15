document.addEventListener('DOMContentLoaded', async () => {
  // Extract code/id from URL: /student/quiz/:id
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const code = pathParts[pathParts.length - 1];
  if (!code) return;

  const container = document.querySelector('section[aria-labelledby="quiz-title"] div');
  if (!container) return;

  // show loading
  container.innerHTML = '<p class="text-muted">Cargando cuestionario...</p>';

  try {
    // fetch sections for this test code
    const sectionsResp = await window.apiClient.fetchSections(code);
    const sections = (sectionsResp && sectionsResp.sections) ? sectionsResp.sections : [];

    // gather items
    const allItems = [];
    for (const s of sections) {
      const itemsResp = await window.apiClient.fetchItems(s.id);
      const items = (itemsResp && itemsResp.items) ? itemsResp.items : [];
      // attach section info
      for (const it of items) { it.section = s; allItems.push(it); }
    }

    // If no sections/items, try fallback: API may expose items without sections
    if (sections.length === 0 || allItems.length === 0) {
      // Try fetching test as a detail (GET /tests/:code) and see if it includes items
      const testResp = await window.apiClient.getTest(code);
      // If testResp.test has sections/items, adapt accordingly
    }

    // render
    container.innerHTML = '';
    if (allItems.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay preguntas en este cuestionario.</p>';
      return;
    }

    const form = document.createElement('form');
    form.id = 'quizForm';

    allItems.forEach((it, index) => {
      const article = document.createElement('article');
      article.className = 'card mb-4';
      article.innerHTML = `
        <div class="card-body">
          <h2 class="h5 mb-3">Pregunta ${index + 1}</h2>
          <p>${escapeHtml(it.question)}</p>
          <div class="list-group" data-item-id="${it.id}"></div>
        </div>
      `;
      const listGroup = article.querySelector('.list-group');

      // Try to parse options from item.answer (could be JSON)
      let options = null;
      // item.answer may store either: a JSON array string ("[\"2\",\"3\"]"),
      // or a JSON array/object, or a plain string for text answers.
      try {
        if (typeof it.answer === 'string') {
          options = JSON.parse(it.answer);
        } else {
          options = it.answer;
        }
      } catch(e) {
        options = null;
      }

      if (Array.isArray(options) && options.length > 0) {
        // options may be array of strings or objects
        options.forEach((opt, i) => {
          const id = typeof opt === 'object' && opt.id ? opt.id : String(i);
          const text = typeof opt === 'object' && opt.text ? opt.text : String(opt);
          const inputType = (it.type === 'select-multiple') ? 'checkbox' : 'radio';
          const name = (inputType === 'radio') ? ('question-' + it.id) : ('question-' + it.id + '-' + i);
          const wrapper = document.createElement('label');
          wrapper.className = 'list-group-item';
          wrapper.innerHTML = `<input type="${inputType}" name="${'question-' + it.id}" value="${escapeHtml(id)}" class="form-check-input me-2">${escapeHtml(text)}`;
          listGroup.appendChild(wrapper);
        });
      } else {
        // No options array: render input based on type
        if (it.type === 'short' || it.type === 'mcq') {
          // text input for free text or single choice represented as string
          const wrapper = document.createElement('div');
          wrapper.className = 'mb-2';
          wrapper.innerHTML = `<input type="text" name="question-${it.id}" class="form-control" />`;
          listGroup.appendChild(wrapper);
        } else if (it.type === 'select-multiple') {
          // no structured options: render a textarea where user types selected options as JSON array
          const wrapper = document.createElement('div');
          wrapper.className = 'mb-2';
          wrapper.innerHTML = `<textarea name="question-${it.id}" class="form-control" placeholder='Envía un array JSON, por ejemplo ["1","2"]'></textarea>`;
          listGroup.appendChild(wrapper);
        } else {
          // fallback
          const wrapper = document.createElement('div');
          wrapper.className = 'mb-2';
          wrapper.innerHTML = `<input type="text" name="question-${it.id}" class="form-control" />`;
          listGroup.appendChild(wrapper);
        }
      }

      form.appendChild(article);
    });

    const submitWrap = document.createElement('div');
    submitWrap.className = 'mt-4 d-flex justify-content-end';
    submitWrap.innerHTML = '<button type="submit" class="btn btn-success"><i class="bi bi-check-circle"></i> Enviar</button>';
    form.appendChild(submitWrap);

    container.appendChild(form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // build payload
      const responses = [];
      for (const it of allItems) {
        const name = 'question-' + it.id;
        const els = form.querySelectorAll('[name="' + name + '"]');
        if (!els || els.length === 0) continue;
        let answer = null;
        if (it.type === 'select-multiple') {
          // collect checked values
          const vals = [];
          els.forEach(el => { if (el.checked) vals.push(el.value); });
          if (vals.length === 0) {
            // maybe textarea
            const ta = form.querySelector('textarea[name="' + name + '"]');
            if (ta) {
              try { answer = JSON.parse(ta.value); } catch(err) { answer = []; }
            } else answer = [];
          } else answer = vals;
        } else if (it.type === 'mcq') {
          // radio or text
          const checked = form.querySelector('[name="' + name + '"]:checked');
          if (checked) answer = checked.value;
          else {
            const inp = form.querySelector('input[name="' + name + '"]'); if (inp) answer = inp.value;
          }
        } else {
          const inp = form.querySelector('[name="' + name + '"]'); if (inp) answer = inp.value;
        }
        responses.push({ item_id: it.id, answer });
      }

      const user = window.apiClient.getUser();
      const payload = { user_id: user ? user.id : null, test_code: code, responses };
      try {
        const res = await window.apiClient.submitAnswers(payload);
        alert('Respuestas enviadas. Puntos totales: ' + (res.total || 'N/A'));
        // redirect to results page if exists
        if (res && res.answer_id) window.location.href = '/results/quiz/' + res.answer_id;
      } catch (err) {
        console.error('submitAnswers error', err);
        alert((err && (err.error || err.message)) ? (err.error || err.message) : 'Error enviando respuestas');
      }
    });

  } catch (err) {
    container.innerHTML = '<p class="text-danger">Error cargando preguntas.</p>';
    console.error(err);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
});
