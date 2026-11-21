const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');
const HttpError = require('../utils/httpError');

async function register(req, res) {
  const { email, password, fullName } = req.validated.body;
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  await userModel.create({ email, passwordHash, fullName });

  return res.status(201).json({ message: 'Đăng ký thành công.' });
}

async function login(req, res) {
  const { email, password } = req.validated.body;
  const user = await userModel.findByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Sai email hoặc mật khẩu', 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { role: user.role },
    env.JWT_SECRET,
    { subject: String(user.id), expiresIn: env.JWT_EXPIRES_IN }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  });
}

async function getMe(req, res) {
  return res.json({ user: req.user });
}

async function updateMe(req, res) {
  const { fullName, currentPassword, newPassword } = req.validated.body;

  if (newPassword !== undefined) {
    const user = await userModel.findByEmail(req.user.email);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new HttpError(400, 'Mật khẩu hiện tại không chính xác.', 'INVALID_CURRENT_PASSWORD');
    }
  }

  if (fullName !== undefined) {
    await userModel.updateFullName(req.user.id, fullName);
  }

  if (newPassword !== undefined) {
    const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await userModel.updatePassword(req.user.id, passwordHash);
  }

  const updatedUser = await userModel.findById(req.user.id);
  return res.json({ user: updatedUser });
}

module.exports = { register, login, getMe, updateMe };
