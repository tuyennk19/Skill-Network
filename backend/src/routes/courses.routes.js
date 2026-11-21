const express = require('express');
const courseController = require('../controllers/course.controller');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { idParams, courseListQuery } = require('../validators/publicData.schemas');

const router = express.Router();

router.get('/', validate(courseListQuery), asyncHandler(courseController.list));
router.get('/:id', validate(idParams), asyncHandler(courseController.getById));

module.exports = router;
