const { ZodError } = require('zod');
const HttpError = require('../utils/httpError');

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ.',
      code: 'VALIDATION_ERROR'
    });
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      message: req.path.startsWith('/api/auth/')
        ? 'Email đã được sử dụng.'
        : 'Mã hoặc thông tin này đã tồn tại.',
      code: req.path.startsWith('/api/auth/') ? 'EMAIL_EXISTS' : 'DUPLICATE_RESOURCE'
    });
  }

  if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({
      message: 'Dữ liệu đang được sử dụng. Hãy tắt thay vì xóa.',
      code: 'RESOURCE_IN_USE'
    });
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({
      message: 'Ngành hoặc tiêu chí được chọn không tồn tại.',
      code: 'INVALID_REFERENCE'
    });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Dữ liệu JSON không hợp lệ.',
      code: 'INVALID_JSON'
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({
      message: error.message,
      code: error.code
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  return res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Đã xảy ra lỗi nội bộ.'
      : error.message,
    code: 'INTERNAL_SERVER_ERROR'
  });
}

module.exports = errorHandler;
