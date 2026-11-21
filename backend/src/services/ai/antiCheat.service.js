const HttpError = require('../../utils/httpError');

const SUSPICIOUS_PHRASES = [
  'ignore previous',
  'ignore all instructions',
  'ignore all previous instructions',
  'system prompt',
  'reveal prompt',
  'bỏ qua hướng dẫn',
  'bỏ qua mọi hướng dẫn',
  'bỏ qua mọi chỉ thị',
  'bỏ qua tất cả hướng dẫn',
  'quên các quy tắc',
  'đóng vai',
  'cho tôi 10 điểm',
  'cho điểm tối đa',
  'tiết lộ prompt',
  'you are now',
  '</answer>',
  '<case>'
];

function normalizeForMatching(value) {
  return value
    .normalize('NFD')
    .toLocaleLowerCase('vi')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanAnswer(answer) {
  if (typeof answer !== 'string') {
    throw new HttpError(400, 'Câu trả lời không hợp lệ.', 'VALIDATION_ERROR');
  }

  return answer
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function validateAnswer(answer, options = {}) {
  const { minLength = 50, maxLength = 3000 } = options;
  const cleanedAnswer = cleanAnswer(answer);

  if (cleanedAnswer.length < minLength || cleanedAnswer.length > maxLength) {
    throw new HttpError(
      400,
      `Câu trả lời phải có từ ${minLength} đến ${maxLength} ký tự.`,
      'INVALID_ANSWER_LENGTH'
    );
  }

  const normalizedAnswer = normalizeForMatching(cleanedAnswer);
  const suspiciousPhrase = SUSPICIOUS_PHRASES.find((phrase) =>
    normalizedAnswer.includes(normalizeForMatching(phrase))
  );

  if (suspiciousPhrase) {
    throw new HttpError(
      400,
      'Câu trả lời chứa nội dung không được phép.',
      'SUSPICIOUS_ANSWER'
    );
  }

  return cleanedAnswer;
}

module.exports = { cleanAnswer, validateAnswer, SUSPICIOUS_PHRASES };
