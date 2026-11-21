const assessmentModel = require('../models/assessment.model');
const HttpError = require('../utils/httpError');

async function list(req, res) {
  return res.json(await assessmentModel.getAdminList(req.validated.query));
}

async function getById(req, res) {
  const assessment = await assessmentModel.getAdminById(req.validated.params.id);
  if (!assessment) {
    throw new HttpError(404, 'Không tìm thấy bài nộp.', 'ASSESSMENT_NOT_FOUND');
  }
  return res.json(assessment);
}

async function stats(req, res) {
  return res.json(await assessmentModel.getAdminStats());
}

module.exports = { list, getById, stats };
