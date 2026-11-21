const jwt = require('jsonwebtoken');
const env = require('../config/env');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/user.model');

const verifyJWT = asyncHandler(async (req, res, next) => {
  const authorization = req.get('authorization');
  const [scheme, token, extra] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token || extra) {
    throw new HttpError(401, 'Vui lòng đăng nhập.', 'UNAUTHORIZED');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 'INVALID_TOKEN');
    }
    throw error;
  }

  const user = await userModel.findById(payload.sub);
  if (!user || user.role !== payload.role) {
    throw new HttpError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 'INVALID_TOKEN');
  }

  req.user = user;
  next();
});

module.exports = verifyJWT;
