const caseModel = require('../models/admin-case.model');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  const { trackId } = req.validated.query;
  return res.json({ items: await caseModel.findAll(trackId) });
}

async function create(req, res) {
  const id = await caseModel.create(req.validated.body);
  return res.status(201).json({ id, message: 'Tạo tình huống thành công.' });
}

async function update(req, res) {
  const affectedRows = await caseModel.update(
    req.validated.params.id,
    req.validated.body
  );
  if (!affectedRows) {
    throw new HttpError(404, 'Không tìm thấy tình huống.', 'CASE_NOT_FOUND');
  }
  return res.json({ message: 'Cập nhật tình huống thành công.' });
}

async function remove(req, res) {
  const affectedRows = await caseModel.deleteById(req.validated.params.id);
  if (!affectedRows) {
    throw new HttpError(404, 'Không tìm thấy tình huống.', 'CASE_NOT_FOUND');
  }
  return res.json({ message: 'Xóa tình huống thành công.' });
}

module.exports = { list, create, update, remove };
