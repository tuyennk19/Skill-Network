const express = require('express');
const caseController = require('../controllers/case.controller');
const verifyJWT = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const { idParams, caseTrackQuery } = require('../validators/publicData.schemas');

const router = express.Router();

router.use(verifyJWT);
router.get('/', validate(caseTrackQuery), asyncHandler(caseController.list));
router.get('/random', validate(caseTrackQuery), asyncHandler(caseController.random));
router.get('/:id', validate(idParams), asyncHandler(caseController.getById));

module.exports = router;
