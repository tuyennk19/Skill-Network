const { z } = require('zod');
const HttpError = require('../../utils/httpError');

const aiResultSchema = z.object({
  overallScore: z.number(),
  criteria: z.array(z.object({
    code: z.string(),
    score: z.number().min(0).max(10),
    comment: z.string()
  }).strict()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  focusTopics: z.array(z.string()),
  advice: z.array(z.string()),
  isOffTopic: z.boolean(),
  offTopicReason: z.string()
}).strict();

function cleanText(value) {
  return value.replace(/<[^>]*>/g, '').trim().slice(0, 500);
}

function invalidAiResult() {
  return new HttpError(
    502,
    'Hệ thống AI trả về kết quả không hợp lệ. Vui lòng thử lại.',
    'INVALID_AI_RESPONSE'
  );
}

function validateAiResult(result, expectedCriteria) {
  const parsed = aiResultSchema.safeParse(result);
  if (!parsed.success || !Array.isArray(expectedCriteria) || expectedCriteria.length === 0) {
    throw invalidAiResult();
  }

  if (expectedCriteria.some((criterion) =>
    !criterion || typeof criterion.code !== 'string'
  )) {
    throw invalidAiResult();
  }

  const expectedCodes = expectedCriteria.map((criterion) => criterion.code);
  const actualCodes = parsed.data.criteria.map((criterion) => criterion.code);
  const uniqueCodes = new Set(actualCodes);

  if (
    expectedCodes.some((code) => typeof code !== 'string') ||
    new Set(expectedCodes).size !== expectedCodes.length ||
    uniqueCodes.size !== actualCodes.length ||
    uniqueCodes.size !== expectedCodes.length ||
    expectedCodes.some((code) => !uniqueCodes.has(code))
  ) {
    throw invalidAiResult();
  }

  if (!parsed.data.isOffTopic && parsed.data.offTopicReason.trim()) {
    throw invalidAiResult();
  }

  if (!parsed.data.isOffTopic && parsed.data.focusTopics.length < 2) {
    throw invalidAiResult();
  }

  if (parsed.data.isOffTopic) {
    throw new HttpError(
      422,
      'Bài làm bị xác định là lạc đề hoặc có dấu hiệu thao túng.',
      'OFF_TOPIC_ANSWER'
    );
  }

  const criteriaByCode = new Map(
    parsed.data.criteria.map((criterion) => [
      criterion.code,
      { ...criterion, comment: cleanText(criterion.comment) }
    ])
  );
  const criteria = expectedCodes.map((code) => criteriaByCode.get(code));
  const average = criteria.reduce((sum, criterion) => sum + criterion.score, 0) / criteria.length;

  return {
    overallScore: Math.round(average * 10) / 10,
    criteria,
    strengths: parsed.data.strengths.slice(0, 3).map(cleanText),
    weaknesses: parsed.data.weaknesses.slice(0, 3).map(cleanText),
    focusTopics: parsed.data.focusTopics.slice(0, 4).map(cleanText),
    advice: parsed.data.advice.slice(0, 3).map(cleanText),
    isOffTopic: false,
    offTopicReason: cleanText(parsed.data.offTopicReason)
  };
}

module.exports = { validateAiResult };
