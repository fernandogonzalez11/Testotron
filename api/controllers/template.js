const {

  createTemplate,

  createTemplateSection,

  addTemplateQuestion

} = require('../models/template');

const {
  getTemplate,
  updateTemplate,
  deleteTemplate
} = require('../models/template');


class TemplateController {

  static create(req, res) {

    try {

      const body = req.body;

      const templateId =
        createTemplate({

          owner_id:
            req.user.id,

          title:
            body.title,

          description:
            body.description || '',

          instructions:
            body.instructions || '',

          time_limit_minutes:
            body.time_limit_minutes || null,

          shuffle_questions: 0,

          shuffle_answers: 0
        });

      const sectionId =
        createTemplateSection({

          template_id:
            templateId,

          title:
            'General',

          description: '',

          position: 0
        });

      if (
        Array.isArray(body.questions)
      ) {

        body.questions.forEach(
          (q, index) => {

            if (!q.question_id) {
              return;
            }

            addTemplateQuestion({

              template_section_id:
                sectionId,

              question_id:
                q.question_id,

              position:
                index,

              pts:
                q.pts || 1,

              required: 1
            });

          }
        );
      }

      res.status(201).json({

        success: true,

        template_id:
          templateId
      });

    } catch (err) {

      handleError(err, res);
    }
  }

static get(req, res) {

  try {

    const template =
      getTemplate(req.params.id);

    if (!template) {

      return res.status(404).json({
        error: 'Template not found'
      });
    }

    res.json({
      template
    });

  } catch (err) {

    handleError(err, res);
  }
}

static update(req, res) {

  try {

    const changes =
      updateTemplate(
        req.params.id,
        req.body
      );

    res.json({
      updated: !!changes
    });

  } catch (err) {

    handleError(err, res);
  }
}


static delete(req, res) {

  try {

    const changes =
      deleteTemplate(
        req.params.id
      );

    res.json({
      deleted: !!changes
    });

  } catch (err) {

    handleError(err, res);
  }
}

static use(req, res) {

  try {

    const template =
      getTemplate(req.params.id);

    if (!template) {

      return res.status(404).json({
        error: 'Template not found'
      });
    }

    const code =
      Math.random()
        .toString(36)
        .slice(2, 10)
        .toUpperCase();

    createTest({

      code,

      template_id:
        template.id,

      owner_id:
        req.user.id,

      group_code: null,

      title:
        template.title,

      description:
        template.description,

      instructions:
        template.instructions,

      status: 'draft',

      category: null,

      time_limit_minutes:
        template.time_limit_minutes,

      min_score: 70,

      show_answers: 1,

      allow_retries: 0,

      settings: '{}',

      shuffle_questions:
        template.shuffle_questions,

      shuffle_answers:
        template.shuffle_answers
    });

    template.questions.forEach(
      (q, index) => {

        addTestQuestion({

          test_code: code,

          original_question_id:
            q.question_id,

          section_title:
            'General',

          position: index,

          question:
            q.question,

          type:
            q.type,

          metadata: '{}',

          correct_answer: 'null',

          pts:
            q.pts || 1
        });
      }
    );

    return res.redirect(
      `/teacher/quizzes/edit/${code}`
    );

  } catch (err) {

    handleError(err, res);
  }
}

}

module.exports = {
  TemplateController
};
