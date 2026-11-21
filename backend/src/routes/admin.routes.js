const express = require('express');
const { z } = require('zod');
const verifyJWT = require('../middlewares/auth');
const requireRole = require('../middlewares/role');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const trackController = require('../controllers/admin-track.controller');
const caseController = require('../controllers/admin-case.controller');
const courseController = require('../controllers/admin-course.controller');
const assessmentController = require('../controllers/admin-assessment.controller');
const { assessmentIdSchema } = require('../validators/assessment.schemas');
const {
  idParams,
  trackIdParams,
  trackBody,
  criterionBody,
  caseBody,
  courseBody,
  caseListQuery,
  assessmentListQuery
} = require('../validators/admin.schemas');

const router = express.Router();

router.use(verifyJWT, requireRole('admin'));

router.get('/tracks', asyncHandler(trackController.list));
router.post('/tracks', validate(z.object({ body: trackBody })), asyncHandler(trackController.create));
router.put(
  '/tracks/:id',
  validate(z.object({ params: idParams.shape.params, body: trackBody })),
  asyncHandler(trackController.update)
);
router.delete('/tracks/:id', validate(idParams), asyncHandler(trackController.remove));
router.post(
  '/tracks/:trackId/criteria',
  validate(z.object({ params: trackIdParams.shape.params, body: criterionBody })),
  asyncHandler(trackController.createCriterion)
);
router.put(
  '/criteria/:id',
  validate(z.object({ params: idParams.shape.params, body: criterionBody })),
  asyncHandler(trackController.updateCriterion)
);
router.delete('/criteria/:id', validate(idParams), asyncHandler(trackController.removeCriterion));

router.get('/cases', validate(caseListQuery), asyncHandler(caseController.list));
router.post('/cases', validate(z.object({ body: caseBody })), asyncHandler(caseController.create));
router.put(
  '/cases/:id',
  validate(z.object({ params: idParams.shape.params, body: caseBody })),
  asyncHandler(caseController.update)
);
router.delete('/cases/:id', validate(idParams), asyncHandler(caseController.remove));

router.get('/courses', asyncHandler(courseController.list));
router.post('/courses', validate(z.object({ body: courseBody })), asyncHandler(courseController.create));
router.put(
  '/courses/:id',
  validate(z.object({ params: idParams.shape.params, body: courseBody })),
  asyncHandler(courseController.update)
);
router.delete('/courses/:id', validate(idParams), asyncHandler(courseController.remove));

router.get('/assessments', validate(assessmentListQuery), asyncHandler(assessmentController.list));
router.get('/stats', asyncHandler(assessmentController.stats));
router.get('/assessments/:id', validate(assessmentIdSchema), asyncHandler(assessmentController.getById));

module.exports = router;
