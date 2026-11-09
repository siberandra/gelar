const profileService = require("../services/profile.service");
const fileService = require("../services/file.service");

async function update(req, res) {
  res.json(await profileService.updateProfile(req.user.id, req.body, req.file));
}

async function changePassword(req, res) {
  await profileService.changePassword(req.user.id, req.body);
  res.json({ message: "Password berhasil diubah" });
}

async function rewards(req, res) {
  res.json(await profileService.getRewards(req.user.id));
}

async function organizer(req, res) {
  res.json(await profileService.getOrganizerProfile(Number(req.params.id)));
}

async function file(req, res) {
  const found = await fileService.getFile(Number(req.params.id), req.user);
  res.set("Content-Type", found.mimeType);
  res.set("Cache-Control", found.isPrivate ? "private, no-store" : "public, max-age=86400");
  res.send(Buffer.from(found.data));
}

module.exports = { update, changePassword, rewards, organizer, file };
