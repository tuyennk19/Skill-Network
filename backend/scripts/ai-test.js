require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../src/config/db');
const env = require('../src/config/env');
const HttpError = require('../src/utils/httpError');
const { validateAnswer } = require('../src/services/ai/antiCheat.service');
const { validateAiResult } = require('../src/services/ai/aiResult.validator');
const { buildPrompt, buildUserContent } = require('../src/services/ai/prompt.builder');
const { generateMockResult } = require('../src/services/ai/mockAi.service');
const geminiService = require('../src/services/ai/gemini.service');

const samplePath = path.join(__dirname, 'ai-samples.json');
const trackCode = 'sales_b2b';
const scenario = 'Giám đốc mua hàng của một công ty sản xuất 200 nhân viên cho biết phần mềm quản lý kho có giá cao hơn đối thủ 1,5 lần và muốn hoãn quyết định sang quý sau. Hãy trình bày cách xử lý.';

async function loadSamples() {
  const content = await fs.readFile(samplePath, 'utf8');
  let samples;
  try {
    samples = JSON.parse(content);
  } catch {
    throw new Error('AI sample file is not valid JSON.');
  }

  if (
    !Array.isArray(samples) ||
    samples.length !== 5 ||
    samples.some((sample) =>
      !sample ||
      typeof sample.id !== 'string' ||
      typeof sample.label !== 'string' ||
      typeof sample.answer !== 'string'
    )
  ) {
    throw new Error('AI sample file must contain exactly five valid samples.');
  }

  return samples;
}

async function loadTrackCriteria() {
  const [rows] = await pool.execute(
    `SELECT t.name AS trackName,
            tc.code, tc.name, tc.description,
            tc.rubric_low AS rubricLow,
            tc.rubric_mid AS rubricMid,
            tc.rubric_high AS rubricHigh
     FROM career_tracks t
     JOIN track_criteria tc ON tc.track_id = t.id
     WHERE t.code = ? AND t.is_active = 1
     ORDER BY tc.sort_order, tc.id`,
    [trackCode]
  );

  if (rows.length === 0) {
    throw new Error(`No active criteria found for track ${trackCode}.`);
  }

  return { trackName: rows[0].trackName, criteria: rows };
}

function assertSamples(samples) {
  const byId = new Map(samples.map((sample) => [sample.id, sample]));
  const requiredIds = ['strong', 'medium', 'weak', 'off_topic', 'prompt_injection'];
  if (requiredIds.some((id) => !byId.has(id))) {
    throw new Error('AI sample file is missing one or more required test cases.');
  }
  return byId;
}

function parseGeminiResult(response, sampleId) {
  if (typeof response !== 'string' || !response.trim()) {
    throw new HttpError(
      502,
      `Gemini returned an empty response for sample ${sampleId}.`,
      'EMPTY_AI_RESPONSE'
    );
  }

  const trimmedResponse = response.trim();
  const fencedJson = trimmedResponse.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fencedJson ? fencedJson[1] : trimmedResponse;

  try {
    return JSON.parse(jsonText);
  } catch {
    throw new HttpError(
      502,
      `Gemini returned invalid JSON for sample ${sampleId}.`,
      'INVALID_AI_RESPONSE'
    );
  }
}

async function gradeSample({ sample, criteria, systemPrompt }) {
  const startedAt = Date.now();
  let answer;
  try {
    answer = validateAnswer(sample.answer, {
      minLength: env.ANSWER_MIN_LEN,
      maxLength: env.ANSWER_MAX_LEN
    });
  } catch (error) {
    if (sample.id === 'prompt_injection' && error.code === 'SUSPICIOUS_ANSWER') {
      return {
        id: sample.id,
        label: sample.label,
        status: 'BLOCKED_BY_ANTI_CHEAT',
        passed: true,
        elapsedMs: Date.now() - startedAt
      };
    }
    throw error;
  }

  if (sample.id === 'prompt_injection') {
    return {
      id: sample.id,
      label: sample.label,
      status: 'NOT_BLOCKED',
      passed: false,
      elapsedMs: Date.now() - startedAt
    };
  }

  let rawResult;
  if (env.MOCK_AI) {
    rawResult = generateMockResult({ criteria });
  } else {
    const response = await geminiService.generate({
      systemPrompt,
      userContent: buildUserContent({ scenario, answer })
    });
    rawResult = parseGeminiResult(response, sample.id);
  }

  try {
    const result = validateAiResult(rawResult, criteria);
    if (sample.id === 'off_topic' && env.MOCK_AI) {
      return {
        id: sample.id,
        label: sample.label,
        status: 'NOT_VERIFIABLE_WITH_MOCK',
        passed: null,
        elapsedMs: Date.now() - startedAt,
        isMock: true
      };
    }

    return {
      id: sample.id,
      label: sample.label,
      status: 'GRADED',
      passed: sample.id !== 'off_topic',
      overallScore: result.overallScore,
      criteria: result.criteria.map(({ code, score }) => ({ code, score })),
      elapsedMs: Date.now() - startedAt,
      isMock: env.MOCK_AI
    };
  } catch (error) {
    if (sample.id === 'off_topic' && error.code === 'OFF_TOPIC_ANSWER') {
      return {
        id: sample.id,
        label: sample.label,
        status: 'REJECTED_AS_OFF_TOPIC',
        passed: true,
        elapsedMs: Date.now() - startedAt,
        isMock: env.MOCK_AI
      };
    }
    throw error;
  }
}

async function run() {
  const samples = await loadSamples();
  const byId = assertSamples(samples);
  const track = await loadTrackCriteria();
  const systemPrompt = buildPrompt(track);
  const results = [];

  for (const id of ['strong', 'medium', 'weak', 'off_topic', 'prompt_injection']) {
    let result;
    try {
      result = await gradeSample({
        sample: byId.get(id),
        criteria: track.criteria,
        systemPrompt
      });
    } catch (error) {
      result = {
        id,
        label: byId.get(id).label,
        status: error instanceof HttpError ? error.code : 'ERROR',
        passed: false
      };
    }

    results.push(result);
    console.log(JSON.stringify(result));
  }

  const summary = {
    track: trackCode,
    total: results.length,
    passed: results.filter((result) => result.passed === true).length,
    failed: results.filter((result) => result.passed === false).length,
    notVerifiable: results.filter((result) => result.passed === null).length,
    mock: env.MOCK_AI
  };
  console.log(JSON.stringify({ summary }));

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  run()
    .catch((error) => {
      if (error instanceof HttpError) {
        console.error(`AI test failed (${error.code}): ${error.message}`);
      } else {
        console.error(`AI test failed: ${error.message}`);
      }
      process.exitCode = 1;
    })
    .finally(async () => {
      await pool.end();
    });
}

module.exports = { assertSamples, gradeSample, loadSamples, parseGeminiResult };
