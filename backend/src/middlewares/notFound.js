function notFound(req, res, next) {
  res.status(404).json({
    message: 'Không tìm thấy tài nguyên.',
    code: 'NOT_FOUND'
  });
}

module.exports = notFound;
