/*document.addEventListener('DOMContentLoaded', () => {
  const questionTypeSelect = document.getElementById('questionType');
  const answerOptionsContainer = document.getElementById('answerOptions');
  const addOptionButtons = document.querySelectorAll('[aria-label="Añadir opción"]');

  // Abrir modal desde botón "Nueva pregunta"
  const newQuestionBtn = document.querySelector('a[href="/teacher/question-bank/new"]');
  if (newQuestionBtn) {
    newQuestionBtn.setAttribute('data-bs-toggle', 'modal');
    newQuestionBtn.setAttribute('data-bs-target', '#questionModal');
    newQuestionBtn.removeAttribute('href');
  }

  // Añadir nueva opción dinámicamente
  addOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = questionTypeSelect.value;
      const wrapper = document.createElement('div');
      wrapper.className = 'input-group mb-2';

      if (type === 'Selección única') {
        wrapper.innerHTML = `
          <div class="input-group-text">
            <input class="form-check-input mt-0" type="radio" name="correctOption" aria-label="Seleccionar como correcta">
          </div>
          <input type="text" class="form-control" placeholder="Texto de opción">
        `;
      } else if (type === 'Selección múltiple') {
        wrapper.innerHTML = `
          <div class="input-group-text">
            <input class="form-check-input mt-0" type="checkbox" aria-label="Seleccionar como correcta">
          </div>
          <input type="text" class="form-control" placeholder="Texto de opción">
        `;
      }
      answerOptionsContainer.insertBefore(wrapper, btn);
    });
  });

  // Cambiar tipo de pregunta (simplificado: aquí podrías limpiar y regenerar inputs)
  questionTypeSelect.addEventListener('change', () => {
    // En un proyecto real, aquí harías un render dinámico según el tipo seleccionado
    // Por ahora, dejamos que Handlebars inicialice y el botón "Añadir opción" agregue más
  });
});*/

document.addEventListener('DOMContentLoaded', () => {
  const questionTypeSelect = document.getElementById('questionType');
  const answerOptionsContainer = document.getElementById('answerOptions');

  // Conectar botón "Nueva pregunta" con el modal
  const newQuestionBtn = document.querySelector('a[href="/teacher/question-bank/new"]');
  if (newQuestionBtn) {
    newQuestionBtn.setAttribute('data-bs-toggle', 'modal');
    newQuestionBtn.setAttribute('data-bs-target', '#questionModal');
    newQuestionBtn.removeAttribute('href');
  }

  // Render dinámico de opciones según tipo
  function renderOptions(type) {
    answerOptionsContainer.innerHTML = ''; // limpiar

    if (type === 'Selección única' || type === 'Selección múltiple') {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-sm btn-success mt-2';
      addBtn.setAttribute('aria-label', 'Añadir opción');
      addBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Añadir opción';

      answerOptionsContainer.appendChild(addBtn);

      // listener único para añadir opción
      addBtn.addEventListener('click', () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'input-group mb-2';

        if (type === 'Selección única') {
          wrapper.innerHTML = `
            <div class="input-group-text">
              <input class="form-check-input mt-0" type="radio" name="correctOption" aria-label="Seleccionar como correcta">
            </div>
            <input type="text" class="form-control" placeholder="Texto de opción">
          `;
        } else {
          wrapper.innerHTML = `
            <div class="input-group-text">
              <input class="form-check-input mt-0" type="checkbox" aria-label="Seleccionar como correcta">
            </div>
            <input type="text" class="form-control" placeholder="Texto de opción">
          `;
        }
        answerOptionsContainer.insertBefore(wrapper, addBtn);
      });
    }

    if (type === 'Respuesta corta') {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-control';
      input.placeholder = 'Respuesta esperada';
      answerOptionsContainer.appendChild(input);
    }
  }

  // Inicializar con el valor actual
  renderOptions(questionTypeSelect.value);

  // Cambiar tipo de pregunta
  questionTypeSelect.addEventListener('change', () => {
    renderOptions(questionTypeSelect.value);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const questionTypeSelect = document.getElementById('questionType');
  const answerOptionsContainer = document.getElementById('answerOptions');
  const addOptionButtons = document.querySelectorAll('[aria-label="Añadir opción"]');

  // Abrir modal desde botón "Nueva pregunta"
  const newQuestionBtn = document.getElementById('addQuestionBtn');
  if (newQuestionBtn) {
    newQuestionBtn.setAttribute('data-bs-toggle', 'modal');
    newQuestionBtn.setAttribute('data-bs-target', '#questionModal');
  }

  // Añadir nueva opción dinámicamente
  addOptionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = questionTypeSelect.value;
      const wrapper = document.createElement('div');
      wrapper.className = 'input-group mb-2';

      if (type === 'Selección única') {
        wrapper.innerHTML = `
          <div class="input-group-text">
            <input class="form-check-input mt-0" type="radio" name="correctOption" aria-label="Seleccionar como correcta">
          </div>
          <input type="text" class="form-control" placeholder="Texto de opción">
        `;
      } else if (type === 'Selección múltiple') {
        wrapper.innerHTML = `
          <div class="input-group-text">
            <input class="form-check-input mt-0" type="checkbox" aria-label="Seleccionar como correcta">
          </div>
          <input type="text" class="form-control" placeholder="Texto de opción">
        `;
      }
      answerOptionsContainer.insertBefore(wrapper, btn);
    });
  });

  // Cambiar tipo de pregunta (simplificado: aquí podrías limpiar y regenerar inputs)
  questionTypeSelect.addEventListener('change', () => {
    // En un proyecto real, aquí harías un render dinámico según el tipo seleccionado
    // Por ahora, dejamos que Handlebars inicialice y el botón "Añadir opción" agregue más
  });
});
