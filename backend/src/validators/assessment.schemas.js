const { z } = require('zod');

const submitAssessmentSchema = z.object({
  body: z.object({
    caseId: z.coerce.number().int().positive(),
    answer: z.string()
  }).strict()
});

const assessmentIdSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  })
});

module.exports = { submitAssessmentSchema, assessmentIdSchema };
