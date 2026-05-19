document.addEventListener('DOMContentLoaded', () => {

  let editingQuestionId = null;

  const typeSelect =
    document.getElementById('questionType');

  const dynamicContainer =
    document.getElementById('dynamicQuestionFields');

  const form =
    document.getElementById('question-modal-form');

  /*
  =========================================
  RENDER FIELDS
  =========================================
  */

  function renderFields(
    type,
    metadata = {},
    correctAnswer = null
  ) {

    dynamicContainer.innerHTML = '';

    /*
    =========================================
    MULTIPLE CHOICE / RESPONSE
    =========================================
    */

    if (
      type === 'multiple_choice' ||
      type === 'multiple_response'
    ) {

      dynamicContainer.innerHTML = `
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

      const optionsContainer =
        document.getElementById('optionsContainer');

      const addOptionBtn =
        document.getElementById('addOptionBtn');

      function addOption(
        text = '',
        checked = false
      ) {

        const optionDiv =
          document.createElement('div');

        optionDiv.className =
          'input-group mb-2';

        optionDiv.innerHTML = `
          <div class="input-group-text">
            <input
              class="form-check-input mt-0 correct-option"
              type="${type === 'multiple_choice'
                ? 'radio'
                : 'checkbox'}"
              name="correctOption"
              ${checked ? 'checked' : ''}
            >
          </div>

          <input
            type="text"
            class="form-control option-text"
            placeholder="Texto de opción"
            value="${text}"
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

      const options =
        metadata.options || [];

      /*
      =========================================
      EDIT MODE
      =========================================
      */

      if (options.length > 0) {

        options.forEach((option, index) => {

          let checked = false;

          if (type === 'multiple_choice') {

            checked =
              correctAnswer === index;
          }

          if (type === 'multiple_response') {

            checked =
              Array.isArray(correctAnswer) &&
              correctAnswer.includes(index);
          }

          addOption(option, checked);

        });

      } else {

        /*
        =========================================
        CREATE MODE
        =========================================
        */

        addOption();
        addOption();
      }

      addOptionBtn.addEventListener(
        'click',
        () => addOption()
      );
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
          <option
            value="true"
            ${correctAnswer === true ? 'selected' : ''}
          >
            Verdadero
          </option>

          <option
            value="false"
            ${correctAnswer === false ? 'selected' : ''}
          >
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
          value="${correctAnswer || ''}"
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
          value="${correctAnswer || ''}"
        >
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
          value="${correctAnswer || ''}"
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
        document.getElementById(
          'matchingContainer'
        );

      const addMatchBtn =
        document.getElementById(
          'addMatchBtn'
        );

      function addMatch(
        left = '',
        right = ''
      ) {

        const row =
          document.createElement('div');

        row.className =
          'row g-2 mb-2';

        row.innerHTML = `
          <div class="col">
            <input
              type="text"
              class="form-control match-left"
              placeholder="Concepto"
              value="${left}"
            >
          </div>

          <div class="col">
            <input
              type="text"
              class="form-control match-right"
              placeholder="Respuesta"
              value="${right}"
            >
          </div>
        `;

        matchingContainer.appendChild(row);
      }

      const pairs =
        metadata.pairs || [];

      if (pairs.length > 0) {

        pairs.forEach(pair => {

          addMatch(
            pair.left,
            pair.right
          );

        });

      } else {

        addMatch();
      }

      addMatchBtn.addEventListener(
        'click',
        () => addMatch()
      );
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
  }

  /*
  =========================================
  INITIAL RENDER
  =========================================
  */

  renderFields(typeSelect.value);

  typeSelect.addEventListener(
    'change',
    () => renderFields(typeSelect.value)
  );

  /*
  =========================================
  OPEN CREATE MODAL
  =========================================
  */

  window.openCreateQuestionModal =
    function() {

      editingQuestionId = null;

      form.reset();
	
      typeSelect.value =  'multiple_choice';

      renderFields(typeSelect.value);


      document.getElementById(
  'saveToBank'
).checked = true;


      document.getElementById(
        'questionModalLabel'
      ).innerText =
        'Añadir pregunta';

      const modal =
        new bootstrap.Modal(
          document.getElementById(
            'questionModal'
          )
        );

      modal.show();
    };

  /*
  =========================================
  EDIT QUESTION
  =========================================
  */

  window.editQuestion =
    async function(id) {

      try {

        const res =
          await fetch(
            `/api/questions/${id}`
          );

        if (!res.ok) {

          alert(
            'No se pudo cargar la pregunta'
          );

          return;
        }

        const data =
          await res.json();

        const q =
          data.question;

        editingQuestionId = id;

        document.getElementById(
          'questionText'
        ).value =
          q.question || '';

        document.getElementById(
          'questionType'
        ).value =
          q.type || '';

        document.getElementById(
          'questionCategory'
        ).value =
          q.category || '';

        document.getElementById(
          'questionDifficulty'
        ).value =
          q.difficulty || 'medium';

        /*
        =====================================
        RENDER METADATA
        =====================================
        */

        renderFields(
          q.type,
          q.metadata,
          q.correct_answer
        );

        document.getElementById(
          'questionModalLabel'
        ).innerText =
          'Editar pregunta';

        const modal =
          new bootstrap.Modal(
            document.getElementById(
              'questionModal'
            )
          );

        modal.show();

      } catch (err) {

        console.error(err);

        alert(
          'Error cargando pregunta'
        );
      }
    };

  /*
  =========================================
  DELETE QUESTION
  =========================================
  */

  window.deleteQuestion =
    async function(id) {

      const ok = confirm(
        '¿Seguro que deseas eliminar esta pregunta?'
      );

      if (!ok) {
        return;
      }

      try {

        const res =
          await fetch(
            `/api/questions/${id}`,
            {
              method: 'DELETE'
            }
          );

if (res.ok) {

document.dispatchEvent(
  new CustomEvent(
    'question:deleted',
    {
      detail: { id }
    }
  )
);

  return;
}

        alert(
          'No se pudo eliminar la pregunta'
        );

      } catch (err) {

        console.error(err);

        alert(
          'Error eliminando pregunta'
        );
      }
    };

  /*
  =========================================
  SUBMIT
  =========================================
  */

  form.onsubmit =
    async function(e) {

      e.preventDefault();

      const type =
        typeSelect.value;

      const payload = {

        question:
          document.getElementById(
            'questionText'
          ).value.trim(),

        type,
	
	source_type:
    document.getElementById(
      'saveToBank'
    ).checked
      ? 'bank'
      : 'quiz',

        category:
          document.getElementById(
            'questionCategory'
          ).value,

        difficulty:
          document.getElementById(
            'questionDifficulty'
          ).value,

        metadata: {},

        correct_answer: null
      };

      /*
      =====================================
      MULTIPLE CHOICE / RESPONSE
      =====================================
      */

      if (
        type === 'multiple_choice' ||
        type === 'multiple_response'
      ) {

        const options = [];

        const correctAnswers = [];

        document
          .querySelectorAll(
            '#optionsContainer .input-group'
          )
          .forEach((row, index) => {

            const text =
              row.querySelector(
                '.option-text'
              ).value.trim();

            const checked =
              row.querySelector(
                '.correct-option'
              ).checked;

            options.push(text);

            if (checked) {
              correctAnswers.push(index);
            }

          });

        payload.metadata.options =
          options;

        payload.correct_answer =
          type === 'multiple_choice'
            ? correctAnswers[0]
            : correctAnswers;
      }

      /*
      =====================================
      TRUE FALSE
      =====================================
      */

      if (type === 'true_false') {

        payload.correct_answer =
          document.getElementById(
            'trueFalseAnswer'
          ).value === 'true';
      }

      /*
      =====================================
      SHORT ANSWER
      =====================================
      */

      if (type === 'short_answer') {

        payload.correct_answer =
          document.getElementById(
            'shortAnswer'
          ).value.trim();
      }

      /*
      =====================================
      NUMERIC
      =====================================
      */

      if (type === 'numeric') {

        payload.correct_answer =
          Number(
            document.getElementById(
              'numericAnswer'
            ).value
          );
      }

      /*
      =====================================
      FILL BLANK
      =====================================
      */

      if (type === 'fill_blank') {

        payload.correct_answer =
          document.getElementById(
            'fillBlankAnswer'
          ).value.trim();
      }

      /*
      =====================================
      MATCHING
      =====================================
      */

      if (type === 'matching') {

        const pairs = [];

        document
          .querySelectorAll(
            '#matchingContainer .row'
          )
          .forEach((row) => {

            pairs.push({

              left:
                row.querySelector(
                  '.match-left'
                ).value,

              right:
                row.querySelector(
                  '.match-right'
                ).value

            });

          });

        payload.metadata.pairs =
          pairs;

        payload.correct_answer =
          pairs;
      }

      let url =
        '/api/questions';

      let method =
        'POST';

      if (editingQuestionId) {

        url =
          `/api/questions/${editingQuestionId}`;

        method =
          'PATCH';
      }

      try {

        const res =
          await fetch(
            url,
            {
              method,

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(payload)
            }
          );

        if (res.ok) {

const savedQuestion = await res.json();

console.log(savedQuestion);

document.dispatchEvent(
  new CustomEvent(
    'question:saved',
    {
      detail: {
        question_id:
          savedQuestion.question.id,

        question:
          savedQuestion.question.question,

        type:
          savedQuestion.question.type,

        metadata:
          savedQuestion.question.metadata,

        correct_answer:
          savedQuestion.question.correct_answer,

        category:
          savedQuestion.question.category,

	difficulty:
	  savedQuestion.question.difficulty,

        pts: 1
      }
    }
  )
);

const modalEl =
  document.getElementById(
    'questionModal'
  );

bootstrap.Modal
  .getOrCreateInstance(
    modalEl
  )
  .hide();

  form.reset();

  editingQuestionId = null;

renderFields(
    'multiple_choice'
  );

          return;
        }

        alert(
          'No se pudo guardar la pregunta'
        );

      } catch (err) {

        console.error(err);

        alert(
          'Error guardando pregunta'
        );
      }
    };

});
