const env = require('../config/env');
const caseModel = require('../models/case.model');
const assessmentModel = require('../models/assessment.model');
const HttpError = require('../utils/httpError');
const { validateAnswer } = require('../services/ai/antiCheat.service');
const { validateAiResult } = require('../services/ai/aiResult.validator');
const { buildPrompt, buildUserContent } = require('../services/ai/prompt.builder');
const { generateMockResult } = require('../services/ai/mockAi.service');
const geminiService = require('../services/ai/gemini.service');
const { recommend } = require('../services/recommend.service');

async function submit(req, res) {
  const { caseId } = req.validated.body;
  const answer = validateAnswer(req.validated.body.answer, {
    minLength: env.ANSWER_MIN_LEN,
    maxLength: env.ANSWER_MAX_LEN
  });

  const caseItem = await caseModel.findActiveForAssessment(caseId);
  if (!caseItem) {
    throw new HttpError(404, 'Không tìm thấy tình huống đang hoạt động.', 'CASE_NOT_FOUND');
  }

  const systemPrompt = buildPrompt({
    trackName: caseItem.trackName,
    criteria: caseItem.criteria
  });
  let aiResult;
  let transientDemo = false;
  const isMock = env.MOCK_AI;

  if (isMock) {
    aiResult = generateMockResult({ criteria: caseItem.criteria });
  } else {
    try {
      const response = await geminiService.generate({
        systemPrompt,
        userContent: buildUserContent({ scenario: caseItem.scenario, answer })
      });
      aiResult = JSON.parse(response);
    } catch {
      if (env.DEMO_ON_AI_FAILURE) {
        aiResult = generateMockResult({ criteria: caseItem.criteria });
        transientDemo = true;
      } else {
        throw new HttpError(
          502,
          'Hệ thống AI trả về kết quả không hợp lệ hoặc không thể kết nối. Vui lòng thử lại.',
          'INVALID_AI_RESPONSE'
        );
      }
    }
  }

  const result = validateAiResult(aiResult, caseItem.criteria);
  const criteria = caseItem.criteria.map((criterion) => {
    const scoredCriterion = result.criteria.find(({ code }) => code === criterion.code);
    return {
      id: criterion.id,
      code: criterion.code,
      name: criterion.name,
      score: scoredCriterion.score,
      comment: scoredCriterion.comment
    };
  });

  if (transientDemo) {
    const recommendations = await recommend({ criteria });
    return res.status(200).json({
      assessmentId: null,
      saved: false,
      trackName: caseItem.trackName,
      caseTitle: caseItem.title,
      overallScore: result.overallScore,
      criteria,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      focusTopics: result.focusTopics,
      advice: result.advice,
      recommendations,
      isMock: true,
      createdAt: new Date().toISOString()
    });
  }

  const created = await assessmentModel.createAssessment({
    userId: req.user.id,
    caseId: caseItem.id,
    trackId: caseItem.trackId,
    answer,
    result,
    isMock,
    criteria
  });

  return res.status(201).json({
    assessmentId: created.assessmentId,
    trackName: caseItem.trackName,
    caseTitle: caseItem.title,
    overallScore: result.overallScore,
    criteria,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    focusTopics: result.focusTopics,
    advice: result.advice,
    recommendations: created.recommendations.map((recommendation) => ({
      courseId: recommendation.courseId,
      title: recommendation.title,
      criterionCode: recommendation.criterionCode,
      reason: recommendation.reason
    })),
    isMock,
    createdAt: created.createdAt
  });
}

async function history(req, res) {
  const items = await assessmentModel.getHistory(req.user.id);
  return res.json({ items });
}

async function getById(req, res) {
  const assessment = await assessmentModel.getById(
    req.user.id,
    req.validated.params.id
  );
  if (!assessment) {
    throw new HttpError(404, 'Không tìm thấy kết quả đánh giá.', 'ASSESSMENT_NOT_FOUND');
  }

  return res.json(assessment);
}

module.exports = { submit, history, getById };
