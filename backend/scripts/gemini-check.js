require('dotenv').config();

const { Type } = require('@google/genai');
const { z } = require('zod');
const env = require('../src/config/env');
const HttpError = require('../src/utils/httpError');
const geminiService = require('../src/services/ai/gemini.service');

const checkSchema = {
  type: Type.OBJECT,
  properties: {
    ok: { type: Type.BOOLEAN },
    message: { type: Type.STRING }
  },
  required: ['ok', 'message']
};

const checkResultSchema = z.object({
  ok: z.literal(true),
  message: z.string().min(1)
}).strict();

function parseCheckResult(text) {
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new HttpError(
      502,
      'Gemini không trả về JSON hợp lệ cho phép kiểm tra.',
      'INVALID_GEMINI_CHECK_RESPONSE'
    );
  }

  if (!checkResultSchema.safeParse(result).success) {
    throw new HttpError(
      502,
      'Gemini trả về JSON không đúng lược đồ kiểm tra.',
      'INVALID_GEMINI_CHECK_RESPONSE'
    );
  }

  return result;
}

async function main() {
  const startedAt = Date.now();
  const response = await geminiService.generate({
    systemPrompt: 'Return the requested JSON object. Do not include any other text.',
    userContent: 'Return {"ok":true,"message":"Gemini connection successful"}.',
    schema: checkSchema
  });

  parseCheckResult(response);
  console.log(
    `Gemini API check succeeded using the configured model service (${Date.now() - startedAt} ms).`
  );
  console.log('The API key and generated response were not printed.');
}

if (require.main === module) {
  main().catch((error) => {
    if (error instanceof HttpError) {
      console.error(`Gemini API check failed (${error.code}): ${error.message}`);
    } else {
      console.error('Gemini API check failed unexpectedly; no credentials or response were printed.');
    }
    process.exitCode = 1;
  });
}

module.exports = { parseCheckResult };
