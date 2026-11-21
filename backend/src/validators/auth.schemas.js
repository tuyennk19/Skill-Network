const { z } = require('zod');

const emailSchema = z.string().trim().email().max(255).transform((email) => email.toLowerCase());
const passwordSchema = z.string().min(8).regex(/\p{L}/u, 'Mật khẩu phải có chữ cái.')
  .regex(/[0-9]/, 'Mật khẩu phải có chữ số.')
  .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, 'Mật khẩu không được vượt quá 72 byte.');

const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().trim().min(2).max(100)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1)
  })
});

const updateMeSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(100).optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: passwordSchema.optional()
  }).strict().refine(
    (body) => Object.keys(body).length > 0,
    'Cần cung cấp ít nhất một thông tin cần cập nhật.'
  ).refine(
    (body) => Boolean(body.currentPassword) === Boolean(body.newPassword),
    'Cần cung cấp cả mật khẩu hiện tại và mật khẩu mới.'
  )
});

module.exports = { registerSchema, loginSchema, updateMeSchema };
