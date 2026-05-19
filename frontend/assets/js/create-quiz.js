document.addEventListener('DOMContentLoaded', () => {

  const questionsContainer =
    document.getElementById(
      'section-preguntas'
    );

  const questionBankList =
    document.getElementById(
      'questionBankList'
    );

const editData =
  window.quizEditData || {};

const isEdit =
  editData.isEdit || false;

const editMode =
  editData.mode || 'test';

let selectedQuestions =
  Array.isArray(editData.questions)
    ? editData.questions
    : [];  
/*
  =========================================
  RENDER QUESTIONS
  =========================================
  */

  function renderQuestions() {

    if (selectedQuestions.length === 0) {

      questionsContainer.innerHTML = `
        <p class="text-muted">
          No hay preguntas añadidas aún.
        </p>
      `;

      return;
    }

    questionsContainer.innerHTML = `
      <ul class="list-group">
        ${selectedQuestions.map((q, index) => `
          <li class="list-group-item">

            <div class="d-flex justify-content-between">

              <div>

                <strong>
                  ${q.question}
                </strong>

                <div class="small text-muted">

                  ${q.type}

                  ·

                  ${q.category || 'Sin categoría'}

                </div>

              </div>

              <div class="d-flex gap-2">

                <input
                  type="number"
                  min="1"
                  value="${q.pts || 1}"
                  class="form-control form-control-sm question-points"
                  data-index="${index}"
                  style="width:80px"
                >

                <button
                  class="btn btn-sm btn-outline-danger remove-question"
                  data-index="${index}"
                >
                  <i class="bi bi-trash"></i>
                </button>

              </div>

            </div>

          </li>
        `).join('')}
      </ul>
    `;

    /*
    =====================================
    REMOVE
    =====================================
    */

    document
      .querySelectorAll('.remove-question')
      .forEach(btn => {

        btn.addEventListener('click', () => {

          const index =
            Number(btn.dataset.index);

          selectedQuestions.splice(
            index,
            1
          );

          renderQuestions();
        });

      });

    /*
    =====================================
    POINTS
    =====================================
    */

    document
      .querySelectorAll('.question-points')
      .forEach(input => {

        input.addEventListener('change', () => {

          const index =
            Number(input.dataset.index);

          selectedQuestions[index].pts =
            Number(input.value);
        });

      });
  }

  /*
  =========================================
  IMPORT QUESTIONS
  =========================================
  */

  async function loadQuestionBank() {

    const res =
      await fetch('/api/questions');

    const data =
      await res.json();

    questionBankList.innerHTML =
      data.questions.map(q => `

        <div class="card mb-2">

          <div class="card-body">

            <div class="d-flex justify-content-between">

              <div>

                <strong>
                  ${q.question}
                </strong>

                <div class="small text-muted">

                  ${q.type}

                </div>

              </div>

              <button
                class="btn btn-sm btn-primary import-question"
                data-id="${q.id}"
              >
                Importar
              </button>

            </div>

          </div>

        </div>

      `).join('');

    document
      .querySelectorAll('.import-question')
      .forEach(btn => {

        btn.addEventListener('click', async () => {

          const id =
            btn.dataset.id;

          const res =
            await fetch(
              `/api/questions/${id}`
            );

          const data =
            await res.json();

          selectedQuestions.push({

            question_id:
              data.question.id,

            question:
              data.question.question,

            type:
              data.question.type,

            metadata:
              data.question.metadata,

            correct_answer:
              data.question.correct_answer,

            category:
              data.question.category,

            pts: 1
          });

		  renderQuestions();
       });

      });
  }

  loadQuestionBank();

  /*
  =========================================
  RECEIVE NEW QUESTION
  =========================================
  */

  document.addEventListener(
    'question:saved',
    (e) => {

      selectedQuestions.push(
        e.detail
      );

      renderQuestions();
    }
  );

  /*
  =========================================
  SAVE QUIZ
  =========================================
  */

  document
    .getElementById('quizForm')
    .addEventListener('submit', async (e) => {

      e.preventDefault();

	
const saveMode =
  document.getElementById(
    'saveMode'
  ).value;

let url = '/api/tests';
let method = 'POST';

/*
=====================================
TEMPLATE
=====================================
*/

if (saveMode === 'template') {

  url = '/api/templates';
}

/*
=====================================
EDIT TEST
=====================================
*/

if (
  isEdit &&
  editMode === 'test'
) {

  url =
    `/api/tests/${editData.code}`;

  method = 'PATCH';
}

/*
=====================================
EDIT TEMPLATE
=====================================
*/

if (
  isEdit &&
  editMode === 'template'
) {

  url =
    `/api/templates/${editData.templateId}`;

  method = 'PATCH';
}

      const payload = {

        title:
          document.getElementById(
            'quizName'
          ).value,

        description:
          document.getElementById(
            'quizDescription'
          ).value,

        category:
          document.getElementById(
            'quizCategory'
          ).value,

        group_code:
          document.getElementById(
            'quizGroup'
          ).value,

        status:
          document.getElementById(
            'quizStatus'
          ).value,

time_limit_minutes:
  document.getElementById(
    'quizTime'
  ).value
    ? Number(document.getElementById('quizTime').value)
    : null,

min_score:
  document.getElementById(
    'quizScore'
  ).value
    ? Number(document.getElementById('quizScore').value)
    : null,

        show_answers:
          document.getElementById(
            'showAnswers'
          ).checked,

        allow_retries:
          document.getElementById(
            'allowRetries'
          ).checked,

shuffle_questions:
  document.getElementById(
    'shuffleQuestions'
  ).checked,

shuffle_answers:
  document.getElementById(
    'shuffleAnswers'
  ).checked,

        questions:
          selectedQuestions
      };

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

      const data =
        await res.json();

      if (!res.ok) {

        alert(
          data.error || 'Error'
        );

        return;
      }

/*
=====================================
REDIRECTS
=====================================
*/

if (saveMode === 'template') {

  window.location =
    '/teacher/templates';

  return;
}

window.location =
  '/teacher/quizzes';

    });

  renderQuestions();

});
