const trackModel = require('../models/admin-track.model');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  return res.json({ items: await trackModel.findAll() });
}

async function create(req, res) {
  const id = await trackModel.create(req.validated.body);
  return res.status(201).json({ id, message: 'Tạo ngành nghề thành công.' });
}

async function update(req, res) {
  const { id } = req.validated.params;
  const affectedRows = await trackModel.update(id, req.validated.body);
  if (!affectedRows) {
    throw new HttpError(404, 'Không tìm thấy ngành nghề.', 'TRACK_NOT_FOUND');
  }
  return res.json({ message: 'Cập nhật ngành nghề thành công.' });
}

async function remove(req, res) {
  const affectedRows = await trackModel.deleteById(req.validated.params.id);
  if (!affectedRows) {
    throw new HttpError(404, 'Không tìm thấy ngành nghề.', 'TRACK_NOT_FOUND');
  }
  return res.json({ message: 'Xóa ngành nghề thành công.' });
}

async function createCriterion(req, res) {
  const id = await trackModel.createCriterion(
    req.validated.params.trackId,
    req.validated.body
  );
  return res.status(201).json({ id, message: 'Tạo tiêu chí thành công.' });
}

async function updateCriterion(req, res) {
  const affectedRows = await trackModel.updateCriterion(
    req.validated.params.id,
    req.validated.body
  );
  if (!affectedRows) {
    throw new HttpError(404, 'Không tìm thấy tiêu chí.', 'CRITERION_NOT_FOUND');
  }
  return res.json({ message: 'Cập nhật tiêu chí thành công.' });
}

async function removeCriterion(req, res) {
  const affectedRows = await trackModel.deleteCriterion(req.validated.params.id);
  if (!affectedRows) {
    throw new HttpError(404, 'Không tìm thấy tiêu chí.', 'CRITERION_NOT_FOUND');
  }
  return res.json({ message: 'Xóa tiêu chí thành công.' });
}

module.exports = { list, create, update, remove, createCriterion, updateCriterion, removeCriterion };
