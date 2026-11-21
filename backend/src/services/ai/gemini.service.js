const { GoogleGenAI, Type } = require('@google/genai');
const env = require('../../config/env');
const HttpError = require('../../utils/httpError');

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER },
    criteria: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code: { type: Type.STRING },
          score: { type: Type.NUMBER },
          comment: { type: Type.STRING }
        },
        required: ['code', 'score', 'comment']
      }
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
    focusTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
    advice: { type: Type.ARRAY, items: { type: Type.STRING } },
    isOffTopic: { type: Type.BOOLEAN },
    offTopicReason: { type: Type.STRING }
  },
  required: [
    'overallScore',
    'criteria',
    'strengths',
    'weaknesses',
    'focusTopics',
    'advice',
    'isOffTopic',
    'offTopicReason'
  ]
};

function isRetryable(error) {
  const status = Number(error && (error.status || error.statusCode || error.code));
  const message = error instanceof Error ? error.message : String(error);
  return [408, 429, 503].includes(status) ||
    (error && (error.name === 'AbortError' || error.name === 'TimeoutError')) ||
    /timeout|timed out|aborted/i.test(message);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function unavailableError() {
  return new HttpError(
    503,
    'Hệ thống AI đang quá tải, vui lòng thử lại sau.',
    'AI_UNAVAILABLE'
  );
}

function authenticationError() {
  return new HttpError(
    503,
    'Gemini từ chối xác thực. Vui lòng kiểm tra API key và quyền truy cập.',
    'AI_AUTH_FAILED'
  );
}

function isAuthenticationError(error) {
  const status = Number(error && (error.status || error.statusCode || error.code));
  return status === 401 || status === 403;
}

async function generate({ systemPrompt, userContent, schema = responseSchema }) {
  if (
    typeof systemPrompt !== 'string' ||
    typeof userContent !== 'string' ||
    !schema ||
    typeof schema !== 'object'
  ) {
    throw new TypeError('systemPrompt, userContent, and schema are required.');
  }

  if (!env.GEMINI_API_KEY) {
    throw new HttpError(
      503,
      'Gemini API chưa được cấu hình.',
      'AI_NOT_CONFIGURED'
    );
  }

  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const request = (model) => client.models.generateContent({
    model,
    contents: userContent,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: schema,
      maxOutputTokens: 3000,
      httpOptions: {
        timeout: env.AI_TIMEOUT_MS,
        retryOptions: { attempts: 1 }
      }
    }
  });

  let response;
  try {
    response = await request(env.GEMINI_MODEL);
  } catch (error) {
    if (isAuthenticationError(error)) {
      throw authenticationError();
    }

    if (!isRetryable(error)) {
      throw unavailableError();
    }

    await wait(1500);
    try {
      response = await request(env.GEMINI_MODEL);
    } catch (retryError) {
      if (isAuthenticationError(retryError)) {
        throw authenticationError();
      }

      if (env.GEMINI_FALLBACK_MODEL === env.GEMINI_MODEL) {
        throw unavailableError();
      }

      try {
        response = await request(env.GEMINI_FALLBACK_MODEL);
      } catch (fallbackError) {
        if (isAuthenticationError(fallbackError)) {
          throw authenticationError();
        }
        throw unavailableError();
      }
    }
  }

  return response.text || '';
}

module.exports = { generate, responseSchema };
