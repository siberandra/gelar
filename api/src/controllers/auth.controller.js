const authService = require("../services/auth.service");

async function register(req, res) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

async function login(req, res) {
  res.json(await authService.login(req.body));
}

async function me(req, res) {
  res.json(await authService.me(req.user.id));
}

async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body.email);
  res.json({ message: "Jika email terdaftar, link reset sudah dikirim" });
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body);
  res.json({ message: "Password berhasil diubah, silakan login" });
}

module.exports = { register, login, me, forgotPassword, resetPassword };
