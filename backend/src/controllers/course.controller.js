const courseModel = require('../models/course.model');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  const { search, level, trackId, page, limit } = req.validated.query;
  const { items, total } = await courseModel.findPage({
    search,
    level,
    trackId,
    limit,
    offset: (page - 1) * limit
  });

  return res.json({ items, page, limit, total });
}

async function getById(req, res) {
  const course = await courseModel.findActiveById(req.validated.params.id);
  if (!course) {
    throw new HttpError(404, 'Không tìm thấy khóa học.', 'COURSE_NOT_FOUND');
  }

  return res.json(course);
}

module.exports = { list, getById };
