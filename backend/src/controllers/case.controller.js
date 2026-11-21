const caseModel = require('../models/case.model');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  const cases = await caseModel.findActiveByTrack(req.validated.query.trackId);
  return res.json({ items: cases });
}

async function random(req, res) {
  const caseItem = await caseModel.findRandomActiveByTrack(req.validated.query.trackId);
  if (!caseItem) {
    throw new HttpError(404, 'Không tìm thấy tình huống đang hoạt động.', 'CASE_NOT_FOUND');
  }

  return res.json(caseItem);
}

async function getById(req, res) {
  const caseItem = await caseModel.findActiveById(req.validated.params.id);
  if (!caseItem) {
    throw new HttpError(404, 'Không tìm thấy tình huống đang hoạt động.', 'CASE_NOT_FOUND');
  }

  return res.json(caseItem);
}

module.exports = { list, random, getById };
