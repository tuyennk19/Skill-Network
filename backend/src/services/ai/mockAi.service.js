function generateMockResult({ criteria }) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new TypeError('criteria must be a non-empty array.');
  }

  const scoredCriteria = criteria.map((criterion) => {
    if (typeof criterion.code !== 'string' || typeof criterion.name !== 'string') {
      throw new TypeError('Each criterion must include its code and name.');
    }

    const score = Math.round((5 + Math.random() * 4) * 10) / 10;
    return {
      code: criterion.code,
      score,
      comment: `Kết quả mô phỏng cho tiêu chí ${criterion.name}.`
    };
  });
  const average = scoredCriteria.reduce((sum, criterion) => sum + criterion.score, 0) /
    scoredCriteria.length;

  return {
    overallScore: Math.round(average * 10) / 10,
    criteria: scoredCriteria,
    strengths: ['Đây là nhận xét mô phỏng.'],
    weaknesses: ['Đây là nhận xét mô phỏng.'],
    focusTopics: [
      'Đây là nội dung mô phỏng, không phải đánh giá thật.',
      'Kết quả không phản ánh năng lực thực tế.'
    ],
    advice: ['Không sử dụng dữ liệu này để đánh giá năng lực thật.'],
    isOffTopic: false,
    offTopicReason: ''
  };
}

module.exports = { generateMockResult };
