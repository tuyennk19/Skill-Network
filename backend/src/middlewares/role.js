const HttpError = require('../utils/httpError');

function requireRole(role) {
  return function checkRole(req, res, next) {
    if (!req.user || req.user.role !== role) {
      return next(new HttpError(403, 'Bạn không có quyền thực hiện thao tác này.', 'FORBIDDEN'));
    }
    return next();
  };
}

module.exports = requireRole;
