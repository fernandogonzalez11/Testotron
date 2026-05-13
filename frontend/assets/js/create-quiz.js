/*
document.addEventListener('DOMContentLoaded', () => {
  const questionsList = document.querySelector('#main-content .card[aria-label="Preguntas"] ul.list-group');
  const addQuestionBtn = document.querySelector('[data-bs-target="#questionModal"]');
  let questions = []; // estado local de preguntas

  // Función para renderizar la lista
  function renderQuestions() {
    if (!questionsList) return;
    questionsList.innerHTML = '';

    if (questions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-muted';
      empty.textContent = 'No hay preguntas añadidas aún.';
      questionsList.parentNode.replaceChild(empty, questionsList);
      return;
    }

    questions.forEach((q, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';

      const info = document.createElement('div');
      info.innerHTML = `<strong>${q.text}</strong> <span class="text-muted small">(${q.type})</span>`;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';

      // Botón subir
      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'btn btn-sm btn-outline-secondary';
      upBtn.setAttribute('aria-label', 'Mover arriba');
      upBtn.innerHTML = '<i class="bi bi-arrow-up"></i>';
      upBtn.addEventListener('click', () => {
        if (index > 0) {
          [questions[index - 1], questions[index]] = [questions[index], questions[index - 1]];
          renderQuestions();
        }
      });

      // Botón bajar
      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'btn btn-sm btn-outline-secondary';
      downBtn.setAttribute('aria-label', 'Mover abajo');
      downBtn.innerHTML = '<i class="bi bi-arrow-down"></i>';
      downBtn.addEventListener('click', () => {
        if (index < questions.length - 1) {
          [questions[index + 1], questions[index]] = [questions[index], questions[index + 1]];
          renderQuestions();
        }
      });

      // Botón eliminar
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-sm btn-outline-danger';
      delBtn.setAttribute('aria-label', 'Eliminar pregunta');
      delBtn.innerHTML = '<i class="bi bi-trash"></i>';
      delBtn.addEventListener('click', () => {
        questions.splice(index, 1);
        renderQuestions();
      });

      btnGroup.append(upBtn, downBtn, delBtn);
      li.append(info, btnGroup);
      questionsList.appendChild(li);
    });
  }

  // Simulación: añadir pregunta desde modal
  const questionModal = document.getElementById('questionModal');
  if (questionModal) {
    const form = questionModal.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = form.querySelector('#questionText').value.trim();
      const type = form.querySelector('#questionType').value;

      if (text) {
        questions.push({ text, type });
        renderQuestions();
        // cerrar modal
        const modal = bootstrap.Modal.getInstance(questionModal);
        modal.hide();
        form.reset();
      }
    });
  }

  // Inicializar lista vacía
  renderQuestions();
});
document.addEventListener('DOMContentLoaded', () => {
  const questionsList = document.querySelector('#main-content .card[aria-label="Preguntas"] ul.list-group');
  const addQuestionBtn = document.querySelector('[data-bs-target="#questionModal"]');
  let questions = []; // estado local de preguntas

  // Función para renderizar la lista
  function renderQuestions() {
    if (!questionsList) return;
    questionsList.innerHTML = '';

    if (questions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'text-muted';
      empty.textContent = 'No hay preguntas añadidas aún.';
      questionsList.parentNode.replaceChild(empty, questionsList);
      return;
    }

    questions.forEach((q, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';

      const info = document.createElement('div');
      info.innerHTML = `<strong>${q.text}</strong> <span class="text-muted small">(${q.type})</span>`;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'btn-group';

      // Botón subir
      const upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.className = 'btn btn-sm btn-outline-secondary';
      upBtn.setAttribute('aria-label', 'Mover arriba');
      upBtn.innerHTML = '<i class="bi bi-arrow-up"></i>';
      upBtn.addEventListener('click', () => {
        if (index > 0) {
          [questions[index - 1], questions[index]] = [questions[index], questions[index - 1]];
          renderQuestions();
        }
      });

      // Botón bajar
      const downBtn = document.createElement('button');
      downBtn.type = 'button';
      downBtn.className = 'btn btn-sm btn-outline-secondary';
      downBtn.setAttribute('aria-label', 'Mover abajo');
      downBtn.innerHTML = '<i class="bi bi-arrow-down"></i>';
      downBtn.addEventListener('click', () => {
        if (index < questions.length - 1) {
          [questions[index + 1], questions[index]] = [questions[index], questions[index + 1]];
          renderQuestions();
        }
      });

      // Botón eliminar
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-sm btn-outline-danger';
      delBtn.setAttribute('aria-label', 'Eliminar pregunta');
      delBtn.innerHTML = '<i class="bi bi-trash"></i>';
      delBtn.addEventListener('click', () => {
        questions.splice(index, 1);
        renderQuestions();
      });

      btnGroup.append(upBtn, downBtn, delBtn);
      li.append(info, btnGroup);
      questionsList.appendChild(li);
    });
  }

  // Simulación: añadir pregunta desde modal
  const questionModal = document.getElementById('questionModal');
  if (questionModal) {
    const form = questionModal.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = form.querySelector('#questionText').value.trim();
      const type = form.querySelector('#questionType').value;

      if (text) {
        questions.push({ text, type });
        renderQuestions();
        // cerrar modal
        const modal = bootstrap.Modal.getInstance(questionModal);
        modal.hide();
        form.reset();
      }
    });
  }

  // Inicializar lista vacía
  renderQuestions();
});
*/

document.addEventListener('DOMContentLoaded', () => {
  const questionsList = document.getElementById('section-preguntas');
  let questions = [];

  function renderQuestions() {
    questionsList.innerHTML = '';
    if (questions.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'list-group-item text-muted';
      emptyLi.textContent = 'No hay preguntas añadidas aún.';
      questionsList.appendChild(emptyLi);
      return;
    }
    questions.forEach((q, index) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <div><strong>${q.text}</strong> <span class="text-muted small">(${q.type})</span></div>
        <div class="btn-group">
          <button type="button" class="btn btn-sm btn-outline-secondary" aria-label="Mover arriba"><i class="bi bi-arrow-up"></i></button>
          <button type="button" class="btn btn-sm btn-outline-secondary" aria-label="Mover abajo"><i class="bi bi-arrow-down"></i></button>
          <button type="button" class="btn btn-sm btn-outline-danger" aria-label="Eliminar pregunta"><i class="bi bi-trash"></i></button>
        </div>
      `;
      // listeners mover/eliminar
      const [upBtn, downBtn, delBtn] = li.querySelectorAll('button');
      upBtn.addEventListener('click', () => {
        if (index > 0) {
          [questions[index - 1], questions[index]] = [questions[index], questions[index - 1]];
          renderQuestions();
        }
      });
      downBtn.addEventListener('click', () => {
        if (index < questions.length - 1) {
          [questions[index + 1], questions[index]] = [questions[index], questions[index + 1]];
          renderQuestions();
        }
      });
      delBtn.addEventListener('click', () => {
        questions.splice(index, 1);
        renderQuestions();
      });
      questionsList.appendChild(li);
    });
  }

  // Escuchar evento del modal
  document.addEventListener('question:add', (e) => {
    questions.push({ text: e.detail.text, type: e.detail.type });
    renderQuestions();
  });

  renderQuestions();
});

