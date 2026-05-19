const express = require('express');

const router = express.Router();

const {
  authMiddleware,
  requireRole
} = require('../middleware/auth');

const {
  TemplateController
} = require('../controllers/template');

router.use(authMiddleware);

router.post(
  '/',
  requireRole('teacher','admin'),
  TemplateController.create
);

router.get(
  '/:id',
  requireRole('teacher','admin'),
  TemplateController.get
);

router.patch(
  '/:id',
  requireRole('teacher','admin'),
  TemplateController.update
);

router.delete(
  '/:id',
  requireRole('teacher','admin'),
  TemplateController.delete
);

router.post(
  '/:id/use',
  requireRole('teacher','admin'),
  TemplateController.use
);

module.exports = router;
