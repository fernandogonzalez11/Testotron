document.addEventListener('DOMContentLoaded', () => {

  const typeSelect = document.getElementById('questionType');
  const dynamicContainer = document.getElementById('dynamicQuestionFields');
  const form = document.getElementById('question-modal-form');

  renderFields(typeSelect.value);

  typeSelect.addEventListener('change', () => {
    renderFields(typeSelect.value);
  });

  function renderFields(type) {

    dynamicContainer.innerHTML = '';

    /*
    =========================================
    MULTIPLE CHOICE / MULTIPLE RESPONSE
    =========================================
    */

    if (
      type === 'multiple_choice' ||
      type === 'multiple_response'
    ) {

      const wrapper = document.createElement('div');

      wrapper.innerHTML = `
        <label class="form-label">
          Opciones
        </label>

        <div id="optionsContainer"></div>

        <button
          type="button"
          class="btn btn-sm btn-success mt-2"
          id="addOptionBtn"
        >
          <i class="bi bi-plus-circle"></i>
          Añadir opción
        </button>
      `;

      dynamicContainer.appendChild(wrapper);

      const optionsContainer =
        document.getElementById('optionsContainer');

      const addOptionBtn =
        document.getElementById('addOptionBtn');

      function addOption() {

        const optionDiv = document.createElement('div');

        optionDiv.className =
          'input-group mb-2';

        optionDiv.innerHTML = `
          <div class="input-group-text">

            <input
              class="form-check-input mt-0 correct-option"
              type="${type === 'multiple_choice' ? 'radio' : 'checkbox'}"
              name="correctOption"
            >

          </div>

          <input
            type="text"
            class="form-control option-text"
            placeholder="Texto de opción"
          >

          <button
            type="button"
            class="btn btn-outline-danger remove-option"
          >
            <i class="bi bi-trash"></i>
          </button>
        `;

        optionsContainer.appendChild(optionDiv);

        optionDiv
          .querySelector('.remove-option')
          .addEventListener('click', () => {
            optionDiv.remove();
          });
      }

      addOption();
      addOption();

      addOptionBtn.addEventListener('click', addOption);
    }

    /*
    =========================================
    TRUE FALSE
    =========================================
    */

    if (type === 'true_false') {

      dynamicContainer.innerHTML = `
        <label class="form-label">
          Respuesta correcta
        </label>

        <select
          id="trueFalseAnswer"
          class="form-select"
        >
          <option value="true">
            Verdadero
          </option>

          <option value="false">
            Falso
          </option>
        </select>
      `;
    }

    /*
    =========================================
    SHORT ANSWER
    =========================================
    */

    if (type === 'short_answer') {

      dynamicContainer.innerHTML = `
        <label class="form-label">
          Respuesta correcta
        </label>

        <input
          type="text"
          id="shortAnswer"
          class="form-control"
        >
      `;
    }

    /*
    =========================================
    NUMERIC
    =========================================
    */

    if (type === 'numeric') {

      dynamicContainer.innerHTML = `
        <label class="form-label">
          Valor correcto
        </label>

        <input
          type="number"
          id="numericAnswer"
          class="form-control"
        >
      `;
    }

    /*
    =========================================
    ESSAY
    =========================================
    */

    if (type === 'essay') {

      dynamicContainer.innerHTML = `
        <div class="alert alert-info mb-0">
          Las preguntas tipo ensayo serán calificadas manualmente.
        </div>
      `;
    }

    /*
    =========================================
    FILL BLANK
    =========================================
    */

    if (type === 'fill_blank') {

      dynamicContainer.innerHTML = `
        <label class="form-label">
          Respuesta correcta
        </label>

        <input
          type="text"
          id="fillBlankAnswer"
          class="form-control"
        >
      `;
    }

    /*
    =========================================
    MATCHING
    =========================================
    */

    if (type === 'matching') {

      dynamicContainer.innerHTML = `
        <label class="form-label">
          Relaciones
        </label>

        <div id="matchingContainer"></div>

        <button
          type="button"
          class="btn btn-success btn-sm mt-2"
          id="addMatchBtn"
        >
          Añadir relación
        </button>
      `;

      const matchingContainer =
        document.getElementById('matchingContainer');

      const addMatchBtn =
        document.getElementById('addMatchBtn');

      function addMatch() {

        const row = document.createElement('div');

        row.className = 'row g-2 mb-2';

        row.innerHTML = `
          <div class="col">
            <input
              type="text"
              class="form-control match-left"
              placeholder="Concepto"
            >
          </div>

          <div class="col">
            <input
              type="text"
              class="form-control match-right"
              placeholder="Respuesta"
            >
          </div>
        `;

        matchingContainer.appendChild(row);
      }

      addMatch();
      addMatchBtn.addEventListener('click', addMatch);
    }

  }

  /*
  =========================================
  SAVE QUESTION
  =========================================
  */

  form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const type = typeSelect.value;

    const payload = {
      question: document
        .getElementById('questionText')
        .value
        .trim(),

      type,

      pts: Number(
        document.getElementById('questionPoints').value
      ),

      config: {}
    };

    /*
    =========================================
    EXTRACT DATA
    =========================================
    */

    if (
      type === 'multiple_choice' ||
      type === 'multiple_response'
    ) {

      const options = [];

      document.querySelectorAll('#optionsContainer .input-group')
        .forEach((row) => {

          options.push({
            text: row.querySelector('.option-text').value,
            correct: row.querySelector('.correct-option').checked
          });

        });

      payload.config.options = options;
    }

    if (type === 'true_false') {

      payload.config.answer =
        document.getElementById('trueFalseAnswer').value;
    }

    if (type === 'short_answer') {

      payload.config.answer =
        document.getElementById('shortAnswer').value;
    }

    if (type === 'fill_blank') {

      payload.config.answer =
        document.getElementById('fillBlankAnswer').value;
    }

    if (type === 'numeric') {

      payload.config.answer =
        Number(
          document.getElementById('numericAnswer').value
        );
    }

    if (type === 'matching') {

      const pairs = [];

      document.querySelectorAll('#matchingContainer .row')
        .forEach((row) => {

          pairs.push({
            left: row.querySelector('.match-left').value,
            right: row.querySelector('.match-right').value
          });

        });

      payload.config.pairs = pairs;
    }

    /*
    =========================================
    SEND
    =========================================
    */

    const res = await fetch('/api/questions', {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Error');
      return;
    }

    window.location.reload();
  });

});
