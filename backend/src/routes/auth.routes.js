const express = require('express');
const authController = require('../controllers/auth.controller');
const verifyJWT = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');
const {
  registerSchema,
  loginSchema,
  updateMeSchema
} = require('../validators/auth.schemas');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register)
);
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login)
);
router.get('/me', verifyJWT, asyncHandler(authController.getMe));
router.patch(
  '/me',
  verifyJWT,
  validate(updateMeSchema),
  asyncHandler(authController.updateMe)
);

module.exports = router;
