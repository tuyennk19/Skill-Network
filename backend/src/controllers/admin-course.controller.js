const courseModel = require('../models/admin-course.model');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  return res.json({ items: await courseModel.findAll() });
}

async function create(req, res) {
  const id = await courseModel.create(req.validated.body);
  return res.status(201).json({ id, message: 'Tạo khóa học thành công.' });
}

async function update(req, res) {
  const affectedRows = await courseModel.update(
    req.validated.params.id,
    req.validated.body
  );
  if (!affectedRows) {
    throw new HttpError(404, 'Không tìm thấy khóa học.', 'COURSE_NOT_FOUND');
  }
  return res.json({ message: 'Cập nhật khóa học thành công.' });
}

async function remove(req, res) {
  const affectedRows = await courseModel.deleteById(req.validated.params.id);
  if (!affectedRows) {
    throw new HttpError(404, 'Không tìm thấy khóa học.', 'COURSE_NOT_FOUND');
  }
  return res.json({ message: 'Xóa khóa học thành công.' });
}

module.exports = { list, create, update, remove };
