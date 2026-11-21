const express = require('express');
const assessmentController = require('../controllers/assessment.controller');
const verifyJWT = require('../middlewares/auth');
const requireRole = require('../middlewares/role');
const { submitLimiter } = require('../middlewares/rateLimit');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const {
  submitAssessmentSchema,
  assessmentIdSchema
} = require('../validators/assessment.schemas');

const router = express.Router();

router.use(verifyJWT);
router.post(
  '/',
  requireRole('student'),
  submitLimiter,
  validate(submitAssessmentSchema),
  asyncHandler(assessmentController.submit)
);
router.get('/history', asyncHandler(assessmentController.history));
router.get(
  '/:id',
  validate(assessmentIdSchema),
  asyncHandler(assessmentController.getById)
);

module.exports = router;
