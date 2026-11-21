const { z } = require('zod');

const idParams = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  })
});

const trackIdParams = z.object({
  params: z.object({
    trackId: z.coerce.number().int().positive()
  })
});

const trackBody = z.object({
  code: z.string().trim().min(2).max(50).regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(5000).nullable().optional(),
  isActive: z.boolean().default(true)
});

const criterionBody = z.object({
  code: z.string().trim().min(2).max(50).regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(255).nullable().optional(),
  rubricLow: z.string().trim().min(1).max(500),
  rubricMid: z.string().trim().min(1).max(500),
  rubricHigh: z.string().trim().min(1).max(500),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

const caseBody = z.object({
  trackId: z.coerce.number().int().positive(),
  title: z.string().trim().min(3).max(200),
  scenario: z.string().trim().min(20).max(20000),
  difficulty: z.enum(['Dễ', 'Trung bình', 'Khó']),
  isActive: z.boolean().default(true)
});

const courseBody = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(20000).nullable().optional(),
  level: z.string().trim().min(1).max(30),
  durationHours: z.coerce.number().int().positive().nullable().optional(),
  thumbnailUrl: z.string().trim().max(255).nullable().optional(),
  isActive: z.boolean().default(true),
  isDemo: z.boolean().default(false),
  criterionIds: z.array(z.coerce.number().int().positive()).max(100).default([])
    .refine((ids) => new Set(ids).size === ids.length, 'Tiêu chí không được trùng lặp.')
});

const caseListQuery = z.object({
  query: z.object({
    trackId: z.coerce.number().int().positive().optional()
  })
});

const assessmentListQuery = z.object({
  query: z.object({
    trackId: z.coerce.number().int().positive().optional(),
    minScore: z.coerce.number().min(0).max(10).optional(),
    maxScore: z.coerce.number().min(0).max(10).optional(),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
    page: z.coerce.number().int().positive().max(1000000).default(1)
  })
    .refine((query) =>
      query.minScore === undefined
      || query.maxScore === undefined
      || query.minScore <= query.maxScore,
    { message: 'Khoảng điểm không hợp lệ.' })
    .refine((query) =>
      query.from === undefined || query.to === undefined || query.from <= query.to,
    { message: 'Khoảng ngày không hợp lệ.' })
});

module.exports = {
  idParams,
  trackIdParams,
  trackBody,
  criterionBody,
  caseBody,
  courseBody,
  caseListQuery,
  assessmentListQuery
};
