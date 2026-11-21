const HttpError = require('../utils/httpError');

function validate(schema) {
  return function validateRequest(req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      return next(new HttpError(400, 'Dữ liệu không hợp lệ.', 'VALIDATION_ERROR'));
    }

    req.validated = result.data;
    return next();
  };
}

module.exports = validate;
