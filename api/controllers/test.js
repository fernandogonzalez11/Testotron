const crypto = require('crypto');

const {
  createTest,
  getTest,
  listTests,
  updateTest,
  deleteTest,
  addTestQuestion,
  clearTestQuestions
} = require('../models/test');

const { getTestQuestions } = require('../models/test-question');

const {
  getQuestion
} = require('../models/questions');

const { handleError } = require('./utils');

class TestController {

  /*
  =========================================
  CREATE TEST
  =========================================
  */
  static create(req, res) {

    try {

      const body = req.body;

      const code =
        crypto.randomBytes(4)
          .toString('hex');

      createTest({

        code,

        template_id:
          body.template_id || null,

        owner_id:
          req.user.id,

        group_code:
          body.group_code || null,

        title:
          body.title,

        description:
          body.description || '',

        instructions:
          body.instructions || '',

        status:
          body.status || 'draft',

        category:
          body.category || '',

        time_limit_minutes:
          body.time_limit_minutes || null,

        min_score:
          body.min_score || 60,

        show_answers:
          body.show_answers ? 1 : 0,

        allow_retries:
          body.allow_retries ? 1 : 0,

        settings:
          JSON.stringify(
            body.settings || {}
          ),

	shuffle_questions:
  body.shuffle_questions ? 1 : 0,

shuffle_answers:
  body.shuffle_answers ? 1 : 0,
      });

      /*
      =====================================
      SNAPSHOT QUESTIONS
      =====================================
      */

      if (Array.isArray(body.questions)) {

        body.questions.forEach((item, index) => {

          /*
          ===================================
          IMPORTED QUESTION
          ===================================
          */

          if (item.question_id) {

            const original =
              getQuestion(
                item.question_id
              );

            if (!original) {
              return;
            }

            addTestQuestion({

              test_code: code,

              original_question_id:
                original.id,

              section_title: '',

              position: index,

              question:
                original.question,

              type:
                original.type,

              metadata:
                JSON.stringify(
                  original.metadata || {}
                ),

              correct_answer:
                JSON.stringify(
                  original.correct_answer
                ),

              pts:
                item.pts || 1
            });

            return;
          }

          /*
          ===================================
          INLINE QUESTION
          ===================================
          */

          addTestQuestion({

            test_code: code,

            original_question_id: null,

            section_title: '',

            position: index,

            question:
              item.question,

            type:
              item.type,

            metadata:
              JSON.stringify(
                item.metadata || {}
              ),

            correct_answer:
              JSON.stringify(
                item.correct_answer
              ),

            pts:
              item.pts || 1
          });

        });

      }

      return res.status(201).json({
        success: true,
        code
      });

    } catch (err) {

      handleError(err, res);
    }
  }

  /*
  =========================================
  LIST TESTS
  =========================================
  */
  static list(req, res) {

    try {

      const q = {

        title:
          req.query.title,

        group_code:
          req.query.group_code,

        owner_id:
          req.query.owner_id
            ? Number(req.query.owner_id)
            : (
                req.user &&
                req.user.role === 'teacher'
              )
                ? req.user.id
                : undefined,

        status:
          req.query.status
      };

      const rows =
        listTests(q);

      res.json({
        tests: rows
      });

    } catch (err) {

      handleError(err, res);
    }
  }

  /*
  =========================================
  GET TEST
  =========================================
  */
  static get(req, res) {

    try {

      const test =
        getTest(req.params.code);

      if (!test) {

        return res.status(404).json({
          error: 'Quiz no encontrado'
        });
      }

      res.json({
        test
      });

    } catch (err) {

      handleError(err, res);
    }
  }

  /*
  =========================================
  TEST DETAIL
  =========================================
  */
  static detail(req, res) {

    try {

      const code =
        req.params.code;

      const test =
        getTest(code);

      if (!test) {

        return res.status(404).json({
          error: 'Not found'
        });
      }

      const questions =
        getTestQuestions(code);

      test.questions =
        questions;

      res.json({
        test
      });

    } catch (err) {

      handleError(err, res);
    }
  }

  /*
  =========================================
  UPDATE TEST
  =========================================
  */
  static update(req, res) {

    try {

      const body =
        req.body;

      const code =
        req.params.code;

      updateTest(
        code,
        {

          template_id:
            body.template_id,

          group_code:
            body.group_code,

          title:
            body.title,

          description:
            body.description,

          instructions:
            body.instructions,

          status:
            body.status,

          category:
            body.category,

          time_limit_minutes:
            body.time_limit_minutes,

          min_score:
            body.min_score,

          show_answers:
            body.show_answers ? 1 : 0,

          allow_retries:
            body.allow_retries ? 1 : 0,

          settings:
            JSON.stringify(
              body.settings || {}
            ),

shuffle_questions:
  body.shuffle_questions ? 1 : 0,

shuffle_answers:
  body.shuffle_answers ? 1 : 0

        }
      );

      /*
      =====================================
      REPLACE QUESTIONS
      =====================================
      */

      clearTestQuestions(code);

      if (Array.isArray(body.questions)) {

        body.questions.forEach((item, index) => {

          /*
          ===================================
          IMPORTED QUESTION
          ===================================
          */

          if (item.question_id) {

            const original =
              getQuestion(
                item.question_id
              );

            if (!original) {
              return;
            }

            addTestQuestion({

              test_code: code,

              original_question_id:
                original.id,

              section_title: '',

              position: index,

              question:
                original.question,

              type:
                original.type,

              metadata:
                JSON.stringify(
                  original.metadata || {}
                ),

              correct_answer:
                JSON.stringify(
                  original.correct_answer
                ),

              pts:
                item.pts || 1
            });

            return;
          }

          /*
          ===================================
          INLINE QUESTION
          ===================================
          */

          addTestQuestion({

            test_code: code,

            original_question_id: null,

            section_title: '',

            position: index,

            question:
              item.question,

            type:
              item.type,

            metadata:
              JSON.stringify(
                item.metadata || {}
              ),

            correct_answer:
              JSON.stringify(
                item.correct_answer
              ),

            pts:
              item.pts || 1
          });

        });

      }

      res.json({
        success: true
      });

    } catch (err) {

      handleError(err, res);
    }
  }

  /*
  =========================================
  DELETE TEST
  =========================================
  */
  static delete(req, res) {

    try {

      const code =
        req.params.code;

      const changes =
        deleteTest(code);

      res.json({
        deleted: changes
      });

    } catch (err) {

      handleError(err, res);
    }
  }

  /*
  =========================================
  PUBLISH TEST
  =========================================
  */
  static publish(req, res) {

    try {

      const code =
        req.params.code;

      const changes =
        updateTest(code, {

          status: 'published',

          published_at:
            new Date().toISOString()
        });

      res.json({
        published: !!changes
      });

    } catch (err) {

      handleError(err, res);
    }
  }

  /*
  =========================================
  CLOSE TEST
  =========================================
  */
  static close(req, res) {

    try {

      const code =
        req.params.code;

      const changes =
        updateTest(code, {
          status: 'closed'
        });

      res.json({
        closed: !!changes
      });

    } catch (err) {

      handleError(err, res);
    }
  }
}

module.exports = {
  TestController
};
