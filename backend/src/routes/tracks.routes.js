const express = require('express');
const trackController = require('../controllers/track.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(trackController.list));

module.exports = router;
