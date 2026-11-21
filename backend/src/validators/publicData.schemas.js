const { z } = require('zod');

const idParams = z.object({
  params: z.object({
    id: z.coerce.number().int().positive()
  })
});

const courseListQuery = z.object({
  query: z.object({
    search: z.string().trim().max(100).default(''),
    level: z.string().trim().max(30).default(''),
    trackId: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(12)
  })
});

const caseTrackQuery = z.object({
  query: z.object({
    trackId: z.coerce.number().int().positive()
  })
});

module.exports = { idParams, courseListQuery, caseTrackQuery };
